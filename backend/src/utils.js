// Helpers de conversión y cálculo compartidos por los routers.

// Prisma devuelve Decimal como objeto; lo pasamos a número para el JSON.
export function toNum(value) {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

// Una fecha @db.Date vuelve como DateTime a medianoche UTC; la formateamos
// como 'YYYY-MM-DD' (o null) para que el frontend la use en <input type="date">.
export function dateStr(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// Convierte 'YYYY-MM-DD' (o null/'') a Date UTC para guardar como @db.Date.
export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value + "T00:00:00.000Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

// Serializa un periodo con todas sus relaciones a un objeto plano para el front.
export function serializePeriod(p) {
  const routeCostMap = {};
  (p.routeCosts || []).forEach((rc) => {
    routeCostMap[rc.routeKey] = toNum(rc.cost);
  });

  const weeks = (p.weeks || [])
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((w) => ({
      id: w.id,
      label: w.label,
      startDate: dateStr(w.startDate),
      endDate: dateStr(w.endDate),
      orderIndex: w.orderIndex,
      days: (w.days || [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((d) => ({
          id: d.id,
          label: d.label,
          orderIndex: d.orderIndex,
          marks: (d.marks || []).map((m) => ({
            id: m.id,
            routeKey: m.routeKey,
            used: m.used,
          })),
        })),
    }));

  return {
    id: p.id,
    label: p.label,
    startDate: dateStr(p.startDate),
    endDate: dateStr(p.endDate),
    saldoInicial: toNum(p.saldoInicial),
    transitDiscount: toNum(p.transitDiscount),
    incomes: (p.incomes || []).map((i) => ({
      id: i.id,
      label: i.label,
      amount: toNum(i.amount),
      date: dateStr(i.date),
    })),
    subscriptions: (p.subscriptions || []).map((s) => ({
      id: s.id,
      name: s.name,
      amount: toNum(s.amount),
    })),
    expenses: (p.expenses || []).map((e) => ({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: toNum(e.amount),
      date: dateStr(e.date),
    })),
    routeCosts: (p.routeCosts || []).map((rc) => ({
      id: rc.id,
      routeKey: rc.routeKey,
      label: rc.label,
      cost: toNum(rc.cost),
    })),
    weeks,
    summary: computeSummary(p, routeCostMap),
  };
}

// Calcula totales del periodo. routeCostMap: { routeKey: costo }.
export function computeSummary(p, routeCostMap) {
  const map =
    routeCostMap ||
    (p.routeCosts || []).reduce((acc, rc) => {
      acc[rc.routeKey] = toNum(rc.cost);
      return acc;
    }, {});

  let pasajes = 0;
  (p.weeks || []).forEach((w) => {
    (w.days || []).forEach((d) => {
      (d.marks || []).forEach((m) => {
        if (m.used) pasajes += map[m.routeKey] || 0;
      });
    });
  });
  pasajes = Math.max(0, pasajes - toNum(p.transitDiscount));

  const ingresos = (p.incomes || []).reduce((a, i) => a + toNum(i.amount), 0);

  const byCat = {
    pasajes,
    subscripciones: 0,
    comida: 0,
    servicios: 0,
    ocio: 0,
    salud: 0,
    otros: 0,
  };
  (p.subscriptions || []).forEach((s) => {
    byCat.subscripciones += toNum(s.amount);
  });
  const catKey = {
    COMIDA: "comida",
    SERVICIOS: "servicios",
    OCIO: "ocio",
    SALUD: "salud",
    OTROS: "otros",
  };
  (p.expenses || []).forEach((e) => {
    const k = catKey[e.category] || "otros";
    byCat[k] += toNum(e.amount);
  });

  const gastos = Object.values(byCat).reduce((a, v) => a + v, 0);
  const saldoInicial = toNum(p.saldoInicial);
  return {
    saldoInicial: round2(saldoInicial),
    ingresos: round2(ingresos),
    gastos: round2(gastos),
    saldo: round2(saldoInicial + ingresos - gastos),
    byCat: Object.fromEntries(
      Object.entries(byCat).map(([k, v]) => [k, round2(v)])
    ),
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Include estándar para traer un periodo completo desde Prisma.
export const PERIOD_INCLUDE = {
  incomes: { orderBy: { id: "asc" } },
  subscriptions: { orderBy: { id: "asc" } },
  expenses: { orderBy: { id: "asc" } },
  routeCosts: { orderBy: { id: "asc" } },
  weeks: {
    orderBy: { orderIndex: "asc" },
    include: {
      days: {
        orderBy: { orderIndex: "asc" },
        include: { marks: true },
      },
    },
  },
};

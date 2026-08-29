// Formato de dinero en soles y cálculo de totales (espejo del backend, para
// que los números se actualicen en vivo sin esperar al servidor).

export function money(n) {
  n = Number(n) || 0;
  const neg = n < 0;
  const abs = Math.abs(n).toFixed(2);
  const [intPart, dec] = abs.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + "S/ " + withSep + "." + dec;
}

const CAT_KEY = {
  COMIDA: "comida",
  SERVICIOS: "servicios",
  OCIO: "ocio",
  SALUD: "salud",
  OTROS: "otros",
};

// Calcula ingresos, gastos, saldo y desglose por categoría de un periodo.
export function computeSummary(period) {
  if (!period) {
    return { ingresos: 0, gastos: 0, saldo: 0, byCat: emptyByCat() };
  }
  const costMap = {};
  (period.routeCosts || []).forEach((rc) => {
    costMap[rc.routeKey] = Number(rc.cost) || 0;
  });

  let pasajes = 0;
  (period.weeks || []).forEach((w) => {
    (w.days || []).forEach((d) => {
      (d.marks || []).forEach((m) => {
        if (m.used) pasajes += costMap[m.routeKey] || 0;
      });
    });
  });
  pasajes = Math.max(0, pasajes - (Number(period.transitDiscount) || 0));

  const ingresos = (period.incomes || []).reduce((a, i) => a + (Number(i.amount) || 0), 0);

  const byCat = emptyByCat();
  byCat.pasajes = pasajes;
  (period.subscriptions || []).forEach((s) => {
    byCat.subscripciones += Number(s.amount) || 0;
  });
  (period.expenses || []).forEach((e) => {
    const k = CAT_KEY[e.category] || "otros";
    byCat[k] += Number(e.amount) || 0;
  });

  const gastos = Object.values(byCat).reduce((a, v) => a + v, 0);
  return { ingresos, gastos, saldo: ingresos - gastos, byCat };
}

// Total de pasajes de una sola semana (para el encabezado de cada semana).
export function weekTotal(period, week) {
  const costMap = {};
  (period.routeCosts || []).forEach((rc) => {
    costMap[rc.routeKey] = Number(rc.cost) || 0;
  });
  let total = 0;
  (week.days || []).forEach((d) => {
    (d.marks || []).forEach((m) => {
      if (m.used) total += costMap[m.routeKey] || 0;
    });
  });
  return total;
}

function emptyByCat() {
  return {
    pasajes: 0,
    subscripciones: 0,
    comida: 0,
    servicios: 0,
    ocio: 0,
    salud: 0,
    otros: 0,
  };
}

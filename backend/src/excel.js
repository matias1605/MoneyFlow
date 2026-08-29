// Generación y lectura de archivos Excel (.xlsx) para Moneyflow.
// El formato de exportación de un periodo es "ida y vuelta": el mismo archivo
// puede volver a importarse.
import ExcelJS from "exceljs";
import { computeSummary, toNum, dateStr } from "./utils.js";

// Categoría (enum interno) <-> etiqueta legible en el Excel.
const CAT_TO_LABEL = {
  COMIDA: "Comida",
  SERVICIOS: "Servicios",
  OCIO: "Ocio",
  SALUD: "Salud",
  OTROS: "Otros",
};
const LABEL_TO_CAT = {
  comida: "COMIDA",
  servicios: "SERVICIOS",
  ocio: "OCIO",
  salud: "SALUD",
  otros: "OTROS",
};
function labelToCat(v) {
  const k = String(v || "").trim().toLowerCase();
  if (LABEL_TO_CAT[k]) return LABEL_TO_CAT[k];
  const up = String(v || "").trim().toUpperCase();
  return CAT_TO_LABEL[up] ? up : "OTROS";
}

const MONEY_FMT = '"S/ "#,##0.00';

function styleHeader(row) {
  row.font = { bold: true };
  row.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3E8DE" } };
    c.border = { bottom: { style: "thin", color: { argb: "FFB9C4B3" } } };
  });
}

// ---------- EXPORT: un periodo completo (ida y vuelta) ----------
export function buildPeriodWorkbook(p) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Moneyflow";
  wb.created = new Date();

  const summary = computeSummary(p);

  // Hoja Periodo (meta + resumen). Las 4 primeras filas se leen al importar.
  const meta = wb.addWorksheet("Periodo");
  meta.columns = [
    { header: "Clave", key: "k", width: 22 },
    { header: "Valor", key: "v", width: 30 },
  ];
  styleHeader(meta.getRow(1));
  meta.addRow({ k: "Etiqueta", v: p.label });
  meta.addRow({ k: "Fecha inicio", v: dateStr(p.startDate) || "" });
  meta.addRow({ k: "Fecha fin", v: dateStr(p.endDate) || "" });
  meta.addRow({ k: "Descuento pasajes", v: toNum(p.transitDiscount) });
  meta.addRow({ k: "", v: "" });
  const sTitle = meta.addRow({ k: "RESUMEN (solo lectura)", v: "" });
  sTitle.font = { bold: true, italic: true };
  const addSum = (label, val) => {
    const r = meta.addRow({ k: label, v: val });
    r.getCell("v").numFmt = MONEY_FMT;
  };
  addSum("Ingresos", summary.ingresos);
  addSum("Gastos", summary.gastos);
  addSum("Saldo", summary.saldo);
  addSum("Pasajes", summary.byCat.pasajes);
  addSum("Suscripciones", summary.byCat.subscripciones);
  addSum("Comida", summary.byCat.comida);
  addSum("Servicios", summary.byCat.servicios);
  addSum("Ocio", summary.byCat.ocio);
  addSum("Salud", summary.byCat.salud);
  addSum("Otros", summary.byCat.otros);

  // Hoja Ingresos
  const ing = wb.addWorksheet("Ingresos");
  ing.columns = [
    { header: "Etiqueta", key: "label", width: 24 },
    { header: "Fecha", key: "date", width: 14 },
    { header: "Monto", key: "amount", width: 14, style: { numFmt: MONEY_FMT } },
  ];
  styleHeader(ing.getRow(1));
  (p.incomes || []).forEach((i) =>
    ing.addRow({ label: i.label, date: dateStr(i.date) || "", amount: toNum(i.amount) })
  );

  // Hoja Suscripciones
  const sub = wb.addWorksheet("Suscripciones");
  sub.columns = [
    { header: "Nombre", key: "name", width: 24 },
    { header: "Monto", key: "amount", width: 14, style: { numFmt: MONEY_FMT } },
  ];
  styleHeader(sub.getRow(1));
  (p.subscriptions || []).forEach((s) =>
    sub.addRow({ name: s.name, amount: toNum(s.amount) })
  );

  // Hoja Gastos
  const gas = wb.addWorksheet("Gastos");
  gas.columns = [
    { header: "Categoria", key: "cat", width: 16 },
    { header: "Descripcion", key: "desc", width: 30 },
    { header: "Fecha", key: "date", width: 14 },
    { header: "Monto", key: "amount", width: 14, style: { numFmt: MONEY_FMT } },
  ];
  styleHeader(gas.getRow(1));
  (p.expenses || []).forEach((e) =>
    gas.addRow({
      cat: CAT_TO_LABEL[e.category] || "Otros",
      desc: e.description,
      date: dateStr(e.date) || "",
      amount: toNum(e.amount),
    })
  );

  // Hoja PasajesCostos
  const rc = wb.addWorksheet("PasajesCostos");
  rc.columns = [
    { header: "RutaClave", key: "key", width: 14 },
    { header: "RutaNombre", key: "label", width: 18 },
    { header: "Costo", key: "cost", width: 12, style: { numFmt: MONEY_FMT } },
  ];
  styleHeader(rc.getRow(1));
  (p.routeCosts || []).forEach((r) =>
    rc.addRow({ key: r.routeKey, label: r.label, cost: toNum(r.cost) })
  );

  // Hoja PasajesUso: grilla completa (una fila por semana×día×ruta)
  const use = wb.addWorksheet("PasajesUso");
  use.columns = [
    { header: "OrdenSemana", key: "ws", width: 12 },
    { header: "Semana", key: "wl", width: 16 },
    { header: "Inicio", key: "ini", width: 14 },
    { header: "Fin", key: "fin", width: 14 },
    { header: "OrdenDia", key: "ds", width: 10 },
    { header: "Dia", key: "dl", width: 16 },
    { header: "RutaClave", key: "rk", width: 14 },
    { header: "Usado", key: "used", width: 8 },
  ];
  styleHeader(use.getRow(1));
  const routeKeys = (p.routeCosts || []).map((r) => r.routeKey);
  (p.weeks || []).forEach((w, wi) => {
    (w.days || []).forEach((d, di) => {
      routeKeys.forEach((rk) => {
        const mark = (d.marks || []).find((m) => m.routeKey === rk);
        use.addRow({
          ws: w.orderIndex ?? wi,
          wl: w.label,
          ini: dateStr(w.startDate) || "",
          fin: dateStr(w.endDate) || "",
          ds: d.orderIndex ?? di,
          dl: d.label,
          rk,
          used: mark && mark.used ? 1 : 0,
        });
      });
    });
  });

  return wb;
}

// ---------- EXPORT: resumen de todos los periodos ----------
export function buildAllPeriodsWorkbook(periods) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Moneyflow";
  const ws = wb.addWorksheet("Todos los periodos");
  ws.columns = [
    { header: "Periodo", key: "label", width: 22 },
    { header: "Inicio", key: "ini", width: 14 },
    { header: "Fin", key: "fin", width: 14 },
    { header: "Ingresos", key: "ing", width: 14, style: { numFmt: MONEY_FMT } },
    { header: "Gastos", key: "gas", width: 14, style: { numFmt: MONEY_FMT } },
    { header: "Saldo", key: "sal", width: 14, style: { numFmt: MONEY_FMT } },
    { header: "Pasajes", key: "pas", width: 12, style: { numFmt: MONEY_FMT } },
    { header: "Suscripciones", key: "sus", width: 14, style: { numFmt: MONEY_FMT } },
    { header: "Comida", key: "com", width: 12, style: { numFmt: MONEY_FMT } },
    { header: "Servicios", key: "ser", width: 12, style: { numFmt: MONEY_FMT } },
    { header: "Ocio", key: "oci", width: 12, style: { numFmt: MONEY_FMT } },
    { header: "Salud", key: "sal2", width: 12, style: { numFmt: MONEY_FMT } },
    { header: "Otros", key: "otr", width: 12, style: { numFmt: MONEY_FMT } },
  ];
  styleHeader(ws.getRow(1));

  periods.forEach((p) => {
    const s = computeSummary(p);
    ws.addRow({
      label: p.label,
      ini: dateStr(p.startDate) || "",
      fin: dateStr(p.endDate) || "",
      ing: s.ingresos,
      gas: s.gastos,
      sal: s.saldo,
      pas: s.byCat.pasajes,
      sus: s.byCat.subscripciones,
      com: s.byCat.comida,
      ser: s.byCat.servicios,
      oci: s.byCat.ocio,
      sal2: s.byCat.salud,
      otr: s.byCat.otros,
    });
  });

  // Fila de totales
  const totalRow = ws.addRow({
    label: "TOTAL",
    ing: { formula: `SUM(D2:D${periods.length + 1})` },
    gas: { formula: `SUM(E2:E${periods.length + 1})` },
    sal: { formula: `SUM(F2:F${periods.length + 1})` },
  });
  totalRow.font = { bold: true };

  return wb;
}

// ---------- IMPORT: leer un workbook de periodo -> objeto para Prisma ----------
export async function parsePeriodWorkbook(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const metaSheet = wb.getWorksheet("Periodo");
  if (!metaSheet) {
    throw new Error("El archivo no tiene la hoja 'Periodo'. ¿Es un Excel exportado por Moneyflow?");
  }

  // Meta: leer pares clave/valor de las primeras filas.
  const metaMap = {};
  metaSheet.eachRow((row) => {
    const k = cellText(row.getCell(1));
    const v = row.getCell(2).value;
    if (k) metaMap[k.toLowerCase()] = v;
  });
  const label = cellStr(metaMap["etiqueta"]) || "Periodo importado";
  const startDate = cellStr(metaMap["fecha inicio"]) || null;
  const endDate = cellStr(metaMap["fecha fin"]) || null;
  const transitDiscount = Number(cellNum(metaMap["descuento pasajes"])) || 0;

  const incomes = readSheet(wb, "Ingresos", ["etiqueta", "fecha", "monto"]).map((r) => ({
    label: cellStr(r.etiqueta) || "",
    date: cellStr(r.fecha) || null,
    amount: Number(cellNum(r.monto)) || 0,
  }));

  const subscriptions = readSheet(wb, "Suscripciones", ["nombre", "monto"]).map((r) => ({
    name: cellStr(r.nombre) || "",
    amount: Number(cellNum(r.monto)) || 0,
  }));

  const expenses = readSheet(wb, "Gastos", ["categoria", "descripcion", "fecha", "monto"]).map(
    (r) => ({
      category: labelToCat(cellStr(r.categoria)),
      description: cellStr(r.descripcion) || "",
      date: cellStr(r.fecha) || null,
      amount: Number(cellNum(r.monto)) || 0,
    })
  );

  const routeCosts = readSheet(wb, "PasajesCostos", ["rutaclave", "rutanombre", "costo"]).map(
    (r) => ({
      routeKey: cellStr(r.rutaclave),
      label: cellStr(r.rutanombre) || cellStr(r.rutaclave),
      cost: Number(cellNum(r.costo)) || 0,
    })
  );

  // Pasajes: reconstruir semanas -> días -> marcas.
  const useRows = readSheet(wb, "PasajesUso", [
    "ordensemana",
    "semana",
    "inicio",
    "fin",
    "ordendia",
    "dia",
    "rutaclave",
    "usado",
  ]);
  const weeksMap = new Map();
  useRows.forEach((r) => {
    const wKey = String(cellNum(r.ordensemana) ?? cellStr(r.semana));
    if (!weeksMap.has(wKey)) {
      weeksMap.set(wKey, {
        orderIndex: Number(cellNum(r.ordensemana)) || weeksMap.size,
        label: cellStr(r.semana) || `Semana ${weeksMap.size + 1}`,
        startDate: cellStr(r.inicio) || null,
        endDate: cellStr(r.fin) || null,
        days: new Map(),
      });
    }
    const week = weeksMap.get(wKey);
    const dKey = String(cellNum(r.ordendia) ?? cellStr(r.dia));
    if (!week.days.has(dKey)) {
      week.days.set(dKey, {
        orderIndex: Number(cellNum(r.ordendia)) || week.days.size,
        label: cellStr(r.dia) || `Día ${week.days.size + 1}`,
        marks: [],
      });
    }
    const day = week.days.get(dKey);
    const rk = cellStr(r.rutaclave);
    const used = Number(cellNum(r.usado)) === 1;
    if (rk && used) day.marks.push({ routeKey: rk, used: true });
  });

  const weeks = Array.from(weeksMap.values())
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((w) => ({
      label: w.label,
      startDate: w.startDate,
      endDate: w.endDate,
      orderIndex: w.orderIndex,
      days: Array.from(w.days.values())
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((d) => ({ label: d.label, orderIndex: d.orderIndex, marks: d.marks })),
    }));

  return {
    label,
    startDate,
    endDate,
    transitDiscount,
    incomes,
    subscriptions,
    expenses,
    routeCosts,
    weeks,
  };
}

// ---------- helpers de lectura ----------
function cellText(cell) {
  const v = cell.value;
  return v === null || v === undefined ? "" : String(v.text ?? v).trim();
}
function cellStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (v.text !== undefined) return String(v.text).trim();
    if (v.result !== undefined) return String(v.result).trim();
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return String(v).trim();
}
function cellNum(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "object" && v.result !== undefined) return v.result;
  return v;
}

// Lee una hoja como array de objetos, mapeando por nombre de encabezado (normalizado).
function readSheet(wb, name, expectedHeaders) {
  const ws = wb.getWorksheet(name);
  if (!ws) return [];
  const headerRow = ws.getRow(1);
  const colIndex = {};
  headerRow.eachCell((cell, col) => {
    const h = String(cell.value || "").trim().toLowerCase();
    if (h) colIndex[h] = col;
  });
  const rows = [];
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    const obj = {};
    let hasAny = false;
    expectedHeaders.forEach((h) => {
      const col = colIndex[h];
      const val = col ? row.getCell(col).value : null;
      obj[h] = val;
      if (val !== null && val !== undefined && String(val).trim() !== "") hasAny = true;
    });
    if (hasAny) rows.push(obj);
  }
  return rows;
}

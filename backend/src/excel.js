// Generación y lectura de archivos Excel (.xlsx) para Moneyflow.
// Formato PROFESIONAL inspirado en la planilla original del usuario: grillas
// semanales (rutas x días) con colores, bloque de resumen, y tablas de
// ingresos / suscripciones / gastos. El MISMO formato sirve para exportar e
// importar (ida y vuelta).
import ExcelJS from "exceljs";
import { computeSummary, toNum, dateStr } from "./utils.js";

// ---- paleta (similar a la planilla original) ----
const C = {
  yellow: "FFFFF000",
  blue: "FF4FC3E8",
  greenTotal: "FF9CD69A",
  headGrey: "FFDCE3D6",
  pink: "FFE6B8D9",
  red: "FFE05a4f",
  greenOk: "FF9CD69A",
  soft: "FFF1F4EE",
  line: "FFB9C4B3",
};
const MONEY = '"S/ "#,##0.00';

// Categoría (enum) <-> etiqueta legible.
const CAT_TO_LABEL = { COMIDA: "Comida", SERVICIOS: "Servicios", OCIO: "Ocio", SALUD: "Salud", OTROS: "Otros" };
const LABEL_TO_CAT = { comida: "COMIDA", servicios: "SERVICIOS", ocio: "OCIO", salud: "SALUD", otros: "OTROS" };
function labelToCat(v) {
  const k = String(v || "").trim().toLowerCase();
  if (LABEL_TO_CAT[k]) return LABEL_TO_CAT[k];
  const up = String(v || "").trim().toUpperCase();
  return CAT_TO_LABEL[up] ? up : "OTROS";
}

// Rutas que se pintan de amarillo (tren); el resto va celeste (bus).
const TREN_KEYS = new Set(["trenIda", "trenVuelta"]);

function fill(cell, argb) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}
function box(cell) {
  cell.border = {
    top: { style: "thin", color: { argb: C.line } },
    bottom: { style: "thin", color: { argb: C.line } },
    left: { style: "thin", color: { argb: C.line } },
    right: { style: "thin", color: { argb: C.line } },
  };
}

// Suma bruta de pasajes (sin restar descuento).
function grossPasajes(p) {
  const costMap = {};
  (p.routeCosts || []).forEach((rc) => (costMap[rc.routeKey] = toNum(rc.cost)));
  let total = 0;
  (p.weeks || []).forEach((w) =>
    (w.days || []).forEach((d) =>
      (d.marks || []).forEach((m) => {
        if (m.used) total += costMap[m.routeKey] || 0;
      })
    )
  );
  return total;
}

// ============================================================
//  EXPORT: un periodo completo (profesional, ida y vuelta)
// ============================================================
export function buildPeriodWorkbook(p) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Moneyflow";
  wb.created = new Date();

  buildPeriodoSheet(wb, p);
  buildTableSheet(wb, "Ingresos", [
    { h: "Etiqueta", w: 24 },
    { h: "Fecha", w: 14 },
    { h: "Monto", w: 14, money: true },
  ], (p.incomes || []).map((i) => [i.label, dateStr(i.date) || "", toNum(i.amount)]));

  buildTableSheet(wb, "Suscripciones", [
    { h: "Nombre", w: 24 },
    { h: "Monto", w: 14, money: true },
  ], (p.subscriptions || []).map((s) => [s.name, toNum(s.amount)]));

  buildTableSheet(wb, "Gastos", [
    { h: "Categoria", w: 16 },
    { h: "Descripcion", w: 32 },
    { h: "Fecha", w: 14 },
    { h: "Monto", w: 14, money: true },
  ], (p.expenses || []).map((e) => [
    CAT_TO_LABEL[e.category] || "Otros",
    e.description,
    dateStr(e.date) || "",
    toNum(e.amount),
  ]));

  buildPasajesSheet(wb, p);

  return wb;
}

// ---- Hoja "Periodo": meta (parseable) + resumen visual ----
function buildPeriodoSheet(wb, p) {
  const ws = wb.addWorksheet("Periodo", { properties: { defaultColWidth: 16 } });
  ws.getColumn(1).width = 26;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 16;

  const summary = computeSummary(p);
  const gross = grossPasajes(p);
  const disc = toNum(p.transitDiscount);

  // Título
  ws.mergeCells("A1:C1");
  const title = ws.getCell("A1");
  title.value = "MONEYFLOW";
  title.font = { name: "Arial", bold: true, size: 16, color: { argb: "FF1F6F5C" } };
  ws.getRow(1).height = 22;

  // Meta (estas 4 filas se LEEN al importar: clave en col A, valor en col B)
  const meta = [
    ["Etiqueta", p.label],
    ["Fecha inicio", dateStr(p.startDate) || ""],
    ["Fecha fin", dateStr(p.endDate) || ""],
    ["Descuento pasajes", disc],
  ];
  let r = 3;
  meta.forEach(([k, v]) => {
    const a = ws.getCell(r, 1);
    a.value = k;
    a.font = { name: "Arial", bold: true };
    fill(a, C.headGrey);
    const b = ws.getCell(r, 2);
    b.value = v;
    if (k === "Descuento pasajes") b.numFmt = MONEY;
    b.font = { name: "Arial" };
    r++;
  });

  // Bloque RESUMEN (solo lectura, estilo planilla)
  r += 1;
  const secTitle = (row, text, argb) => {
    const c = ws.getCell(row, 1);
    c.value = text;
    c.font = { name: "Arial", bold: true, color: { argb: "FF1F2620" } };
    fill(c, argb);
    ws.mergeCells(row, 1, row, 3);
  };
  const line = (row, label, value, opts = {}) => {
    const a = ws.getCell(row, 1);
    a.value = label;
    a.font = { name: "Arial", bold: !!opts.bold };
    const b = ws.getCell(row, 2);
    b.value = value;
    b.numFmt = MONEY;
    b.font = { name: "Arial", bold: !!opts.bold };
    if (opts.fillC) {
      fill(a, opts.fillC);
      fill(b, opts.fillC);
    }
  };

  secTitle(r, "RESUMEN DEL PERIODO", C.yellow);
  r++;
  line(r++, "Ingresos (quincenas)", summary.ingresos);
  r++;
  secTitle(r, "PASAJES", C.pink);
  r++;
  line(r++, "Total pasajes (bruto)", gross);
  line(r++, "Descuento", -disc);
  line(r++, "Pasajes neto", summary.byCat.pasajes, { bold: true });
  r++;
  secTitle(r, "GASTOS", C.pink);
  r++;
  line(r++, "Pasajes", summary.byCat.pasajes);
  line(r++, "Suscripciones", summary.byCat.subscripciones);
  line(r++, "Comida", summary.byCat.comida);
  line(r++, "Servicios", summary.byCat.servicios);
  line(r++, "Ocio", summary.byCat.ocio);
  line(r++, "Salud", summary.byCat.salud);
  line(r++, "Otros", summary.byCat.otros);
  line(r++, "TOTAL GASTOS", summary.gastos, { bold: true, fillC: C.red });
  r++;
  line(r++, "SALDO DISPONIBLE", summary.saldo, { bold: true, fillC: C.greenOk });
}

// ---- Hojas de tabla simples (parseables por encabezado) ----
function buildTableSheet(wb, name, cols, rows) {
  const ws = wb.addWorksheet(name);
  cols.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.w || 16;
    if (c.money) ws.getColumn(i + 1).numFmt = MONEY;
  });
  const header = ws.getRow(1);
  cols.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.h;
    cell.font = { name: "Arial", bold: true };
    fill(cell, C.headGrey);
    box(cell);
  });
  rows.forEach((row) => {
    const added = ws.addRow(row);
    added.eachCell((cell) => (cell.font = { name: "Arial" }));
  });
}

// ---- Hoja "Pasajes": costos + grillas semanales (rutas x días) ----
function buildPasajesSheet(wb, p) {
  const ws = wb.addWorksheet("Pasajes");
  ws.getColumn(1).width = 16;
  ws.getColumn(2).width = 16;
  for (let c = 3; c <= 12; c++) ws.getColumn(c).width = 12;

  const routes = p.routeCosts || [];
  const costMap = {};
  routes.forEach((rc) => (costMap[rc.routeKey] = toNum(rc.cost)));

  // --- Tabla COSTOS POR RUTA (parseable) ---
  let r = 1;
  const ct = ws.getCell(r, 1);
  ct.value = "COSTOS POR RUTA";
  ct.font = { name: "Arial", bold: true };
  fill(ct, C.yellow);
  ws.mergeCells(r, 1, r, 3);
  r++;
  ["RutaClave", "RutaNombre", "Costo"].forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.font = { name: "Arial", bold: true };
    fill(cell, C.headGrey);
    box(cell);
  });
  r++;
  routes.forEach((rc) => {
    ws.getCell(r, 1).value = rc.routeKey;
    ws.getCell(r, 2).value = rc.label;
    const cc = ws.getCell(r, 3);
    cc.value = toNum(rc.cost);
    cc.numFmt = MONEY;
    r++;
  });
  r += 1; // fila en blanco

  // --- Grillas por semana ---
  (p.weeks || []).forEach((w) => {
    const days = (w.days || []).slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const nDays = days.length;
    const totalCol = 3 + nDays; // C=3 -> primer día

    // Título de semana + fechas (parseable: label en A, inicio en D, fin en F)
    const tr = ws.getRow(r);
    const tl = tr.getCell(1);
    tl.value = w.label || "Semana";
    tl.font = { name: "Arial", bold: true, size: 12 };
    if (dateStr(w.startDate)) {
      tr.getCell(3).value = "Del";
      tr.getCell(4).value = dateStr(w.startDate);
      tr.getCell(5).value = "al";
      tr.getCell(6).value = dateStr(w.endDate) || "";
      tr.getCell(3).font = tr.getCell(5).font = { name: "Arial", italic: true, color: { argb: "FF7C887E" } };
    }
    r++;

    // Encabezado: días + "Total"
    const hr = ws.getRow(r);
    days.forEach((d, j) => {
      const cell = hr.getCell(3 + j);
      cell.value = d.label;
      cell.font = { name: "Arial", bold: true };
      fill(cell, C.headGrey);
      box(cell);
      cell.alignment = { horizontal: "center" };
    });
    const tcell = hr.getCell(totalCol);
    tcell.value = "Total";
    tcell.font = { name: "Arial", bold: true };
    fill(tcell, C.headGrey);
    box(tcell);
    tcell.alignment = { horizontal: "center" };
    const headerRowNum = r;
    r++;

    // Filas de ruta
    routes.forEach((rc) => {
      const rowNum = r;
      const rl = ws.getRow(rowNum).getCell(2);
      rl.value = rc.label;
      rl.font = { name: "Arial", bold: true };
      fill(rl, TREN_KEYS.has(rc.routeKey) ? C.yellow : C.blue);
      box(rl);
      days.forEach((d, j) => {
        const used = (d.marks || []).some((m) => m.routeKey === rc.routeKey && m.used);
        const cell = ws.getRow(rowNum).getCell(3 + j);
        if (used) {
          cell.value = costMap[rc.routeKey] || 0;
          cell.numFmt = MONEY;
          cell.alignment = { horizontal: "center" };
        }
        box(cell);
      });
      // total de fila
      const rowTot = ws.getRow(rowNum).getCell(totalCol);
      if (nDays > 0) {
        const first = ws.getRow(rowNum).getCell(3).address;
        const last = ws.getRow(rowNum).getCell(totalCol - 1).address;
        rowTot.value = { formula: `SUM(${first}:${last})` };
      } else {
        rowTot.value = 0;
      }
      rowTot.numFmt = MONEY;
      box(rowTot);
      r++;
    });

    // Fila de totales
    const totRow = ws.getRow(r);
    const tLbl = totRow.getCell(2);
    tLbl.value = "Total";
    tLbl.font = { name: "Arial", bold: true };
    fill(tLbl, C.greenTotal);
    box(tLbl);
    days.forEach((d, j) => {
      const col = 3 + j;
      const cell = totRow.getCell(col);
      const firstRoute = headerRowNum + 1;
      const lastRoute = headerRowNum + routes.length;
      const colLetter = ws.getColumn(col).letter;
      cell.value = { formula: `SUM(${colLetter}${firstRoute}:${colLetter}${lastRoute})` };
      cell.numFmt = MONEY;
      cell.font = { name: "Arial", bold: true };
      fill(cell, C.greenTotal);
      box(cell);
    });
    const weekTot = totRow.getCell(totalCol);
    if (nDays > 0) {
      const colLetter = ws.getColumn(totalCol).letter;
      const firstRoute = headerRowNum + 1;
      const lastRoute = headerRowNum + routes.length;
      weekTot.value = { formula: `SUM(${colLetter}${firstRoute}:${colLetter}${lastRoute})` };
    } else {
      weekTot.value = 0;
    }
    weekTot.numFmt = MONEY;
    weekTot.font = { name: "Arial", bold: true };
    fill(weekTot, C.greenTotal);
    box(weekTot);
    r += 2; // separación entre semanas
  });
}

// ============================================================
//  EXPORT: resumen de todos los periodos
// ============================================================
export function buildAllPeriodsWorkbook(periods) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Moneyflow";
  const ws = wb.addWorksheet("Todos los periodos");
  const cols = [
    { h: "Periodo", w: 22 },
    { h: "Inicio", w: 14 },
    { h: "Fin", w: 14 },
    { h: "Ingresos", w: 14, m: true },
    { h: "Gastos", w: 14, m: true },
    { h: "Saldo", w: 14, m: true },
    { h: "Pasajes", w: 12, m: true },
    { h: "Suscripciones", w: 14, m: true },
    { h: "Comida", w: 12, m: true },
    { h: "Servicios", w: 12, m: true },
    { h: "Ocio", w: 12, m: true },
    { h: "Salud", w: 12, m: true },
    { h: "Otros", w: 12, m: true },
  ];
  cols.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.w;
    if (c.m) ws.getColumn(i + 1).numFmt = MONEY;
  });
  const header = ws.getRow(1);
  cols.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.h;
    cell.font = { name: "Arial", bold: true };
    fill(cell, C.yellow);
    box(cell);
  });

  periods.forEach((p) => {
    const s = computeSummary(p);
    ws.addRow([
      p.label,
      dateStr(p.startDate) || "",
      dateStr(p.endDate) || "",
      s.ingresos,
      s.gastos,
      s.saldo,
      s.byCat.pasajes,
      s.byCat.subscripciones,
      s.byCat.comida,
      s.byCat.servicios,
      s.byCat.ocio,
      s.byCat.salud,
      s.byCat.otros,
    ]);
  });

  const totalRow = ws.addRow(["TOTAL"]);
  totalRow.font = { bold: true };
  const n = periods.length;
  if (n > 0) {
    ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"].forEach((col) => {
      const cell = totalRow.getCell(ws.getColumn(col).number);
      cell.value = { formula: `SUM(${col}2:${col}${n + 1})` };
      cell.numFmt = MONEY;
      cell.font = { bold: true };
    });
  }
  return wb;
}

// ============================================================
//  IMPORT: leer un workbook de periodo -> objeto para Prisma
// ============================================================
export async function parsePeriodWorkbook(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const metaSheet = wb.getWorksheet("Periodo");
  if (!metaSheet) {
    throw new Error("El archivo no tiene la hoja 'Periodo'. ¿Es un Excel exportado por Moneyflow?");
  }

  // Meta
  const metaMap = {};
  metaSheet.eachRow((row) => {
    const k = cellStr(row.getCell(1).value);
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
  const expenses = readSheet(wb, "Gastos", ["categoria", "descripcion", "fecha", "monto"]).map((r) => ({
    category: labelToCat(cellStr(r.categoria)),
    description: cellStr(r.descripcion) || "",
    date: cellStr(r.fecha) || null,
    amount: Number(cellNum(r.monto)) || 0,
  }));

  const { routeCosts, weeks } = parsePasajesSheet(wb.getWorksheet("Pasajes"));

  return { label, startDate, endDate, transitDiscount, incomes, subscriptions, expenses, routeCosts, weeks };
}

// Lee la hoja "Pasajes": tabla de costos + grillas semanales.
function parsePasajesSheet(ws) {
  if (!ws) return { routeCosts: [], weeks: [] };
  const maxRow = ws.rowCount;
  const maxCol = Math.max(ws.columnCount, 12);

  // 1) Tabla de costos
  const routeCosts = [];
  const labelToKey = {};
  let costHeaderRow = null;
  for (let i = 1; i <= maxRow; i++) {
    const row = ws.getRow(i);
    const c1 = cellStr(row.getCell(1).value).toLowerCase();
    if (c1 === "rutaclave") {
      costHeaderRow = i;
      break;
    }
  }
  if (costHeaderRow) {
    for (let i = costHeaderRow + 1; i <= maxRow; i++) {
      const row = ws.getRow(i);
      const key = cellStr(row.getCell(1).value);
      if (!key) break;
      const label = cellStr(row.getCell(2).value) || key;
      const cost = Number(cellNum(row.getCell(3).value)) || 0;
      routeCosts.push({ routeKey: key, label, cost });
      labelToKey[label.toLowerCase()] = key;
    }
  }

  // 2) Grillas semanales
  const weeks = [];
  let i = 1;
  while (i <= maxRow) {
    const row = ws.getRow(i);
    // ¿es fila de encabezado de semana? busca "Total" en col >= 3
    let totalCol = null;
    for (let c = 3; c <= maxCol; c++) {
      if (cellStr(row.getCell(c).value).toLowerCase() === "total") {
        totalCol = c;
        break;
      }
    }
    // la fila siguiente debe empezar con una ruta conocida (col 2)
    const nextLabel = cellStr(ws.getRow(i + 1).getCell(2).value).toLowerCase();
    if (totalCol && labelToKey[nextLabel]) {
      // días
      const days = [];
      for (let c = 3; c < totalCol; c++) {
        const lbl = cellStr(row.getCell(c).value);
        days.push({ colIndex: c, label: lbl || `Día ${c - 2}`, marks: [] });
      }
      // título/fechas: fila de arriba
      const titleRow = ws.getRow(i - 1);
      const weekLabel = cellStr(titleRow.getCell(1).value) || `Semana ${weeks.length + 1}`;
      const startDate = cellStr(titleRow.getCell(4).value) || null;
      const endDate = cellStr(titleRow.getCell(6).value) || null;

      // filas de ruta
      let rr = i + 1;
      while (rr <= maxRow) {
        const rrow = ws.getRow(rr);
        const rlabel = cellStr(rrow.getCell(2).value).toLowerCase();
        const routeKey = labelToKey[rlabel];
        if (!routeKey) break;
        days.forEach((d) => {
          const v = rrow.getCell(d.colIndex).value;
          if (Number(cellNum(v)) > 0) d.marks.push({ routeKey, used: true });
        });
        rr++;
      }

      weeks.push({
        label: weekLabel,
        startDate,
        endDate,
        orderIndex: weeks.length,
        days: days.map((d, idx) => ({ label: d.label, orderIndex: idx, marks: d.marks })),
      });
      i = rr;
    } else {
      i++;
    }
  }

  return { routeCosts, weeks };
}

// ---- helpers de lectura ----
function cellStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (v.text !== undefined) return String(v.text).trim();
    if (v.result !== undefined) return String(v.result).trim();
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (v.formula) return "";
  }
  return String(v).trim();
}
function cellNum(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "object") {
    if (v.result !== undefined) return v.result;
    if (v.formula !== undefined) return 0;
  }
  return v;
}
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

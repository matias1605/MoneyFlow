import { Router } from "express";
import multer from "multer";
import { prisma } from "../db.js";
import { PERIOD_INCLUDE, serializePeriod, parseDate } from "../utils.js";
import {
  buildPeriodWorkbook,
  buildAllPeriodsWorkbook,
  parsePeriodWorkbook,
} from "../excel.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Nombre de archivo seguro (sin acentos ni caracteres raros).
function safeName(s) {
  return String(s || "moneyflow")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "_") || "moneyflow";
}

// GET /api/periods/:id/export  -> descarga un periodo como .xlsx
router.get("/periods/:id/export", async (req, res) => {
  const period = await prisma.period.findUnique({
    where: { id: Number(req.params.id) },
    include: PERIOD_INCLUDE,
  });
  if (!period) return res.status(404).json({ error: "Periodo no encontrado" });

  const wb = buildPeriodWorkbook(period);
  res.setHeader("Content-Type", XLSX_MIME);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Moneyflow_${safeName(period.label)}.xlsx"`
  );
  await wb.xlsx.write(res);
  res.end();
});

// GET /api/export  -> descarga el resumen de todos los periodos
router.get("/export", async (_req, res) => {
  const periods = await prisma.period.findMany({
    orderBy: { startDate: "asc" },
    include: PERIOD_INCLUDE,
  });
  const wb = buildAllPeriodsWorkbook(periods);
  res.setHeader("Content-Type", XLSX_MIME);
  res.setHeader("Content-Disposition", `attachment; filename="Moneyflow_todos_los_periodos.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

// POST /api/import  -> sube un .xlsx (campo "file") y crea un periodo nuevo
router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo." });

  let parsed;
  try {
    parsed = await parsePeriodWorkbook(req.file.buffer);
  } catch (e) {
    return res.status(400).json({ error: e.message || "No se pudo leer el archivo Excel." });
  }

  const created = await prisma.period.create({
    data: {
      label: parsed.label,
      startDate: parseDate(parsed.startDate) || new Date(),
      endDate: parseDate(parsed.endDate) || new Date(),
      transitDiscount: Number(parsed.transitDiscount) || 0,
      incomes: {
        create: parsed.incomes.map((i) => ({
          label: i.label,
          amount: Number(i.amount) || 0,
          date: parseDate(i.date),
        })),
      },
      subscriptions: {
        create: parsed.subscriptions.map((s) => ({
          name: s.name,
          amount: Number(s.amount) || 0,
        })),
      },
      expenses: {
        create: parsed.expenses.map((e) => ({
          category: e.category,
          description: e.description,
          amount: Number(e.amount) || 0,
          date: parseDate(e.date),
        })),
      },
      routeCosts: {
        create: parsed.routeCosts.map((r) => ({
          routeKey: r.routeKey,
          label: r.label,
          cost: Number(r.cost) || 0,
        })),
      },
      weeks: {
        create: parsed.weeks.map((w) => ({
          label: w.label,
          startDate: parseDate(w.startDate),
          endDate: parseDate(w.endDate),
          orderIndex: w.orderIndex,
          days: {
            create: w.days.map((d) => ({
              label: d.label,
              orderIndex: d.orderIndex,
              marks: {
                create: d.marks.map((m) => ({ routeKey: m.routeKey, used: true })),
              },
            })),
          },
        })),
      },
    },
    include: PERIOD_INCLUDE,
  });

  res.status(201).json(serializePeriod(created));
});

export default router;

import { Router } from "express";
import { prisma } from "../db.js";
import { DEFAULT_ROUTES } from "../constants.js";
import {
  serializePeriod,
  computeSummary,
  parseDate,
  dateStr,
  PERIOD_INCLUDE,
} from "../utils.js";

const router = Router();

// GET /api/periods  -> lista para el historial (con saldo calculado)
router.get("/periods", async (_req, res) => {
  const periods = await prisma.period.findMany({
    orderBy: { startDate: "asc" },
    include: PERIOD_INCLUDE,
  });
  res.json(
    periods.map((p) => ({
      id: p.id,
      label: p.label,
      startDate: dateStr(p.startDate),
      endDate: dateStr(p.endDate),
      summary: computeSummary(p),
    }))
  );
});

// POST /api/periods  -> crea un periodo. Body: { label, startDate, endDate, cloneFromId? }
router.post("/periods", async (req, res) => {
  const { label, startDate, endDate, cloneFromId } = req.body || {};

  let routeSeed = DEFAULT_ROUTES;
  let subsSeed = [{ name: "Claude", amount: 88.31 }];
  let incomeSeed = [];

  if (cloneFromId) {
    const src = await prisma.period.findUnique({
      where: { id: Number(cloneFromId) },
      include: { routeCosts: true, subscriptions: true, incomes: true },
    });
    if (src) {
      routeSeed = src.routeCosts.map((r) => ({
        routeKey: r.routeKey,
        label: r.label,
        cost: r.cost,
      }));
      subsSeed = src.subscriptions.map((s) => ({ name: s.name, amount: s.amount }));
      // Copia las quincenas como plantilla (mismos labels/montos, sin fecha).
      incomeSeed = src.incomes.map((i) => ({ label: i.label, amount: i.amount }));
    }
  }

  const created = await prisma.period.create({
    data: {
      label: label || "Nuevo periodo",
      startDate: parseDate(startDate) || new Date(),
      endDate: parseDate(endDate) || new Date(),
      routeCosts: { create: routeSeed },
      subscriptions: { create: subsSeed },
      incomes: { create: incomeSeed },
    },
    include: PERIOD_INCLUDE,
  });

  res.status(201).json(serializePeriod(created));
});

// GET /api/periods/:id  -> detalle completo
router.get("/periods/:id", async (req, res) => {
  const period = await prisma.period.findUnique({
    where: { id: Number(req.params.id) },
    include: PERIOD_INCLUDE,
  });
  if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
  res.json(serializePeriod(period));
});

// PUT /api/periods/:id  -> edita label / fechas / descuento
router.put("/periods/:id", async (req, res) => {
  const { label, startDate, endDate, transitDiscount } = req.body || {};
  const data = {};
  if (label !== undefined) data.label = label;
  if (startDate !== undefined) data.startDate = parseDate(startDate) || undefined;
  if (endDate !== undefined) data.endDate = parseDate(endDate) || undefined;
  if (transitDiscount !== undefined) data.transitDiscount = Number(transitDiscount) || 0;

  const updated = await prisma.period.update({
    where: { id: Number(req.params.id) },
    data,
    include: PERIOD_INCLUDE,
  });
  res.json(serializePeriod(updated));
});

// DELETE /api/periods/:id
router.delete("/periods/:id", async (req, res) => {
  await prisma.period.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

// GET /api/periods/:id/summary
router.get("/periods/:id/summary", async (req, res) => {
  const period = await prisma.period.findUnique({
    where: { id: Number(req.params.id) },
    include: PERIOD_INCLUDE,
  });
  if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
  res.json(computeSummary(period));
});

export default router;

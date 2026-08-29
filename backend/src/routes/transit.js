import { Router } from "express";
import { prisma } from "../db.js";
import { parseDate, toNum, dateStr } from "../utils.js";
import { DEFAULT_ROUTES, DEFAULT_DAY_LABELS } from "../constants.js";

const router = Router();

// PUT /api/periods/:id/route-costs  -> Body: { routeCosts: [{routeKey,label,cost}] }
router.put("/periods/:id/route-costs", async (req, res) => {
  const periodId = Number(req.params.id);
  const list = (req.body && req.body.routeCosts) || [];
  await Promise.all(
    list.map((rc) =>
      prisma.routeCost.upsert({
        where: { periodId_routeKey: { periodId, routeKey: rc.routeKey } },
        update: { label: rc.label, cost: Number(rc.cost) || 0 },
        create: {
          periodId,
          routeKey: rc.routeKey,
          label: rc.label || rc.routeKey,
          cost: Number(rc.cost) || 0,
        },
      })
    )
  );
  const routeCosts = await prisma.routeCost.findMany({
    where: { periodId },
    orderBy: { id: "asc" },
  });
  res.json(routeCosts.map((rc) => ({ id: rc.id, routeKey: rc.routeKey, label: rc.label, cost: toNum(rc.cost) })));
});

// POST /api/periods/:id/weeks  -> crea una semana con días por defecto (L-V)
router.post("/periods/:id/weeks", async (req, res) => {
  const periodId = Number(req.params.id);
  const { label, startDate, endDate } = req.body || {};
  const count = await prisma.transitWeek.count({ where: { periodId } });

  const week = await prisma.transitWeek.create({
    data: {
      periodId,
      label: label || `Semana ${count + 1}`,
      startDate: parseDate(startDate),
      endDate: parseDate(endDate),
      orderIndex: count,
      days: {
        create: DEFAULT_DAY_LABELS.map((lbl, idx) => ({ label: lbl, orderIndex: idx })),
      },
    },
    include: { days: { orderBy: { orderIndex: "asc" }, include: { marks: true } } },
  });
  res.status(201).json(serializeWeek(week));
});

// PUT /api/weeks/:id  -> edita label / fechas de la semana
router.put("/weeks/:id", async (req, res) => {
  const { label, startDate, endDate } = req.body || {};
  const data = {};
  if (label !== undefined) data.label = label;
  if (startDate !== undefined) data.startDate = parseDate(startDate);
  if (endDate !== undefined) data.endDate = parseDate(endDate);
  const week = await prisma.transitWeek.update({
    where: { id: Number(req.params.id) },
    data,
    include: { days: { orderBy: { orderIndex: "asc" }, include: { marks: true } } },
  });
  res.json(serializeWeek(week));
});

// DELETE /api/weeks/:id
router.delete("/weeks/:id", async (req, res) => {
  await prisma.transitWeek.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

// POST /api/weeks/:id/days  -> agrega un día (columna)
router.post("/weeks/:id/days", async (req, res) => {
  const weekId = Number(req.params.id);
  const { label } = req.body || {};
  const count = await prisma.transitDay.count({ where: { weekId } });
  const day = await prisma.transitDay.create({
    data: { weekId, label: label || `Día ${count + 1}`, orderIndex: count },
    include: { marks: true },
  });
  res.status(201).json(serializeDay(day));
});

// PUT /api/days/:id  -> renombra un día
router.put("/days/:id", async (req, res) => {
  const { label } = req.body || {};
  const day = await prisma.transitDay.update({
    where: { id: Number(req.params.id) },
    data: label !== undefined ? { label } : {},
    include: { marks: true },
  });
  res.json(serializeDay(day));
});

// DELETE /api/days/:id
router.delete("/days/:id", async (req, res) => {
  await prisma.transitDay.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

// PUT /api/marks  -> Body: { dayId, routeKey, used }  (upsert de un checkbox)
router.put("/marks", async (req, res) => {
  const { dayId, routeKey, used } = req.body || {};
  const mark = await prisma.transitMark.upsert({
    where: { dayId_routeKey: { dayId: Number(dayId), routeKey } },
    update: { used: !!used },
    create: { dayId: Number(dayId), routeKey, used: !!used },
  });
  res.json({ id: mark.id, dayId: mark.dayId, routeKey: mark.routeKey, used: mark.used });
});

function serializeWeek(w) {
  return {
    id: w.id,
    label: w.label,
    startDate: dateStr(w.startDate),
    endDate: dateStr(w.endDate),
    orderIndex: w.orderIndex,
    days: (w.days || []).map(serializeDay),
  };
}
function serializeDay(d) {
  return {
    id: d.id,
    label: d.label,
    orderIndex: d.orderIndex,
    marks: (d.marks || []).map((m) => ({ id: m.id, routeKey: m.routeKey, used: m.used })),
  };
}

// Exporto DEFAULT_ROUTES por si se necesita en otro módulo.
export { DEFAULT_ROUTES };
export default router;

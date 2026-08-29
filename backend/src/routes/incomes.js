import { Router } from "express";
import { prisma } from "../db.js";
import { parseDate, toNum, dateStr } from "../utils.js";

const router = Router();

function serialize(i) {
  return { id: i.id, label: i.label, amount: toNum(i.amount), date: dateStr(i.date) };
}

// POST /api/periods/:id/incomes
router.post("/periods/:id/incomes", async (req, res) => {
  const { label, amount, date } = req.body || {};
  const income = await prisma.income.create({
    data: {
      periodId: Number(req.params.id),
      label: label || "",
      amount: Number(amount) || 0,
      date: parseDate(date),
    },
  });
  res.status(201).json(serialize(income));
});

// PUT /api/incomes/:id
router.put("/incomes/:id", async (req, res) => {
  const { label, amount, date } = req.body || {};
  const data = {};
  if (label !== undefined) data.label = label;
  if (amount !== undefined) data.amount = Number(amount) || 0;
  if (date !== undefined) data.date = parseDate(date);
  const income = await prisma.income.update({
    where: { id: Number(req.params.id) },
    data,
  });
  res.json(serialize(income));
});

// DELETE /api/incomes/:id
router.delete("/incomes/:id", async (req, res) => {
  await prisma.income.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export default router;

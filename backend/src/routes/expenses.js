import { Router } from "express";
import { prisma } from "../db.js";
import { parseDate, toNum, dateStr } from "../utils.js";
import { CATEGORIES } from "../constants.js";

const router = Router();

function normCategory(c) {
  const up = String(c || "").toUpperCase();
  return CATEGORIES.includes(up) ? up : "OTROS";
}

function serialize(e) {
  return {
    id: e.id,
    category: e.category,
    description: e.description,
    amount: toNum(e.amount),
    date: dateStr(e.date),
  };
}

// POST /api/periods/:id/expenses
router.post("/periods/:id/expenses", async (req, res) => {
  const { category, description, amount, date } = req.body || {};
  const expense = await prisma.expense.create({
    data: {
      periodId: Number(req.params.id),
      category: normCategory(category),
      description: description || "",
      amount: Number(amount) || 0,
      date: parseDate(date),
    },
  });
  res.status(201).json(serialize(expense));
});

// PUT /api/expenses/:id
router.put("/expenses/:id", async (req, res) => {
  const { category, description, amount, date } = req.body || {};
  const data = {};
  if (category !== undefined) data.category = normCategory(category);
  if (description !== undefined) data.description = description;
  if (amount !== undefined) data.amount = Number(amount) || 0;
  if (date !== undefined) data.date = parseDate(date);
  const expense = await prisma.expense.update({
    where: { id: Number(req.params.id) },
    data,
  });
  res.json(serialize(expense));
});

// DELETE /api/expenses/:id
router.delete("/expenses/:id", async (req, res) => {
  await prisma.expense.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export default router;

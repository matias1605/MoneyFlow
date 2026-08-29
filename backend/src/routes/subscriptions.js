import { Router } from "express";
import { prisma } from "../db.js";
import { toNum } from "../utils.js";

const router = Router();

function serialize(s) {
  return { id: s.id, name: s.name, amount: toNum(s.amount) };
}

// POST /api/periods/:id/subscriptions
router.post("/periods/:id/subscriptions", async (req, res) => {
  const { name, amount } = req.body || {};
  const sub = await prisma.subscription.create({
    data: {
      periodId: Number(req.params.id),
      name: name || "",
      amount: Number(amount) || 0,
    },
  });
  res.status(201).json(serialize(sub));
});

// PUT /api/subscriptions/:id
router.put("/subscriptions/:id", async (req, res) => {
  const { name, amount } = req.body || {};
  const data = {};
  if (name !== undefined) data.name = name;
  if (amount !== undefined) data.amount = Number(amount) || 0;
  const sub = await prisma.subscription.update({
    where: { id: Number(req.params.id) },
    data,
  });
  res.json(serialize(sub));
});

// DELETE /api/subscriptions/:id
router.delete("/subscriptions/:id", async (req, res) => {
  await prisma.subscription.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export default router;

import "dotenv/config";
import express from "express";
import "express-async-errors"; // hace que los errores async lleguen al middleware de error
import cors from "cors";

import periods from "./routes/periods.js";
import incomes from "./routes/incomes.js";
import subscriptions from "./routes/subscriptions.js";
import expenses from "./routes/expenses.js";
import transit from "./routes/transit.js";

const app = express();
app.use(cors());
app.use(express.json());

// Chequeo de salud rápido.
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Todos los routers cuelgan de /api.
app.use("/api", periods);
app.use("/api", incomes);
app.use("/api", subscriptions);
app.use("/api", expenses);
app.use("/api", transit);

// Manejo de errores centralizado: Prisma "no encontrado" -> 404, resto -> 500.
app.use((err, _req, res, _next) => {
  if (err && err.code === "P2025") {
    return res.status(404).json({ error: "Recurso no encontrado" });
  }
  console.error(err);
  res.status(500).json({ error: "Error del servidor", detail: String(err && err.message) });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Moneyflow API escuchando en http://localhost:${PORT}`);
});

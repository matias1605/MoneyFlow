import "dotenv/config";
import express from "express";
import "express-async-errors"; // hace que los errores async lleguen al middleware de error
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import periods from "./routes/periods.js";
import incomes from "./routes/incomes.js";
import subscriptions from "./routes/subscriptions.js";
import expenses from "./routes/expenses.js";
import transit from "./routes/transit.js";
import excelRoutes from "./routes/excelRoutes.js";

const app = express();
app.disable("x-powered-by");
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
app.use("/api", excelRoutes);

// En producción (Render), el backend sirve también el frontend ya compilado.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Cualquier ruta que no sea /api devuelve el index.html (SPA).
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

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

import { money } from "../lib/format.js";

const LABELS = {
  pasajes: "Pasajes",
  subscripciones: "Suscripciones",
  comida: "Comida",
  servicios: "Servicios",
  ocio: "Ocio",
  salud: "Salud",
  otros: "Otros",
};
const ORDER = ["pasajes", "subscripciones", "comida", "servicios", "ocio", "salud", "otros"];

export default function CategorySummary({ summary }) {
  const byCat = summary.byCat;
  const max = Math.max(0.01, ...ORDER.map((k) => byCat[k]));
  return (
    <div className="card">
      <h2 style={{ fontSize: "1.1rem", marginBottom: "14px" }}>Resumen por categoría</h2>
      {ORDER.map((k) => {
        const amt = byCat[k];
        const pct = summary.gastos > 0 ? Math.round((amt / summary.gastos) * 100) : 0;
        const width = Math.round((amt / max) * 100);
        return (
          <div className="cat-row" key={k}>
            <div className="cat-top">
              <span className="name">{LABELS[k]}</span>
              <span className="amt num">
                {money(amt)} <span className="pct">({pct}%)</span>
              </span>
            </div>
            <div className="bar-track">
              <div
                className={"bar-fill" + (k === "pasajes" ? " transit" : "")}
                style={{ width: width + "%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

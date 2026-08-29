import { money } from "../lib/format.js";

export default function StatsStrip({ summary }) {
  return (
    <div className="stats">
      <div className="stat">
        <div className="label">Ingresos</div>
        <div className="value num">{money(summary.ingresos)}</div>
      </div>
      <div className="stat">
        <div className="label">Gastos</div>
        <div className="value num">{money(summary.gastos)}</div>
      </div>
      <div className={"stat " + (summary.saldo >= 0 ? "good" : "bad")}>
        <div className="label">Saldo disponible</div>
        <div className="value num">{money(summary.saldo)}</div>
      </div>
    </div>
  );
}

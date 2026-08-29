import { money } from "../lib/format.js";

export default function HistoryPanel({ periods, currentId, liveSummary, onSelect }) {
  const rows = periods.slice().reverse();
  return (
    <div className="card">
      <h2 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>Historial</h2>
      {rows.length === 0 && <div className="empty-hint">Sin periodos todavía.</div>}
      {rows.map((p) => {
        // Para el periodo actual usamos el saldo calculado en vivo.
        const saldo =
          p.id === currentId && liveSummary ? liveSummary.saldo : p.summary.saldo;
        return (
          <div className={"hist-row" + (p.id === currentId ? " current" : "")} key={p.id}>
            <button className="hist-btn" onClick={() => onSelect(p.id)}>
              {p.label}
            </button>
            <span
              className="hist-saldo num"
              style={{ color: saldo >= 0 ? "var(--good)" : "var(--bad)" }}
            >
              {money(saldo)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

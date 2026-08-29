import { money, weekTotal } from "../lib/format.js";

function dayUses(day, routeKey) {
  const m = (day.marks || []).find((x) => x.routeKey === routeKey);
  return m ? m.used : false;
}

export default function TransitSection({
  period,
  pasajesTotal,
  onRouteCostChange,
  onAddWeek,
  onUpdateWeek,
  onDeleteWeek,
  onAddDay,
  onUpdateDay,
  onDeleteDay,
  onToggleMark,
  onDiscountChange,
}) {
  const routes = period.routeCosts;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Pasajes <span className="chip">tren · bus</span></h2>
          <div className="sub">marcá los días que usaste cada ruta</div>
        </div>
      </div>

      <details className="route-costs">
        <summary>Costos por ruta</summary>
        <div className="cost-grid">
          {routes.map((r) => (
            <label key={r.routeKey}>
              {r.label}
              <input
                type="number"
                step="0.01"
                value={r.cost}
                onChange={(e) => onRouteCostChange(r.routeKey, { cost: e.target.value })}
              />
            </label>
          ))}
        </div>
      </details>

      {period.weeks.map((week) => (
        <div className="week-block" key={week.id}>
          <div className="week-block-head">
            <input
              type="text"
              value={week.label}
              onChange={(e) => onUpdateWeek(week.id, { label: e.target.value })}
              aria-label="Nombre de la semana"
            />
            <div className="week-block-dates">
              <input
                type="date"
                value={week.startDate || ""}
                onChange={(e) => onUpdateWeek(week.id, { startDate: e.target.value })}
                aria-label="Inicio de semana"
              />
              <span>→</span>
              <input
                type="date"
                value={week.endDate || ""}
                onChange={(e) => onUpdateWeek(week.id, { endDate: e.target.value })}
                aria-label="Fin de semana"
              />
            </div>
            <div className="week-total num">{money(weekTotal(period, week))}</div>
          </div>

          <div className="week-table-wrap">
            <table className="week-table">
              <thead>
                <tr>
                  <th className="route-name"></th>
                  {week.days.map((day) => (
                    <th key={day.id}>
                      <input
                        type="text"
                        value={day.label}
                        onChange={(e) => onUpdateDay(day.id, { label: e.target.value })}
                        aria-label="Nombre del día"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.routeKey}>
                    <td className="route-name">{r.label}</td>
                    {week.days.map((day) => (
                      <td key={day.id}>
                        <input
                          type="checkbox"
                          checked={dayUses(day, r.routeKey)}
                          onChange={(e) => onToggleMark(day.id, r.routeKey, e.target.checked)}
                          aria-label={`${r.label} en ${day.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="week-actions">
            <button className="icon-btn" onClick={() => onAddDay(week.id)}>
              + día
            </button>
            <button className="icon-btn danger-btn" onClick={() => onDeleteWeek(week.id)}>
              eliminar semana
            </button>
          </div>
        </div>
      ))}

      {period.weeks.length === 0 && (
        <div className="empty-hint">Todavía no agregaste semanas.</div>
      )}

      <button className="add-line" onClick={onAddWeek}>
        + agregar semana
      </button>

      <div className="field-inline" style={{ marginTop: "10px" }}>
        <label>Descuento / saldo a favor</label>
        <input
          type="number"
          step="0.01"
          value={period.transitDiscount}
          onChange={(e) => onDiscountChange(e.target.value)}
        />
      </div>

      <div className="pasajes-footline">
        <span className="sub">Total pasajes del periodo</span>
        <span className="pasajes-total num">{money(pasajesTotal)}</span>
      </div>
    </div>
  );
}

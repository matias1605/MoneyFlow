import { useState } from "react";

export default function MonthNav({
  periods,
  currentId,
  period,
  onSelect,
  onCreate,
  onDelete,
  onMetaChange,
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const ids = periods.map((p) => p.id);
  const idx = ids.indexOf(currentId);

  return (
    <div className="month-nav">
      <button
        className="arrow"
        disabled={idx <= 0}
        onClick={() => onSelect(ids[idx - 1])}
        aria-label="Periodo anterior"
      >
        ‹
      </button>

      <input
        className="label"
        value={period ? period.label : ""}
        onChange={(e) => onMetaChange({ label: e.target.value })}
        aria-label="Nombre del periodo"
      />

      <button
        className="arrow"
        disabled={idx < 0 || idx >= ids.length - 1}
        onClick={() => onSelect(ids[idx + 1])}
        aria-label="Periodo siguiente"
      >
        ›
      </button>

      {period && (
        <div className="month-dates">
          <input
            type="date"
            value={period.startDate || ""}
            onChange={(e) => onMetaChange({ startDate: e.target.value })}
            aria-label="Fecha inicio"
          />
          <span>→</span>
          <input
            type="date"
            value={period.endDate || ""}
            onChange={(e) => onMetaChange({ endDate: e.target.value })}
            aria-label="Fecha fin"
          />
        </div>
      )}

      <button className="icon-btn" onClick={onCreate}>
        + periodo
      </button>

      <button
        className="icon-btn danger-btn"
        disabled={periods.length <= 1}
        onClick={() => {
          if (!confirmDel) {
            setConfirmDel(true);
            return;
          }
          setConfirmDel(false);
          onDelete();
        }}
        onBlur={() => setConfirmDel(false)}
      >
        {confirmDel ? "¿Confirmar?" : "Borrar"}
      </button>
    </div>
  );
}

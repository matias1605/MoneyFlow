export default function IncomeSection({ incomes, onAdd, onUpdate, onDelete }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Ingresos <span className="chip">quincenas</span></h2>
          <div className="sub">cada pago de sueldo, con su monto (puede variar)</div>
        </div>
      </div>

      <div>
        {incomes.map((i) => (
          <div className="row-line" key={i.id}>
            <input
              type="text"
              placeholder="Ej. 1ra quincena"
              value={i.label}
              onChange={(e) => onUpdate(i.id, { label: e.target.value })}
            />
            <input
              type="date"
              value={i.date || ""}
              onChange={(e) => onUpdate(i.id, { date: e.target.value })}
              aria-label="Fecha del pago"
            />
            <input
              type="number"
              step="0.01"
              value={i.amount}
              onChange={(e) => onUpdate(i.id, { amount: e.target.value })}
              aria-label="Monto"
            />
            <button className="row-del" onClick={() => onDelete(i.id)} aria-label="Eliminar">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="add-line" onClick={onAdd}>
        + agregar pago
      </button>
    </div>
  );
}

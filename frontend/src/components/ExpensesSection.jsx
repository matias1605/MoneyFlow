const CATS = [
  { id: "COMIDA", label: "Comida" },
  { id: "SERVICIOS", label: "Servicios" },
  { id: "OCIO", label: "Ocio" },
  { id: "SALUD", label: "Salud" },
  { id: "OTROS", label: "Otros" },
];

export default function ExpensesSection({ expenses, onAdd, onUpdate, onDelete }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Otros gastos</h2>
          <div className="sub">comida, servicios, ocio, salud…</div>
        </div>
      </div>

      <div>
        {expenses.map((e) => (
          <div className="row-line" key={e.id}>
            <select value={e.category} onChange={(ev) => onUpdate(e.id, { category: ev.target.value })}>
              {CATS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Descripción"
              value={e.description}
              onChange={(ev) => onUpdate(e.id, { description: ev.target.value })}
            />
            <input
              type="number"
              step="0.01"
              value={e.amount}
              onChange={(ev) => onUpdate(e.id, { amount: ev.target.value })}
              aria-label="Monto"
            />
            <button className="row-del" onClick={() => onDelete(e.id)} aria-label="Eliminar">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="add-line" onClick={onAdd}>
        + agregar gasto
      </button>
    </div>
  );
}

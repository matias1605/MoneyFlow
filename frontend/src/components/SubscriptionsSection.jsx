export default function SubscriptionsSection({ subscriptions, onAdd, onUpdate, onDelete }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Suscripciones</h2>
          <div className="sub">cargos recurrentes del periodo</div>
        </div>
      </div>

      <div>
        {subscriptions.map((s) => (
          <div className="row-line" key={s.id}>
            <input
              type="text"
              placeholder="Nombre"
              value={s.name}
              onChange={(e) => onUpdate(s.id, { name: e.target.value })}
            />
            <input
              type="number"
              step="0.01"
              value={s.amount}
              onChange={(e) => onUpdate(s.id, { amount: e.target.value })}
              aria-label="Monto"
            />
            <button className="row-del" onClick={() => onDelete(s.id)} aria-label="Eliminar">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="add-line" onClick={onAdd}>
        + agregar suscripción
      </button>
    </div>
  );
}

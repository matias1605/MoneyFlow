import { useRef, useState } from "react";

export default function DataTools({ onSavePeriod, onSaveAll, onImport }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn, okPrefix) {
    setBusy(true);
    setMsg("Procesando…");
    try {
      const result = await fn();
      setMsg(okPrefix + result);
    } catch (err) {
      setMsg("Error: " + (err.message || "no se pudo completar"));
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    await run(() => onImport(file), "Importado: ");
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Excel</h2>
      <div className="sub" style={{ marginBottom: "12px" }}>
        se guardan en tu carpeta Moneyflowexcels
      </div>

      <div className="data-tools">
        <button className="icon-btn" disabled={busy} onClick={() => run(onSavePeriod, "Guardado en: ")}>
          ⬇ Guardar este periodo
        </button>
        <button className="icon-btn" disabled={busy} onClick={() => run(onSaveAll, "Guardado en: ")}>
          ⬇ Guardar todos (resumen)
        </button>
        <button className="icon-btn" disabled={busy} onClick={() => fileRef.current.click()}>
          ⬆ Importar periodo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>

      {msg && <div className="data-msg">{msg}</div>}
    </div>
  );
}

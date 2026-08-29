import { useRef, useState } from "react";

export default function DataTools({ onSavePeriod, onSaveAll, onImport }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // En local dice "se guardan en tu carpeta"; en la nube, "se descargan".
  const local =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  async function run(fn) {
    setBusy(true);
    setMsg("Procesando…");
    try {
      setMsg(await fn());
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
    await run(() => onImport(file));
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Excel</h2>
      <div className="sub" style={{ marginBottom: "12px" }}>
        {local ? "se guardan en tu carpeta Moneyflowexcels" : "se descargan a tu dispositivo"}
      </div>

      <div className="data-tools">
        <button className="icon-btn" disabled={busy} onClick={() => run(onSavePeriod)}>
          ⬇ {local ? "Guardar" : "Descargar"} este periodo
        </button>
        <button className="icon-btn" disabled={busy} onClick={() => run(onSaveAll)}>
          ⬇ {local ? "Guardar" : "Descargar"} todos (resumen)
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

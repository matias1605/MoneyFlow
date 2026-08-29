import { useRef, useState } from "react";

export default function DataTools({ onExportPeriod, onExportAll, onImport }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // permite re-subir el mismo archivo
    if (!file) return;
    setBusy(true);
    setMsg("Importando…");
    try {
      const name = await onImport(file);
      setMsg(`Importado: ${name}`);
    } catch (err) {
      setMsg("Error: " + (err.message || "no se pudo importar"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Excel</h2>
      <div className="sub" style={{ marginBottom: "12px" }}>
        exportá para respaldo o importá un periodo
      </div>

      <div className="data-tools">
        <button className="icon-btn" onClick={onExportPeriod}>
          ⬇ Exportar este periodo
        </button>
        <button className="icon-btn" onClick={onExportAll}>
          ⬇ Exportar todos (resumen)
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

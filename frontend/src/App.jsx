import { useEffect, useRef, useState } from "react";
import { api, downloadFile } from "./api.js";
import { computeSummary } from "./lib/format.js";

import MonthNav from "./components/MonthNav.jsx";
import StatsStrip from "./components/StatsStrip.jsx";
import IncomeSection from "./components/IncomeSection.jsx";
import TransitSection from "./components/TransitSection.jsx";
import SubscriptionsSection from "./components/SubscriptionsSection.jsx";
import ExpensesSection from "./components/ExpensesSection.jsx";
import CategorySummary from "./components/CategorySummary.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import DataTools from "./components/DataTools.jsx";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [periods, setPeriods] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const didInit = useRef(false);

  // Reporta un error de red de forma no intrusiva.
  function fail(e) {
    console.error(e);
    setError("Hubo un problema al guardar. ¿El servidor está corriendo? " + (e.message || ""));
  }

  // Carga inicial: lista periodos, crea uno si no hay, y abre el último.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      try {
        let list = await api.listPeriods();
        if (list.length === 0) {
          await api.createPeriod({
            label: "Nuevo periodo",
            startDate: todayISO(),
            endDate: todayISO(),
          });
          list = await api.listPeriods();
        }
        setPeriods(list);
        const last = list[list.length - 1];
        await openPeriod(last.id);
      } catch (e) {
        fail(e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshList() {
    try {
      setPeriods(await api.listPeriods());
    } catch (e) {
      fail(e);
    }
  }

  async function openPeriod(id) {
    try {
      const detail = await api.getPeriod(id);
      setPeriod(detail);
      setCurrentId(id);
    } catch (e) {
      fail(e);
    }
  }

  // ---- helpers de actualización local (optimista) ----
  function patchPeriod(updater) {
    setPeriod((prev) => (prev ? updater({ ...prev }) : prev));
  }
  function updateWeekLocal(weekId, updater) {
    patchPeriod((p) => {
      p.weeks = p.weeks.map((w) => (w.id === weekId ? updater({ ...w }) : w));
      return p;
    });
  }
  function updateDayLocal(dayId, updater) {
    patchPeriod((p) => {
      p.weeks = p.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) => (d.id === dayId ? updater({ ...d }) : d)),
      }));
      return p;
    });
  }

  // ---- Periodo (meta) ----
  async function handleCreate() {
    try {
      const created = await api.createPeriod({
        label: "Nuevo periodo",
        startDate: todayISO(),
        endDate: todayISO(),
        cloneFromId: currentId,
      });
      await refreshList();
      setPeriod(created);
      setCurrentId(created.id);
    } catch (e) {
      fail(e);
    }
  }
  async function handleDelete() {
    try {
      await api.deletePeriod(currentId);
      const list = await api.listPeriods();
      setPeriods(list);
      const next = list[list.length - 1];
      if (next) await openPeriod(next.id);
    } catch (e) {
      fail(e);
    }
  }
  function handleMetaChange(patch) {
    patchPeriod((p) => ({ ...p, ...patch }));
    api.updatePeriod(currentId, patch).catch(fail);
  }
  function handleDiscountChange(value) {
    patchPeriod((p) => ({ ...p, transitDiscount: value }));
    api.updatePeriod(currentId, { transitDiscount: Number(value) || 0 }).catch(fail);
  }

  // ---- Ingresos ----
  async function addIncome() {
    try {
      const row = await api.addIncome(currentId, { label: "", amount: 0 });
      patchPeriod((p) => ({ ...p, incomes: [...p.incomes, row] }));
    } catch (e) {
      fail(e);
    }
  }
  function updateIncome(id, patch) {
    patchPeriod((p) => ({
      ...p,
      incomes: p.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
    api.updateIncome(id, patch).catch(fail);
  }
  function deleteIncome(id) {
    patchPeriod((p) => ({ ...p, incomes: p.incomes.filter((i) => i.id !== id) }));
    api.deleteIncome(id).catch(fail);
  }

  // ---- Suscripciones ----
  async function addSubscription() {
    try {
      const row = await api.addSubscription(currentId, { name: "", amount: 0 });
      patchPeriod((p) => ({ ...p, subscriptions: [...p.subscriptions, row] }));
    } catch (e) {
      fail(e);
    }
  }
  function updateSubscription(id, patch) {
    patchPeriod((p) => ({
      ...p,
      subscriptions: p.subscriptions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
    api.updateSubscription(id, patch).catch(fail);
  }
  function deleteSubscription(id) {
    patchPeriod((p) => ({ ...p, subscriptions: p.subscriptions.filter((s) => s.id !== id) }));
    api.deleteSubscription(id).catch(fail);
  }

  // ---- Gastos ----
  async function addExpense() {
    try {
      const row = await api.addExpense(currentId, { category: "OTROS", description: "", amount: 0 });
      patchPeriod((p) => ({ ...p, expenses: [...p.expenses, row] }));
    } catch (e) {
      fail(e);
    }
  }
  function updateExpense(id, patch) {
    patchPeriod((p) => ({
      ...p,
      expenses: p.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    api.updateExpense(id, patch).catch(fail);
  }
  function deleteExpense(id) {
    patchPeriod((p) => ({ ...p, expenses: p.expenses.filter((x) => x.id !== id) }));
    api.deleteExpense(id).catch(fail);
  }

  // ---- Pasajes ----
  function updateRouteCost(routeKey, patch) {
    patchPeriod((p) => {
      const routeCosts = p.routeCosts.map((rc) =>
        rc.routeKey === routeKey ? { ...rc, ...patch } : rc
      );
      // Persistimos la lista completa (el endpoint hace upsert).
      api
        .updateRouteCosts(
          currentId,
          routeCosts.map((rc) => ({
            routeKey: rc.routeKey,
            label: rc.label,
            cost: Number(rc.cost) || 0,
          }))
        )
        .catch(fail);
      return { ...p, routeCosts };
    });
  }
  async function addWeek() {
    try {
      const week = await api.addWeek(currentId);
      patchPeriod((p) => ({ ...p, weeks: [...p.weeks, week] }));
    } catch (e) {
      fail(e);
    }
  }
  function updateWeek(id, patch) {
    updateWeekLocal(id, (w) => ({ ...w, ...patch }));
    api.updateWeek(id, patch).catch(fail);
  }
  function deleteWeek(id) {
    patchPeriod((p) => ({ ...p, weeks: p.weeks.filter((w) => w.id !== id) }));
    api.deleteWeek(id).catch(fail);
  }
  async function addDay(weekId) {
    try {
      const day = await api.addDay(weekId);
      updateWeekLocal(weekId, (w) => ({ ...w, days: [...w.days, day] }));
    } catch (e) {
      fail(e);
    }
  }
  function updateDay(id, patch) {
    updateDayLocal(id, (d) => ({ ...d, ...patch }));
    api.updateDay(id, patch).catch(fail);
  }
  function deleteDay(id) {
    patchPeriod((p) => ({
      ...p,
      weeks: p.weeks.map((w) => ({ ...w, days: w.days.filter((d) => d.id !== id) })),
    }));
    api.deleteDay(id).catch(fail);
  }
  function toggleMark(dayId, routeKey, used) {
    updateDayLocal(dayId, (d) => {
      const exists = (d.marks || []).some((m) => m.routeKey === routeKey);
      const marks = exists
        ? d.marks.map((m) => (m.routeKey === routeKey ? { ...m, used } : m))
        : [...(d.marks || []), { routeKey, used }];
      return { ...d, marks };
    });
    api.setMark(dayId, routeKey, used).catch(fail);
  }

  // ---- Excel ----
  function exportPeriod() {
    if (currentId) downloadFile(api.exportPeriodUrl(currentId));
  }
  function exportAll() {
    downloadFile(api.exportAllUrl());
  }
  async function importExcel(file) {
    const created = await api.importExcel(file);
    await refreshList();
    setPeriod(created);
    setCurrentId(created.id);
    return created.label;
  }

  if (loading) {
    return <div className="loading-screen">Cargando Moneyflow…</div>;
  }

  const summary = computeSummary(period);
  const pasajesTotal = summary.byCat.pasajes;

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <h1>Moneyflow</h1>
          <div className="tagline">
            sueldo quincenal <span className="dot">·</span> pasajes{" "}
            <span className="dot">·</span> suscripciones <span className="dot">·</span> gastos
          </div>
        </div>
        <MonthNav
          periods={periods}
          currentId={currentId}
          period={period}
          onSelect={openPeriod}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onMetaChange={handleMetaChange}
        />
      </header>

      {error && <div className="error-banner">{error}</div>}

      {period && (
        <>
          <StatsStrip summary={summary} />
          <div className="layout">
            <div className="col">
              <IncomeSection
                incomes={period.incomes}
                onAdd={addIncome}
                onUpdate={updateIncome}
                onDelete={deleteIncome}
              />
              <TransitSection
                period={period}
                pasajesTotal={pasajesTotal}
                onRouteCostChange={updateRouteCost}
                onAddWeek={addWeek}
                onUpdateWeek={updateWeek}
                onDeleteWeek={deleteWeek}
                onAddDay={addDay}
                onUpdateDay={updateDay}
                onDeleteDay={deleteDay}
                onToggleMark={toggleMark}
                onDiscountChange={handleDiscountChange}
              />
              <SubscriptionsSection
                subscriptions={period.subscriptions}
                onAdd={addSubscription}
                onUpdate={updateSubscription}
                onDelete={deleteSubscription}
              />
              <ExpensesSection
                expenses={period.expenses}
                onAdd={addExpense}
                onUpdate={updateExpense}
                onDelete={deleteExpense}
              />
            </div>
            <div className="col">
              <CategorySummary summary={summary} />
              <HistoryPanel
                periods={periods}
                currentId={currentId}
                liveSummary={summary}
                onSelect={openPeriod}
              />
              <DataTools
                onExportPeriod={exportPeriod}
                onExportAll={exportAll}
                onImport={importExcel}
              />
            </div>
          </div>
        </>
      )}

      <footer className="foot">
        Los datos se guardan en tu base PostgreSQL local. Proyecto personal — Moneyflow.
      </footer>
    </div>
  );
}

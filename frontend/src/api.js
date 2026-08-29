// Wrapper simple sobre fetch hacia el backend (/api va por proxy a :3001).

async function req(method, url, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).error || "";
    } catch (e) {
      /* ignore */
    }
    throw new Error(`${res.status} ${detail}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Periodos
  listPeriods: () => req("GET", "/api/periods"),
  getPeriod: (id) => req("GET", `/api/periods/${id}`),
  createPeriod: (data) => req("POST", "/api/periods", data),
  updatePeriod: (id, data) => req("PUT", `/api/periods/${id}`, data),
  deletePeriod: (id) => req("DELETE", `/api/periods/${id}`),

  // Ingresos (quincenas)
  addIncome: (periodId, data) => req("POST", `/api/periods/${periodId}/incomes`, data),
  updateIncome: (id, data) => req("PUT", `/api/incomes/${id}`, data),
  deleteIncome: (id) => req("DELETE", `/api/incomes/${id}`),

  // Suscripciones
  addSubscription: (periodId, data) => req("POST", `/api/periods/${periodId}/subscriptions`, data),
  updateSubscription: (id, data) => req("PUT", `/api/subscriptions/${id}`, data),
  deleteSubscription: (id) => req("DELETE", `/api/subscriptions/${id}`),

  // Gastos
  addExpense: (periodId, data) => req("POST", `/api/periods/${periodId}/expenses`, data),
  updateExpense: (id, data) => req("PUT", `/api/expenses/${id}`, data),
  deleteExpense: (id) => req("DELETE", `/api/expenses/${id}`),

  // Pasajes
  updateRouteCosts: (periodId, routeCosts) =>
    req("PUT", `/api/periods/${periodId}/route-costs`, { routeCosts }),
  addWeek: (periodId, data) => req("POST", `/api/periods/${periodId}/weeks`, data || {}),
  updateWeek: (id, data) => req("PUT", `/api/weeks/${id}`, data),
  deleteWeek: (id) => req("DELETE", `/api/weeks/${id}`),
  addDay: (weekId, data) => req("POST", `/api/weeks/${weekId}/days`, data || {}),
  updateDay: (id, data) => req("PUT", `/api/days/${id}`, data),
  deleteDay: (id) => req("DELETE", `/api/days/${id}`),
  setMark: (dayId, routeKey, used) => req("PUT", "/api/marks", { dayId, routeKey, used }),

  // Excel
  savePeriodExcel: (id) => req("POST", `/api/periods/${id}/save-excel`),
  saveAllExcel: () => req("POST", `/api/save-excel`),
  exportPeriodUrl: (id) => `/api/periods/${id}/export`,
  exportAllUrl: () => `/api/export`,
  importExcel: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: form });
    if (!res.ok) {
      let detail = "";
      try {
        detail = (await res.json()).error || "";
      } catch (e) {
        /* ignore */
      }
      throw new Error(detail || `Error ${res.status}`);
    }
    return res.json();
  },
};

// Dispara la descarga de un archivo desde una URL (respuesta con attachment).
export function downloadFile(url) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

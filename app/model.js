// ============================ MODEL ============================
// Data, business logic and API access. No Preact / no DOM rendering here —
// pure data + side-effecting API calls. The View imports the read helpers;
// the Controller drives loading.

// ---- Connection parameters ----
// Normal wrapper flow: injected via the URL query string (?baseUrl=…&token=…).
// srcDoc-embedded flow: a React host renders app.html into an iframe's srcDoc and
// exposes the same params on `window.__COCKPIT_PARAMS__` (set by a classic inline
// script that runs before this module). This is the robust channel — it survives
// sandboxed / opaque-origin iframes where the query-string-seeding replaceState is
// blocked. Precedence: query string → srcDoc global → localStorage fallback.
export const LS = 'eduxept_cockpit';
const cfg = JSON.parse(localStorage.getItem(LS) || '{}');
const gp  = window.__COCKPIT_PARAMS__ || {};
const qp = new URLSearchParams(location.search);
export const BASE_URL   = (qp.get('baseUrl') || gp.baseUrl || cfg.baseUrl || '').trim().replace(/\/$/, '');
export const TOKEN      = (qp.get('token')   || gp.token   || cfg.token   || '').trim();
export const PROJECT_PK = (qp.get('projectPk') || gp.projectPk || cfg.projectPk || '').toString().trim();
// Theme is resolved & applied by the inline script in app.html (single source
// of truth, runs before first paint); here we just reflect the result.
export const THEME      = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

export function saveCfg() {
  localStorage.setItem(LS, JSON.stringify({ baseUrl: BASE_URL, token: TOKEN, projectPk: PROJECT_PK || cfg.projectPk, theme: THEME }));
}

export async function api(path, body, method = 'POST') {
  const res = await fetch(BASE_URL + path, {
    method, headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    let detail = ''; try { const j = await res.json(); detail = j.detail ? JSON.stringify(j.detail) : JSON.stringify(j); } catch (e) {}
    throw new Error('HTTP ' + res.status + ' bei ' + method + ' ' + path + (detail ? '\n' + detail : ' (kein Fehlertext vom Server)'));
  }
  if (res.status === 204) return null;
  try { return await res.json(); } catch (e) { return null; }
}

// ============================ MODEL ============================
// App-wide data plumbing: connection parameters and the generic API
// transport. No Preact / no DOM rendering here. Entity-specific Models
// live in feature folders (e.g. base_data/projects/model.js) and build
// on the api() helper exported below.

// ---- Connection parameters ----
// Normal wrapper flow: injected via the URL query string (?baseUrl=…&token=…).
// srcDoc-embedded flow: a React host renders app.html into an iframe's srcDoc and
// exposes the same params on `window.__COCKPIT_PARAMS__` (set by a classic inline
// script that runs before this module). This is the robust channel — it survives
// sandboxed / opaque-origin iframes where the query-string-seeding replaceState is
// blocked. Precedence: query string → srcDoc global → localStorage fallback.
export const LS = 'xedu_org_template';
const cfg = JSON.parse(localStorage.getItem(LS) || '{}');
const gp  = window.__COCKPIT_PARAMS__ || {};
const qp = new URLSearchParams(location.search);
export const BASE_URL   = (qp.get('baseUrl') || gp.baseUrl || cfg.baseUrl || '').trim().replace(/\/$/, '');
export const TOKEN      = (qp.get('token')   || gp.token   || cfg.token   || '').trim();
export const PROJECT_PK = (qp.get('projectPk') || gp.projectPk || cfg.projectPk || '').toString().trim();
export const LANGUAGE   = (qp.get('language') || gp.language || cfg.language || 'de').toString().trim().toLowerCase();

// console.log('BASE_URL', BASE_URL, 'TOKEN', TOKEN, 'PROJECT_PK', PROJECT_PK, 'LANGUAGE', LANGUAGE);

// Theme is resolved & applied by the inline script in app.html (single source
// of truth, runs before first paint); here we just reflect the result.
export const THEME      = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

export function saveCfg() {
  localStorage.setItem(LS, JSON.stringify({ baseUrl: BASE_URL, token: TOKEN, projectPk: PROJECT_PK || cfg.projectPk, theme: THEME, language: LANGUAGE }));
}

// ---- i18n ----
// i18next itself is loaded & initialized in app.html (CDN, UMD globals).
// Here it is bound to the LANGUAGE connection parameter and exposed as t()
// for all modules; controller.js awaits i18nReady before the first render.
export const i18nReady = (window.i18nReady || Promise.resolve()).then(() => {
  if (window.i18next && window.i18next.language !== LANGUAGE) return window.i18next.changeLanguage(LANGUAGE);
});
export const t = (key, opts) => window.i18next ? window.i18next.t(key, opts) : key;

export async function api(path, body, method = 'POST') {
  const res = await fetch(BASE_URL + path, {
    method, headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    let detail = ''; try { const j = await res.json(); detail = j.detail ? JSON.stringify(j.detail) : JSON.stringify(j); } catch (e) {}
    throw new Error(t('http_error', {status: res.status, method, path}) + (detail ? '\n' + detail : ' ' + t('no_error_text')));
  }
  if (res.status === 204) return null;
  try { return await res.json(); } catch (e) { return null; }
}


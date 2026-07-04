// ============================ MODEL ============================
// Data, business logic and API access. No Preact / no DOM rendering here —
// pure data + side-effecting API calls. The View imports the read helpers;
// the Controller drives loading.

import {
    ProjectQueryStrategies, ProjectsStrategies, ProjectStrategies,
    TrafficLightType, DataStateType, McpDataStateType,
} from './openapi.js';

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
// Theme is resolved & applied by the inline script in app.html (single source
// of truth, runs before first paint); here we just reflect the result.
export const THEME      = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

export function saveCfg() {
  localStorage.setItem(LS, JSON.stringify({ baseUrl: BASE_URL, token: TOKEN, projectPk: PROJECT_PK || cfg.projectPk, theme: THEME, language: LANGUAGE }));
}

export async function api(path, body, method = 'POST') {
  const res = await fetch(BASE_URL + path, {
    method, headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  console.log(method, body);
  if (!res.ok) {
    let detail = ''; try { const j = await res.json(); detail = j.detail ? JSON.stringify(j.detail) : JSON.stringify(j); } catch (e) {}
    throw new Error('HTTP ' + res.status + ' bei ' + method + ' ' + path + (detail ? '\n' + detail : ' (kein Fehlertext vom Server)'));
  }
  if (res.status === 204) return null;
  try { return await res.json(); } catch (e) { return null; }
}

// ---- CRUD: /strategies-tables/projects/* ----
// Contract (openapi.json):
//   POST   …/create  ProjectStrategies      → ProjectStrategies
//   POST   …/read    ProjectQueryStrategies → ProjectsStrategies (envelope, rows)
//   PUT    …/update  ProjectStrategies      → ProjectStrategies
//   DELETE …/delete  ProjectStrategies      → (kein Inhalt)
// Payloads and results are typed via the generated dataclasses (openapi.js).
const PROJECTS_BASE = '/strategies-tables/projects';
const toProject = data => data ? ProjectStrategies.constructFromObject(data, new ProjectStrategies()) : null;

// Create a row. State/enum fields (traffic_light*, *data_state) are
// intentionally not sent (server enum-view bug, see CLAUDE.md).
export async function createProject(project) {
  const payload = {...project};
  PROJECT_FIELDS.filter(f => f.type === 'enum').forEach(f => delete payload[f.key]);
  return toProject(await api(PROJECTS_BASE + '/create', payload));
}

// Read rows by SQL-ish filter; returns the ProjectsStrategies envelope
// (rows typed as ProjectStrategies; `where` defaults to 'pk > 0').
export async function readProjects(where) {
  const q = new ProjectQueryStrategies();
  if (where) q.where = where;
  const data = await api(PROJECTS_BASE + '/read', q);
  return ProjectsStrategies.constructFromObject(data, new ProjectsStrategies());
}

// Update a row (all fields optional, pk identifies the row).
export async function updateProject(project)
{
  return toProject(await api(PROJECTS_BASE + '/update', project, 'PUT'));
}

// Delete a row (identified by pk).
export async function deleteProject(project) {
  return api(PROJECTS_BASE + '/delete', {pk: project.pk}, 'DELETE');
}

// ---- Projekt (current row from strategies-tables/projects) ----
// Attribute config for the Projekteinstellungen form. `ro` = server-managed,
// read-only; `json` = JSONB column edited as JSON text; enum options come
// from the generated enum classes (openapi.js, contract: openapi.json).
const TRAFFIC_LIGHTS = Object.values(new TrafficLightType());
export const PROJECT_FIELDS = [
  {key: 'pk', type: 'ro'},
  // {key: 'fk_user', type: 'number'},
  {key: 'id', type: 'text'},
  {key: 'name', type: 'text'},
  {key: 'description', type: 'text'},
  {key: 'icon', type: 'text'},
  {key: 'traffic_light', type: 'enum', options: TRAFFIC_LIGHTS},
  {key: 'traffic_light_quality', type: 'enum', options: TRAFFIC_LIGHTS},
  {key: 'traffic_light_cost', type: 'enum', options: TRAFFIC_LIGHTS},
  {key: 'traffic_light_time', type: 'enum', options: TRAFFIC_LIGHTS},
  {key: 'data_state', type: 'enum', options: Object.values(new DataStateType())},
  {key: 'mcp_data_state', type: 'enum', options: Object.values(new McpDataStateType())},
  {key: 'comments', type: 'text'},
  {key: 'notes', type: 'json'},
  {key: 'metadatas', type: 'json'},
  {key: 'created_at', type: 'ro'},
  {key: 'updated_at', type: 'ro'},
];

// Load the current project row, typed as ProjectStrategies (openapi.js).
export async function readProject() {
  if (!PROJECT_PK) return null;
  const res = await readProjects('pk = ' + PROJECT_PK);
  console.log('readProject', res.rows[0]);
  return (res.rows && res.rows[0]) || null;
}

// Write one changed attribute (partial update: pk + field) via
// PUT /strategies-tables/projects/update. `raw` is the input string; it is
// coerced to the field type ('' → null). Returns the updated row from the
// PUT response, typed as ProjectStrategies (openapi.js).
export async function updateProjectField(project, key, raw) {
  console.log(project, key, raw)
  const f = PROJECT_FIELDS.find(x => x.key === key);
  let value = raw === '' ? null : raw;
  if (value != null && f.type === 'number') {
    value = Number(value);
    if (Number.isNaN(value)) throw new Error('Ungültige Zahl für ' + key + ': ' + raw);
  }
  if (value != null && f.type === 'json') {
    try { value = JSON.parse(value); }
    catch (e) { throw new Error('Ungültiges JSON für ' + key + ': ' + e.message); }
  }
  console.log('updateProjectField', {pk: project.pk, [key]: value});
  return updateProject({pk: project.pk, [key]: value});
}

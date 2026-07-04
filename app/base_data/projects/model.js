// ==================== MODEL · base_data/projects ====================
// Data + API access for the project row (/strategies-tables/projects/*).
// No Preact / no DOM rendering here — the View (./view.js) renders, the
// app Controller owns the state and wires the two together.

import {api, PROJECT_PK, t} from '../../model.js';
import {
    ProjectQueryStrategies, ProjectsStrategies, ProjectStrategies,
    TrafficLightType, DataStateType, McpDataStateType,
} from '../../openapi.js';

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
  {key: 'fk_user', type: 'number'},
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

// Write one changed attribute via PUT /strategies-tables/projects/update:
// the coerced value is merged into the full current row, so all other
// attributes are sent along unchanged. `raw` is the input string; it is
// coerced to the field type ('' → null). Returns the updated row from the
// PUT response, typed as ProjectStrategies (openapi.js).
export async function updateProjectField(project, key, raw) {
  console.log(project, key, raw)
  const f = PROJECT_FIELDS.find(x => x.key === key);
  let value = raw === '' ? null : raw;
  if (value != null && f.type === 'number') {
    value = Number(value);
    if (Number.isNaN(value)) throw new Error(t('invalid_number', {key, value: raw}));
  }
  if (value != null && f.type === 'json') {
    try { value = JSON.parse(value); }
    catch (e) { throw new Error(t('invalid_json', {key, message: e.message})); }
  }
  const payload = {...project, [key]: value};
  console.log('updateProjectField', payload);
  return updateProject(payload);
}

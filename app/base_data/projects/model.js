// ==================== MODEL · base_data/projects ====================
// Data + API access for the project row (/skills-tables/projects/*).
// No Preact / no DOM rendering here — the View (./view.js) renders, the
// app Controller owns the state and wires the two together.

import {api, LANGUAGE, PROJECT_PK, t} from '../../model.js';
import {
    ProjectQuerySkills, ProjectsSkills, ProjectSkills,
    DataStateType, McpDataStateType,
} from '../../openapi.js';

// ---- CRUD: /skills-tables/projects/* ----
// Contract (openapi.json):
//   POST   …/create  ProjectSkills      → ProjectSkills
//   POST   …/read    ProjectQuerySkills → ProjectsSkills (envelope, rows)
//   PUT    …/update  ProjectSkills      → ProjectSkills
//   DELETE …/delete  ProjectSkills      → (kein Inhalt)
// Payloads and results are typed via the generated dataclasses (openapi.js).
const PROJECTS_BASE = '/skills-tables/projects';
const toProject = data => data ? ProjectSkills.constructFromObject(data, new ProjectSkills()) : null;

// Create a row. State/enum fields (traffic_light*, *data_state) are
// intentionally not sent (server enum-view bug, see CLAUDE.md).
export async function createProject(project) {
  const payload = {...project};
  PROJECT_FIELDS.filter(f => f.type === 'enum').forEach(f => delete payload[f.key]);
  return toProject(await api(PROJECTS_BASE + '/create', payload));
}

// Read rows by SQL-ish filter; returns the ProjectsSkills envelope
// (rows typed as ProjectSkills; `where` defaults to 'pk > 0'). The UI
// language is sent along so the server resolves the tsl_*_txt fields.
export async function readProjects(where) {
  const q = new ProjectQuerySkills();
  if (where) q.where = where;
  q.language = LANGUAGE;
  const data = await api(PROJECTS_BASE + '/read', q);
  return ProjectsSkills.constructFromObject(data, new ProjectsSkills());
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

// ---- Projekt (current row from skills-tables/projects) ----
// Attribute config for the Projekteinstellungen form. `ro` = server-managed,
// read-only; `json` = JSONB column edited as JSON text; enum options come
// from the generated enum classes (openapi.js, contract: openapi.json).
// Language handling: tsl_name/tsl_description are logical references into
// tsl_translations (read-only here); the editable texts are the resolved
// tsl_name_txt/tsl_description_txt in tsl_language (the read language).
export const PROJECT_FIELDS = [
  {key: 'pk', type: 'ro'},
  {key: 'id', type: 'text'},
  {key: 'tsl_name', type: 'ro'},
  {key: 'tsl_description', type: 'ro'},
  {key: 'tsl_name_txt', type: 'text'},
  {key: 'tsl_description_txt', type: 'text'},
  {key: 'tsl_language', type: 'ro'},
  {key: 'data_state', type: 'enum', options: Object.values(new DataStateType())},
  {key: 'mcp_data_state', type: 'enum', options: Object.values(new McpDataStateType())},
  {key: 'comments', type: 'text'},
  {key: 'notes', type: 'json'},
  {key: 'metadatas', type: 'json'},
  {key: 'created_at', type: 'ro'},
  {key: 'updated_at', type: 'ro'},
];

// Load the current project row, typed as ProjectSkills (openapi.js).
export async function readProject() {
  if (!PROJECT_PK) return null;
  const res = await readProjects('pk = ' + PROJECT_PK);
  // console.log('readProject', res.rows[0]);
  return (res.rows && res.rows[0]) || null;
}

// Write one changed attribute via PUT /skills-tables/projects/update:
// the coerced value is merged into the full current row, so all other
// attributes (incl. tsl_language, which tells the server which language
// the tsl_*_txt values belong to) are sent along unchanged. `raw` is the
// input string; it is coerced to the field type ('' → null). Returns the
// updated row from the PUT response, typed as ProjectSkills (openapi.js).
export async function updateProjectField(project, key, raw) {
  // console.log(project, key, raw)
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
  // console.log('updateProjectField', payload);
  return updateProject(payload);
}

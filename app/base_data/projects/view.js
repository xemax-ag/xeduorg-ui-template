// ==================== VIEW · base_data/projects ====================
// Presentational components for the Projekteinstellungen panel. Reads the
// field config from the feature Model (./model.js) and delegates mutations
// to the Controller via the onChangeField callback prop.

import {h} from 'preact';
import htm from 'htm';

const html = htm.bind(h);

import {t} from '../../model.js';
import {Icon} from '../../icons.js';
import {PROJECT_FIELDS} from './model.js';

// Field keys rendered by ProjectSettings, in display order.
const FIELD_ORDER = [
    'pk', 'id', 'tsl_name_txt', 'tsl_description_txt',
    'tsl_language', 'tsl_name', 'tsl_description',
    'data_state', 'mcp_data_state', 'comments', 'notes', 'metadatas', 'created_at', 'updated_at',
];

// Editable project attributes (Projekteinstellungen): auto-save on change.
// Each committed input calls onChangeField(key, rawValue); the Controller
// writes it via the API and reloads the row (also on error, so the form
// falls back to the stored values).
export function ProjectSettings({project, onChangeField}) {
    // Field config per attribute from the Model (single source of truth for
    // type, enum options and coercion).
    const fld = key => PROJECT_FIELDS.find(f => f.key === key);
    const lbl = key => t(`base_data.projects.view_js.${key}`);
    return html`
        <div class="card bg-base-100 border border-base-300 rounded-card shadow-card w-full mb-1">
            <div class="card-body gap-3">
                <div class="flex items-center gap-2">
                    <${Icon} name="sliders" class="size-4 text-primary"/>
                    <h2 class="card-title text-base m-0">${t('project_settings')}</h2>
                </div>
                ${!project ? html`
                    <p class="text-base-content/60">${t('no_project_loaded')}</p>` : html`
                    <div class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
                        ${FIELD_ORDER.map(key => html`
                            <${Field} key=${key} f=${fld(key)} label=${lbl(key)} project=${project}
                                      onChangeField=${onChangeField}/>`)}
                    </div>`}
            </div>
        </div>
    `;
}

// One attribute: read-only input, enum select, or text/number input.
function Field({f, label, project, onChangeField}) {
    const raw = project[f.key];
    const v = raw == null ? '' : (typeof raw === 'object' ? JSON.stringify(raw) : String(raw));
    const commit = e => { if (e.target.value !== v) onChangeField(f.key, e.target.value); };
    if (f.type === 'ro') return html`
        <fieldset class="fieldset py-0">
            <legend class="fieldset-legend">${label}</legend>
            <input class="input input-sm w-full" value=${v} placeholder="–" readonly/>
        </fieldset>`;
    if (f.type === 'enum') return html`
        <fieldset class="fieldset py-0">
            <legend class="fieldset-legend">${label}</legend>
            <select class="select select-sm w-full" value=${v} onChange=${commit}>
                <option value="">–</option>
                ${f.options.map(o => html`
                    <option value=${o}>${o}</option>`)}
            </select>
        </fieldset>`;
    return html`
        <fieldset class="fieldset py-0">
            <legend class="fieldset-legend">${label}</legend>
            <input class="input input-sm w-full" type=${f.type === 'number' ? 'number' : 'text'} value=${v}
                   onChange=${commit}/>
        </fieldset>`;
}

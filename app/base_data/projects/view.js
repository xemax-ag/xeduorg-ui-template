// ==================== VIEW · base_data/projects ====================
// Presentational components for the Projekteinstellungen panel. Reads the
// field config from the feature Model (./model.js) and delegates mutations
// to the Controller via the onChangeField callback prop.

import {h} from 'preact';
import htm from 'htm';

const html = htm.bind(h);

import {t} from '../../model.js';
import {PROJECT_FIELDS} from './model.js';

// Field keys rendered by ProjectSettings, in display order.
const FIELD_ORDER = [
    'pk', 'id', 'name', 'description',
    'traffic_light', 'traffic_light_quality', 'traffic_light_cost', 'traffic_light_time',
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
        <wa-card class="w-full mb-1">
            <div slot="header" class="wa-cluster wa-gap-xs wa-align-items-center">
                <wa-icon name="sliders"></wa-icon>
                <h1 class="wa-heading-s m-0">${t('project_settings')}</h1>
            </div>
            ${!project ? html`
                <p class="wa-color-text-quiet">${t('no_project_loaded')}</p>` : html`
                <div class="wa-grid wa-gap-m" style="--min-column-size: 14rem;">
                    ${FIELD_ORDER.map(key => html`
                        <${Field} key=${key} f=${fld(key)} label=${lbl(key)} project=${project}
                                  onChangeField=${onChangeField}/>`)}
                </div>`}
        </wa-card>
    `;
}

// One attribute: read-only input, enum select, or text/number input.
function Field({f, label, project, onChangeField}) {
    const raw = project[f.key];
    const v = raw == null ? '' : (typeof raw === 'object' ? JSON.stringify(raw) : String(raw));
    const commit = e => { if (e.target.value !== v) onChangeField(f.key, e.target.value); };
    if (f.type === 'ro') return html`
        <wa-input label=${label} value=${v} placeholder="–" readonly></wa-input>`;
    if (f.type === 'enum') return html`
        <wa-select label=${label} value=${v} onChange=${commit}>
            <wa-option value="">–</wa-option>
            ${f.options.map(o => html`
                <wa-option value=${o}>${o}</wa-option>`)}
        </wa-select>`;
    return html`
        <wa-input label=${label} type=${f.type === 'number' ? 'number' : 'text'} value=${v}
                  onChange=${commit}></wa-input>`;
}

// ==================== VIEW · base_data/projects ====================
// Presentational components for the Projekteinstellungen panel. Reads the
// field config from the feature Model (./model.js) and delegates mutations
// to the Controller via the onChangeField callback prop.

import {h} from 'preact';
import htm from 'htm';

const html = htm.bind(h);

import {t} from '../../model.js';
import {PROJECT_FIELDS} from './model.js';

// Editable project attributes (Projekteinstellungen): auto-save on change.
// Each committed input calls onChangeField(key, rawValue); the Controller
// writes it via the API and reloads the row (also on error, so the form
// falls back to the stored values).
export function ProjectSettings({project, onChangeField}) {
    // Field config per attribute from the Model (single source of truth for
    // type, enum options and coercion).
    const fld = key => PROJECT_FIELDS.find(f => f.key === key);
    return html`
        <div class="bg-panel border border-border rounded-card shadow-card p-5 w-full mb-5">
            <h1 class="text-[15px] font-[650] text-primary mb-3">${t('project_settings')}</h1>
            ${!project ? html`
                <div class="text-sm text-[var(--color-text-faint)]">${t('no_project_loaded')}</div>` : html`
                <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm items-center">
                    <label>pk</label>
                    <${Field} f=${fld('pk')} project=${project} onChangeField=${onChangeField}/>

                    <label>id</label>
                    <${Field} f=${fld('id')} project=${project} onChangeField=${onChangeField}/>

                    <label>name</label>
                    <${Field} f=${fld('name')} project=${project} onChangeField=${onChangeField}/>

                    <label>description</label>
                    <${Field} f=${fld('description')} project=${project} onChangeField=${onChangeField}/>

                    <label>icon</label>
                    <${Field} f=${fld('icon')} project=${project} onChangeField=${onChangeField}/>

                    <label>traffic_light</label>
                    <${Field} f=${fld('traffic_light')} project=${project} onChangeField=${onChangeField}/>

                    <label>traffic_light_quality</label>
                    <${Field} f=${fld('traffic_light_quality')} project=${project} onChangeField=${onChangeField}/>

                    <label>traffic_light_cost</label>
                    <${Field} f=${fld('traffic_light_cost')} project=${project} onChangeField=${onChangeField}/>

                    <label>traffic_light_time</label>
                    <${Field} f=${fld('traffic_light_time')} project=${project} onChangeField=${onChangeField}/>

                    <label>data_state</label>
                    <${Field} f=${fld('data_state')} project=${project} onChangeField=${onChangeField}/>

                    <label>mcp_data_state</label>
                    <${Field} f=${fld('mcp_data_state')} project=${project} onChangeField=${onChangeField}/>

                    <label>comments</label>
                    <${Field} f=${fld('comments')} project=${project} onChangeField=${onChangeField}/>

                    <label>notes</label>
                    <${Field} f=${fld('notes')} project=${project} onChangeField=${onChangeField}/>

                    <label>metadatas</label>
                    <${Field} f=${fld('metadatas')} project=${project} onChangeField=${onChangeField}/>

                    <label>created_at</label>
                    <${Field} f=${fld('created_at')} project=${project} onChangeField=${onChangeField}/>

                    <label>updated_at</label>
                    <${Field} f=${fld('updated_at')} project=${project} onChangeField=${onChangeField}/>
                </div>`}
        </div>
    `;
}

// One attribute: read-only display, enum select, or text/number input.
function Field({f, project, onChangeField}) {
    const raw = project[f.key];
    const v = raw == null ? '' : (typeof raw === 'object' ? JSON.stringify(raw) : String(raw));
    const commit = e => { if (e.target.value !== v) onChangeField(f.key, e.target.value); };
    if (f.type === 'ro') return html`
        <div class="font-mono break-all text-[var(--color-text-dim)]">${v || '–'}</div>`;
    if (f.type === 'enum') return html`
        <select value=${v} onChange=${commit}>
            <option value=""></option>
            ${f.options.map(o => html`
                <option value=${o}>${o}</option>`)}
        </select>`;
    return html`<input type=${f.type === 'number' ? 'number' : 'text'} value=${v} onChange=${commit}/>`;
}

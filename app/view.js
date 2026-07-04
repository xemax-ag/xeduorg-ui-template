// ============================ VIEW ============================
// Preact presentational components. Reads data/helpers from the Model and
// receives user-action callbacks via props (the Controller wires them).

import {h} from 'preact';
import htm from 'htm';

const html = htm.bind(h);

import {BASE_URL, TOKEN, PROJECT_PK, LANGUAGE, PROJECT_FIELDS} from './model.js';

// Shows the connection parameters forwarded by the wrapper (URL query params).
export function Params() {
    const rows = [
        ['baseUrl', BASE_URL],
        ['token', TOKEN],
        ['projectPk', PROJECT_PK],
        ['language', LANGUAGE],
    ];
    return html`
        <div class="bg-panel border border-border rounded-card shadow-card p-5 w-full mb-5">
            <h1 class="text-[15px] font-[650] text-primary mb-3">Parameter vom Wrapper</h1>
            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                ${rows.map(([k, v]) => html`
                    <dt class="font-semibold text-[var(--color-text-dim)]">${k}</dt>
                    <dd class="font-mono break-all">${v || '–'}</dd>
                `)}
            </dl>
        </div>
    `;
}

// Editable project attributes (Projekteinstellungen): auto-save on change.
// Each committed input calls onChangeField(key, rawValue); the Controller
// writes it via the API and reloads the row (also on error, so the form
// falls back to the stored values).
export function ProjectSettings({project, onChangeField}) {
    return html`
        <div class="bg-panel border border-border rounded-card shadow-card p-5 w-full mb-5">
            <h1 class="text-[15px] font-[650] text-primary mb-3">Projekteinstellungen</h1>
            ${!project ? html`
                <div class="text-sm text-[var(--color-text-faint)]">Kein Projekt geladen.</div>` : html`
                <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm items-center">
                    ${PROJECT_FIELDS.map(f => html`
                        <label>${f.key}</label>
                        <${Field} f=${f} project=${project} onChangeField=${onChangeField}/>
                    `)}
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

// Error toast (bottom right); the Controller dismisses it after 5 s.
export function Toast({text}) {
    return text ? html`
        <div class="fixed bottom-4 right-4 z-50 max-w-md px-4 py-3 rounded-card shadow-card border text-sm whitespace-pre-wrap bg-panel border-[var(--color-err)] text-[var(--color-err)]">
            ${text}
        </div>` : null;
}

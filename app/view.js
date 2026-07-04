// ============================ VIEW ============================
// Preact presentational components. Reads data/helpers from the Model and
// receives user-action callbacks via props (the Controller wires them).

import {h} from 'preact';
import htm from 'htm';

const html = htm.bind(h);

import {BASE_URL, TOKEN, PROJECT_PK} from './model.js';

// Shows the connection parameters forwarded by the wrapper (URL query params).
export function Params() {
    const rows = [
        ['baseUrl', BASE_URL],
        ['token', TOKEN],
        ['projectPk', PROJECT_PK],
    ];
    return html`
        <div class="bg-panel border border-border rounded-card shadow-card p-5 max-w-2xl">
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

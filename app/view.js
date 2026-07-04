// ============================ VIEW ============================
// App-wide presentational components (Preact). Reads data/helpers from the
// Model and receives user-action callbacks via props (the Controller wires
// them). Entity-specific Views live in feature folders (e.g.
// base_data/projects/view.js).

import {h} from 'preact';
import htm from 'htm';

const html = htm.bind(h);

import {BASE_URL, TOKEN, PROJECT_PK, LANGUAGE, t} from './model.js';

// Shows the connection parameters forwarded by the wrapper (URL query params).
export function Params() {
    return html`
        <div class="bg-panel border border-border rounded-card shadow-card p-5 w-full mb-5">
            <h1 class="text-[15px] font-[650] text-primary mb-3">${t('params_from_wrapper')}</h1>
            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt class="font-semibold text-[var(--color-text-dim)]">baseUrl</dt>
                <dd class="font-mono break-all">${BASE_URL || '–'}</dd>

                <dt class="font-semibold text-[var(--color-text-dim)]">token</dt>
                <dd class="font-mono break-all">${TOKEN || '–'}</dd>

                <dt class="font-semibold text-[var(--color-text-dim)]">projectPk</dt>
                <dd class="font-mono break-all">${PROJECT_PK || '–'}</dd>

                <dt class="font-semibold text-[var(--color-text-dim)]">language</dt>
                <dd class="font-mono break-all">${LANGUAGE || '–'}</dd>
            </dl>
        </div>
    `;
}

// Error toast (bottom right); the Controller dismisses it after 5 s.
export function Toast({text}) {
    return text ? html`
        <div class="fixed bottom-4 right-4 z-50 max-w-md px-4 py-3 rounded-card shadow-card border text-sm whitespace-pre-wrap bg-panel border-[var(--color-err)] text-[var(--color-err)]">
            ${text}
        </div>` : null;
}

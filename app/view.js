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
        <wa-card class="w-full mb-1">
            <div slot="header" class="wa-cluster wa-gap-xs wa-align-items-center">
                <wa-icon name="plug"></wa-icon>
                <h1 class="wa-heading-s m-0">${t('view_js.params_from_wrapper')}</h1>
            </div>
            <div class="wa-grid wa-gap-m" style="--min-column-size: 14rem;">
                <wa-input label="baseUrl" value=${BASE_URL || ''} placeholder="–" readonly></wa-input>
                <wa-input label="token" value=${TOKEN || ''} placeholder="–" readonly></wa-input>
                <wa-input label="projectPk" value=${PROJECT_PK || ''} placeholder="–" readonly></wa-input>
                <wa-input label="language" value=${LANGUAGE || ''} placeholder="–" readonly></wa-input>
            </div>
        </wa-card>
    `;
}

// Error toast (bottom right); the Controller dismisses it after 5 s.
export function Toast({text}) {
    return text ? html`
        <wa-callout variant="danger" class="fixed bottom-4 right-4 z-50 max-w-md">
            <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
            <span class="whitespace-pre-wrap">${text}</span>
        </wa-callout>` : null;
}

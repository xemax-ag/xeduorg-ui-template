// ============================ VIEW ============================
// App-wide presentational components (Preact). Reads data/helpers from the
// Model and receives user-action callbacks via props (the Controller wires
// them). Entity-specific Views live in feature folders (e.g.
// base_data/projects/view.js).

import {h} from 'preact';
import htm from 'htm';

const html = htm.bind(h);

import {BASE_URL, TOKEN, PROJECT_PK, LANGUAGE, t} from './model.js';
import {Icon} from './icons.js';

// Shows the connection parameters forwarded by the wrapper (URL query params).
export function Params() {
    return html`
        <div class="card bg-base-100 border border-base-300 rounded-card shadow-card w-full mb-4">
            <div class="card-body gap-3">
                <div class="flex items-center gap-2">
                    <${Icon} name="plug" class="size-4 text-primary"/>
                    <h2 class="card-title text-base m-0">${t('view_js.params_from_wrapper')}</h2>
                </div>
                <div class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
                    <fieldset class="fieldset py-0">
                        <legend class="fieldset-legend">baseUrl</legend>
                        <input class="input input-sm w-full" value=${BASE_URL || ''} placeholder="–" readonly/>
                    </fieldset>
                    <fieldset class="fieldset py-0">
                        <legend class="fieldset-legend">token</legend>
                        <input class="input input-sm w-full" value=${TOKEN || ''} placeholder="–" readonly/>
                    </fieldset>
                    <fieldset class="fieldset py-0">
                        <legend class="fieldset-legend">projectPk</legend>
                        <input class="input input-sm w-full" value=${PROJECT_PK || ''} placeholder="–" readonly/>
                    </fieldset>
                    <fieldset class="fieldset py-0">
                        <legend class="fieldset-legend">language</legend>
                        <input class="input input-sm w-full" value=${LANGUAGE || ''} placeholder="–" readonly/>
                    </fieldset>
                </div>
            </div>
        </div>
    `;
}

// Error toast (bottom right); the Controller dismisses it after 5 s.
export function Toast({text}) {
    return text ? html`
        <div role="alert" class="alert alert-error fixed bottom-4 right-4 z-50 max-w-md">
            <${Icon} name="triangle-exclamation" class="size-5"/>
            <span class="whitespace-pre-wrap">${text}</span>
        </div>` : null;
}

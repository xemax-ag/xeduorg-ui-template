// ============================ CONTROLLER ============================
// Owns application state, reacts to user actions by calling the Model, selects
// the appropriate View, and bootstraps the Preact render. This is the only file
// loaded by app.html; it pulls in the Model (data) and the View (components).

import {h, render} from 'preact';
import {useEffect} from 'preact/hooks';
import htm from 'htm';

const html = htm.bind(h);

import {TOKEN, saveCfg} from './model.js';
import {Params} from './view.js';

function App() {
    // Connect on mount (token injected by the wrapper); otherwise return to the wrapper.
    useEffect(() => {
        if (TOKEN) saveCfg();
        else location.href = 'wrapper.html';
    }, []);

    return html`
        <div class="max-w-[1920px] mx-auto p-5">
            <${Params}/>
        </div>
    `;
}

render(html`
    <${App}/>`, document.getElementById('app'));

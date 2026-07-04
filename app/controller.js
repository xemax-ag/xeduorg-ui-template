// ============================ CONTROLLER ============================
// Owns application state, reacts to user actions by calling the Model, selects
// the appropriate View, and bootstraps the Preact render. This is the only file
// loaded by app.html; it pulls in the Model (data) and the View (components).

import {h, render} from 'preact';
import {useState, useEffect, useRef} from 'preact/hooks';
import htm from 'htm';

const html = htm.bind(h);

import {TOKEN, saveCfg, readProject, updateProjectField} from './model.js';
import {Params, ProjectSettings, Toast} from './view.js';

function App() {
    const [project, setProject] = useState(null);
    const [toast, setToast] = useState('');
    const toastTimer = useRef(null);

    // Error toast with 5 s auto-dismiss.
    function showToast(text) {
        clearTimeout(toastTimer.current);
        setToast(text);
        toastTimer.current = setTimeout(() => setToast(''), 5000);
    }

    async function loadProject() {
        try {
            setProject(await readProject());
        } catch (e) {
            showToast(e.message);
        }
    }

    // Connect on mount (token injected by the wrapper); otherwise return to the wrapper.
    useEffect(() => {
        if (TOKEN) {
            saveCfg();
            loadProject();
        } else location.href = 'wrapper.html';
    }, []);

    // Auto-save one changed attribute; the PUT response is the updated row
    // (typed as ProjectStrategies) and replaces the project state directly.
    // On error, reload so the form falls back to the last stored values.
    async function changeProjectField(key, raw) {
        try {
            const updated = await updateProjectField(project, key, raw);
            setProject(updated || await readProject());
        } catch (e) {
            showToast(e.message);
            await loadProject();
        }
    }

    return html`
        <div class="max-w-[1920px] mx-auto p-5">
            <${Params}/>
            <${ProjectSettings} project=${project} onChangeField=${changeProjectField}/>
        </div>
        <${Toast} text=${toast}/>
    `;
}

render(html`
    <${App}/>`, document.getElementById('app'));

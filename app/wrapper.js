// Wrapper / connection screen for the Strategie-Cockpit — Preact (no build step).
// Reads the API base URL + bearer token (injected as URL parameters by the dev
// server, with localStorage fallback), loads the project list, lets the user pick
// a project and theme, then embeds app.html in an iframe with those values
// forwarded via the iframe URL.

import {h, render} from 'preact';
import {useState, useEffect} from 'preact/hooks';
import htm from 'htm';

import {ProjectsStrategies} from './openapi.js';

const html = htm.bind(h);

const LS = 'xedu_org_template';
const cfg = JSON.parse(localStorage.getItem(LS) || '{}');
const qp = new URLSearchParams(location.search);

const BASE_URL = (qp.get('baseUrl') || cfg.baseUrl || 'https://eduxept-api-v1.xemax.ch').trim().replace(/\/$/, '');
const TOKEN = (qp.get('token') || cfg.token || '').trim();
const INIT_THEME = (qp.get('theme') || cfg.theme || 'dark') === 'dark' ? 'dark' : 'light';

// Supported UI languages (lowercase codes forwarded to the cockpit via the iframe URL).
const LANGS = ['de', 'fr', 'it', 'en'];
const INIT_LANGUAGE = (() => {
    const l = (qp.get('language') || cfg.language || 'de').toLowerCase();
    return LANGS.includes(l) ? l : 'de';
})();

async function api(path, body, method = 'POST') {
    const res = await fetch(BASE_URL + path, {
        method, headers: {Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        let detail = '';
        try {
            const j = await res.json();
            detail = j.detail ? JSON.stringify(j.detail) : JSON.stringify(j);
        } catch (e) {
        }
        throw new Error('HTTP ' + res.status + ' bei ' + method + ' ' + path + (detail ? '\n' + detail : ' (kein Fehlertext vom Server)'));
    }
    if (res.status === 204) return null;
    try {
        return await res.json();
    } catch (e) {
        return null;
    }
}

function App() {
    const [theme, setTheme] = useState(INIT_THEME);
    const [language, setLanguage] = useState(INIT_LANGUAGE);
    const [topbarHidden, setTopbarHidden] = useState(false);
    // Data provider for the project dropdown: a ProjectsStrategies envelope
    // (generated model, openapi.js) — carries the query and, once loaded, the rows.
    const [projects, setProjects] = useState(new ProjectsStrategies());
    const [projectPk, setProjectPk] = useState(String(cfg.projectPk || ''));
    const [err, setErr] = useState('');
    const [iframeSrc, setIframeSrc] = useState('');

    // Apply the theme to this document whenever it changes.
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Reflect the selected language on <html lang> (initial value is set
    // before first paint by the inline script in wrapper.html).
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    // Persist the connection config; `over` overrides state values that are
    // not yet committed when called from an event handler (theme/language).
    function saveCfg(pk = projectPk, over = {}) {
        localStorage.setItem(LS, JSON.stringify({
            baseUrl: BASE_URL,
            token: TOKEN,
            theme,
            language,
            projectPk: pk || cfg.projectPk,
            ...over
        }));
    }

    function buildSrc(pk, th, lang) {
        return 'app.html?' + new URLSearchParams({
            baseUrl: BASE_URL,
            token: TOKEN,
            projectPk: pk,
            theme: th,
            language: lang
        }).toString();
    }

    // Connect: load the project list, pick the default/previous project, embed it.
    async function connect() {
        setErr('');
        if (!TOKEN) {
            setErr('No bearer token available. Please set `auth_token` in the configuration (strategy_cockpit.env).');
            return;
        }
        saveCfg();
        try {
            // The ProjectsStrategies instance is both the request payload (its
            // `where`, default 'pk > 0', serializes as the JSON body) and — after
            // constructFromObject — the typed result (rows of ProjectStrategies).
            const query = new ProjectsStrategies();
            const data = await api('/strategies-tables/projects/read', query);
            const provider = ProjectsStrategies.constructFromObject(data, query);
            setProjects(provider);
            const rows = provider.rows || [];
            let want = String(cfg.projectPk || 3);
            if (!rows.some(p => String(p.pk) === want)) want = rows.length ? String(rows[0].pk) : '';
            setProjectPk(want);
            if (want) {
                saveCfg(want);
                setIframeSrc(buildSrc(want, theme, language));
            }
        } catch (e) {
            setErr(e.message);
        }
    }

    // Auto-connect on load when a token is present; otherwise show the error.
    useEffect(() => {
        if (TOKEN) connect();
    }, []);

    function onSelectProject(e) {
        const pk = e.target.value;
        setProjectPk(pk);
        saveCfg(pk);
        if (pk) setIframeSrc(buildSrc(pk, theme, language));
    }

    function onToggleTheme() {
        const t = theme === 'dark' ? 'light' : 'dark';
        setTheme(t);
        saveCfg(projectPk, {theme: t});
        if (projectPk) setIframeSrc(buildSrc(projectPk, t, language));  // reload the cockpit with the new theme
    }

    function onSelectLanguage(e) {
        const lang = e.target.value;
        setLanguage(lang);
        saveCfg(projectPk, {language: lang});
        if (projectPk) setIframeSrc(buildSrc(projectPk, theme, lang));  // reload the cockpit with the new language
    }

    const projectRows = projects.rows || [];

    // Top-right toggle: collapse/expand the topbar to give the cockpit the full viewport.
    return html`
      <button type="button" title=${topbarHidden ? 'Bereich einblenden' : 'Bereich ausblenden'}
              onClick=${() => setTopbarHidden(v => !v)}
              class="fixed top-2 right-2 z-50 h-9 w-9 p-0 flex items-center justify-center text-base leading-none rounded-card bg-panel border border-border text-text-dim shadow-card hover:border-secondary hover:text-text">
        ${topbarHidden ? '☰' : '✕'}
      </button>

      <div class=${'w-full shrink-0 max-w-[1920px] mx-auto px-5 pt-5 pb-2' + (topbarHidden ? ' hidden' : '')}>
        <header
            class="flex items-center gap-3.5 pl-5 pr-5 py-4 mb-4 bg-primary border border-primary rounded-card shadow-header">
          <div>
            <h1 class="m-0 text-lg font-semibold tracking-tight text-white">Wrapper xEduOrg Template</h1>
            <div class="text-xs text-white/70">eduxept-api-v1 · Verbindung & Konfiguration</div>
          </div>
          <div class="ml-auto mr-2 flex items-center gap-3"
               title="Sprachauswahl">
            <label class="flex items-center gap-1.5 text-white/80">
              <select class="w-auto" value=${language} onChange=${onSelectLanguage}>
                <option value="de">DE</option>
                <option value="fr">FR</option>
                <option value="it">IT</option>
                <option value="en">EN</option>
              </select>
            </label>
            <button type="button"
                    title=${theme === 'dark' ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln'}
                    onClick=${onToggleTheme}
                    class="h-9 w-9 p-0 flex items-center justify-center text-base leading-none rounded-card 
                      bg-panel-2 border border-border shadow-card hover:border-secondary">
              ${theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>

        </header>

        <div class="bg-panel border border-border rounded-card shadow-card p-4 flex flex-col gap-1.5 mb-3">
          <label>Projekt</label>
          <select disabled=${!projectRows.length} value=${projectPk} onChange=${onSelectProject}>
            ${!projectRows.length && html`
              <option>– zuerst verbinden –</option>`}
            ${projectRows.map(p => html`
              <option value=${p.pk}>${(p.name || p.id || ('pk ' + p.pk)) + '  (pk=' + p.pk + ')'}</option>`)}
          </select>
        </div>

        ${err && html`
          <div
              class="px-4 py-3 mb-2 rounded-lg text-sm whitespace-pre-wrap bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
            ${err}
          </div>`}
      </div>

      ${iframeSrc && html`
        <iframe title="Strategie-Cockpit" src=${iframeSrc}
                class="flex-1 w-full h-full border-0 border-t border-border pb-4"></iframe>`}
    `;
}

render(html`
  <${App}/>`, document.getElementById('app'));

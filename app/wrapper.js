// Wrapper / connection screen for the Strategie-Cockpit — Preact (no build step).
// Reads the API base URL + bearer token (injected as URL parameters by the web
// server, with localStorage fallback), loads the project list, lets the user pick
// a project and theme, then embeds app.html in an iframe with those values
// forwarded via the iframe URL.

import {h, render} from 'preact';
import {useState, useEffect} from 'preact/hooks';
import htm from 'htm';

import {ProjectsStrategies} from './openapi.js';
import {Icon} from './icons.js';

const html = htm.bind(h);

// i18next is loaded & initialized in wrapper.html (CDN, UMD globals); t()
// falls back to the raw key until the translations are ready (the initial
// render is gated on i18nReady at the bottom of this file).
const t = (key, opts) => window.i18next ? window.i18next.t(key, opts) : key;

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

// Selectable access roles (forwarded to the cockpit via the iframe URL).
const ROLES = ['read', 'write', 'project', 'admin', 'dev'];
const INIT_ROLE = (() => {
    const r = (qp.get('role') || cfg.role || 'write').toLowerCase();
    return ROLES.includes(r) ? r : 'write';
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
        throw new Error(t('http_error', {status: res.status, method, path}) + (detail ? '\n' + detail : ' ' + t('no_error_text')));
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
    const [role, setRole] = useState(INIT_ROLE);
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
        document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'black' : 'light');
    }, [theme]);

    // Reflect the selected language on <html lang> (initial value is set
    // before first paint by the inline script in wrapper.html).
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    // Re-render when i18next switches language, so t() output updates
    // without a page reload (triggered by onSelectLanguage below).
    const [, setI18nTick] = useState(0);
    useEffect(() => {
        if (!window.i18next) return;
        const rerender = () => setI18nTick(n => n + 1);
        window.i18next.on('languageChanged', rerender);
        return () => window.i18next.off('languageChanged', rerender);
    }, []);

    // Persist the connection config; `over` overrides state values that are
    // not yet committed when called from an event handler (theme/language).
    function saveCfg(pk = projectPk, over = {}) {
        localStorage.setItem(LS, JSON.stringify({
            baseUrl: BASE_URL,
            token: TOKEN,
            theme,
            language,
            role,
            projectPk: pk || cfg.projectPk,
            ...over
        }));
    }

    function buildSrc(pk, th, lang, rl) {
        return 'app.html?' + new URLSearchParams({
            baseUrl: BASE_URL,
            token: TOKEN,
            projectPk: pk,
            theme: th,
            language: lang,
            role: rl
        }).toString();
    }

    // Connect: load the project list, pick the default/previous project, embed it.
    async function connect() {
        setErr('');
        if (!TOKEN) {
            setErr(t('wrapper_js.no_token'));
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
                setIframeSrc(buildSrc(want, theme, language, role));
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
        if (pk) setIframeSrc(buildSrc(pk, theme, language, role));
    }

    function onToggleTheme() {
        const t = theme === 'dark' ? 'light' : 'dark';
        setTheme(t);
        saveCfg(projectPk, {theme: t});
        if (projectPk) setIframeSrc(buildSrc(projectPk, t, language, role));  // reload the cockpit with the new theme
    }

    function onSelectLanguage(e) {
        const lang = e.target.value;
        setLanguage(lang);
        saveCfg(projectPk, {language: lang});
        // Keep the wrapper's i18next instance in sync (the iframe reloads and
        // re-detects; the wrapper page itself does not reload).
        if (window.i18nReady) window.i18nReady.then(() => i18next.changeLanguage(lang));
        if (projectPk) setIframeSrc(buildSrc(projectPk, theme, lang, role));  // reload the cockpit with the new language
    }

    function onSelectRole(e) {
        const r = e.target.value;
        setRole(r);
        saveCfg(projectPk, {role: r});
        if (projectPk) setIframeSrc(buildSrc(projectPk, theme, language, r));  // reload the cockpit with the new role
    }

    const projectRows = projects.rows || [];

    // Top-right toggle: collapse/expand the topbar to give the cockpit the full viewport.
    return html`
      <button class="btn btn-sm btn-circle btn-neutral fixed top-2 right-2 z-50"
              title=${topbarHidden ? t('wrapper_js.show_panel') : t('wrapper_js.hide_panel')}
              aria-label=${topbarHidden ? t('wrapper_js.show_panel') : t('wrapper_js.hide_panel')}
              onClick=${() => setTopbarHidden(v => !v)}>
        <${Icon} name=${topbarHidden ? 'bars' : 'xmark'} class="size-4"/>
      </button>

      <div class=${'w-full shrink-0 max-w-[1920px] mx-auto px-5 pt-5 pb-0' + (topbarHidden ? ' hidden' : '')}>
        <header
            class="flex items-center gap-3.5 pl-5 pr-5 py-4 mb-4 bg-primary border border-primary rounded-card shadow-header">
          <div>
            <h1 class="m-0 text-lg font-semibold tracking-tight text-white">Wrapper xEduOrg Template</h1>
            <div class="text-xs text-white/70">eduxept-api-v1 · ${t('wrapper_js.connection_and_configuration')}</div>
          </div>
          <div class="ml-auto mr-2 flex items-center gap-3">
            <select class="select select-sm w-24" title=${t('wrapper_js.role_selection')}
                    value=${role} onChange=${onSelectRole}>
              ${ROLES.map(r => html`
                <option value=${r}>${r}</option>`)}
            </select>
            <select class="select select-sm w-20" title=${t('wrapper_js.language_selection')}
                    value=${language} onChange=${onSelectLanguage}>
              <option value="de">DE</option>
              <option value="fr">FR</option>
              <option value="it">IT</option>
              <option value="en">EN</option>
            </select>
            <button class="btn btn-sm btn-circle btn-neutral w-10 h-10"
                    title=${theme === 'dark' ? t('wrapper_js.switch_to_light_theme') : t('wrapper_js.switch_to_dark_theme')}
                    aria-label=${theme === 'dark' ? t('wrapper_js.switch_to_light_theme') : t('wrapper_js.switch_to_dark_theme')}
                    onClick=${onToggleTheme}>
              <${Icon} name=${theme === 'dark' ? 'moon' : 'sun'} class="size-4"/>
            </button>
          </div>

        </header>

        <div class="card bg-base-100 border border-base-300 rounded-card shadow-card mb-5">
          <div class="card-body gap-3">
            <div class="flex items-center gap-2">
              <${Icon} name="diagram-project" class="size-4 text-primary"/>
              <h2 class="card-title text-base m-0">${t('wrapper_js.project')}</h2>
            </div>
            <select class="select select-sm w-full" disabled=${!projectRows.length}
                    value=${projectPk} onChange=${onSelectProject}>
              ${!projectRows.length && html`<option value="">${t('wrapper_js.connect_first')}</option>`}
              ${projectRows.map(p => html`
                <option value=${String(p.pk)}>${(p.name || p.id || ('pk ' + p.pk)) + '  (pk=' + p.pk + ')'}</option>`)}
            </select>
          </div>
        </div>

        ${err && html`
          <div role="alert" class="alert alert-error mb-2">
            <${Icon} name="triangle-exclamation" class="size-5"/>
            <span class="whitespace-pre-wrap">${err}</span>
          </div>`}
      </div>

      ${iframeSrc && html`
        <iframe title=${t('wrapper_js.cockpit_title')} src=${iframeSrc}
                class="flex-1 w-full h-full border-0 border-t border-border pb-4"></iframe>`}
    `;
}

// Render after the translations are ready (avoids a flash of raw keys) and
// pin i18next to the resolved wrapper language (same source as the UI state).
if (window.i18nReady) {
    await window.i18nReady;
    if (window.i18next && window.i18next.language !== INIT_LANGUAGE) await window.i18next.changeLanguage(INIT_LANGUAGE);
}
render(html`
  <${App}/>`, document.getElementById('app'));

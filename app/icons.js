// Minimal inline-SVG icon set (simple stroke primitives), replacing the Web
// Awesome <wa-icon> font-icon component. No dependency beyond Preact/htm.

import {h} from 'preact';
import htm from 'htm';

const html = htm.bind(h);

function svg(cls, children) {
    return html`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class=${cls} aria-hidden="true">
            ${children}
        </svg>`;
}

const ICONS = {
    plug: cls => svg(cls, html`
        <rect x="7" y="9" width="10" height="7" rx="1"/>
        <line x1="9.5" y1="9" x2="9.5" y2="4"/>
        <line x1="14.5" y1="9" x2="14.5" y2="4"/>
        <line x1="12" y1="16" x2="12" y2="20"/>
    `),
    'triangle-exclamation': cls => svg(cls, html`
        <polygon points="12,4 21,19 3,19"/>
        <line x1="12" y1="10" x2="12" y2="14.5"/>
        <circle cx="12" cy="16.8" r="0.4" fill="currentColor" stroke="none"/>
    `),
    sliders: cls => svg(cls, html`
        <line x1="4" y1="6" x2="20" y2="6"/>
        <circle cx="9" cy="6" r="1.6" fill="currentColor" stroke="none"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
        <circle cx="15" cy="12" r="1.6" fill="currentColor" stroke="none"/>
        <line x1="4" y1="18" x2="20" y2="18"/>
        <circle cx="7" cy="18" r="1.6" fill="currentColor" stroke="none"/>
    `),
    bars: cls => svg(cls, html`
        <line x1="4" y1="6" x2="20" y2="6"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
        <line x1="4" y1="18" x2="20" y2="18"/>
    `),
    xmark: cls => svg(cls, html`
        <line x1="6" y1="6" x2="18" y2="18"/>
        <line x1="18" y1="6" x2="6" y2="18"/>
    `),
    moon: cls => svg(cls, html`
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
    `),
    sun: cls => svg(cls, html`
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    `),
    'diagram-project': cls => svg(cls, html`
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <rect x="3" y="15" width="6" height="4" rx="1"/>
        <rect x="15" y="15" width="6" height="4" rx="1"/>
        <line x1="12" y1="7" x2="12" y2="11"/>
        <line x1="6" y1="15" x2="12" y2="11"/>
        <line x1="18" y1="15" x2="12" y2="11"/>
    `),
};

export function Icon({name, class: cls = 'size-4'}) {
    const render = ICONS[name];
    return render ? render(cls) : null;
}

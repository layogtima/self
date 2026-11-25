// A tabbed panel, in the shape the `body` project (and `cubbon` before it) uses: a fixed
// nav down the side, one pane at a time, a quiet footer. Everything the reader can change
// lives here except the three controls that earn a place in the top bar.

import { SECTIONS, DETAIL_LEVELS, sectionsForLevel } from '../data.js';
import { ICONS } from './icons.js';
import { state, set } from '../state.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])';

const TABS = [
  { id: 'look', label: 'Look', icon: 'look' },
  { id: 'numbers', label: 'Numbers', icon: 'numbers' },
  { id: 'detail', label: 'Detail', icon: 'detail' },
  { id: 'about', label: 'About', icon: 'about' },
];

export function mountSettings(app) {
  const btn = document.getElementById('settings-toggle');
  const modal = document.getElementById('settings');
  const scrim = document.getElementById('settings-scrim');
  let restoreTo = null;
  let tab = 'look';

  const seg = (name, options, current) =>
    `<div class="seg" role="group">${options
      .map(
        ([value, label, hint]) =>
          `<button type="button" data-opt="${name}" data-value="${value}" class="${
            value === current ? 'active' : ''
          }">${label}${hint ? `<small>${hint}</small>` : ''}</button>`
      )
      .join('')}</div>`;

  const toggle = (id, label, hint, on) =>
    `<label class="toggle"><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ''}</span>
      <input type="checkbox" id="${id}" ${on ? 'checked' : ''} /></label>`;

  function paneLook() {
    return `
      <h4>Theme</h4>
      ${seg('theme', [['auto', 'Match device', 'Follows your system'], ['light', 'Light', ''], ['dark', 'Dark', '']], state.theme)}
      <div class="toggles">
        ${toggle('opt-motion', 'Movement', 'The floating samples and the live counter', !state.calm)}
        ${toggle('opt-icons', 'Little pictures', 'Symbols on the nine kinds of material', state.icons)}
      </div>`;
  }

  function paneNumbers() {
    const per = (app.global.extraction.value * 1000) / app.population.value / 1000;
    return `
      <h4>Whose numbers</h4>
      ${seg(
        'perPerson',
        [
          ['world', "The world's", 'Everything humans take'],
          ['me', 'My share', `About ${per.toFixed(0)} tonnes a year, each`],
        ],
        state.perPerson ? 'me' : 'world'
      )}
      <p class="pane-note">Divided between ${(app.population.value / 1e9).toFixed(1)} billion people, UN ${
        app.population.year
      }.</p>
      <h4>Compare sizes against</h4>
      <label class="pane-row">
        <select id="opt-scale">
          <option value="auto">Whichever fits best</option>
          ${app.scales.objects
            .map((o) => `<option value="${o.id}">${o.name.charAt(0).toUpperCase()}${o.name.slice(1)}</option>`)
            .join('')}
        </select>
      </label>`;
  }

  function paneDetail() {
    const active = new Set(activeSections());
    return `
      <h4>How much to show on each material</h4>
      <label class="pane-slider">
        <input id="level" type="range" min="0" max="4" step="1" value="${state.level}" />
        <output id="level-out">${DETAIL_LEVELS[state.level]}</output>
      </label>
      <p class="pane-note" id="level-hint">${state.sections ? 'Your own set of sections' : 'Chosen by the slider'}</p>
      <div class="toggles">
        ${SECTIONS.map(
          (sec) =>
            `<label class="toggle"><span><b>${sec.label}</b></span>
              <input type="checkbox" data-section="${sec.id}" ${active.has(sec.id) ? 'checked' : ''} /></label>`
        ).join('')}
      </div>`;
  }

  function paneAbout() {
    const e = app.global.extraction;
    const em = app.global.emissions;
    const share = app.global.materialsShare;
    return `
      <h4>Where the two big numbers come from</h4>
      <p class="pane-note">
        The counter runs on ${e.value / 1e9} billion tonnes of material a year, UNEP ${e.year}.
        The ${app.materials.length} materials listed cover ${(app.global.trackedShare * 100).toFixed(0)}% of it.
      </p>
      <p class="pane-note">
        The carbon line runs on ${em.value / 1e9} billion tonnes of CO2 a year, Global Carbon Project ${em.year},
        of which about ${Math.round(share.value * 100)}% comes from getting materials and making things out of
        them, UNEP ${share.year}.
      </p>
      <h4>Keyboard</h4>
      <ul class="pane-keys">
        <li><kbd>/</kbd> search</li><li><kbd>j</kbd> <kbd>k</kbd> move</li>
        <li><kbd>Enter</kbd> open</li><li><kbd>Esc</kbd> close</li>
        <li><kbd>r</kbd> shuffle</li><li><kbd>t</kbd> light or dark</li>
        <li><kbd>c</kbd> pause</li><li><kbd>s</kbd> these settings</li>
      </ul>`;
  }

  const PANES = { look: paneLook, numbers: paneNumbers, detail: paneDetail, about: paneAbout };

  function render() {
    modal.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h2 id="settings-title">Settings</h2>
          <button id="settings-close" class="icon-btn" type="button" aria-label="Close settings">${ICONS.close}</button>
        </div>
        <div class="panel-body">
          <nav class="panel-nav" role="tablist" aria-label="Settings sections">
            ${TABS.map(
              (t) =>
                `<button type="button" role="tab" data-tab="${t.id}" aria-selected="${t.id === tab}"
                   class="${t.id === tab ? 'active' : ''}"><i>${ICONS[t.icon]}</i><span>${t.label}</span></button>`
            ).join('')}
          </nav>
          <div class="panel-pane" role="tabpanel">${PANES[tab]()}</div>
        </div>
        <div class="panel-foot">
          <span>Everything here is remembered on this device</span>
          <button id="settings-reset" type="button">Put it all back</button>
        </div>
      </div>`;
    wire();
    btn.setAttribute('aria-expanded', String(!modal.hidden));
  }

  function wire() {
    for (const b of modal.querySelectorAll('[data-tab]')) {
      b.addEventListener('click', () => {
        tab = b.dataset.tab;
        render();
        modal.querySelector(`[data-tab="${tab}"]`).focus();
      });
    }
    for (const b of modal.querySelectorAll('[data-opt]')) {
      b.addEventListener('click', () => {
        const { opt, value } = b.dataset;
        if (opt === 'theme') set({ theme: value });
        if (opt === 'perPerson') set({ perPerson: value === 'me' });
        render();
      });
    }
    modal.querySelector('#opt-motion')?.addEventListener('change', (e) => set({ calm: !e.target.checked }));
    modal.querySelector('#opt-icons')?.addEventListener('change', (e) => set({ icons: e.target.checked }));
    modal.querySelector('#opt-scale')?.addEventListener('change', (e) => set({ scaleObject: e.target.value }));
    const level = modal.querySelector('#level');
    if (level) {
      level.value = String(state.level);
      level.addEventListener('input', (e) => {
        set({ level: Number(e.target.value), sections: null });
        render();
      });
    }
    const boxes = [...modal.querySelectorAll('[data-section]')];
    for (const box of boxes) {
      box.addEventListener('change', () => {
        set({ sections: boxes.filter((b) => b.checked).map((b) => b.dataset.section) });
        modal.querySelector('#level-hint').textContent = 'Your own set of sections';
      });
    }
    modal.querySelector('#opt-scale') && (modal.querySelector('#opt-scale').value = state.scaleObject);
    modal.querySelector('#settings-close').addEventListener('click', close);
    modal.querySelector('#settings-reset').addEventListener('click', () => {
      set({ level: 4, sections: null, icons: true, perPerson: false, scaleObject: 'auto', theme: 'auto', calm: false });
      render();
    });
  }

  scrim.addEventListener('click', close);
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const [first, last] = [items[0], items[items.length - 1]];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  function open() {
    restoreTo = document.activeElement;
    modal.hidden = false;
    scrim.hidden = false;
    render();
    modal.querySelector('#settings-close').focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    scrim.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    restoreTo?.focus?.();
    restoreTo = null;
  }

  btn.addEventListener('click', () => (modal.hidden ? open() : close()));
  return {
    render: () => !modal.hidden && render(),
    open,
    close,
    isOpen: () => !modal.hidden,
    toggle: () => (modal.hidden ? open() : close()),
  };
}

/** The section ids currently switched on: the reader's own set, or the slider's. */
export function activeSections() {
  return state.sections ?? sectionsForLevel(state.level);
}

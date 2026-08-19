// The detail panel. A real dialog: focus trapped, focus restored, Escape closes.

import { PRIMARY, SORTS } from '../data.js';
import { commas, fmtBig, fmtRate, fmtProperty, fmtYear, credit, esc, PROPERTY_LABELS, QUANTITY_LABELS } from '../format.js';
import { since } from '../ticker.js';
import { state, set } from '../state.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])';

export function mountDetail(app, { onSpecimen, offSpecimen } = {}) {
  const el = document.getElementById('detail');
  const scrim = document.getElementById('detail-scrim');
  let restoreTo = null;
  let liveEl = null;
  let current = null;

  scrim.addEventListener('click', () => set({ detail: null }));

  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  function close() {
    if (!current) return;
    offSpecimen?.();
    current = null;
    liveEl = null;
    el.hidden = true;
    scrim.hidden = true;
    el.innerHTML = '';
    document.body.style.overflow = '';
    restoreTo?.focus?.();
    restoreTo = null;
  }

  function open(m, { restore } = {}) {
    if (current?.id === m.id) return;
    if (current) offSpecimen?.();
    if (!restoreTo) restoreTo = restore || document.activeElement;
    current = m;
    el.innerHTML = render(m, app);
    el.hidden = false;
    scrim.hidden = false;
    document.body.style.overflow = 'hidden';
    el.scrollTop = 0;

    el.querySelector('#detail-close').addEventListener('click', () => set({ detail: null }));
    for (const b of el.querySelectorAll('.rel button')) {
      b.addEventListener('click', () => set({ detail: b.dataset.go }));
    }
    liveEl = el.querySelector('#detail-live-kg');
    el.querySelector('#detail-close').focus();
    onSpecimen?.(m, el.querySelector('.detail-specimen'));
  }

  function sync() {
    const m = state.detail ? app.byId.get(state.detail) : null;
    if (!m) {
      close();
      if (state.detail) set({ detail: null });
      return;
    }
    open(m);
  }

  function tick() {
    if (!liveEl || !current) return;
    liveEl.textContent = commas(since(current.rateKgS));
  }

  return { sync, close, tick, isOpen: () => !!current, current: () => current };
}

function render(m, app) {
  const q = m.quantities;
  const rows = Object.entries(QUANTITY_LABELS)
    .filter(([key]) => q[key])
    .map(([key, label]) => {
      const v = q[key];
      const est = v.derived ? ' <span class="est">EST</span>' : '';
      const note = v.note ? `<span class="src">${esc(v.note)}</span>` : '';
      const big = fmtBig(v, null);
      return `<tr><th>${label}</th><td>${big.num} ${big.words}${est}
        <span class="src">${sourceTag(v, app.sources)}</span>${note}</td></tr>`;
    })
    .join('');

  const props = Object.entries(PROPERTY_LABELS)
    .filter(([key]) => m.properties?.[key])
    .map(([key, label]) => {
      const p = m.properties[key];
      return `<tr><th>${label}</th><td>${fmtProperty(p)}
        <span class="src">${esc(credit(p, app.sources))}${p.note ? '. ' + esc(p.note) : ''}</span></td></tr>`;
    })
    .join('');

  const facts = (m.facts || [])
    .map((f) => `<li>${esc(f.text)}<span class="src">${esc(credit(f, app.sources))}</span></li>`)
    .join('');

  const scales = (m.scale || [])
    .map((s) => {
      const v = q[s.quantity];
      const obj = app.scales.objects.find((o) => o.id === s.against);
      if (!v || !obj) return '';
      const n = v.value / obj.mass_t;
      const amount = n >= 1 ? `<b>${commas(n)}×</b> the ${obj.name}` : `<b>${(n * 100).toFixed(1)}%</b> of the ${obj.name}`;
      const lead = s.quantity === 'annualProduction' ? 'Every year' : QUANTITY_LABELS[s.quantity];
      return `<li>${lead}: ${amount}</li>`;
    })
    .join('');

  const points = (list, cls) =>
    list?.length ? `<ul class="points ${cls}">${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '';

  const relGroups = [
    ['madeFrom', 'Made from'],
    ['uses', 'Turns into'],
    ['recycledInto', 'Recycled into'],
  ]
    .map(([key, label]) => {
      const list = (m.relations?.[key] || []).filter((id) => app.byId.has(id));
      if (!list.length) return '';
      return `<div class="rel-group">${label}
        <div class="rel">${list.map((id) => `<button type="button" data-go="${id}">${esc(app.byId.get(id).name)}</button>`).join('')}</div>
      </div>`;
    })
    .join('');

  const ranksLine = Object.values(SORTS)
    .filter((s) => s.quantity)
    .map((s) => {
      const r = app.ranks[s.quantity]?.get(m.id);
      return r ? `${ordinal(r)} ${s.label.replace(/^Most /, 'most ')}` : null;
    })
    .filter(Boolean)
    .join(' · ');

  const live = m.rateKgS > 0
    ? `<div class="detail-live">
         <div class="counter-label">${esc(m.name)} made since you got here</div>
         <div class="counter-value"><span id="detail-live-kg">0</span><span class="counter-unit">kg</span></div>
         <div class="counter-rate">${fmtRate(m.rateKgS)}</div>
         <p class="note">${plainAnnual(q.annualProduction)} · ${esc(credit(q.annualProduction, app.sources))}</p>
       </div>`
    : '';

  return `<div class="detail-inner">
    <div class="detail-top">
      <div>
        <h2 id="detail-name">${esc(m.name)}</h2>
        <div class="detail-sub">${esc(m.class)}${m.formula ? ' · ' + esc(m.formula) : ''}${ranksLine ? ' · ' + ranksLine : ''}</div>
      </div>
      <button id="detail-close" type="button" aria-label="Close (Escape)">✕</button>
    </div>

    <div class="detail-cols">
      <div>
        <div class="detail-specimen" style="--swatch:${esc(m.specimen.color)}"></div>
        <p class="specimen-hint">Drag to turn</p>
        ${live}
        <h3>Numbers</h3>
        <table class="qtable">${rows || '<tr><td>No sourced quantity.</td></tr>'}</table>
        ${props ? `<h3>What it is like</h3><table class="qtable">${props}</table>` : ''}
      </div>
      <div>
        ${m.aka?.length ? `<p class="note">Also called ${m.aka.map(esc).join(', ')}.</p>` : ''}
        <h3>Since</h3>
        <p>${esc(fmtYear(m.discovered?.year, m.discovered?.era, m.discovered?.approx))}</p>
        ${scales ? `<h3>That is like</h3><ul class="scales">${scales}</ul>` : ''}
        ${m.pros?.length ? `<h3>Good at</h3>${points(m.pros, 'good')}` : ''}
        ${m.cons?.length ? `<h3>Not so good</h3>${points(m.cons, 'bad')}` : ''}
        <h3>Did you know</h3>
        <ul class="facts">${facts}</ul>
        ${relGroups ? `<h3>Linked to</h3>${relGroups}` : ''}
      </div>
    </div>
  </div>`;
}

/** The credit line, linked to the source itself rather than trailing a long paper title. */
function sourceTag(q, sources) {
  const s = sources[q.source_id];
  const text = esc(credit(q, sources));
  return s?.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${text}</a>` : text;
}

function ordinal(n) {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  return `${n}${suffix}`;
}

function plainAnnual(q) {
  const { num, words } = fmtBig(q, 'flow');
  return `${num} ${words}`;
}


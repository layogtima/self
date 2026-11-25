// The detail panel. A real dialog: focus trapped, focus restored, Escape closes.

import { PRIMARY, SORTS } from '../data.js';
import { activeSections } from './settings.js';
import { commas, fmtBig, fmtRate, fmtProperty, fmtYear, fmtCarbon, fmtYearsLeft, runOutRisk, RESERVES_CAVEAT, credit, esc, quantityLabel, propertyNote, PROPERTY_LABELS, QUANTITY_LABELS } from '../format.js';
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
    el.querySelector('#detail-compare').addEventListener('click', () => {
      const has = state.compare.includes(m.id);
      // Four columns is as many as stay readable side by side.
      set({ compare: has ? state.compare.filter((x) => x !== m.id) : [...state.compare, m.id].slice(-4) });
    });
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

  /** Redraw the open panel in place, for when the section settings change. */
  function rerender() {
    if (!current) return;
    const m = current;
    current = null;
    open(m, { restore: restoreTo });
  }

  return { sync, close, tick, rerender, isOpen: () => !!current, current: () => current };
}

function render(m, app) {
  const q = m.quantities;
  const shown = new Set(activeSections());
  const on = (id) => shown.has(id);
  // Headings are read once and are already distinct. A glyph on each of twelve was
  // decoration; the words carry it.
  const h = (id, text) => `<h3>${text}</h3>`;
  const rows = Object.entries(QUANTITY_LABELS)
    .filter(([key]) => q[key])
    .map(([key]) => {
      const v = q[key];
      const label = quantityLabel(key, v);
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
      const gloss = propertyNote(key, p);
      return `<tr><th>${label}</th><td>${fmtProperty(p)}
        ${gloss ? `<span class="gloss">${esc(gloss)}</span>` : ''}
        <span class="src">${esc(credit(p, app.sources))}${p.note ? '. ' + esc(p.note) : ''}</span></td></tr>`;
    })
    .join('');

  const facts = (m.facts || [])
    .map((f) => `<li>${esc(f.text)}<span class="src">${esc(credit(f, app.sources))}</span></li>`)
    .join('');

  // Pick the comparison object that lands the count in a range a person can hold in
  // their head, rather than hand-picking one per material and leaving 171 without any.
  const compare = (tonnes) => {
    const objs = [...app.scales.objects].sort((a, b) => b.mass_t - a.mass_t);
    const best = objs.find((o) => tonnes / o.mass_t >= 1 && tonnes / o.mass_t < 1e6) || objs[objs.length - 1];
    const n = tonnes / best.mass_t;
    if (n < 1) return `<b>${(n * 100).toFixed(1)}%</b> of the ${best.name}`;
    return `<b>${commas(n)}×</b> the ${best.name}`;
  };
  const scaleRows = [
    q.annualProduction && ['Every year', compare(q.annualProduction.value)],
    q.anthropogenicStock && ['Still standing', compare(q.anthropogenicStock.value)],
  ].filter(Boolean);
  const scales = scaleRows.map(([lead, amount]) => `<li>${lead}: ${amount}</li>`).join('');

  const carbon = m.co2PerKg && on('carbon')
    ? `${h('carbon', 'What it costs the air')}
       <table class="qtable">
         <tr><th>Per kilogram</th><td>${fmtCarbon(m.co2PerKg.value)}
           <span class="gloss">${esc(carbonGloss(m.co2PerKg.value))}</span>
           <span class="src">${esc(credit(m.co2PerKg, app.sources))}</span>
           ${m.co2PerKg.note ? `<span class="src">${esc(m.co2PerKg.note)}</span>` : ''}</td></tr>
         ${m.co2PerYear ? `<tr><th>Every year</th><td>${fmtBig({ value: m.co2PerYear / 1000, unit: 't' }, null).num} ${fmtBig({ value: m.co2PerYear / 1000, unit: 't' }, null).words} of CO2e
           <span class="gloss">Making a year of it releases ${compare(m.co2PerYear / 1000).replace(/<\/?b>/g, '')} in weight of carbon dioxide.</span></td></tr>` : ''}
       </table>`
    : '';

  const risk = runOutRisk({
    years: m.yearsLeft,
    recycled: m.recyclingRate?.value ?? 0,
    topShare: m.producers?.top?.[0]?.share ?? 0,
  });
  const lifecycle = (m.yearsLeft || m.recyclingRate) && on('lifecycle')
    ? `${h('lifecycle', 'How long it lasts')}
       <table class="qtable">
         ${m.yearsLeft ? `<tr><th>Left to dig</th><td>${fmtYearsLeft(m.yearsLeft)}
           ${risk ? `<span class="risk risk-${risk.level}">${esc(risk.reason)}</span>` : ''}
           <span class="gloss">${esc(RESERVES_CAVEAT)}</span>
           <span class="src">${esc(credit(q.reserves, app.sources))}</span></td></tr>` : ''}
         ${m.recyclingRate ? `<tr><th>Comes back</th><td>${Math.round(m.recyclingRate.value * 100)}% recycled
           <span class="gloss">${esc(recycleGloss(m.recyclingRate.value))}</span>
           <span class="src">${esc(credit(m.recyclingRate, app.sources))}</span></td></tr>` : ''}
       </table>`
    : '';

  const fromWhere = m.producers?.top?.length && on('producers')
    ? `${h('producers', 'Where it comes from')}
       <ul class="uses producers">${m.producers.top
         .map((t) => `<li>${esc(t.country)} <span>${Math.round(t.share * 100)}%</span></li>`)
         .join('')}</ul>
       <p class="note">${esc(credit({ year: m.producers.year, source_id: m.producers.source_id }, app.sources))}</p>`
    : '';

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
      return r ? `${ordinal(r)} ${s.rank}` : null;
    })
    .filter(Boolean)
    .join(' · ');

  const live = m.rateKgS > 0
    ? `<div class="detail-live">
         <div class="counter-label">${esc(m.name)} ${liveVerb(q.annualProduction.kind)} since you got here</div>
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
      <div class="detail-actions">
        <button id="detail-compare" type="button">${state.compare.includes(m.id) ? 'In compare' : 'Compare'}</button>
        <button id="detail-close" type="button" aria-label="Close (Escape)">✕</button>
      </div>
    </div>

    <div class="detail-cols">
      <div>
        <div class="detail-specimen" style="--swatch:${esc(m.specimen.color)}"></div>
        <p class="specimen-hint">Drag to turn</p>
        ${live}
        ${on('numbers') ? `${h('numbers', 'Numbers')}
        <table class="qtable">${rows || '<tr><td>No sourced quantity.</td></tr>'}</table>` : ''}
        ${props && on('properties') ? `${h('properties', 'What it is like')}<table class="qtable">${props}</table>` : ''}
      </div>
      <div>
        ${m.aka?.length ? `<p class="note">Also called ${m.aka.map(esc).join(', ')}.</p>` : ''}
        ${on('since') ? `${h('since', 'Since')}
        <p>${esc(fmtYear(m.discovered?.year, m.discovered?.era, m.discovered?.approx))}</p>` : ''}
        ${scales && on('scale') ? `${h('scale', 'That is like')}<ul class="scales">${scales}</ul>` : ''}
        ${lifecycle}
        ${fromWhere}
        ${carbon}
        ${m.usedFor?.length && on('uses') ? `${h('uses', 'What it is for')}<ul class="uses">${m.usedFor.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : ''}
        ${m.pros?.length && on('pros') ? `${h('pros', 'Good at')}${points(m.pros, 'good')}` : ''}
        ${m.cons?.length && on('cons') ? `${h('cons', 'Not so good')}${points(m.cons, 'bad')}` : ''}
        ${on('facts') ? `${h('facts', 'Did you know')}<ul class="facts">${facts}</ul>` : ''}
        ${relGroups && on('relations') ? `${h('relations', 'Linked to')}${relGroups}` : ''}
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

/** Anchors people already have a feel for: a bus ride, a flight, a year of driving. */
function carbonGloss(kg) {
  if (kg >= 1000) return `A single kilogram of it carries the carbon of driving about ${commas((kg / 0.17) / 1000)} thousand km.`;
  if (kg >= 10) return `Ten kilos of it carries about the carbon of driving ${commas((kg * 10) / 0.17)} km.`;
  if (kg >= 1) return `A tonne of it carries about the carbon of driving ${commas((kg * 1000) / 0.17)} km.`;
  return `You would need ${commas(1 / kg)} kg of it to match one kilogram of carbon dioxide.`;
}

function recycleGloss(rate) {
  if (rate >= 0.7) return 'Most of it comes back round rather than being dug up again.';
  if (rate >= 0.3) return 'A useful share comes back, but most supply is still new material.';
  if (rate >= 0.05) return 'Only a small share comes back. Almost all supply is freshly dug or made.';
  return 'Effectively none of it comes back. Every kilogram used is a kilogram made from scratch.';
}

/** Nobody takes carbon dioxide out of the ground, and nobody makes it on purpose either. */
function liveVerb(kind) {
  if (kind === 'manufacture') return 'made';
  if (kind === 'byproduct') return 'released';
  return 'taken';
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


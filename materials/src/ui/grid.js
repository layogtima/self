// One list of everything we make, ranked by tonnes a year. What the crust holds and what is
// still standing ride along as extra facts and as alternative sort orders.

import { PRIMARY, SORTS, CLASS_ICONS } from '../data.js';
import { fmtBig, fmtCarbon } from '../format.js';
import { state, set } from '../state.js';

export function mountGrid(app, { thumbs } = {}) {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const noteEl = document.getElementById('grid-note');
  const template = document.getElementById('card-template');
  const classesEl = document.getElementById('classes');
  const searchEl = document.getElementById('search');
  const sortEl = document.getElementById('sort');
  const countryEl = document.getElementById('country');
  const compareEl = document.getElementById('compare');

  const cards = new Map();
  let visible = [];
  let cursor = -1;

  // Paint a card's specimen when it first scrolls into view, once.
  const painted = new Set();
  const io = thumbs
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const id = e.target.dataset.id;
            if (painted.has(id)) continue;
            if (thumbs.paint(app.byId.get(id), e.target.querySelector('canvas'))) {
              painted.add(id);
              io.unobserve(e.target);
            }
          }
        },
        { rootMargin: '200px' }
      )
    : null;

  for (const m of app.materials) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = m.id;
    node.style.setProperty('--swatch', m.specimen.color);
    node.querySelector('.card-name').textContent = m.name;
    node.setAttribute('aria-label', `${m.name}, ${m.class}`);
    node.addEventListener('click', () => set({ detail: m.id }));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        set({ detail: m.id });
      }
    });
    if (thumbs) attachHover(node, m);
    grid.append(node);
    cards.set(m.id, node);
    io?.observe(node);
  }

  /** One card spins while the pointer is on it. Everything else stays a still image. */
  function attachHover(node, m) {
    const canvas = node.querySelector('canvas');
    let raf = null;
    let angle = 0;
    let last = 0;
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      thumbs.paint(m, canvas, 0);
    };
    const step = (now) => {
      raf = requestAnimationFrame(step);
      if (now - last < 33) return; // 30fps is plenty for a 5rem specimen
      last = now;
      angle += 0.05;
      thumbs.paint(m, canvas, angle);
    };
    const start = () => {
      if (raf || state.calm) return;
      angle = 0;
      last = 0;
      raf = requestAnimationFrame(step);
    };
    node.addEventListener('pointerenter', start);
    node.addEventListener('focus', start);
    node.addEventListener('pointerleave', stop);
    node.addEventListener('blur', stop);
  }

  for (const cls of app.classes) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = cls;
    b.dataset.class = cls;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      const next = state.classes.includes(cls) ? state.classes.filter((c) => c !== cls) : [...state.classes, cls];
      set({ classes: next });
    });
    classesEl.append(b);
  }

  // Nine buckets that add up to the whole list, each one also a filter.
  const activeEl = document.getElementById('active');
  const totalsEl = document.getElementById('totals');
  // One unit, stated once in the label, rather than "billion tonnes" nine times over.
  // Per-person mode reframes these too, or the strip would contradict every card below it.
  const renderTotals = () => {
    const per = state.perPerson;
    totalsEl.innerHTML =
      `<span class="totals-label">${per ? 'Tonnes a year, each' : 'Billions of tonnes a year'}</span>` +
      app.byClass
        .map((b) => {
          const bn = per ? b.tonnes / app.population.value : b.tonnes / 1e9;
          const shown = bn >= 10 ? bn.toFixed(0) : bn >= 1 ? bn.toFixed(1) : bn.toFixed(2);
          return `<button type="button" data-class="${b.cls}" aria-pressed="false">${
            state.icons ? `${CLASS_ICONS[b.cls] || ''} ` : ''
          }${b.cls}<b>${shown}</b></button>`;
        })
        .join('');
    for (const b of totalsEl.querySelectorAll('[data-class]')) {
      b.addEventListener('click', () => {
        const cls = b.dataset.class;
        set({ classes: state.classes.includes(cls) ? state.classes.filter((c) => c !== cls) : [cls] });
      });
    }
  };
  renderTotals();
  // Everywhere that turns up as a top producer, so the list can be read by origin.
  countryEl.innerHTML =
    '<option value="">Anywhere</option>' +
    app.countries.map((c) => `<option value="${c}">${c}</option>`).join('');
  countryEl.addEventListener('change', () => set({ country: countryEl.value }));

  sortEl.innerHTML = Object.values(SORTS)
    .map((s) => `<option value="${s.id}">${s.label}</option>`)
    .join('');

  document.getElementById('reset').addEventListener('click', () => {
    set({ q: '', classes: [] });
    searchEl.value = '';
  });
  searchEl.addEventListener('input', () => set({ q: searchEl.value.trim() }));
  sortEl.addEventListener('change', () => set({ sort: sortEl.value }));

  /** The small grey line under a card: the facts the two retired lists used to carry. */
  function extras(m) {
    // No icon here: every card already carries a rendered specimen, which does this job
    // better, and 180 repeated glyphs is noise rather than signal.
    const out = [m.class];
    if (m.subsetOf && app.byId.has(m.subsetOf)) out.push(`part of ${app.byId.get(m.subsetOf).name}`);
    if (m.excludedFromTotal) out.push('counted separately');
    if (m.yearsLeft) out.push(`${Math.round(m.yearsLeft)} years left`);
    if (m.co2PerKg) out.push(`${fmtCarbon(m.co2PerKg.value)}/kg`);
    const stock = m.quantities.anthropogenicStock;
    const crust = m.quantities.crustalAbundance;
    if (stock) out.push(`${fmtBig(stock, 'made').num} bn t built`.replace('bn t', unitWord(stock.value)));
    if (crust) out.push(`${fmtBig(crust, 'crust').num} of rock`);
    return out.join(' · ');
  }

  // "33 billion tonnes still standing" wraps the card to two lines; "33 billion t built"
  // says the same thing and keeps every card the same height.
  function unitWord(tonnes) {
    if (tonnes >= 1e9) return 'billion t';
    if (tonnes >= 1e6) return 'million t';
    if (tonnes >= 1e3) return 'thousand t';
    return 't';
  }

  function render() {
    const sort = SORTS[state.sort] || SORTS.made;
    const query = state.q.toLowerCase();
    const ranks = app.ranks[PRIMARY];

    // Never write into the box the user is typing in: it breaks IME and jumps the caret.
    if (document.activeElement !== searchEl && searchEl.value !== state.q) searchEl.value = state.q;
    sortEl.value = sort.id;
    const totalsKey = `${state.icons}|${state.perPerson}`;
    if (totalsEl.dataset.key !== totalsKey) {
      totalsEl.dataset.key = totalsKey;
      renderTotals();
    }
    for (const chip of totalsEl.querySelectorAll('[data-class]')) {
      chip.setAttribute('aria-pressed', String(state.classes.includes(chip.dataset.class)));
    }
    for (const chip of classesEl.children) {
      chip.setAttribute('aria-pressed', String(state.classes.includes(chip.dataset.class)));
    }

    countryEl.value = state.country;
    const matched = app.materials.filter((m) => {
      if (query && !m.haystack.includes(query)) return false;
      if (state.classes.length && !state.classes.includes(m.class)) return false;
      if (state.country && !(m.producers?.top || []).some((t) => t.country === state.country)) return false;
      return true;
    });

    // The list is what we make, so a material with no production figure is not in it.
    const sorted = matched
      .filter((m) => m.quantities[PRIMARY])
      .sort((a, b) => {
        if (sort.id === 'name') return a.name.localeCompare(b.name);
        if (sort.id === 'year') return a.sortYear - b.sortYear;
        // A sort key some materials lack: those fall to the bottom either way, which is
        // why the missing sentinel flips with the direction.
        const pick = (m) =>
          sort.quantity ? m.quantities[sort.quantity]?.value : sort.field ? m[sort.field]?.value : m[sort.derived];
        const miss = sort.ascending ? Infinity : -1;
        const av = pick(a) ?? miss;
        const bv = pick(b) ?? miss;
        if (av === bv) return a.name.localeCompare(b.name);
        return sort.ascending ? av - bv : bv - av;
      });

    for (const node of cards.values()) node.classList.add('is-hidden');

    for (const m of sorted) {
      const node = cards.get(m.id);
      node.classList.remove('is-hidden');
      grid.append(node);

      const q = m.quantities[PRIMARY];
      node.querySelector('.card-rank').textContent = ranks.get(m.id) ?? '';

      const { num, words } = fmtBig(q, 'flow');
      const est = q.derived ? ' <span class="est">EST</span>' : '';
      // The space matters to screen readers; the unit renders as its own line anyway.
      node.querySelector('.card-figure').innerHTML = `${num} <span class="unit">${words}${est}</span>`;
      node.querySelector('.card-class').textContent = extras(m);
    }

    // When filtered to one country, say what share of its output each material is.
    if (state.country) {
      for (const m of sorted) {
        const t = m.producers.top.find((x) => x.country === state.country);
        const line = cards.get(m.id).querySelector('.card-class');
        if (t) line.textContent = `${line.textContent} · ${Math.round(t.share * 100)}% from ${state.country}`;
      }
    }

    // Say out loud what is being filtered, and give each one an off switch. Without this
    // a country filter or per-person mode just silently changes every number on the page.
    const chips = [];
    if (state.perPerson) chips.push(['perPerson', 'My share']);
    if (state.country) chips.push(['country', `Made in ${state.country}`]);
    for (const c of state.classes) chips.push([`class:${c}`, c]);
    if (state.q) chips.push(['q', `Search: ${state.q}`]);
    activeEl.hidden = chips.length === 0;
    activeEl.innerHTML = chips.length
      ? `<span class="active-label">Showing</span>` +
        chips
          .map(([key, label]) => `<button type="button" data-clear="${key}">${label}<i aria-hidden="true">\u00d7</i></button>`)
          .join('') +
        (chips.length > 1 ? '<button type="button" data-clear="all" class="active-all">Clear all</button>' : '')
      : '';
    for (const b of activeEl.querySelectorAll('[data-clear]')) {
      b.addEventListener('click', () => {
        const k = b.dataset.clear;
        if (k === 'all') return set({ perPerson: false, country: '', classes: [], q: '' });
        if (k === 'perPerson') return set({ perPerson: false });
        if (k === 'country') return set({ country: '' });
        if (k === 'q') return set({ q: '' });
        if (k.startsWith('class:')) return set({ classes: state.classes.filter((c) => c !== k.slice(6)) });
      });
    }

    const offList = matched.length - sorted.length;
    noteEl.textContent = offList ? `${offList} more have no yearly figure.` : '';
    noteEl.hidden = !offList;

    visible = sorted.map((m) => m.id);
    cursor = Math.min(cursor, visible.length - 1);
    empty.hidden = sorted.length > 0;
    empty.querySelector('span').textContent = matched.length ? 'Nothing here has a yearly figure.' : 'Nothing found.';
  }

  function move(delta) {
    if (!visible.length) return;
    cursor = cursor < 0 ? (delta > 0 ? 0 : visible.length - 1) : (cursor + delta + visible.length) % visible.length;
    cards.get(visible[cursor])?.focus();
  }

  /** Open a material at random, weighted to nothing: pure luck. */
  function shuffle() {
    const pool = visible.length ? visible : app.materials.map((m) => m.id);
    set({ detail: pool[Math.floor(Math.random() * pool.length)] });
  }

  /** The compare tray: a few materials side by side on the numbers that matter. */
  function renderCompare() {
    const picks = state.compare.map((id) => app.byId.get(id)).filter(Boolean);
    compareEl.hidden = picks.length === 0;
    if (!picks.length) return;
    const rows = [
      ['Made each year', (m) => fmtWith(m.quantities.annualProduction, 'flow')],
      ['Carbon per kilo', (m) => (m.co2PerKg ? `${m.co2PerKg.value} kg` : 'not known')],
      ['Comes back', (m) => (m.recyclingRate ? `${Math.round(m.recyclingRate.value * 100)}%` : 'not known')],
      ['Left to dig', (m) => (m.yearsLeft ? `${Math.round(m.yearsLeft)} yrs` : 'not known')],
      ['Heaviness', (m) => (m.properties?.density ? `${commasish(m.properties.density.value)} kg/m³` : 'not known')],
    ];
    compareEl.innerHTML = `
      <div class="compare-inner">
        <table class="compare-table">
          <thead><tr><th></th>${picks
            .map((m) => `<th>${m.name}<button type="button" data-drop="${m.id}" aria-label="Remove ${m.name}">&times;</button></th>`)
            .join('')}</tr></thead>
          <tbody>${rows
            .map(([label, fn]) => `<tr><th>${label}</th>${picks.map((m) => `<td>${fn(m)}</td>`).join('')}</tr>`)
            .join('')}</tbody>
        </table>
        <button type="button" id="compare-clear">Clear</button>
      </div>`;
    for (const b of compareEl.querySelectorAll('[data-drop]')) {
      b.addEventListener('click', () => set({ compare: state.compare.filter((x) => x !== b.dataset.drop) }));
    }
    compareEl.querySelector('#compare-clear').addEventListener('click', () => set({ compare: [] }));
  }

  const commasish = (n) => Math.round(n).toLocaleString('en-US');
  const fmtWith = (q, view) => {
    if (!q) return 'not known';
    const { num, words } = fmtBig(q, view);
    return `${num} ${words}`;
  };

  return { render, renderCompare, shuffle, move, current: () => visible[cursor], cardEl: (id) => cards.get(id) };
}

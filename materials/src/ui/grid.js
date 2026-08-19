// One list of everything we make, ranked by tonnes a year. What the crust holds and what is
// still standing ride along as extra facts and as alternative sort orders.

import { PRIMARY, SORTS } from '../data.js';
import { fmtBig } from '../format.js';
import { state, set } from '../state.js';

export function mountGrid(app, { thumbs } = {}) {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const noteEl = document.getElementById('grid-note');
  const template = document.getElementById('card-template');
  const classesEl = document.getElementById('classes');
  const searchEl = document.getElementById('search');
  const sortEl = document.getElementById('sort');

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
    const out = [m.class];
    if (m.subsetOf && app.byId.has(m.subsetOf)) out.push(`part of ${app.byId.get(m.subsetOf).name}`);
    if (m.excludedFromTotal) out.push('counted separately');
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
    for (const chip of classesEl.children) {
      chip.setAttribute('aria-pressed', String(state.classes.includes(chip.dataset.class)));
    }

    const matched = app.materials.filter((m) => {
      if (query && !m.haystack.includes(query)) return false;
      if (state.classes.length && !state.classes.includes(m.class)) return false;
      return true;
    });

    // The list is what we make, so a material with no production figure is not in it.
    const sorted = matched
      .filter((m) => m.quantities[PRIMARY])
      .sort((a, b) => {
        if (sort.id === 'name') return a.name.localeCompare(b.name);
        if (sort.id === 'year') return a.sortYear - b.sortYear;
        // Sorting by a quantity some materials lack: those fall to the bottom.
        const av = a.quantities[sort.quantity]?.value ?? -1;
        const bv = b.quantities[sort.quantity]?.value ?? -1;
        if (av === bv) return a.name.localeCompare(b.name);
        return bv - av;
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

  return { render, move, current: () => visible[cursor], cardEl: (id) => cards.get(id) };
}

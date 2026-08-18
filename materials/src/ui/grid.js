// The grid: one card per material. Specimens are painted once into a per-card canvas and
// only re-painted on hover, so scrolling the list costs nothing.

import { VIEWS, logFraction } from '../data.js';
import { fmtBig } from '../format.js';
import { state, set } from '../state.js';

export function mountGrid(app, { thumbs } = {}) {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const template = document.getElementById('card-template');
  const classesEl = document.getElementById('classes');
  const searchEl = document.getElementById('search');
  const sortEl = document.getElementById('sort');

  const noteEl = document.getElementById('grid-note');
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
    node.style.setProperty('--accent', m.specimen.color);
    node.querySelector('.card-name').textContent = m.name;
    node.querySelector('.card-class').textContent = m.class;
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

  document.getElementById('reset').addEventListener('click', () => {
    set({ q: '', classes: [] });
    searchEl.value = '';
  });
  searchEl.addEventListener('input', () => set({ q: searchEl.value.trim() }));
  sortEl.addEventListener('change', () => set({ sort: sortEl.value }));
  for (const tab of document.querySelectorAll('.views button')) {
    tab.textContent = VIEWS[tab.dataset.view].tab;
    tab.addEventListener('click', () => set({ view: tab.dataset.view }));
  }

  function render() {
    const key = VIEWS[state.view].quantity;
    const ranks = app.ranks[state.view];
    const extent = app.extents[state.view];
    const query = state.q.toLowerCase();

    // Never write into the box the user is typing in: it breaks IME and jumps the caret.
    if (document.activeElement !== searchEl && searchEl.value !== state.q) searchEl.value = state.q;
    sortEl.value = state.sort;
    for (const tab of document.querySelectorAll('.views button')) {
      tab.setAttribute('aria-selected', String(tab.dataset.view === state.view));
    }
    for (const chip of classesEl.children) {
      chip.setAttribute('aria-pressed', String(state.classes.includes(chip.dataset.class)));
    }

    const matched = app.materials.filter((m) => {
      if (query && !m.haystack.includes(query)) return false;
      if (state.classes.length && !state.classes.includes(m.class)) return false;
      return true;
    });

    // A material with no figure for this list is not shown. Rows reading "not on this
    // list" made a real absence look like a broken record; the count below says how many
    // and why instead.
    const sorted = matched
      .filter((m) => m.quantities[key])
      .sort((a, b) => {
        if (state.sort === 'name') return a.name.localeCompare(b.name);
        if (state.sort === 'year') return a.sortYear - b.sortYear;
        return b.quantities[key].value - a.quantities[key].value;
      });

    for (const node of cards.values()) node.classList.add('is-hidden');

    for (const m of sorted) {
      const node = cards.get(m.id);
      node.classList.remove('is-hidden');
      grid.append(node);

      const q = m.quantities[key];
      node.querySelector('.card-rank').textContent = ranks.get(m.id) ?? '';

      const { num, words } = fmtBig(q, state.view);
      const est = q.derived ? ' <span class="est">EST</span>' : '';
      // The space matters to screen readers; the unit renders as its own line anyway.
      node.querySelector('.card-figure').innerHTML = `${num} <span class="unit">${words}${est}</span>`;
      node.querySelector('.bar').style.setProperty('--bar', logFraction(q.value, extent).toFixed(3));
    }

    const offList = matched.length - sorted.length;
    noteEl.textContent = offList ? `${offList} more aren't measured this way.` : '';
    noteEl.hidden = !offList;

    visible = sorted.map((m) => m.id);
    cursor = Math.min(cursor, visible.length - 1);
    empty.hidden = sorted.length > 0;
    empty.querySelector('span').textContent = matched.length
      ? 'Nothing on this list matches.'
      : 'Nothing found.';
  }

  function move(delta) {
    if (!visible.length) return;
    cursor = cursor < 0 ? (delta > 0 ? 0 : visible.length - 1) : (cursor + delta + visible.length) % visible.length;
    cards.get(visible[cursor])?.focus();
  }

  return { render, move, current: () => visible[cursor], cardEl: (id) => cards.get(id) };
}

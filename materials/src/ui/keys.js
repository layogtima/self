// Keyboard: / search, 1/2/3 views, j/k navigate, Enter open, Esc close, c calm.

import { state, set } from '../state.js';

const VIEW_KEYS = new Map([['1', 'crust'], ['2', 'made'], ['3', 'flow']]);

export function mountKeys({ grid, detail, toggleCalm }) {
  const search = document.getElementById('search');

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName || '');

    if (e.key === 'Escape') {
      if (detail.isOpen()) {
        e.preventDefault();
        set({ detail: null });
      } else if (typing) {
        document.activeElement.blur();
      }
      return;
    }

    if (typing) return;

    if (e.key === '/') {
      e.preventDefault();
      search.focus();
      search.select();
      return;
    }
    if (VIEW_KEYS.has(e.key)) {
      e.preventDefault();
      set({ view: VIEW_KEYS.get(e.key) });
      return;
    }
    if (detail.isOpen()) return;
    if (e.key === 'j') {
      e.preventDefault();
      grid.move(1);
    } else if (e.key === 'k') {
      e.preventDefault();
      grid.move(-1);
    } else if (e.key === 'c') {
      e.preventDefault();
      toggleCalm();
    }
  });
}

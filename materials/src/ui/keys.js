// Keyboard: / search, j/k navigate, Enter open, Esc close, c pause.

import { state, set } from '../state.js';

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

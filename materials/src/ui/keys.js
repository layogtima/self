// Keyboard: / search, j/k navigate, Enter open, Esc close, c pause, t theme, s settings, r shuffle.

import { state, set } from '../state.js';

export function mountKeys({ grid, detail, toggleCalm, toggleTheme, toggleSettings, shuffle }) {
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
    } else if (e.key === 't') {
      e.preventDefault();
      toggleTheme();
    } else if (e.key === 's') {
      e.preventDefault();
      toggleSettings();
    } else if (e.key === 'r') {
      e.preventDefault();
      shuffle();
    }
  });
}

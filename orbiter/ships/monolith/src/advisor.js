// NOVA — the resident infinity. Formless, serene, faintly amused. The intro
// dialogue card; her portrait is a live particle swirl (nova-entity.js).

import { attachPortrait } from './nova-entity.js';

const LINES = [
  'I am the space between the exhibits. The previous Directors called me Nova. I let them.',
  'This is the Wondervoid: seven vessels, six worlds, one of me. I collected the worlds. The Directors collected themselves.',
  'You are Director now. The title is ornamental. The job is wonder.',
  'Press N when you want to bend something. Walk (G) when you want to feel small inside it. I will be everywhere, either way.',
];

export function createAdvisor({ onDone }) {
  const root = document.getElementById('advisor');
  const portrait = document.getElementById('advisor-portrait');
  const lineEl = document.getElementById('advisor-line');
  const bubble = document.getElementById('advisor-bubble');
  attachPortrait(portrait);

  let idx = -1;
  let typing = null;

  function typeLine(text) {
    clearInterval(typing);
    lineEl.textContent = '';
    let i = 0;
    typing = setInterval(() => {
      lineEl.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(typing);
    }, 14);
  }

  function advance() {
    idx++;
    if (idx >= LINES.length) {
      root.classList.remove('show');
      setTimeout(() => { root.style.display = 'none'; }, 600);
      onDone();
      return;
    }
    typeLine(LINES[idx]);
  }

  bubble.addEventListener('click', () => {
    if (lineEl.textContent.length < (LINES[idx] || '').length) {
      clearInterval(typing);
      lineEl.textContent = LINES[idx];
    } else {
      advance();
    }
  });

  return {
    start() {
      root.classList.add('show');
      advance();
    },
  };
}

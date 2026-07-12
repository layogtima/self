// Auntie Nova, the holographic concierge — first of the campaign advisors.
// Pure DOM/CSS; her portrait is an inline SVG hologram.

const PORTRAIT_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="holo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#aef1ff"/>
      <stop offset="1" stop-color="#3fa9d9"/>
    </linearGradient>
  </defs>
  <!-- scanlines -->
  <g stroke="#7ee0ff" stroke-width="0.6" opacity="0.25">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="4" y1="${10 + i * 7}" x2="96" y2="${10 + i * 7}"/>`).join('')}
  </g>
  <!-- bouffant hairdo -->
  <ellipse cx="50" cy="30" rx="24" ry="18" fill="url(#holo)" opacity="0.85"/>
  <ellipse cx="32" cy="38" rx="9" ry="12" fill="url(#holo)" opacity="0.7"/>
  <ellipse cx="68" cy="38" rx="9" ry="12" fill="url(#holo)" opacity="0.7"/>
  <!-- face -->
  <ellipse cx="50" cy="52" rx="17" ry="19" fill="#0a2a3d" stroke="#7ee0ff" stroke-width="1.2"/>
  <!-- three kind eyes -->
  <circle cx="42" cy="48" r="3.2" fill="#aef1ff"/>
  <circle cx="58" cy="48" r="3.2" fill="#aef1ff"/>
  <circle cx="50" cy="42" r="2.4" fill="#aef1ff"/>
  <circle cx="42.8" cy="48.8" r="1.1" fill="#06222f"/>
  <circle cx="58.8" cy="48.8" r="1.1" fill="#06222f"/>
  <circle cx="50.6" cy="42.6" r="0.9" fill="#06222f"/>
  <!-- warm smile -->
  <path d="M 41 60 Q 50 68 59 60" stroke="#aef1ff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- earrings: tiny planets -->
  <circle cx="31" cy="56" r="2.6" fill="none" stroke="#ffd27a" stroke-width="1"/>
  <ellipse cx="31" cy="56" rx="4.4" ry="1.2" fill="none" stroke="#ffd27a" stroke-width="0.7"/>
  <circle cx="69" cy="56" r="2.6" fill="none" stroke="#ffd27a" stroke-width="1"/>
  <ellipse cx="69" cy="56" rx="4.4" ry="1.2" fill="none" stroke="#ffd27a" stroke-width="0.7"/>
  <!-- collar -->
  <path d="M 30 84 Q 50 70 70 84 L 70 96 L 30 96 Z" fill="url(#holo)" opacity="0.55"/>
</svg>`;

const LINES = [
  'Ohh, a new Park Director! Welcome aboard the Wondervoid, sugar. I\'m Auntie Nova — I\'ve run this deck since before your species invented the funnel cake.',
  'Out there: hard vacuum, minus 270, certain death. In here: a carousel, churro stands, and the finest artificial gravity money can buy. Marvelous product, isn\'t it?',
  'But the guests are getting restless. Restless guests write reviews. Bad ones. On the galactic net. FOREVER.',
  'Be a dear — press B, or tap that shiny button up top, and plop down a Gravity Whirl. The teacups spin clockwise; the nausea is complimentary. ♥',
];

export function createAdvisor({ onDone }) {
  const root = document.getElementById('advisor');
  const portrait = document.getElementById('advisor-portrait');
  const lineEl = document.getElementById('advisor-line');
  const bubble = document.getElementById('advisor-bubble');
  portrait.innerHTML = PORTRAIT_SVG;

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
    // finish the typewriter first if it's mid-line
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

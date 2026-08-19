// MATERIALS — wiring only.

import { loadData } from './data.js';
import { esc } from './format.js';
import { initState, state, set, subscribe } from './state.js';
import { mountGrid } from './ui/grid.js';
import { mountDetail } from './ui/detail.js';
import { mountHero } from './ui/hero.js';
import { mountKeys } from './ui/keys.js';
import { setPaused } from './ticker.js';

let app;
try {
  app = await loadData('./');
} catch (err) {
  // A failed fetch would otherwise reject module evaluation and leave a blank page.
  console.error('MATERIALS: could not load the dataset.', err);
  document.getElementById('grid').innerHTML =
    `<li class="card"><div class="card-body"><h3 class="card-name">Data failed to load</h3>
     <p class="card-rate">${esc(err.message)}. The dataset lives at data/materials.json.</p></div></li>`;
  throw err;
}
initState();

// 3D is a progressive enhancement: if three.js or WebGL is unavailable the app still works.
// Two jobs, two renderers: `gl` draws the live hero cloud and the open specimen; `thumbs`
// paints each card once into its own canvas so the grid costs nothing to scroll.
let gl = null;
let thumbs = null;
try {
  const [glMod, thumbMod] = await Promise.all([import('./render/gl.js'), import('./render/thumbs.js')]);
  gl = glMod.createRenderer();
  thumbs = thumbMod.createThumbnailer();
} catch (err) {
  console.warn('MATERIALS: 3D specimens unavailable, falling back to flat swatches.', err);
}
if (!gl || !thumbs) document.body.classList.add('no-webgl');

const grid = mountGrid(app, { thumbs });
const detail = mountDetail(app, {
  onSpecimen: (m, el) => gl?.addDetail(m, el),
  offSpecimen: () => gl?.removeDetail(),
});
const updateHero = mountHero(app);
gl?.addHero(app.materials, document.getElementById('hero-specimens'), (id) => set({ detail: id }));

// sources list in the About section
document.getElementById('source-list').innerHTML = Object.values(app.sources)
  .sort((a, b) => a.publisher.localeCompare(b.publisher))
  .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.publisher)} · ${esc(s.title)}</a></li>`)
  .join('');

if (app.warnings.length) {
  const box = document.getElementById('warnings');
  box.hidden = false;
  box.innerHTML = `<strong>Data warning.</strong> ${app.warnings.map((w) => `<div>${esc(w)}</div>`).join('')}`;
}

// theme: follow the OS until the reader picks a side, then remember the choice
const themeBtn = document.getElementById('theme-toggle');
const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)');

function resolvedTheme() {
  if (state.theme === 'light' || state.theme === 'dark') return state.theme;
  return prefersLight?.matches ? 'light' : 'dark';
}

function applyTheme() {
  const theme = resolvedTheme();
  document.documentElement.dataset.theme = theme;
  // Tells the browser which scrollbars and form controls to draw.
  document.documentElement.style.colorScheme = theme;
  const next = theme === 'dark' ? 'light' : 'dark';
  themeBtn.textContent = next.toUpperCase();
  themeBtn.setAttribute('aria-label', `Switch to ${next} mode`);
}
themeBtn.addEventListener('click', () => set({ theme: resolvedTheme() === 'dark' ? 'light' : 'dark' }));

// calm mode
const calmBtn = document.getElementById('calm-toggle');
function applyCalm() {
  document.body.classList.toggle('calm', state.calm);
  calmBtn.setAttribute('aria-pressed', String(state.calm));
  calmBtn.textContent = state.calm ? 'PLAY' : 'PAUSE';
  setPaused(state.calm);
  gl?.setCalm(state.calm);
}
calmBtn.addEventListener('click', () => set({ calm: !state.calm }));

mountKeys({
  grid,
  detail,
  toggleCalm: () => set({ calm: !state.calm }),
  toggleTheme: () => set({ theme: resolvedTheme() === 'dark' ? 'light' : 'dark' }),
});

subscribe((_s, changed) => {
  if (changed.some((c) => ['q', 'sort', 'classes'].includes(c))) grid.render();
  if (changed.includes('detail')) detail.sync();
  if (changed.includes('calm')) applyCalm();
  if (changed.includes('theme')) applyTheme();
});

grid.render();
detail.sync();
applyCalm();
applyTheme();

// One loop drives the counters; gl runs its own rAF for the specimens.
function tick() {
  requestAnimationFrame(tick);
  if (state.calm) return;
  updateHero();
  detail.tick();
}
tick();
updateHero();

// exposed for the smoke test
window.__mat = { app, state, gl, thumbs, grid, detail };

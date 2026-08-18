// MATERIAL — wiring only.

import { loadData, VIEWS } from './data.js';
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
  console.error('MATERIAL: could not load the dataset.', err);
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
  console.warn('MATERIAL: 3D specimens unavailable, falling back to flat swatches.', err);
}
if (!gl || !thumbs) document.body.classList.add('no-webgl');

const grid = mountGrid(app, { thumbs });
const detail = mountDetail(app, {
  onSpecimen: (m, el) => gl?.addDetail(m, el),
  offSpecimen: () => gl?.removeDetail(),
});
const updateHero = mountHero(app);
gl?.addHero(app.materials, document.getElementById('hero-specimens'));

// The About legend is rendered from VIEWS so the tabs and the explanations cannot drift.
document.getElementById('legend').innerHTML = Object.values(VIEWS)
  .map((v) => `<div><dt>${esc(v.tab)}</dt><dd>${esc(v.legend)}</dd></div>`)
  .join('');

// sources list in the About section
document.getElementById('source-list').innerHTML = Object.values(app.sources)
  .sort((a, b) => a.publisher.localeCompare(b.publisher))
  .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.publisher)} — ${esc(s.title)}</a></li>`)
  .join('');

if (app.warnings.length) {
  const box = document.getElementById('warnings');
  box.hidden = false;
  box.innerHTML = `<strong>Data warning.</strong> ${app.warnings.map((w) => `<div>${esc(w)}</div>`).join('')}`;
}

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

mountKeys({ grid, detail, toggleCalm: () => set({ calm: !state.calm }) });

subscribe((_s, changed) => {
  if (changed.some((c) => ['view', 'q', 'sort', 'classes'].includes(c))) grid.render();
  if (changed.includes('detail')) detail.sync();
  if (changed.includes('calm')) applyCalm();
});

grid.render();
detail.sync();
applyCalm();

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

// MATERIALS, wiring only.

import { loadData } from './data.js';
import { setPerPerson } from './format.js';
import { ICONS } from './ui/icons.js';
import { esc } from './format.js';
import { initState, state, set, subscribe } from './state.js';
import { mountGrid } from './ui/grid.js';
import { mountDetail } from './ui/detail.js';
import { mountHero } from './ui/hero.js';
import { mountKeys } from './ui/keys.js';
import { mountSettings } from './ui/settings.js';
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

// The two headline figures, explained where there is room to explain them.
{
  const { extraction, emissions, materialsShare, trackedShare } = app.global;
  document.getElementById('provenance').textContent =
    `The counter runs on ${extraction.value / 1e9} billion tonnes of material a year (UNEP ${extraction.year}); ` +
    `the ${app.materials.length} below cover ${(trackedShare * 100).toFixed(0)}% of it. The carbon line runs on ` +
    `${emissions.value / 1e9} billion tonnes of CO2 a year (Global Carbon Project ${emissions.year}), of which about ` +
    `${Math.round(materialsShare.value * 100)}% comes from getting materials and making things out of them.`;
}

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
const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)');

function resolvedTheme() {
  if (state.theme === 'light' || state.theme === 'dark') return state.theme;
  return prefersLight?.matches ? 'light' : 'dark';
}

const themeBtn = document.getElementById('theme-toggle');
document.getElementById('shuffle').innerHTML = ICONS.shuffle;
document.getElementById('settings-toggle').innerHTML = ICONS.settings;
themeBtn.addEventListener('click', () => set({ theme: resolvedTheme() === 'dark' ? 'light' : 'dark' }));

function applyTheme() {
  const theme = resolvedTheme();
  document.documentElement.dataset.theme = theme;
  // Tells the browser which scrollbars and form controls to draw.
  document.documentElement.style.colorScheme = theme;
  // Show the thing you would get by pressing it.
  themeBtn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
  themeBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}

function applyCalm() {
  document.body.classList.toggle('calm', state.calm);
  setPaused(state.calm);
  gl?.setCalm(state.calm);
}

function applyIcons() {
  document.body.classList.toggle('no-icons', !state.icons);
}

function applyPerPerson() {
  setPerPerson(state.perPerson ? app.population.value : null);
  document.body.classList.toggle('per-person', state.perPerson);
}

const settings = mountSettings(app);

document.getElementById('shuffle').addEventListener('click', () => grid.shuffle());

mountKeys({
  grid,
  detail,
  toggleCalm: () => set({ calm: !state.calm }),
  toggleTheme: () => set({ theme: resolvedTheme() === 'dark' ? 'light' : 'dark' }),
  toggleSettings: () => settings.toggle(),
  shuffle: () => grid.shuffle(),
});

subscribe((_s, changed) => {
  if (changed.includes('perPerson')) applyPerPerson();
  if (changed.includes('icons')) applyIcons();
  if (changed.some((c) => ['q', 'sort', 'classes', 'country', 'perPerson', 'icons'].includes(c))) grid.render();
  if (changed.includes('compare')) grid.renderCompare();
  if (changed.includes('detail')) detail.sync();
  if (changed.includes('calm')) applyCalm();
  if (changed.includes('theme')) applyTheme();
  // Section choices change what the open panel should be showing.
  if (changed.some((c) => ['level', 'sections', 'perPerson', 'scaleObject', 'icons'].includes(c))) {
    detail.rerender();
  }
  settings.render();
});

applyPerPerson();
applyIcons();
grid.render();
grid.renderCompare();
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
window.__mat = { app, state, gl, thumbs, grid, detail, settings };

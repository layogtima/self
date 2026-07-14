// formicarium — a living Messor barbarus colony behind glass, and a chemical
// interface for talking to it. Observe (zoom, inspect, decode the pheromone field)
// and emit semiochemicals of your own — a two-way conversation in chemistry.

import { COLS, ROWS, CELL, CH } from './config.js';
import { makeNest } from './nest.js';
import { makePheromones } from './pheromones.js';
import { makeColony } from './colony.js';
import { makeRenderer } from './render.js';
import { makeUI } from './ui.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;
function resize() {   // DPR-scaled backing store → crisp instrument text; math stays in logical px
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize); resize();

const nest = makeNest();
const pher = makePheromones();
const colony = makeColony(nest, pher);
const renderer = makeRenderer(ctx);
const ui = makeUI(ctx);

// camera fit to the tank (URL: ?zoom= &cx= &cy= to frame a shot)
const cam = { x: COLS / 2, y: ROWS / 2, zoom: Math.min(W / (COLS * CELL), H / (ROWS * CELL)) * 0.94 };
const fitZoom = cam.zoom;
{
  const p = new URLSearchParams(location.search);
  if (p.has('zoom')) cam.zoom = fitZoom * parseFloat(p.get('zoom'));
  if (p.has('cx')) cam.x = parseFloat(p.get('cx'));
  if (p.has('cy')) cam.y = parseFloat(p.get('cy'));
}

// ---- semiochemical codex (decode-to-learn) --------------------------------------
const params = new URLSearchParams(location.search);
const codex = {}; for (const ch of CH) codex[ch] = { fam: params.has('unlock') ? 1 : 0, unlocked: params.has('unlock') };
codex.QUEEN.readonly = true;
let armed = null, overlay = params.has('overlay') ? 'ALL' : null, selected = null, taskOverlay = params.has('tasks');
const mouse = { x: W / 2, y: H / 2 };

// ---- input ----------------------------------------------------------------------
const pxPer = () => CELL * cam.zoom;
const screenToWorld = (sx, sy) => [(sx - W / 2) / pxPer() + cam.x, (sy - H / 2) / pxPer() + cam.y];
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const [wx, wy] = screenToWorld(e.clientX, e.clientY);
  cam.zoom = Math.max(fitZoom * 0.8, Math.min(fitZoom * 12, cam.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  const [nx, ny] = screenToWorld(e.clientX, e.clientY);
  cam.x += wx - nx; cam.y += wy - ny;
}, { passive: false });

let dragging = false, emitting = false, moved = 0;
canvas.addEventListener('pointerdown', e => {
  const hit = ui.hitTest(e.clientX, e.clientY);
  if (hit && hit.kind === 'chip') {   // click a console chip to arm it (parity with 1–6)
    const cd = codex[hit.ch]; if (cd.unlocked && !cd.readonly) { armed = armed === hit.ch ? null : hit.ch; overlay = armed; }
    return;
  }
  moved = 0;
  if (armed) { emitting = true; const [wx, wy] = screenToWorld(e.clientX, e.clientY); ui.ripple(wx, wy, armed); emitAt(e.clientX, e.clientY); }
  else dragging = true;
});
addEventListener('pointermove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  if (dragging) { cam.x -= e.movementX / pxPer(); cam.y -= e.movementY / pxPer(); moved += Math.abs(e.movementX) + Math.abs(e.movementY); }
  else if (emitting) emitAt(e.clientX, e.clientY);
});
addEventListener('pointerup', e => {
  if (dragging && moved < 6 && !ui.hitTest(e.clientX, e.clientY)) {   // a click → select / deselect an ant
    const [wx, wy] = screenToWorld(e.clientX, e.clientY);
    selected = colony.antAt(wx, wy, 2.2 / cam.zoom * 1.4 + 1.2);
  }
  dragging = false; emitting = false;
});
addEventListener('keydown', e => {
  if (e.code === 'KeyP') overlay = overlay ? null : 'ALL';
  else if (e.code === 'KeyT') taskOverlay = !taskOverlay;
  else if (e.code === 'Escape' || e.code === 'Digit0') armed = null;
  else if (/^Digit[1-6]$/.test(e.code)) { const ch = CH[+e.code.slice(5) - 1]; if (ch && codex[ch].unlocked && !codex[ch].readonly) { armed = armed === ch ? null : ch; overlay = armed; } }
});

function emitAt(sx, sy) {
  if (!armed) return;
  const [wx, wy] = screenToWorld(sx, sy);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) pher.deposit(armed, wx + dx, wy + dy, 0.9);
}

// ---- decode-to-learn: studying an active channel fills the codex -----------------
function studyDecode(dt) {
  if (!overlay) return;
  for (const ch of CH) {
    if (codex[ch].unlocked) continue;
    let tot = 0; const fld = pher.field[ch];
    for (let i = 0; i < fld.length; i += 7) tot += fld[i];
    if (tot > 0.5) { codex[ch].fam = Math.min(1, codex[ch].fam + dt * 0.5); if (codex[ch].fam >= 1) codex[ch].unlocked = true; }
  }
}

// ---- headless-proof fast-forward (?ff=N sim steps before first draw) -------------
{
  const n = parseInt(new URLSearchParams(location.search).get('ff') || '0', 10);
  for (let i = 0; i < n; i++) { colony.update(1 / 30); pher.step(nest); }
  if (params.has('sel')) selected = colony.ants.find(a => a.task === 'forage' && a.carrying) || colony.ants.find(a => a.caste === 'major') || colony.ants[0];   // dev: preselect for headless
}

// ---- loop -----------------------------------------------------------------------
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  colony.update(dt); pher.step(nest); studyDecode(dt); ui.update(dt);
  const time = now / 1000;

  ctx.fillStyle = '#0c0a08'; ctx.fillRect(0, 0, W, H);
  renderer.draw(ctx, W, H, cam, nest, pher, colony, { selected, taskOverlay, time });
  const state = { colony, pher, codex, armed, overlay, selected, W, H, time, dt, cam, cursorWorld: screenToWorld(mouse.x, mouse.y) };
  ui.drawField(state);
  ui.drawHUD(state);
}
requestAnimationFrame(frame);

window.__form = { nest, pher, colony, cam, codex };

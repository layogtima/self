// SUBSTRATE · scene 01 — DIG
// Falling-sand cellular automata. The terrain is an array, not a mesh:
// carve it, dam it, let the rain argue with you. ~110k cells at 30Hz.

export const meta = { name: 'DIG', simHz: 30, unit: 'cells' };

const EMPTY = 0, ROCK = 1, SOIL = 2, WATER = 3;
const STEP = 1000 / 30;
const GH = 280;

let canvas, ctx, W = 0, H = 0;
let GW = 400, N = 0;
let grid, moved, noise, gy0; // cells, per-step move flags, texture, initial terrain height
let waterCount = 0, waterCap = 0, waterline = 0, lakeX = 0;
let img, buf32, off, offCtx, skyRow;
let running = false, inited = false, raf = 0, acc = 0, last = 0, frameNo = 0;
let fps = 0, frames = 0, fpsAt = 0;
let lastInput = -1e9;
let pointers = new Map(); // id -> {gx, gy, mode: 'dig'|'fill'}
let ghost = { t: 0, path: null, x: 0, y: 0, active: false };

const rnd = (a, b) => a + Math.random() * (b - a);

function terrainY(x) {
  return GH * 0.40 + GH * 0.13 * Math.sin(x * 0.013 + 1.3)
       + GH * 0.07 * Math.sin(x * 0.029 + 5.0)
       + GH * 0.03 * Math.sin(x * 0.061 + 2.2);
}

function buildWorld() {
  N = GW * GH;
  grid = new Uint8Array(N);
  moved = new Uint8Array(N);
  noise = new Uint8Array(N);
  gy0 = new Float32Array(GW);
  for (let i = 0; i < N; i++) noise[i] = Math.random() * 255;
  waterline = Math.round(GH * 0.52);
  waterCap = Math.round(N * 0.09);
  waterCount = 0;
  let deepest = 0;
  for (let x = 0; x < GW; x++) {
    const gy = terrainY(x); gy0[x] = gy;
    if (gy > gy0[deepest]) deepest = x;
    const rockAt = gy + GH * 0.22 + GH * 0.05 * Math.sin(x * 0.02 + 3);
    for (let y = 0; y < GH; y++) {
      const i = y * GW + x;
      if (y >= GH - 3 || x < 2 || x >= GW - 2) grid[i] = ROCK;
      else if (y >= rockAt) grid[i] = ROCK;
      else if (y >= gy) grid[i] = SOIL;
      else if (y >= waterline) { grid[i] = WATER; waterCount++; } // lakes fill the valleys
    }
  }
  lakeX = deepest;
}

function setCell(i, v) {
  if (grid[i] === WATER) waterCount--;
  if (v === WATER) waterCount++;
  grid[i] = v;
}

function carve(gx, gy, r) {
  const r2 = r * r;
  for (let y = Math.max(1, gy - r | 0); y <= Math.min(GH - 2, gy + r | 0); y++)
    for (let x = Math.max(2, gx - r | 0); x <= Math.min(GW - 3, gx + r | 0); x++) {
      const dx = x - gx, dy = y - gy;
      if (dx * dx + dy * dy > r2) continue;
      const i = y * GW + x;
      if (grid[i] === SOIL) setCell(i, EMPTY);
    }
}

function fill(gx, gy, r) {
  const r2 = r * r;
  for (let y = Math.max(1, gy - r | 0); y <= Math.min(GH - 2, gy + r | 0); y++)
    for (let x = Math.max(2, gx - r | 0); x <= Math.min(GW - 3, gx + r | 0); x++) {
      const dx = x - gx, dy = y - gy;
      if (dx * dx + dy * dy > r2) continue;
      const i = y * GW + x;
      if (grid[i] === EMPTY || grid[i] === WATER) setCell(i, SOIL);
    }
}

function applyPointer(p, gx, gy) {
  // stamp along the segment from the previous position so fast drags stay solid
  const dx = gx - p.gx, dy = gy - p.gy, d = Math.hypot(dx, dy), steps = Math.max(1, d / 2 | 0);
  for (let s = 1; s <= steps; s++) {
    const x = p.gx + dx * s / steps, y = p.gy + dy * s / steps;
    if (p.mode === 'fill') fill(x, y, 4); else carve(x, y, 6);
  }
  p.gx = gx; p.gy = gy;
}

function step() {
  frameNo++;
  moved.fill(0);
  // rain source at top
  for (let k = 0; k < 5; k++) {
    if (waterCount >= waterCap) break;
    const x = 2 + (Math.random() * (GW - 4) | 0), i = GW + x;
    if (grid[i] === EMPTY) setCell(i, WATER);
  }
  const ltr = (frameNo & 1) === 0;
  for (let y = GH - 2; y >= 1; y--) {
    const row = y * GW;
    for (let xi = 2; xi < GW - 2; xi++) {
      const x = ltr ? xi : GW - 1 - xi;
      const i = row + x, m = grid[i];
      if (m === EMPTY || m === ROCK || moved[i]) continue;
      const dn = i + GW;
      if (m === SOIL) {
        if (grid[dn] === EMPTY) { grid[dn] = SOIL; grid[i] = EMPTY; moved[dn] = 1; }
        else if (grid[dn] === WATER) { grid[dn] = SOIL; grid[i] = WATER; moved[dn] = 1; moved[i] = 1; } // soil sinks
        else if (Math.random() < 0.5) {
          const s = Math.random() < 0.5 ? 1 : -1;
          if (grid[dn + s] === EMPTY && grid[i + s] === EMPTY) { grid[dn + s] = SOIL; grid[i] = EMPTY; moved[dn + s] = 1; }
          else if (grid[dn - s] === EMPTY && grid[i - s] === EMPTY) { grid[dn - s] = SOIL; grid[i] = EMPTY; moved[dn - s] = 1; }
        }
      } else { // WATER
        if (grid[dn] === EMPTY) {
          // free fall covers two cells so rain reads as rain
          if (y < GH - 3 && grid[dn + GW] === EMPTY) { grid[dn + GW] = WATER; grid[i] = EMPTY; moved[dn + GW] = 1; }
          else { grid[dn] = WATER; grid[i] = EMPTY; moved[dn] = 1; }
          continue;
        }
        const s = ((x ^ y ^ frameNo) & 1) === 0 ? 1 : -1;
        if (grid[dn + s] === EMPTY) { grid[dn + s] = WATER; grid[i] = EMPTY; moved[dn + s] = 1; }
        else if (grid[dn - s] === EMPTY) { grid[dn - s] = WATER; grid[i] = EMPTY; moved[dn - s] = 1; }
        else if (grid[i + s] === EMPTY) { grid[i + s] = WATER; grid[i] = EMPTY; moved[i + s] = 1; }
        else if (grid[i - s] === EMPTY) { grid[i - s] = WATER; grid[i] = EMPTY; moved[i - s] = 1; }
        else if (grid[i - GW] === EMPTY && Math.random() < 0.001) setCell(i, EMPTY); // evaporation keeps the rain honest
      }
    }
  }
  stepGhost();
}

// ---- attract mode: a ghost cursor digs a zigzag canal out of the lake ----
function stepGhost() {
  const idle = performance.now() - lastInput > 4000 && pointers.size === 0;
  if (!idle) { ghost.active = false; ghost.path = null; return; }
  ghost.active = true;
  if (!ghost.path) {
    const pts = [], x0 = lakeX, dir = lakeX < GW / 2 ? 1 : -1;
    let y = Math.min(GH - 20, gy0[Math.max(0, Math.min(GW - 1, x0))] + 4);
    for (let k = 0; k <= 8; k++) {
      const x = x0 + dir * k * (GW * 0.08);
      if (x < 6 || x > GW - 6) break;
      pts.push({ x, y: Math.min(GH - 12, y + k * 3 + (k % 2 ? 8 : -4)) });
    }
    ghost.path = pts; ghost.t = 0;
  }
  ghost.t += 1 / (30 * 7); // ~7s per pass
  const pts = ghost.path, u = ghost.t * (pts.length - 1);
  if (ghost.t >= 1.25) { ghost.path = null; return; } // linger, then re-cut
  if (ghost.t < 1) {
    const k = Math.min(pts.length - 2, u | 0), f = u - k;
    ghost.x = pts[k].x + (pts[k + 1].x - pts[k].x) * f;
    ghost.y = pts[k].y + (pts[k + 1].y - pts[k].y) * f;
    carve(ghost.x, ghost.y, 5);
  }
}

function render() {
  const deepMax = GH * 0.6;
  for (let y = 0; y < GH; y++) {
    const row = y * GW, sky = skyRow[y];
    for (let x = 0; x < GW; x++) {
      const i = row + x, m = grid[i], sh = (noise[i] / 255 - 0.5);
      let r, g, b;
      if (m === EMPTY) { buf32[i] = sky; continue; }
      else if (m === SOIL) {
        const depth = Math.min(1, Math.max(0, (y - gy0[x]) / deepMax));
        r = 148 + sh * 26 - depth * 34; g = 99 + sh * 20 - depth * 26; b = 62 + sh * 14 - depth * 18;
      } else if (m === ROCK) {
        r = 92 + sh * 18; g = 76 + sh * 16; b = 68 + sh * 14;
      } else { // silt-brown water
        const surf = y > 0 && grid[i - GW] === EMPTY;
        r = (surf ? 152 : 112) + sh * 10; g = (surf ? 144 : 108) + sh * 10; b = (surf ? 118 : 88) + sh * 10;
      }
      buf32[i] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
  }
  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, W, H);
  if (ghost.active && ghost.path) {
    const sx = W / GW, sy = H / GH;
    ctx.strokeStyle = 'rgba(255,244,220,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ghost.x * sx, ghost.y * sy, 12, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,244,220,0.6)';
    ctx.beginPath(); ctx.arc(ghost.x * sx, ghost.y * sy, 2, 0, 7); ctx.fill();
  }
}

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  acc += Math.min(100, now - last); last = now;
  let n = 0;
  while (acc >= STEP && n++ < 3) { step(); acc -= STEP; }
  render();
  frames++;
  if (now - fpsAt >= 1000) { fps = Math.round(frames * 1000 / (now - fpsAt)); frames = 0; fpsAt = now; }
}

function toGrid(e) {
  const r = canvas.getBoundingClientRect();
  return { gx: (e.clientX - r.left) / r.width * GW, gy: (e.clientY - r.top) / r.height * GH };
}
function onDown(e) {
  lastInput = performance.now();
  const g = toGrid(e);
  // right-drag or a second finger deposits soil to dam; first contact digs
  const mode = (e.button === 2 || pointers.size >= 1) ? 'fill' : 'dig';
  const p = { gx: g.gx, gy: g.gy, mode };
  pointers.set(e.pointerId, p);
  canvas.setPointerCapture(e.pointerId);
  if (mode === 'fill') fill(g.gx, g.gy, 4); else carve(g.gx, g.gy, 6);
}
function onMove(e) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  lastInput = performance.now();
  const g = toGrid(e);
  applyPointer(p, g.gx, g.gy);
}
function onUp(e) { pointers.delete(e.pointerId); }

export function init(c) {
  if (inited) return;
  inited = true;
  canvas = c;
  ctx = canvas.getContext('2d');
  const aspect = Math.max(0.5, (canvas.clientWidth || 640) / (canvas.clientHeight || 448));
  GW = Math.max(160, Math.min(460, Math.round(GH * aspect)));
  buildWorld();
  off = document.createElement('canvas'); off.width = GW; off.height = GH;
  offCtx = off.getContext('2d');
  img = offCtx.createImageData(GW, GH);
  buf32 = new Uint32Array(img.data.buffer);
  skyRow = new Uint32Array(GH);
  for (let y = 0; y < GH; y++) {
    const t = y / GH;
    const r = 236 - t * 22, g = 206 - t * 40, b = 162 - t * 52; // warm dusk
    skyRow[y] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  resize();
}

export function resize() {
  if (!canvas) return;
  const d = Math.min(2, window.devicePixelRatio || 1);
  W = Math.max(2, Math.round(canvas.clientWidth * d));
  H = Math.max(2, Math.round(canvas.clientHeight * d));
  canvas.width = W; canvas.height = H;
}

export function start() {
  if (running) return;
  running = true;
  last = performance.now(); fpsAt = last; frames = 0; acc = 0;
  raf = requestAnimationFrame(frame);
}

export function stop() {
  running = false;
  cancelAnimationFrame(raf);
  pointers.clear();
}

export function stats() { return { fps, entities: N, simHz: meta.simHz }; }

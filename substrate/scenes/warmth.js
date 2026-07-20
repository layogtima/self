// SUBSTRATE · scene 03 — WARMTH
// One diffusion field is simultaneously the renderer, the stealth model,
// and the puzzle. 96×160 cells, ironbow LUT, scanline + vignette post-pass.

export const meta = { name: 'WARMTH', simHz: 30, unit: 'cells' };

const GW = 160, GH = 96, N = GW * GH;
const STEP = 1000 / 30;
const K = [0.16, 0.55, 0.015]; // conductivity: stone, copper, wall
const COOL = 0.992;

let canvas, ctx, W = 0, H = 0;
let heat, heat2, mat;
let lut, img, buf32, off, offCtx, post, postCtx;
let running = false, inited = false, raf = 0, acc = 0, last = 0, simT = 0;
let fps = 0, frames = 0, fpsAt = 0;
let lastInput = -1e9;
let touch = null; // live pointer in grid coords
let guard = { y: 0.25, dir: 1 };

function buildWorld() {
  heat = new Float32Array(N);
  heat2 = new Float32Array(N);
  mat = new Uint8Array(N); // 0 stone, 1 copper, 2 wall
  // one copper strip, L-shaped: along then up — touch the pad, watch heat race
  const cy = Math.round(GH * 0.64);
  for (let x = Math.round(GW * 0.10); x <= Math.round(GW * 0.58); x++)
    for (let t = 0; t < 2; t++) mat[(cy + t) * GW + x] = 1;
  const cx = Math.round(GW * 0.58);
  for (let y = Math.round(GH * 0.22); y <= cy; y++)
    for (let t = 0; t < 2; t++) mat[y * GW + cx + t] = 1;
  // one thin wall; the guard smear patrols behind it
  const wx = Math.round(GW * 0.76);
  for (let y = 0; y < Math.round(GH * 0.74); y++)
    for (let t = 0; t < 2; t++) mat[y * GW + wx + t] = 2;
}

function buildLut() {
  const stops = [
    [0.00, 2, 0, 12], [0.14, 34, 4, 85], [0.35, 138, 14, 118],
    [0.55, 219, 63, 50], [0.75, 252, 150, 10], [0.90, 255, 236, 105], [1, 255, 255, 255],
  ];
  lut = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0], b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++)
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    const f = (t - a[0]) / (b[0] - a[0] || 1);
    const r = a[1] + (b[1] - a[1]) * f, g = a[2] + (b[2] - a[2]) * f, bl = a[3] + (b[3] - a[3]) * f;
    lut[i] = (255 << 24) | (bl << 16) | (g << 8) | r;
  }
}

function inject(gx, gy, radius, amp) {
  const r2 = radius * radius;
  const x0 = Math.max(1, gx - radius | 0), x1 = Math.min(GW - 2, gx + radius | 0);
  const y0 = Math.max(1, gy - radius | 0), y1 = Math.min(GH - 2, gy + radius | 0);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x - gx, dy = y - gy, d2 = dx * dx + dy * dy;
    if (d2 > r2) continue;
    const i = y * GW + x, w = amp * (1 - d2 / r2);
    heat[i] += (1.35 - heat[i]) * w;
  }
}

function step() {
  simT += STEP / 1000;
  // sources: pointer, or ghost blob when idle
  if (touch) inject(touch.gx, touch.gy, 5, 0.55);
  else if (performance.now() - lastInput > 4000) {
    const gx = GW * (0.36 + 0.26 * Math.sin(simT * 0.33)),
          gy = GH * (0.5 + 0.32 * Math.sin(simT * 0.47 + 1.7));
    inject(gx, gy, 4, 0.35);
  }
  // guard smear patrols behind the wall, always
  guard.y += guard.dir * 0.004;
  if (guard.y > 0.62 || guard.y < 0.1) guard.dir *= -1;
  inject(GW * 0.88, GH * guard.y, 3.5, 0.45);
  // diffuse: per-cell conductivity, then cool toward ambient
  for (let y = 1; y < GH - 1; y++) {
    const row = y * GW;
    for (let x = 1; x < GW - 1; x++) {
      const i = row + x, h = heat[i];
      const lap = heat[i - 1] + heat[i + 1] + heat[i - GW] + heat[i + GW] - 4 * h;
      heat2[i] = (h + K[mat[i]] * 0.5 * lap) * COOL;
    }
  }
  const t = heat; heat = heat2; heat2 = t;
}

function ghostCursorPos() {
  return {
    x: (GW * (0.36 + 0.26 * Math.sin(simT * 0.33))) / GW * W,
    y: (GH * (0.5 + 0.32 * Math.sin(simT * 0.47 + 1.7))) / GH * H,
  };
}

function render() {
  for (let i = 0; i < N; i++) {
    let t = heat[i];
    buf32[i] = lut[(t <= 0 ? 0 : t >= 1 ? 255 : (t * 255) | 0)];
  }
  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, W, H);
  // faint material hints so the copper pad invites a touch
  const sx = W / GW, sy = H / GH;
  ctx.strokeStyle = 'rgba(255,190,90,0.14)';
  ctx.lineWidth = 2 * sy;
  ctx.beginPath();
  ctx.moveTo(GW * 0.10 * sx, GH * 0.645 * sy);
  ctx.lineTo(GW * 0.585 * sx, GH * 0.645 * sy);
  ctx.lineTo(GW * 0.585 * sx, GH * 0.22 * sy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(GW * 0.10 * sx, GH * 0.645 * sy, 5 * sy * 0.9, 0, 7);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(GW * 0.76 * sx, 0, 2 * sx, GH * 0.74 * sy);
  // ghost cursor ring while attract mode is running
  if (!touch && performance.now() - lastInput > 4000) {
    const g = ghostCursorPos();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(g.x, g.y, 2, 0, 7); ctx.fill();
  }
  ctx.drawImage(post, 0, 0);
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
function onDown(e) { lastInput = performance.now(); touch = toGrid(e); canvas.setPointerCapture(e.pointerId); }
function onMove(e) { if (touch) { lastInput = performance.now(); touch = toGrid(e); } }
function onUp() { touch = null; }

export function init(c) {
  if (inited) return;
  inited = true;
  canvas = c;
  ctx = canvas.getContext('2d');
  buildWorld();
  buildLut();
  off = document.createElement('canvas'); off.width = GW; off.height = GH;
  offCtx = off.getContext('2d');
  img = offCtx.createImageData(GW, GH);
  buf32 = new Uint32Array(img.data.buffer);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  resize();
}

export function resize() {
  if (!canvas) return;
  const d = Math.min(2, window.devicePixelRatio || 1);
  W = Math.max(2, Math.round(canvas.clientWidth * d));
  H = Math.max(2, Math.round(canvas.clientHeight * d));
  canvas.width = W; canvas.height = H;
  // rebuild post-pass layer: scanlines + vignette
  post = document.createElement('canvas'); post.width = W; post.height = H;
  postCtx = post.getContext('2d');
  postCtx.fillStyle = 'rgba(0,0,0,0.13)';
  for (let y = 0; y < H; y += 3) postCtx.fillRect(0, y, W, 1);
  const g = postCtx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  postCtx.fillStyle = g;
  postCtx.fillRect(0, 0, W, H);
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
  touch = null;
}

export function stats() { return { fps, entities: N, simHz: meta.simHz }; }

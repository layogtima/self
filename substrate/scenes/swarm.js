// SUBSTRATE · scene 04 — SWARM
// Physarum-style agents: sense the trail field, turn, move, deposit;
// the field diffuses and decays. You never command them — you tempt them.
// 100k agents minimum on desktop; auto-benchmark scales the count and the
// HUD shows the real number, whatever it lands on.

export const meta = { name: 'SWARM', simHz: 60, unit: 'agents' };

const FW = 320;
let FH = 180, FN = 0;
const TRIG = 1024, T2 = TRIG / (Math.PI * 2);
const SIN = new Float32Array(TRIG), COS = new Float32Array(TRIG);
for (let i = 0; i < TRIG; i++) { SIN[i] = Math.sin(i * 2 * Math.PI / TRIG); COS[i] = Math.cos(i * 2 * Math.PI / TRIG); }

const SPEED = 1.15, SDIST = 8, SANG = 0.45, TURN = 0.32, JITTER = 0.14, DEPOSIT = 0.85, DECAY = 0.94;
let norm = 6; // adaptive exposure: track the field's running max so trails never blow out

let canvas, ctx, W = 0, H = 0;
let field, tmp, lut, img, buf32, off, offCtx;
let ax, ay, aa, capacity = 0, count = 0, minCount = 0, maxCount = 0;
let running = false, inited = false, raf = 0;
let fps = 0, frames = 0, fpsAt = 0, last = 0, emaMs = 16, benchTick = 0;
let lastInput = -1e9;
let attract = null;            // live pointer, field coords
let foods = [];                // {fx, fy, born, ghost}
let lastTap = { t: -1e9, x: 0, y: 0 };
let ghostHop = 0, ghostCorner = 3;

function buildLut() {
  const stops = [
    [0.00, 3, 5, 12], [0.18, 4, 44, 62], [0.42, 8, 132, 158],
    [0.62, 60, 220, 235], [0.80, 245, 208, 96], [1.00, 255, 252, 235],
  ];
  lut = new Uint32Array(1024);
  for (let i = 0; i < 1024; i++) {
    const t = i / 1023;
    let a = stops[0], b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++)
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    const f = (t - a[0]) / (b[0] - a[0] || 1);
    const r = a[1] + (b[1] - a[1]) * f, g = a[2] + (b[2] - a[2]) * f, bl = a[3] + (b[3] - a[3]) * f;
    lut[i] = (255 << 24) | (bl << 16) | (g << 8) | r;
  }
}

function sample(x, y) {
  let xi = x | 0, yi = y | 0;
  if (xi < 0) xi += FW; else if (xi >= FW) xi -= FW;
  if (yi < 0) yi += FH; else if (yi >= FH) yi -= FH;
  return field[yi * FW + xi];
}

function deposit(fx, fy, r, amt) {
  const r2 = r * r;
  for (let y = fy - r | 0; y <= fy + r; y++) for (let x = fx - r | 0; x <= fx + r; x++) {
    const dx = x - fx, dy = y - fy, d2 = dx * dx + dy * dy;
    if (d2 > r2) continue;
    let xi = ((x % FW) + FW) % FW, yi = ((y % FH) + FH) % FH;
    field[yi * FW + xi] += amt * (1 - d2 / r2);
  }
}

function step() {
  const now = performance.now();
  // attractants: live pointer, food nodes, ghost nodes when idle
  if (attract) deposit(attract.fx, attract.fy, 5, 3.2);
  foods = foods.filter(f => f.ghost || now - f.born < 20000);
  const idle = now - lastInput > 4000 && !attract;
  if (idle && !foods.some(f => !f.ghost)) {
    if (!foods.some(f => f.ghost)) {
      foods.push({ fx: FW * 0.14, fy: FH * 0.18, born: now, ghost: true });
      foods.push({ fx: FW * 0.86, fy: FH * 0.82, born: now, ghost: true });
      ghostHop = now + 9000;
    } else if (now > ghostHop) { // reroute: one node hops to another corner
      const corners = [[0.86, 0.18], [0.14, 0.82], [0.86, 0.82], [0.5, 0.5], [0.14, 0.18]];
      ghostCorner = (ghostCorner + 1) % corners.length;
      const g = foods.filter(f => f.ghost)[1] || foods.filter(f => f.ghost)[0];
      if (g) { g.fx = FW * corners[ghostCorner][0]; g.fy = FH * corners[ghostCorner][1]; }
      ghostHop = now + 9000;
    }
  } else foods = foods.filter(f => !f.ghost);
  for (const f of foods) deposit(f.fx, f.fy, 4, 2.6);
  // agents: sense → turn → move → deposit
  const sd = SDIST, sp = SPEED;
  for (let i = 0; i < count; i++) {
    let a = aa[i], x = ax[i], y = ay[i];
    const ia = ((a * T2) | 0) & (TRIG - 1);
    const il = (((a - SANG) * T2) | 0) & (TRIG - 1);
    const ir = (((a + SANG) * T2) | 0) & (TRIG - 1);
    const f = sample(x + COS[ia] * sd, y + SIN[ia] * sd);
    const l = sample(x + COS[il] * sd, y + SIN[il] * sd);
    const r = sample(x + COS[ir] * sd, y + SIN[ir] * sd);
    if (f > l && f > r) { /* hold course */ }
    else if (f < l && f < r) a += (Math.random() < 0.5 ? -TURN : TURN);
    else if (l > r) a -= TURN; else a += TURN;
    a += (Math.random() - 0.5) * JITTER;
    const im = ((a * T2) | 0) & (TRIG - 1);
    x += COS[im] * sp; y += SIN[im] * sp;
    if (x < 0) x += FW; else if (x >= FW) x -= FW;
    if (y < 0) y += FH; else if (y >= FH) y -= FH;
    aa[i] = a; ax[i] = x; ay[i] = y;
    field[(y | 0) * FW + (x | 0)] += DEPOSIT;
  }
  // diffuse (separable box blur) + decay
  for (let y = 0; y < FH; y++) {
    const row = y * FW;
    tmp[row] = (field[row] * 2 + field[row + 1]) / 3;
    for (let x = 1; x < FW - 1; x++) {
      const i = row + x;
      tmp[i] = (field[i - 1] + field[i] + field[i + 1]) / 3;
    }
    tmp[row + FW - 1] = (field[row + FW - 2] + field[row + FW - 1] * 2) / 3;
  }
  for (let x = 0; x < FW; x++) {
    field[x] = (tmp[x] * 2 + tmp[x + FW]) / 3 * DECAY;
    for (let y = 1; y < FH - 1; y++) {
      const i = y * FW + x;
      field[i] = (tmp[i - FW] + tmp[i] + tmp[i + FW]) / 3 * DECAY;
    }
    const iL = (FH - 1) * FW + x;
    field[iL] = (tmp[iL - FW] + tmp[iL] * 2) / 3 * DECAY;
  }
}

function render() {
  const scale = 950 / norm;
  let mx = 0;
  for (let i = 0; i < FN; i++) {
    const f = field[i];
    if (f > mx) mx = f;
    const v = f * scale;
    buf32[i] = lut[v >= 1023 ? 1023 : v | 0];
  }
  norm += (Math.max(0.5, mx) - norm) * 0.04;
  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, W, H);
  // food rings
  const sx = W / FW, sy = H / FH;
  for (const f of foods) {
    ctx.strokeStyle = f.ghost ? 'rgba(120,230,240,0.35)' : 'rgba(245,208,96,0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash(f.ghost ? [4, 4] : []);
    ctx.beginPath(); ctx.arc(f.fx * sx, f.fy * sy, 12, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(245,208,96,0.9)';
    ctx.beginPath(); ctx.arc(f.fx * sx, f.fy * sy, 2, 0, 7); ctx.fill();
  }
}

function bench(dt) {
  emaMs = emaMs * 0.95 + dt * 0.05;
  if (++benchTick % 90 !== 0) return;
  if (emaMs > 19 && count > minCount) count = Math.max(minCount, count * 0.75 | 0);
  else if (emaMs < 11.5 && count < maxCount) count = Math.min(maxCount, count * 1.2 | 0);
}

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  const dt = Math.min(100, now - last); last = now;
  step();
  render();
  bench(dt);
  frames++;
  if (now - fpsAt >= 1000) { fps = Math.round(frames * 1000 / (now - fpsAt)); frames = 0; fpsAt = now; }
}

function toField(e) {
  const r = canvas.getBoundingClientRect();
  return { fx: (e.clientX - r.left) / r.width * FW, fy: (e.clientY - r.top) / r.height * FH };
}
function onDown(e) {
  lastInput = performance.now();
  const p = toField(e), now = performance.now();
  const r = canvas.getBoundingClientRect();
  const cx = e.clientX - r.left, cy = e.clientY - r.top;
  if (now - lastTap.t < 350 && Math.hypot(cx - lastTap.x, cy - lastTap.y) < 40) {
    foods.push({ fx: p.fx, fy: p.fy, born: now, ghost: false }); // double-tap drops food
    if (foods.filter(f => !f.ghost).length > 6) foods.splice(foods.findIndex(f => !f.ghost), 1);
    lastTap.t = -1e9;
  } else { lastTap = { t: now, x: cx, y: cy }; }
  attract = p;
  canvas.setPointerCapture(e.pointerId);
}
function onMove(e) { if (attract) { lastInput = performance.now(); attract = toField(e); } }
function onUp() { attract = null; }

export function init(c) {
  if (inited) return;
  inited = true;
  canvas = c;
  ctx = canvas.getContext('2d');
  const aspect = Math.max(0.5, (canvas.clientWidth || 640) / (canvas.clientHeight || 448));
  FH = Math.max(120, Math.min(320, Math.round(FW / aspect)));
  FN = FW * FH;
  field = new Float32Array(FN);
  tmp = new Float32Array(FN);
  buildLut();
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (coarse) { count = 60000; minCount = 24000; maxCount = 100000; }
  else { count = 100000; minCount = 100000; maxCount = 200000; }
  capacity = maxCount;
  ax = new Float32Array(capacity); ay = new Float32Array(capacity); aa = new Float32Array(capacity);
  for (let i = 0; i < capacity; i++) {
    ax[i] = Math.random() * FW; ay[i] = Math.random() * FH; aa[i] = Math.random() * Math.PI * 2;
  }
  off = document.createElement('canvas'); off.width = FW; off.height = FH;
  offCtx = off.getContext('2d');
  img = offCtx.createImageData(FW, FH);
  buf32 = new Uint32Array(img.data.buffer);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  resize();
}

export function resize() {
  if (!canvas) return;
  const d = Math.min(1.5, window.devicePixelRatio || 1); // upscale is smoothed anyway
  W = Math.max(2, Math.round(canvas.clientWidth * d));
  H = Math.max(2, Math.round(canvas.clientHeight * d));
  canvas.width = W; canvas.height = H;
}

export function start() {
  if (running) return;
  running = true;
  last = performance.now(); fpsAt = last; frames = 0;
  raf = requestAnimationFrame(frame);
}

export function stop() {
  running = false;
  cancelAnimationFrame(raf);
  attract = null;
}

export function stats() { return { fps, entities: count, simHz: meta.simHz }; }

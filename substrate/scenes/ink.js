// SUBSTRATE · scene 02 — INK
// Draw a line; it is immediately a solid object. Balls rain, bounce, roll.
// Verlet circles vs. hand-drawn segments. Sketches decay after ~15s.

export const meta = { name: 'INK', simHz: 120, unit: 'bodies' };

const NB = 200;
const SUB = 2;               // physics substeps per frame
const LIFE = 15000;          // stroke lifetime, ms
const STEP = 1000 / 60;

let canvas, ctx, W = 0, H = 0, d = 1;
let bx, by, bpx, bpy, br;    // ball state (verlet)
let strokes = [];            // {pts:[{x,y}], born, ghost}
let bucket = null;           // {x0,x1,yTop,yBot, segs:[...]}
let score = 0, scoreFlash = 0;
let running = false, inited = false, raf = 0, last = 0, acc = 0;
let fps = 0, frames = 0, fpsAt = 0;
let lastInput = -1e9;
let drawing = null;          // active stroke being drawn by the user
let ghost = { t: -1, stroke: null, path: null, x: 0, y: 0, nextAt: 0 };
let hashGw = 1, hashGh = 1, hashHead = new Int32Array(1), hashNext = new Int32Array(NB);

function spawnBall(i, anywhere) {
  bx[i] = (0.05 + Math.random() * 0.9) * W;
  by[i] = anywhere ? -Math.random() * H : -Math.random() * 60 * d;
  bpx[i] = bx[i] - (Math.random() - 0.5) * 1.2 * d;
  bpy[i] = by[i];
  br[i] = (3.4 + Math.random() * 2.4) * d;
}

function buildBucket() {
  const x0 = W - 130 * d, x1 = W - 44 * d, yB = H - 22 * d, yT = yB - 74 * d;
  bucket = {
    x0, x1, yT, yB,
    segs: [
      [x0, yT, x0, yB], [x0, yB, x1, yB], [x1, yB, x1, yT],
    ],
  };
}

function segCollide(i, ax, ay, cx, cy, halfW) {
  const px = bx[i], py = by[i];
  const dx = cx - ax, dy = cy - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + dx * t, qy = ay + dy * t;
  let nx = px - qx, ny = py - qy;
  const dist2 = nx * nx + ny * ny, minD = br[i] + halfW;
  if (dist2 >= minD * minD || dist2 === 0) return;
  const dist = Math.sqrt(dist2); nx /= dist; ny /= dist;
  const pen = minD - dist;
  bx[i] += nx * pen; by[i] += ny * pen;
  // verlet response: kill normal velocity (restitution), keep some tangent (friction)
  const vx = bx[i] - bpx[i], vy = by[i] - bpy[i];
  const vn = vx * nx + vy * ny;
  const tx = vx - vn * nx, ty = vy - vn * ny;
  bpx[i] = bx[i] - (tx * 0.985 - vn * 0.35 * nx);
  bpy[i] = by[i] - (ty * 0.985 - vn * 0.35 * ny);
}

function physics(dt) {
  const g = 1500 * d * dt * dt;
  for (let i = 0; i < NB; i++) {
    const nx = bx[i] + (bx[i] - bpx[i]) * 0.999, ny = by[i] + (by[i] - bpy[i]) * 0.999 + g;
    bpx[i] = bx[i]; bpy[i] = by[i];
    bx[i] = nx; by[i] = ny;
    if (by[i] > H + 60 * d || bx[i] < -60 * d || bx[i] > W + 60 * d) spawnBall(i, false);
  }
  // ball vs strokes + bucket
  const halfW = 2.5 * d;
  for (let i = 0; i < NB; i++) {
    for (const s of strokes) {
      const p = s.pts;
      for (let k = 0; k < p.length - 1; k++) {
        // cheap reject before the segment test
        if (Math.abs(p[k].x - bx[i]) > 60 * d && Math.abs(p[k + 1].x - bx[i]) > 60 * d) continue;
        segCollide(i, p[k].x, p[k].y, p[k + 1].x, p[k + 1].y, halfW);
      }
    }
    for (const s of bucket.segs) segCollide(i, s[0], s[1], s[2], s[3], halfW);
  }
  // ball vs ball, spatial hash (buffers preallocated in resize)
  const cs = 14 * d, gw = hashGw, gh = hashGh;
  const head = hashHead.fill(-1), next = hashNext;
  for (let i = 0; i < NB; i++) {
    const cx = Math.max(0, Math.min(gw - 1, bx[i] / cs | 0));
    const cy = Math.max(0, Math.min(gh - 1, by[i] / cs | 0));
    const c = cy * gw + cx;
    next[i] = head[c]; head[c] = i;
  }
  for (let i = 0; i < NB; i++) {
    const cx = Math.max(0, Math.min(gw - 1, bx[i] / cs | 0));
    const cy = Math.max(0, Math.min(gh - 1, by[i] / cs | 0));
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const nx2 = cx + ox, ny2 = cy + oy;
      if (nx2 < 0 || ny2 < 0 || nx2 >= gw || ny2 >= gh) continue;
      for (let j = head[ny2 * gw + nx2]; j >= 0; j = next[j]) {
        if (j <= i) continue;
        let dx = bx[j] - bx[i], dy = by[j] - by[i];
        const rr = br[i] + br[j], d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr || d2 === 0) continue;
        const dist = Math.sqrt(d2), pen = (rr - dist) / 2;
        dx /= dist; dy /= dist;
        bx[i] -= dx * pen; by[i] -= dy * pen;
        bx[j] += dx * pen; by[j] += dy * pen;
      }
    }
  }
  // the bucket quietly counts
  for (let i = 0; i < NB; i++) {
    if (bx[i] > bucket.x0 + 4 * d && bx[i] < bucket.x1 - 4 * d &&
        by[i] > bucket.yT + 20 * d && by[i] < bucket.yB - 4 * d &&
        Math.abs(by[i] - bpy[i]) < 0.6 * d) {
      score++; scoreFlash = performance.now(); spawnBall(i, false);
    }
  }
}

// ---- attract: a ghost pen draws a ramp chain into the bucket ----
function stepGhost(now) {
  const idle = now - lastInput > 4000 && !drawing;
  if (!idle) { ghost.t = -1; ghost.stroke = null; return; }
  if (ghost.t < 0) {
    if (now < ghost.nextAt) return;
    const variants = [
      [[0.10, 0.18], [0.48, 0.38]],
      [[0.30, 0.52], [0.72, 0.68]],
      [[0.55, 0.30], [0.86, 0.52]],
    ];
    ghost.path = variants[(Math.random() * variants.length) | 0]
      .map(p => ({ x: p[0] * W + rnds(30), y: p[1] * H + rnds(20) }));
    ghost.stroke = { pts: [], born: now, ghost: true };
    strokes.push(ghost.stroke);
    ghost.t = 0;
  }
  ghost.t += 1 / 80; // ~1.3s per ramp
  const [a, b] = ghost.path, t = Math.min(1, ghost.t);
  ghost.x = a.x + (b.x - a.x) * t;
  ghost.y = a.y + (b.y - a.y) * t + Math.sin(t * 9) * 4 * d; // a little hand wobble
  const p = ghost.stroke.pts, lp = p[p.length - 1];
  if (!lp || Math.hypot(ghost.x - lp.x, ghost.y - lp.y) > 5 * d) p.push({ x: ghost.x, y: ghost.y });
  if (ghost.t >= 1) { ghost.t = -1; ghost.stroke = null; ghost.nextAt = now + 2500; }
}
function rnds(m) { return (Math.random() - 0.5) * 2 * m * d; }

function render(now) {
  ctx.fillStyle = '#0d1526';
  ctx.fillRect(0, 0, W, H);
  // blueprint grid
  ctx.strokeStyle = 'rgba(140,170,220,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const gs = 42 * d;
  for (let x = gs; x < W; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = gs; y < H; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  // strokes (chalk), fading in their final seconds
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of strokes) {
    const age = now - s.born, rem = LIFE - age;
    const a = rem < 4000 ? Math.max(0, rem / 4000) : 1;
    ctx.strokeStyle = `rgba(238,244,255,${0.92 * a})`;
    ctx.lineWidth = 5 * d;
    ctx.beginPath();
    const p = s.pts;
    if (p.length === 1) { ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[0].x + 0.1, p[0].y); }
    else { ctx.moveTo(p[0].x, p[0].y); for (let k = 1; k < p.length; k++) ctx.lineTo(p[k].x, p[k].y); }
    ctx.stroke();
  }
  // bucket
  ctx.strokeStyle = 'rgba(238,244,255,0.85)';
  ctx.lineWidth = 5 * d;
  ctx.beginPath();
  ctx.moveTo(bucket.x0, bucket.yT); ctx.lineTo(bucket.x0, bucket.yB);
  ctx.lineTo(bucket.x1, bucket.yB); ctx.lineTo(bucket.x1, bucket.yT);
  ctx.stroke();
  // balls, amber
  ctx.fillStyle = '#f2a93b';
  ctx.beginPath();
  for (let i = 0; i < NB; i++) {
    ctx.moveTo(bx[i] + br[i], by[i]);
    ctx.arc(bx[i], by[i], br[i], 0, 7);
  }
  ctx.fill();
  // score appears only if you score
  if (score > 0) {
    const flash = Math.max(0, 1 - (now - scoreFlash) / 400);
    ctx.font = `${(13 + 6 * flash) * d}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(242,169,59,${0.75 + 0.25 * flash})`;
    ctx.fillText(String(score), (bucket.x0 + bucket.x1) / 2, bucket.yT - 10 * d);
  }
  // ghost pen
  if (ghost.stroke) {
    ctx.strokeStyle = 'rgba(238,244,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ghost.x, ghost.y, 10 * d, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(238,244,255,0.8)';
    ctx.beginPath(); ctx.arc(ghost.x, ghost.y, 1.6 * d, 0, 7); ctx.fill();
  }
}

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  acc += Math.min(100, now - last); last = now;
  let n = 0;
  while (acc >= STEP && n++ < 2) {
    strokes = strokes.filter(s => now - s.born < LIFE || s === (drawing && drawing.stroke));
    stepGhost(now);
    for (let s = 0; s < SUB; s++) physics(1 / (60 * SUB));
    acc -= STEP;
  }
  render(now);
  frames++;
  if (now - fpsAt >= 1000) { fps = Math.round(frames * 1000 / (now - fpsAt)); frames = 0; fpsAt = now; }
}

function toPx(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}
function onDown(e) {
  lastInput = performance.now();
  const p = toPx(e);
  drawing = { id: e.pointerId, stroke: { pts: [p], born: performance.now() } };
  strokes.push(drawing.stroke);
  canvas.setPointerCapture(e.pointerId);
}
function onMove(e) {
  if (!drawing || e.pointerId !== drawing.id) return;
  lastInput = performance.now();
  const p = toPx(e), pts = drawing.stroke.pts, lp = pts[pts.length - 1];
  if (Math.hypot(p.x - lp.x, p.y - lp.y) > 5 * d) {
    pts.push(p);
    drawing.stroke.born = performance.now(); // a line lives 15s from its last touch
  }
}
function onUp(e) { if (drawing && e.pointerId === drawing.id) drawing = null; }

export function init(c) {
  if (inited) return;
  inited = true;
  canvas = c;
  ctx = canvas.getContext('2d');
  bx = new Float32Array(NB); by = new Float32Array(NB);
  bpx = new Float32Array(NB); bpy = new Float32Array(NB); br = new Float32Array(NB);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  resize();
  for (let i = 0; i < NB; i++) spawnBall(i, true);
}

export function resize() {
  if (!canvas) return;
  d = Math.min(2, window.devicePixelRatio || 1);
  W = Math.max(2, Math.round(canvas.clientWidth * d));
  H = Math.max(2, Math.round(canvas.clientHeight * d));
  canvas.width = W; canvas.height = H;
  const cs = 14 * d;
  hashGw = Math.ceil(W / cs) + 1; hashGh = Math.ceil(H / cs) + 2;
  hashHead = new Int32Array(hashGw * hashGh);
  buildBucket();
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
  drawing = null;
}

export function stats() { return { fps, entities: NB + strokes.length, simHz: meta.simHz }; }

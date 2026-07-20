// SUBSTRATE · scene 06 — WORDS
// Every letter is a rigid body. Canvas renders text natively; 3D engines
// fear it. Type to drop words — mass = font weight. Mind the anvil.

export const meta = { name: 'WORDS', simHz: 120, unit: 'bodies' };

const CAP = 84;
const FONT = 'Georgia, "Times New Roman", serif';
const FINALE = 'EVERYTHING YOU JUST TOUCHED IS A TEXT FILE.';

let canvas, ctx, W = 0, H = 0, d = 1;
let meas; // offscreen ctx for measureText
let bodies = [];
let running = false, inited = false, raf = 0, last = 0, acc = 0;
let fps = 0, frames = 0, fpsAt = 0;
let lastInput = -1e9, awake = false, interacted = false;
let dragged = null; // {b, id}
let buffer = '';
let nextAnvil = Infinity;
let attract = { phase: 'off', until: 0 };
let finaleDone = false, finaleHold = false;
let kbd = null;

const now = () => performance.now();

function makeBody(ch, x, y, size, weight, color) {
  meas.font = `${weight} ${size}px ${FONT}`;
  const w = Math.max(size * 0.3, meas.measureText(ch).width);
  const h = size * 0.74;
  const mass = (weight / 400) * (w * h) / (30 * d * 30 * d) * (ch.length > 1 ? 2.2 : 1);
  const I = mass * (w * w + h * h) / 12;
  const nc = Math.min(3, Math.max(1, Math.round(w / h)));
  const offs = [];
  if (nc === 1) offs.push(0);
  else for (let i = 0; i < nc; i++) offs.push(-(w / 2 - h / 2) + (w - h) * i / (nc - 1));
  return {
    ch, size, weight, color, w, h, mass, inv: 1 / mass, I, invI: 1 / I,
    x, y, a: 0, vx: 0, vy: 0, va: 0,
    r: h * 0.54, offs, sleep: 0, sleeping: false, kin: null, born: now(),
  };
}

function wakeAll() { for (const b of bodies) { b.sleeping = false; b.sleep = 0; } }

function layoutWord(word, cx, y, size, weight, color, asOne) {
  const out = [];
  if (asOne) { out.push(makeBody(word, cx, y, size, weight, color)); return out; }
  meas.font = `${weight} ${size}px ${FONT}`;
  const widths = [...word].map(c => Math.max(size * 0.3, meas.measureText(c).width));
  const total = widths.reduce((a, b) => a + b, 0) + (word.length - 1) * size * 0.06;
  let x = cx - total / 2;
  for (let i = 0; i < word.length; i++) {
    if (word[i] !== ' ') out.push(makeBody(word[i], x + widths[i] / 2, y, size, weight, color));
    x += widths[i] + size * 0.06;
  }
  return out;
}

function initialPhrase() {
  const size = Math.min(64 * d, W / 11);
  bodies = [
    ...layoutWord('TYPOGRAPHY', W / 2, H * 0.38, size, 700, '#191512'),
    ...layoutWord('WITH MASS', W / 2, H * 0.52, size, 400, '#191512'),
  ];
  for (const b of bodies) b.sleeping = true;
}

function dropWord(word) {
  word = word.trim().toUpperCase();
  if (!word) return;
  interacted = true;
  const weights = [300, 400, 600, 700, 900];
  const weight = weights[(Math.random() * weights.length) | 0];
  const size = Math.max(26 * d, Math.min(56 * d, W / (word.length + 4)));
  const cx = W * (0.25 + Math.random() * 0.5);
  const fresh = layoutWord(word, cx, -size, size, weight, '#191512');
  for (const b of fresh) { b.vy = 60 * d; b.va = (Math.random() - 0.5) * 2; }
  admit(fresh);
}

function dropAnvil() {
  const b = makeBody('GRAVITY', W * (0.3 + Math.random() * 0.4), -60 * d, Math.min(76 * d, W / 8), 900, '#c22b1e');
  b.mass *= 4; b.inv = 1 / b.mass; b.I *= 4; b.invI = 1 / b.I;
  b.vy = 400 * d;
  admit([b]);
}

function admit(fresh) {
  bodies.push(...fresh);
  while (bodies.length > CAP) {
    const i = bodies.findIndex(b => (!dragged || b !== dragged.b) && !b.kin);
    if (i < 0) break;
    bodies.splice(i, 1);
  }
}

// ---- physics ----
function contact(bi, bj, px, py, nx, ny, pen) {
  // bj === null → static world
  const raX = px - bi.x, raY = py - bi.y;
  let rbX = 0, rbY = 0, invM = bi.inv, invSum;
  let rvx = -(bi.vx - bi.va * raY), rvy = -(bi.vy + bi.va * raX);
  if (bj) {
    rbX = px - bj.x; rbY = py - bj.y;
    rvx += bj.vx - bj.va * rbY; rvy += bj.vy + bj.va * rbX;
  }
  const vn = rvx * nx + rvy * ny; // velocity of j relative to i along n (n points i→j)
  const raN = raX * ny - raY * nx, rbN = rbX * ny - rbY * nx;
  invSum = bi.inv + raN * raN * bi.invI + (bj ? bj.inv + rbN * rbN * bj.invI : 0);
  if (vn < 0) {
    const e = 0.12, j = -(1 + e) * vn / invSum;
    const jx = nx * j, jy = ny * j;
    bi.vx -= jx * bi.inv; bi.vy -= jy * bi.inv;
    bi.va -= (raX * jy - raY * jx) * bi.invI;
    if (bj) {
      bj.vx += jx * bj.inv; bj.vy += jy * bj.inv;
      bj.va += (rbX * jy - rbY * jx) * bj.invI;
    }
    // friction
    let tx = rvx - vn * nx, ty = rvy - vn * ny;
    const tl = Math.hypot(tx, ty);
    if (tl > 1e-4) {
      tx /= tl; ty /= tl;
      const jt = Math.max(-0.5 * j, Math.min(0.5 * j, -(rvx * tx + rvy * ty) / invSum));
      bi.vx -= tx * jt * bi.inv; bi.vy -= ty * jt * bi.inv;
      bi.va -= (raX * ty * jt - raY * tx * jt) * bi.invI;
      if (bj) {
        bj.vx += tx * jt * bj.inv; bj.vy += ty * jt * bj.inv;
        bj.va += (rbX * ty * jt - rbY * tx * jt) * bj.invI;
      }
    }
    if (Math.abs(j) > 0.5) { bi.sleeping = false; bi.sleep = 0; if (bj) { bj.sleeping = false; bj.sleep = 0; } }
  }
  // positional correction
  const corr = Math.max(0, pen - 0.5) * 0.35;
  const total = bi.inv + (bj ? bj.inv : 0);
  bi.x -= nx * corr * bi.inv / total; bi.y -= ny * corr * bi.inv / total;
  if (bj) { bj.x += nx * corr * bj.inv / total; bj.y += ny * corr * bj.inv / total; }
}

function circlesOf(b, out) {
  const c = Math.cos(b.a), s = Math.sin(b.a);
  for (let k = 0; k < b.offs.length; k++) {
    out[k * 2] = b.x + c * b.offs[k];
    out[k * 2 + 1] = b.y + s * b.offs[k];
  }
  return b.offs.length;
}

const ciBuf = new Float64Array(6), cjBuf = new Float64Array(6);

function floorAt() { return H - (kbd ? 130 : 10) * d; } // letters rest above the on-screen keyboard

function physics(dt) {
  const floorY = floorAt(), wallL = 6 * d, wallR = W - 6 * d;
  for (const b of bodies) {
    if (b.kin) { stepKin(b, dt); continue; }
    if (!awake || b.sleeping) continue;
    const g = 1600 * d * (0.7 + (b.weight / 900) * 0.55); // heavy words fall harder
    b.vy += g * dt;
    b.vx *= 0.999; b.va *= 0.995;
    b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
  }
  // world contacts via rotated corners
  for (const b of bodies) {
    if (b.kin || b.sleeping) continue;
    const c = Math.cos(b.a), s = Math.sin(b.a), hw = b.w / 2, hh = b.h / 2;
    for (const [ox, oy] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) {
      const px = b.x + ox * c - oy * s, py = b.y + ox * s + oy * c;
      if (py > floorY) contact(b, null, px, py, 0, 1, py - floorY);
      if (px < wallL) contact(b, null, px, py, -1, 0, wallL - px);
      if (px > wallR) contact(b, null, px, py, 1, 0, px - wallR);
    }
  }
  // body-body, circle approximations
  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i];
    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j];
      if (bi.sleeping && bj.sleeping) continue;
      if (bi.kin && bj.kin) continue;
      const maxR = bi.r + bi.w / 2 + bj.r + bj.w / 2;
      if (Math.abs(bi.x - bj.x) > maxR || Math.abs(bi.y - bj.y) > maxR) continue;
      const ni = circlesOf(bi, ciBuf), nj = circlesOf(bj, cjBuf);
      for (let a = 0; a < ni; a++) for (let bIdx = 0; bIdx < nj; bIdx++) {
        const axp = ciBuf[a * 2], ayp = ciBuf[a * 2 + 1];
        const bxp = cjBuf[bIdx * 2], byp = cjBuf[bIdx * 2 + 1];
        let nx = bxp - axp, ny = byp - ayp;
        const dist2 = nx * nx + ny * ny, rr = bi.r + bj.r;
        if (dist2 >= rr * rr || dist2 === 0) continue;
        const dist = Math.sqrt(dist2); nx /= dist; ny /= dist;
        contact(bi, bj.kin ? null : bj, (axp + bxp) / 2, (ayp + byp) / 2, nx, ny, rr - dist);
      }
    }
  }
  // settle bookkeeping
  for (const b of bodies) {
    if (b.kin || b.sleeping || !awake) continue;
    const energy = Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.va) * b.w;
    if (energy < 14 * d && b.y > H * 0.3) { if (++b.sleep > 50) { b.sleeping = true; b.vx = b.vy = b.va = 0; } }
    else b.sleep = 0;
  }
}

function stepKin(b, dt) {
  const k = b.kin;
  k.t += dt;
  const u = Math.min(1, k.t / k.dur), e = u * u * (3 - 2 * u);
  const nx = k.x0 + (k.x1 - k.x0) * e, ny = k.y0 + (k.y1 - k.y0) * e, na = k.a0 + (0 - k.a0) * e;
  b.vx = (nx - b.x) / dt; b.vy = (ny - b.y) / dt; b.va = (na - b.a) / dt;
  b.x = nx; b.y = ny; b.a = na;
  if (u >= 1) { b.vx = b.vy = b.va = 0; if (k.release && now() > k.release) b.kin = null; }
}

function releaseKins() {
  for (const b of bodies) if (b.kin) b.kin = null;
  finaleHold = false;
  attract.phase = 'off';
}

// ---- attract: SUBSTRATE assembles itself, holds, collapses ----
function stepAttract() {
  const idle = now() - lastInput > 4000;
  if (!idle || finaleHold) { if (attract.phase === 'assembling') releaseKins(); return; }
  if (attract.phase === 'off' && now() > attract.until) {
    const word = 'SUBSTRATE';
    const size = Math.min(72 * d, W / 8);
    meas.font = `700 ${size}px ${FONT}`;
    const widths = [...word].map(c => meas.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + (word.length - 1) * size * 0.08;
    // recruit bodies (reuse letters, spawn if short)
    const pool = bodies.filter(b => !b.kin && (!dragged || b !== dragged.b)).slice(0, word.length);
    while (pool.length < word.length) {
      const b = makeBody('•', Math.random() * W, -40 * d, size, 700, '#191512');
      admit([b]); pool.push(b);
    }
    let x = W / 2 - total / 2;
    for (let i = 0; i < word.length; i++) {
      const b = pool[i];
      b.ch = word[i]; b.size = size; b.weight = 700;
      const nb = makeBody(word[i], 0, 0, size, 700, b.color);
      Object.assign(b, { w: nb.w, h: nb.h, r: nb.r, offs: nb.offs, mass: nb.mass, inv: nb.inv, I: nb.I, invI: nb.invI });
      b.sleeping = false;
      b.kin = { x0: b.x, y0: b.y, a0: b.a, x1: x + widths[i] / 2, y1: H * 0.42, t: 0, dur: 1.4, release: now() + 3200 };
      x += widths[i] + size * 0.08;
    }
    awake = true; // so the collapse actually collapses
    attract.phase = 'assembling';
    attract.until = now() + 9000;
  } else if (attract.phase === 'assembling' && now() > attract.until - 1000) {
    attract.phase = 'off';
  }
}

// ---- finale: the settled letters compose the closing line ----
function maybeFinale() {
  if (finaleDone || !interacted || bodies.length < 12 || attract.phase !== 'off') return;
  if (!bodies.every(b => b.sleeping || b.kin)) return;
  if (now() - lastInput < 3000) return;
  finaleDone = true; finaleHold = true;
  const size = Math.min(34 * d, W / 24);
  const lines = ['EVERYTHING YOU JUST', 'TOUCHED IS', 'A TEXT FILE.'];
  const chars = [];
  meas.font = `400 ${size}px ${FONT}`;
  lines.forEach((line, li) => {
    const widths = [...line].map(c => meas.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = W / 2 - total / 2;
    for (const [i, c] of [...line].entries()) {
      if (c !== ' ') chars.push({ c, x: x + widths[i] / 2, y: H * (0.34 + li * 0.1) });
      x += widths[i];
    }
  });
  while (bodies.length < chars.length) admit([makeBody('•', Math.random() * W, -30 * d, size, 400, '#191512')]);
  const pool = [...bodies].sort((a, b) => a.x - b.x);
  chars.forEach((t, i) => {
    const b = pool[i % pool.length];
    if (b.kin) return;
    b.ch = t.c; b.size = size; b.weight = 400; b.color = t.c === '.' ? '#c22b1e' : '#191512';
    const nb = makeBody(t.c, 0, 0, size, 400, b.color);
    Object.assign(b, { w: nb.w, h: nb.h, r: nb.r, offs: nb.offs, mass: nb.mass, inv: nb.inv, I: nb.I, invI: nb.invI });
    b.sleeping = false;
    b.kin = { x0: b.x, y0: b.y, a0: b.a, x1: t.x, y1: t.y, t: 0, dur: 1.8, release: 0 }; // hold until touched
  });
  // surplus bodies beyond the phrase drop away politely
  pool.slice(chars.length).forEach(b => { if (!b.kin) { b.sleeping = false; b.vy = -100 * d; } });
}

// ---- render ----
function render(tNow) {
  ctx.fillStyle = '#ece5d8';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(25,21,18,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, floorAt() + 1); ctx.lineTo(W, floorAt() + 1); ctx.stroke();
  if (buffer) {
    ctx.font = `400 ${22 * d}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(25,21,18,0.35)';
    ctx.fillText(buffer + '_', W / 2, 30 * d);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const b of bodies) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.a);
    ctx.font = `${b.weight} ${b.size}px ${FONT}`;
    ctx.fillStyle = b.color;
    ctx.fillText(b.ch, 0, b.h / 2 - b.size * 0.02); // baseline sits on the box bottom
    ctx.restore();
  }
}

function frame(tNow) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  acc += Math.min(100, tNow - last); last = tNow;
  let n = 0;
  while (acc >= 1000 / 60 && n++ < 2) {
    stepAttract();
    if (awake && interacted && tNow > nextAnvil) { dropAnvil(); nextAnvil = tNow + 25000 + Math.random() * 15000; }
    physics(1 / 120); physics(1 / 120);
    maybeFinale();
    acc -= 1000 / 60;
  }
  if (dragged) {
    const b = dragged.b;
    b.vx = (dragged.tx - b.x) * 18; b.vy = (dragged.ty - b.y) * 18;
    b.va *= 0.9; b.sleeping = false; b.sleep = 0;
  }
  render(tNow);
  frames++;
  if (tNow - fpsAt >= 1000) { fps = Math.round(frames * 1000 / (tNow - fpsAt)); frames = 0; fpsAt = tNow; }
}

// ---- input ----
function toPx(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}
function pick(p) {
  let best = null, bestD = 44 * d;
  for (const b of bodies) {
    const nc = circlesOf(b, ciBuf);
    for (let k = 0; k < nc; k++) {
      const dist = Math.hypot(p.x - ciBuf[k * 2], p.y - ciBuf[k * 2 + 1]) - b.r;
      if (dist < bestD) { bestD = dist; best = b; }
    }
  }
  return best;
}
function onDown(e) {
  lastInput = now();
  releaseKins();
  if (!awake) { awake = true; wakeAll(); nextAnvil = now() + 20000; }
  const p = toPx(e), b = pick(p);
  if (b) {
    interacted = true;
    b.kin = null; b.sleeping = false;
    dragged = { b, id: e.pointerId, tx: p.x, ty: p.y };
    canvas.setPointerCapture(e.pointerId);
  }
}
function onMove(e) {
  if (!dragged || e.pointerId !== dragged.id) return;
  lastInput = now();
  const p = toPx(e);
  dragged.tx = p.x; dragged.ty = p.y;
}
function onUp(e) { if (dragged && e.pointerId === dragged.id) dragged = null; }

function onKey(e) {
  if (!running) return;
  if (e.key.length === 1 && /[a-zA-Z'!?]/.test(e.key)) {
    if (buffer.length < 14) buffer += e.key.toUpperCase();
    lastInput = now();
    if (!awake) { awake = true; wakeAll(); nextAnvil = now() + 20000; }
    releaseKins();
  } else if (e.key === 'Backspace' && buffer) { buffer = buffer.slice(0, -1); e.preventDefault(); }
  else if ((e.key === 'Enter' || e.key === ' ') && buffer) { dropWord(buffer); buffer = ''; e.preventDefault(); }
}

function buildKeyboard() {
  if (!matchMedia('(pointer: coarse)').matches) return;
  kbd = document.createElement('div');
  kbd.style.cssText = 'position:absolute;left:50%;bottom:10px;transform:translateX(-50%);display:flex;flex-direction:column;gap:3px;align-items:center;z-index:5;user-select:none;';
  const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM⌫↵'];
  for (const row of rows) {
    const r = document.createElement('div');
    r.style.cssText = 'display:flex;gap:3px;';
    for (const ch of row) {
      const b = document.createElement('button');
      b.textContent = ch;
      b.style.cssText = 'min-width:26px;height:32px;padding:0 4px;font:12px ui-monospace,monospace;background:rgba(25,21,18,0.75);color:#ece5d8;border:none;border-radius:4px;';
      b.addEventListener('pointerdown', ev => {
        ev.stopPropagation(); ev.preventDefault();
        lastInput = now();
        if (!awake) { awake = true; wakeAll(); nextAnvil = now() + 20000; }
        releaseKins();
        if (ch === '⌫') buffer = buffer.slice(0, -1);
        else if (ch === '↵') { dropWord(buffer); buffer = ''; }
        else if (buffer.length < 14) buffer += ch;
      });
      r.appendChild(b);
    }
    kbd.appendChild(r);
  }
  canvas.parentElement.appendChild(kbd);
}

export function init(c) {
  if (inited) return;
  inited = true;
  canvas = c;
  ctx = canvas.getContext('2d');
  meas = document.createElement('canvas').getContext('2d');
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', onKey);
  buildKeyboard();
  resize();
  initialPhrase();
  attract.until = now() + 4500;
}

export function resize() {
  if (!canvas) return;
  d = Math.min(2, window.devicePixelRatio || 1);
  W = Math.max(2, Math.round(canvas.clientWidth * d));
  H = Math.max(2, Math.round(canvas.clientHeight * d));
  canvas.width = W; canvas.height = H;
}

export function start() {
  if (running) return;
  running = true;
  last = now(); fpsAt = last; frames = 0; acc = 0;
  raf = requestAnimationFrame(frame);
}

export function stop() {
  running = false;
  cancelAnimationFrame(raf);
  dragged = null; buffer = '';
}

export function stats() { return { fps, entities: bodies.length, simHz: meta.simHz }; }

// SUBSTRATE · scene 05 — LENS
// Two pre-rendered layers of the same vector scene: sepia ruins outside the
// lens, the vivid past inside it. The lens is one clip() and a composite.
// Deliberately the cheapest scene on the page — placed after the heaviest.

export const meta = { name: 'LENS', simHz: 60, unit: 'shapes' };

const SEG = 14; // bridge deck segments the lens can heal

let canvas, ctx, W = 0, H = 0;
let pastC, pastX, presC, presX;
let prims = 0, primCount = 0;
let healed = new Array(SEG).fill(false);
let doorOpen = false;
let lens = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, r: 0 }; // normalized pos, px radius
let running = false, inited = false, raf = 0, t0 = 0;
let fps = 0, frames = 0, fpsAt = 0;
let lastInput = -1e9;
let down = null;

// scene geometry (normalized)
const GY = 0.76;                       // ground line
const CH = { x0: 0.38, x1: 0.62 };     // chasm
const TWR = { x: 0.70, w: 0.17, h: 0.44 };
const DOOR = { cx: 0.785, w: 0.05, h: 0.115 };
const TMP = { x: 0.06, w: 0.245 };

function P(f) { prims++; f(); }

function drawLayer(g, past) {
  prims = 0;
  const px = v => v * W, py = v => v * H;
  // sky
  P(() => {
    const gr = g.createLinearGradient(0, 0, 0, py(GY));
    if (past) { gr.addColorStop(0, '#5aa0dc'); gr.addColorStop(1, '#c2e4ee'); }
    else { gr.addColorStop(0, '#4e4136'); gr.addColorStop(1, '#968062'); }
    g.fillStyle = gr; g.fillRect(0, 0, W, py(GY));
  });
  // sun
  P(() => {
    g.fillStyle = past ? '#ffd65a' : 'rgba(206,186,150,0.55)';
    g.beginPath(); g.arc(px(0.62), py(0.16), (past ? 0.045 : 0.032) * W, 0, 7); g.fill();
  });
  if (past) for (let i = 0; i < 4; i++) P(() => { // birds
    const bx = px(0.18 + i * 0.09), by = py(0.12 + (i % 2) * 0.05);
    g.strokeStyle = 'rgba(40,50,60,0.8)'; g.lineWidth = Math.max(1, 0.002 * W);
    g.beginPath(); g.moveTo(bx - 6, by); g.quadraticCurveTo(bx - 3, by - 4, bx, by);
    g.quadraticCurveTo(bx + 3, by - 4, bx + 6, by); g.stroke();
  });
  // ground
  P(() => {
    g.fillStyle = past ? '#7c5e3c' : '#6e5c46';
    g.fillRect(0, py(GY), W, H - py(GY));
  });
  if (past) P(() => { g.fillStyle = '#5f9e50'; g.fillRect(0, py(GY), W, py(0.018)); });
  // chasm
  P(() => {
    g.fillStyle = past ? '#3a2c1e' : '#332a20';
    g.beginPath();
    g.moveTo(px(CH.x0), py(GY)); g.lineTo(px(CH.x0 + 0.03), H);
    g.lineTo(px(CH.x1 - 0.03), H); g.lineTo(px(CH.x1), py(GY));
    g.closePath(); g.fill();
  });
  drawTemple(g, past, px, py);
  drawBridge(g, past, px, py);
  drawTower(g, past, px, py);
  drawTree(g, past, px, py, 0.345, 0.9);
  drawTree(g, past, px, py, 0.655, 1.1);
  return prims;
}

function drawTemple(g, past, px, py) {
  const x = px(TMP.x), w = px(TMP.w), base = py(GY), colH = py(0.20);
  const stone = past ? '#e4ddc6' : '#8a7b64', dark = past ? '#bcb294' : '#6e614e';
  P(() => { g.fillStyle = dark; g.fillRect(x, base - py(0.015), w, py(0.015)); }); // plinth
  const heights = past ? [1, 1, 1, 1] : [0.55, 0.9, 0.3, 0.7]; // ruin: broken columns
  for (let i = 0; i < 4; i++) P(() => {
    const cw = w * 0.09, cx = x + w * (0.08 + i * 0.26);
    g.fillStyle = stone;
    g.fillRect(cx, base - py(0.015) - colH * heights[i], cw, colH * heights[i]);
    g.fillStyle = dark;
    g.fillRect(cx - cw * 0.2, base - py(0.015) - colH * heights[i], cw * 1.4, py(0.008));
  });
  if (past) {
    P(() => { g.fillStyle = stone; g.fillRect(x, base - py(0.015) - colH - py(0.022), w, py(0.022)); });
    P(() => { // pediment
      g.fillStyle = dark;
      g.beginPath();
      g.moveTo(x - w * 0.04, base - py(0.037) - colH);
      g.lineTo(x + w / 2, base - py(0.037) - colH - py(0.055));
      g.lineTo(x + w * 1.04, base - py(0.037) - colH);
      g.closePath(); g.fill();
    });
  } else for (let i = 0; i < 5; i++) P(() => { // rubble
    g.fillStyle = i % 2 ? '#7b6c56' : '#857459';
    g.beginPath();
    g.ellipse(x + w * (0.1 + i * 0.2), base - py(0.008), w * 0.06, py(0.012), 0, 0, 7);
    g.fill();
  });
}

function bridgeSeg(i) {
  const x0 = CH.x0 - 0.015, x1 = CH.x1 + 0.015;
  return { x: x0 + (x1 - x0) * i / SEG, w: (x1 - x0) / SEG };
}

function drawBridge(g, past, px, py) {
  const deckY = py(GY - 0.006), deckH = py(0.018);
  if (past) {
    P(() => { // arch
      g.strokeStyle = '#b09165'; g.lineWidth = py(0.014);
      g.beginPath();
      g.ellipse(px((CH.x0 + CH.x1) / 2), deckY + deckH, px((CH.x1 - CH.x0) / 2 * 0.8), py(0.13), 0, 0, Math.PI);
      g.stroke();
    });
    for (let i = 0; i < SEG; i++) P(() => {
      const s = bridgeSeg(i);
      g.fillStyle = i % 2 ? '#c9a26b' : '#bd9660';
      g.fillRect(px(s.x), deckY, px(s.w) + 1, deckH);
    });
    for (let i = 0; i <= 4; i++) P(() => { // railing posts
      g.fillStyle = '#8a6c46';
      g.fillRect(px(CH.x0 + (CH.x1 - CH.x0) * i / 4) - 1, deckY - py(0.02), Math.max(2, px(0.004)), py(0.02));
    });
  } else {
    for (let i = 0; i < SEG; i++) {
      const s = bridgeSeg(i);
      if (i <= 1 || i >= SEG - 2) P(() => { // surviving stubs
        g.fillStyle = '#77664e';
        g.fillRect(px(s.x), deckY, px(s.w) + 1, deckH);
      });
      else if (healed[i]) P(() => { // the lens passed here: a healed scar
        g.fillStyle = i % 2 ? '#c9a26b' : '#bd9660';
        g.fillRect(px(s.x), deckY, px(s.w) + 1, deckH);
        g.fillStyle = 'rgba(255,214,90,0.45)';
        g.fillRect(px(s.x), deckY + deckH, px(s.w) + 1, Math.max(1, py(0.004)));
      });
    }
    P(() => { // broken arch stumps
      g.strokeStyle = '#5e5140'; g.lineWidth = py(0.012);
      g.beginPath();
      g.ellipse(px((CH.x0 + CH.x1) / 2), deckY + deckH, px((CH.x1 - CH.x0) / 2 * 0.8), py(0.13), 0, Math.PI * 0.05, Math.PI * 0.3);
      g.stroke();
      g.beginPath();
      g.ellipse(px((CH.x0 + CH.x1) / 2), deckY + deckH, px((CH.x1 - CH.x0) / 2 * 0.8), py(0.13), 0, Math.PI * 0.7, Math.PI * 0.95);
      g.stroke();
    });
  }
}

function drawTower(g, past, px, py) {
  const x = px(TWR.x), w = px(TWR.w), top = py(GY - TWR.h), base = py(GY);
  P(() => { g.fillStyle = past ? '#cbb894' : '#80705a'; g.fillRect(x, top, w, base - top); });
  const merlons = past ? 5 : 3;
  for (let i = 0; i < merlons; i++) P(() => { // battlements (a few fell)
    g.fillStyle = past ? '#b5a17c' : '#746550';
    g.fillRect(x + (w / 5) * (past ? i : [0, 2, 4][i]) + w * 0.02, top - py(0.022), w / 7, py(0.022));
  });
  if (!past) for (let i = 0; i < 3; i++) P(() => { // cracks
    g.strokeStyle = '#4a3f30'; g.lineWidth = Math.max(1, py(0.003));
    g.beginPath();
    let cx = x + w * (0.25 + i * 0.25), cy = top + py(0.04);
    g.moveTo(cx, cy);
    for (let k = 0; k < 5; k++) { cx += (Math.sin(i * 7 + k * 3) * w) * 0.06; cy += py(0.05); g.lineTo(cx, cy); }
    g.stroke();
  });
  P(() => { // window
    g.fillStyle = past ? '#5c4630' : '#4e4436';
    g.beginPath(); g.arc(px(DOOR.cx), top + py(0.07), w * 0.09, 0, 7); g.fill();
  });
  // the door only exists in the past
  const dw = px(DOOR.w), dh = py(DOOR.h), dx = px(DOOR.cx) - dw / 2, dy = base - dh;
  if (past) {
    P(() => { // arch frame
      g.fillStyle = '#9d8963';
      g.beginPath();
      g.moveTo(dx - dw * 0.18, base); g.lineTo(dx - dw * 0.18, dy + dw * 0.5);
      g.arc(px(DOOR.cx), dy + dw * 0.5, dw * 0.68, Math.PI, 0);
      g.lineTo(dx + dw * 1.18, base); g.closePath(); g.fill();
    });
    P(() => {
      if (doorOpen) { // ajar, warm light spilling out
        g.fillStyle = '#2c1f12';
        g.beginPath();
        g.moveTo(dx, base); g.lineTo(dx, dy + dw * 0.5);
        g.arc(px(DOOR.cx), dy + dw * 0.5, dw * 0.5, Math.PI, 0);
        g.lineTo(dx + dw, base); g.closePath(); g.fill();
        const gr = g.createRadialGradient(px(DOOR.cx), base - dh * 0.4, 0, px(DOOR.cx), base - dh * 0.4, dh * 1.1);
        gr.addColorStop(0, 'rgba(255,206,110,0.95)'); gr.addColorStop(1, 'rgba(255,206,110,0)');
        g.fillStyle = gr;
        g.fillRect(dx - dw, dy - dh * 0.4, dw * 3, dh * 1.6);
        g.fillStyle = '#7a4d26'; // door panel swung open
        g.save(); g.translate(dx, base); g.rotate(-0.35);
        g.fillRect(0, -dh * 0.96, dw * 0.5, dh * 0.96); g.restore();
      } else {
        g.fillStyle = '#7a4d26';
        g.beginPath();
        g.moveTo(dx, base); g.lineTo(dx, dy + dw * 0.5);
        g.arc(px(DOOR.cx), dy + dw * 0.5, dw * 0.5, Math.PI, 0);
        g.lineTo(dx + dw, base); g.closePath(); g.fill();
        g.strokeStyle = '#54331a'; g.lineWidth = Math.max(1, dw * 0.06);
        for (let k = 1; k < 4; k++) {
          g.beginPath(); g.moveTo(dx + dw * k / 4, base); g.lineTo(dx + dw * k / 4, dy + dw * 0.25); g.stroke();
        }
        g.fillStyle = '#ffd65a';
        g.beginPath(); g.arc(dx + dw * 0.78, base - dh * 0.45, dw * 0.06, 0, 7); g.fill();
      }
    });
  } else {
    P(() => { // present: the doorway is bricked shut… unless it was opened
      g.fillStyle = '#5d5140';
      g.beginPath();
      g.moveTo(dx, base); g.lineTo(dx, dy + dw * 0.5);
      g.arc(px(DOOR.cx), dy + dw * 0.5, dw * 0.5, Math.PI, 0);
      g.lineTo(dx + dw, base); g.closePath(); g.fill();
    });
    if (doorOpen) P(() => { // permanent scar: light leaks through from the past
      const gr = g.createRadialGradient(px(DOOR.cx), base - dh * 0.4, 0, px(DOOR.cx), base - dh * 0.4, dh * 1.3);
      gr.addColorStop(0, 'rgba(255,206,110,0.55)'); gr.addColorStop(1, 'rgba(255,206,110,0)');
      g.fillStyle = gr;
      g.fillRect(dx - dw * 1.5, dy - dh * 0.6, dw * 4, dh * 2);
    });
  }
}

function drawTree(g, past, px, py, nx, scale) {
  const x = px(nx), base = py(GY), h = py(0.13) * scale;
  P(() => {
    g.strokeStyle = past ? '#5c4028' : '#564838';
    g.lineWidth = Math.max(2, py(0.008));
    g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - h);
    g.moveTo(x, base - h * 0.55); g.lineTo(x - h * 0.35, base - h * 0.9);
    g.moveTo(x, base - h * 0.7); g.lineTo(x + h * 0.35, base - h * 1.05);
    g.stroke();
  });
  if (past) for (const [ox, oy, r] of [[0, -1.15, 0.42], [-0.4, -0.95, 0.3], [0.42, -1.1, 0.3]]) P(() => {
    g.fillStyle = '#4f9a44';
    g.beginPath(); g.arc(x + ox * h, base + oy * h, r * h, 0, 7); g.fill();
  });
  else P(() => { // dead branch tips
    g.strokeStyle = '#564838'; g.lineWidth = Math.max(1, py(0.004));
    g.beginPath();
    g.moveTo(x - h * 0.35, base - h * 0.9); g.lineTo(x - h * 0.5, base - h * 1.05);
    g.moveTo(x + h * 0.35, base - h * 1.05); g.lineTo(x + h * 0.5, base - h * 1.15);
    g.stroke();
  });
}

function renderLayers() {
  pastX.clearRect(0, 0, W, H);
  presX.clearRect(0, 0, W, H);
  const a = drawLayer(pastX, true);
  const b = drawLayer(presX, false);
  primCount = a + b;
}

function checkHeal() {
  const lx = lens.x * W, ly = lens.y * H;
  let changed = false;
  for (let i = 2; i < SEG - 2; i++) {
    if (healed[i]) continue;
    const s = bridgeSeg(i);
    const cx = (s.x + s.w / 2) * W, cy = (GY - 0.006) * H;
    if (Math.hypot(lx - cx, ly - cy) < lens.r * 0.92) { healed[i] = true; changed = true; }
  }
  if (changed) renderLayers();
}

function ghostTarget(t) {
  // sweep the bridge (healing a path), drift to the door, wander home
  const k = (t / 1000) % 14;
  if (k < 5) return { x: CH.x0 - 0.06 + (CH.x1 - CH.x0 + 0.12) * (k / 5), y: GY - 0.02 };
  if (k < 7) return { x: DOOR.cx, y: GY - 0.06 };
  if (k < 9) return { x: DOOR.cx, y: GY - 0.06 };
  return { x: 0.5 - 0.2 * Math.sin((k - 9) * 1.2), y: 0.45 };
}

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  const idle = now - lastInput > 4000;
  if (idle) { const g = ghostTarget(now - t0); lens.tx = g.x; lens.ty = g.y; }
  lens.x += (lens.tx - lens.x) * 0.12;
  lens.y += (lens.ty - lens.y) * 0.12;
  checkHeal();
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(presC, 0, 0);
  const lx = lens.x * W, ly = lens.y * H;
  ctx.save();
  ctx.beginPath(); ctx.arc(lx, ly, lens.r, 0, 7); ctx.clip();
  ctx.drawImage(pastC, 0, 0);
  // drifting motes of the past, only visible inside the lens
  for (let i = 0; i < 7; i++) {
    const a = now / 1400 + i * 0.9;
    ctx.fillStyle = `rgba(255,244,190,${0.25 + 0.2 * Math.sin(a * 2)})`;
    ctx.beginPath();
    ctx.arc(lx + Math.sin(a) * lens.r * 0.7, ly + Math.cos(a * 1.3 + i) * lens.r * 0.7, 1.6, 0, 7);
    ctx.fill();
  }
  ctx.restore();
  // rim
  ctx.strokeStyle = 'rgba(30,22,12,0.5)'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(lx, ly, lens.r + 3, 0, 7); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,200,0.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(lx, ly, lens.r, 0, 7); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(lx, ly, lens.r - 6, -2.2, -1.4); ctx.stroke();
  frames++;
  if (now - fpsAt >= 1000) { fps = Math.round(frames * 1000 / (now - fpsAt)); frames = 0; fpsAt = now; }
}

function toNorm(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
}
function onMove(e) {
  lastInput = performance.now();
  const p = toNorm(e);
  lens.tx = p.x; lens.ty = p.y;
}
function onDown(e) {
  lastInput = performance.now();
  const p = toNorm(e);
  lens.tx = p.x; lens.ty = p.y;
  down = { x: p.x, y: p.y, t: performance.now() };
}
function onUp(e) {
  if (!down) return;
  const p = toNorm(e), dt = performance.now() - down.t;
  const moved = Math.hypot((p.x - down.x) * W, (p.y - down.y) * H);
  down = null;
  if (dt > 400 || moved > 12) return;
  // a tap: is the door inside the lens, and is the tap near the door?
  if (doorOpen) return;
  const dx = DOOR.cx * W, dyc = (GY - DOOR.h / 2) * H;
  const inLens = Math.hypot(lens.x * W - dx, lens.y * H - dyc) < lens.r * 1.05;
  const nearDoor = Math.hypot(p.x * W - dx, p.y * H - dyc) < Math.max(40, DOOR.h * H);
  if (inLens && nearDoor) { doorOpen = true; renderLayers(); }
}

export function init(c) {
  if (inited) return;
  inited = true;
  canvas = c;
  ctx = canvas.getContext('2d');
  pastC = document.createElement('canvas'); pastX = pastC.getContext('2d');
  presC = document.createElement('canvas'); presX = presC.getContext('2d');
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { down = null; });
  t0 = performance.now();
  resize();
}

export function resize() {
  if (!canvas) return;
  const d = Math.min(2, window.devicePixelRatio || 1);
  W = Math.max(2, Math.round(canvas.clientWidth * d));
  H = Math.max(2, Math.round(canvas.clientHeight * d));
  canvas.width = W; canvas.height = H;
  pastC.width = presC.width = W;
  pastC.height = presC.height = H;
  lens.r = Math.min(W, H) * 0.21;
  renderLayers();
}

export function start() {
  if (running) return;
  running = true;
  fpsAt = performance.now(); frames = 0;
  raf = requestAnimationFrame(frame);
}

export function stop() {
  running = false;
  cancelAnimationFrame(raf);
  down = null;
}

export function stats() { return { fps, entities: primCount, simHz: meta.simHz }; }

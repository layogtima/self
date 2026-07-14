// Rendering: the substrate cross-section, pheromone decode overlays, brood/seeds,
// and level-of-detail ants (dots when zoomed out → segmented bodies up close).

import { COLS, ROWS, SURFACE, CELL, S, COL, CH, PH_COL, TASK_COL } from './config.js';

function hash(x, y) { const s = Math.sin(x * 91.7 + y * 47.3) * 43758.5; return s - Math.floor(s); }

export function makeRenderer(ctx) {
  const soilCache = document.createElement('canvas');   // static substrate baked once per remesh-ish

  return {
    draw(ctx, W_, H_, cam, nest, pher, colony, opts) {
      const px = CELL * cam.zoom;
      const s2w = (sx, sy) => [(sx - W_ / 2) / px + cam.x, (sy - H_ / 2) / px + cam.y];
      const w2s = (wx, wy) => [(wx - cam.x) * px + W_ / 2, (wy - cam.y) * px + H_ / 2];
      const [x0, y0] = s2w(0, 0), [x1, y1] = s2w(W_, H_);
      const cx0 = Math.max(0, Math.floor(x0)), cy0 = Math.max(0, Math.floor(y0));
      const cx1 = Math.min(COLS, Math.ceil(x1) + 1), cy1 = Math.min(ROWS, Math.ceil(y1) + 1);

      // --- garden sky (soft daylight gradient, replaces the dead blue) ---
      const surfSY = w2s(0, SURFACE)[1];
      if (surfSY > 0) { const g = ctx.createLinearGradient(0, 0, 0, Math.max(1, surfSY)); g.addColorStop(0, COL.sky1); g.addColorStop(1, COL.sky2); ctx.fillStyle = g; ctx.fillRect(0, 0, W_, surfSY); }

      // --- substrate (soil only; sky handled above) ---
      for (let y = Math.max(cy0, SURFACE); y < cy1; y++) for (let x = cx0; x < cx1; x++) {
        const [sx, sy] = w2s(x, y);
        const t = nest.at(x, y);
        let c;
        if (t === S.AIR) c = COL.air;                                  // tunnel void
        else if (t === S.ROCK) c = COL.rock;
        else {                                                         // soil, banded by depth + grain
          const d = (y - SURFACE) / (ROWS - SURFACE);
          const base = d < 0.25 ? COL.soilTop : d < 0.6 ? COL.soilMid : COL.soilDeep;
          c = base;
        }
        ctx.fillStyle = c;
        ctx.fillRect(sx | 0, sy | 0, Math.ceil(px), Math.ceil(px));
        // grain + tunnel-wall lamp catch
        if (t === S.SOIL && px > 3) { const g = hash(x, y); if (g > 0.8) { ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(sx | 0, sy | 0, Math.ceil(px), Math.ceil(px)); } else if (g < 0.12) { ctx.fillStyle = 'rgba(255,220,170,0.05)'; ctx.fillRect(sx | 0, sy | 0, Math.ceil(px), Math.ceil(px)); } }
        if (t === S.AIR && y >= SURFACE && px > 3) {                   // faint wall glow at tunnel edges
          if (nest.isSoil(x - 1, y) || nest.isSoil(x + 1, y) || nest.isSoil(x, y - 1)) { ctx.fillStyle = 'rgba(120,80,50,0.25)'; ctx.fillRect(sx | 0, sy | 0, Math.ceil(px), Math.ceil(px)); }
        }
      }

      // midden rim on the surface
      ctx.fillStyle = COL.midden;
      for (let x = cx0; x < cx1; x++) { const h = nest.midden[x]; if (h > 0.05) { const [sx, sy] = w2s(x, SURFACE); ctx.fillRect(sx | 0, (sy - h * px * 0.5) | 0, Math.ceil(px), Math.ceil(h * px * 0.5)); } }

      // --- garden: grass lawn + seed-bearing plants along the surface ---
      drawGarden(ctx, nest, w2s, px, opts.time || 0, cx0, cx1);

      // (pheromone decode overlay is drawn by ui.js as a smooth field, post-world)

      // --- seeds ---
      for (const sd of nest.seeds) { if (sd.taken && !sd.stored) continue; const [sx, sy] = w2s(sd.x, sd.y); ctx.fillStyle = COL.seed; ctx.beginPath(); ctx.ellipse(sx, sy, px * 0.32, px * 0.22, 0.5, 0, 7); ctx.fill(); }

      // --- brood ---
      for (const b of colony.brood) {
        const [sx, sy] = w2s(b.x, b.y);
        ctx.fillStyle = COL.brood;
        const r = b.stage === 'egg' ? px * 0.16 : b.stage === 'larva' ? px * 0.26 : px * 0.3;
        ctx.beginPath();
        if (b.stage === 'pupa') { ctx.fillStyle = '#e6d8b8'; ctx.ellipse(sx, sy, r, r * 1.5, 0, 0, 7); }
        else ctx.ellipse(sx, sy, r, r * (b.stage === 'larva' ? 1.3 : 1), 0, 0, 7);
        ctx.fill();
      }

      // --- corpses ---
      for (const c of colony.corpses) { const [sx, sy] = w2s(c.x, c.y); drawAnt(ctx, sx, sy, px, { caste: 'minor', hx: 1, hy: 0, age: 1, dead: true }); }

      // --- ants (LOD) ---
      for (const a of colony.ants) {
        const [sx, sy] = w2s(a.x, a.y);
        if (sx < -20 || sy < -20 || sx > W_ + 20 || sy > H_ + 20) continue;
        if (opts.taskOverlay) { ctx.fillStyle = TASK_COL[a.task] || TASK_COL.idle; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(sx, sy, Math.max(3.5, px * 0.9), 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
        drawAnt(ctx, sx, sy, px, a);
      }

      // selected-ant ring
      if (opts.selected && colony.ants.includes(opts.selected)) {
        const [sx, sy] = w2s(opts.selected.x, opts.selected.y);
        ctx.strokeStyle = '#7fe0d0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy, Math.max(8, px * 1.6), 0, 7); ctx.stroke();
      }
    },
  };
}

// the garden: a grass lawn + seed-bearing plants along the surface line
function drawGarden(ctx, nest, w2s, px, time, cx0, cx1) {
  if (px < 1.4) return;
  ctx.lineCap = 'round';
  for (let x = cx0; x < cx1; x++) {                       // lawn
    const g = hash(x, 1); if (g < 0.34) continue;
    const [sx, sy] = w2s(x + 0.5, SURFACE);
    ctx.strokeStyle = g > 0.7 ? COL.grass : COL.grassDk; ctx.lineWidth = Math.max(0.8, px * 0.12);
    const n = 1 + (g * 2 | 0);
    for (let i = 0; i < n; i++) { const bx = sx + (hash(x, i + 2) - 0.5) * px * 0.7, bl = (1.1 + hash(x, i + 5) * 1.5) * px, sw = Math.sin(time * 1.2 + x + i) * px * 0.28; ctx.beginPath(); ctx.moveTo(bx, sy); ctx.quadraticCurveTo(bx + sw * 0.5, sy - bl * 0.6, bx + sw, sy - bl); ctx.stroke(); }
  }
  for (const p of nest.plants) {                           // plants
    if (p.x < cx0 - 2 || p.x > cx1 + 2) continue;
    const [sx, sy] = w2s(p.x + 0.5, SURFACE), Hh = p.h * px, sw = Math.sin(time * 0.9 + p.ph) * px * 0.8;
    if (p.kind === 'grass') {
      ctx.strokeStyle = COL.grass; ctx.lineWidth = Math.max(1, px * 0.14);
      for (const o of [-0.4, 0, 0.4]) { ctx.beginPath(); ctx.moveTo(sx + o * px, sy); ctx.quadraticCurveTo(sx + o * px + sw * 0.4, sy - Hh * 0.6, sx + o * px + sw, sy - Hh); ctx.stroke(); }
    } else {
      ctx.strokeStyle = COL.stalk; ctx.lineWidth = Math.max(1.2, px * 0.16);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + sw * 0.5, sy - Hh * 0.6, sx + sw, sy - Hh); ctx.stroke();
      ctx.fillStyle = COL.leaf;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx + sw * 0.5 + s * px * 0.5, sy - Hh * 0.55, px * 0.5, px * 0.2, s * 0.6, 0, 7); ctx.fill(); }
      const tx = sx + sw, ty = sy - Hh;                    // seed head
      ctx.fillStyle = COL.seedhead; ctx.beginPath(); ctx.ellipse(tx, ty, px * 0.45, px * 0.72, 0, 0, 7); ctx.fill();
      ctx.fillStyle = COL.seed;
      for (let i = 0; i < 5; i++) ctx.fillRect(tx - px * 0.28 + (i % 3) * px * 0.28, ty - px * 0.4 + ((i / 3 | 0)) * px * 0.36, px * 0.18, px * 0.18);
    }
  }
}

// a single ant, scaled to px (px = screen px per world cell)
export function drawAnt(ctx, sx, sy, px, a) {
  const major = a.caste === 'major', queen = a.caste === 'queen';
  const L = (queen ? 3.4 : major ? 2.3 : 1.5) * px;          // body length in screen px
  if (L < 4.5) {                                             // far LOD: a dot
    ctx.fillStyle = a.dead ? COL.corpse : (a.caste === 'queen' ? '#4a2e1c' : COL.ant);
    ctx.fillRect(sx - 1, sy - 1, major || queen ? 3 : 2, major || queen ? 3 : 2);
    return;
  }
  const ang = Math.atan2(a.hy, a.hx);
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang);
  const seg = L / 3.2, w = seg * (major ? 0.95 : 0.8);
  const body = a.dead ? COL.corpse : queen ? '#3a2416' : major ? COL.antMajor : (a.age < 0.06 ? COL.callow : COL.ant);
  // legs (3 pairs) + antennae
  ctx.strokeStyle = body; ctx.lineWidth = Math.max(0.6, seg * 0.14); ctx.lineCap = 'round';
  const legR = seg * 1.5, spread = a.dead ? 0.2 : Math.sin((a.t || 0) * 14) * 0.35;
  for (let i = 0; i < 3; i++) { const bx = seg * (0.4 - i * 0.7); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(bx, s * w * 0.4); ctx.lineTo(bx + Math.cos((i - 1) * 0.5) * legR * 0.5, s * (legR + Math.sin(i + spread) * seg)); ctx.stroke(); } }
  // gaster, petiole, thorax, head
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(-seg * 1.3, 0, seg * (queen ? 1.5 : 1.05), w * (queen ? 1.15 : 0.95), 0, 0, 7); ctx.fill();   // gaster
  ctx.beginPath(); ctx.ellipse(-seg * 0.2, 0, seg * 0.7, w * 0.7, 0, 0, 7); ctx.fill();                                     // thorax
  ctx.beginPath(); ctx.ellipse(seg * (major ? 1.1 : 0.9), 0, seg * (major ? 0.95 : 0.6), w * (major ? 1.0 : 0.7), 0, 0, 7); ctx.fill();  // head (majors big)
  // antennae
  ctx.beginPath(); ctx.moveTo(seg * 1.0, -w * 0.3); ctx.lineTo(seg * 1.8, -w * 0.9); ctx.moveTo(seg * 1.0, w * 0.3); ctx.lineTo(seg * 1.8, w * 0.9); ctx.stroke();
  // carried item
  if (a.carrying) {
    ctx.fillStyle = a.carrying === 'seed' ? COL.seed : a.carrying === 'brood' ? COL.brood : a.carrying === 'corpse' ? COL.corpse : COL.pellet;
    ctx.beginPath(); ctx.ellipse(seg * 2.0, 0, seg * 0.5, seg * 0.4, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
}

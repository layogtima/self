// Lab minigames — one per station, real fossil-prep flavour, behind a common
// interface (content/stations.js keys them by `minigame`):
//   const g = makeMinigame(kind, spec, makeCanvas, extra)
//   g.update(dt) → sets g.status: 'active' | 'success' | 'failed' | 'cancelled'
//   g.render(ctx, time)
//
//   prep      — brush matrix off the bone; fast strokes near the bone chip it.
//               integrity can hit 0 → the fragment is LOST (real prep is slow).
//   identify  — comparative anatomy: pick the species from 3 silhouettes.
//   stabilize — consolidant: hold to raise the gauge, release inside the zone.
//   mount     — place the bone in the correct slot of the skeleton.
//
// `extra` supplies: { fragment, decoys:[spec,spec], bones:[names], boneIndex,
//                     mountedSlots:Set }

import { VIEW_W, VIEW_H, TILE } from '../config.js';
import { keys, mouse, pressed } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { PALETTE, RARITY_COLORS } from '../render/palette.js';
import { blueprintPanel, text, roundRect } from '../render/text.js';
import { drawFossil } from '../render/sprites.js';

const PW = 600, PH = 380;

export function makeMinigame(kind, spec, makeCanvas, extra = {}) {
  const base = {
    kind, spec, extra, status: 'active',
    px: VIEW_W / 2 - PW / 2, py: VIEH(), t: 0,
    cancel() { this.status = 'cancelled'; sfx.uiBack(); },
    frame(ctx, title, hint) {
      ctx.fillStyle = 'rgba(20,16,12,0.6)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      blueprintPanel(ctx, this.px, this.py, PW, PH, { frameW: 10, r: 16 });
      text(ctx, title, this.px + 24, this.py + 18, { size: 16, bold: true, color: PALETTE.amber });
      text(ctx, hint, this.px + PW - 24, this.py + 20, { size: 11, align: 'right', color: PALETTE.creamDim });
      text(ctx, 'ESC cancel', this.px + PW - 24, this.py + PH - 26, { size: 10, align: 'right', color: PALETTE.creamDim });
    },
  };
  const games = { prep: makePrep, identify: makeIdentify, stabilize: makeStabilize, mount: makeMount };
  return (games[kind] || makeStabilize)(base, spec, makeCanvas, extra);
}
function VIEH() { return VIEW_H / 2 - PH / 2; }

// ---------------------------------------------------------------- prep (fail-able)
function makePrep(g, spec, makeCanvas) {
  const [fw, fh] = spec.footprint;
  const scale = Math.min(280 / (fw * TILE), 170 / (fh * TILE), 3.5);
  const aw = fw * TILE * scale, ah = fh * TILE * scale;
  const ax = VIEW_W / 2 - aw / 2, ay = VIEW_H / 2 - ah / 2 - 6;

  const cell = 10;
  const cols = Math.ceil((aw + 16) / cell), rows = Math.ceil((ah + 16) / cell);
  const dirt = new Uint8Array(cols * rows).fill(1);
  // fragile = cells directly over the bone body (inner ellipse of the art box)
  const fragile = new Uint8Array(cols * rows);
  for (let cy = 0; cy < rows; cy++)
    for (let cx = 0; cx < cols; cx++) {
      const nx = (cx / cols - 0.5) * 2, ny = (cy / rows - 0.5) * 2;
      if (nx * nx + ny * ny < 0.7) fragile[cy * cols + cx] = 1;
    }
  let remaining = dirt.length, total = dirt.length;
  let integrity = 1;
  let px = VIEW_W / 2, py = VIEW_H / 2, warnT = 0;

  g.update = function (dt) {
    this.t += dt;
    warnT = Math.max(0, warnT - dt);
    if (pressed('Escape')) return this.cancel();
    const kdir = { x: (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), y: (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) };
    let nx = px, ny = py;
    if (kdir.x || kdir.y) { nx += kdir.x * 200 * dt; ny += kdir.y * 200 * dt; }
    else { nx = mouse.x; ny = mouse.y; }
    const speed = Math.hypot(nx - px, ny - py) / Math.max(0.001, dt);   // px/s
    px = nx; py = ny;

    if (mouse.left || keys.Space) {
      const R = 15;
      for (let cy = 0; cy < rows; cy++)
        for (let cx = 0; cx < cols; cx++) {
          const i = cy * cols + cx;
          if (!dirt[i]) continue;
          const wx = ax - 8 + cx * cell + cell / 2, wy = ay - 8 + cy * cell + cell / 2;
          if ((wx - px) ** 2 + (wy - py) ** 2 < R * R) {
            dirt[i] = 0; remaining--;
            if (fragile[i] && speed > 130) {          // scrubbed the bone too fast
              integrity -= 0.06; warnT = 0.3; sfx.crumble();
              if (integrity <= 0) { this.status = 'failed'; return; }
            }
          }
        }
    }
    if (remaining / total <= 0.08) { this.status = 'success'; sfx.complete(); }
  };

  g.render = function (ctx, time) {
    this.frame(ctx, 'PREP BENCH — mechanical prep', 'slow, short strokes near the bone · fast scrubbing chips it');
    drawFossil(ctx, spec, ax, ay, makeCanvas, scale);
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        const i = cy * cols + cx;
        if (!dirt[i]) continue;
        ctx.fillStyle = (cx + cy) % 2 ? '#8A7355' : '#7C6749';
        ctx.fillRect(ax - 8 + cx * cell, ay - 8 + cy * cell, cell + 1, cell + 1);
      }
    // brush cursor (red near fragile)
    ctx.strokeStyle = warnT > 0 ? PALETTE.danger : PALETTE.amber;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, 15, 0, Math.PI * 2); ctx.stroke();
    // integrity + cleared meters
    meter(ctx, this.px + 24, this.py + PH - 40, 200, integrity, 'integrity', integrity < 0.4 ? PALETTE.danger : PALETTE.good);
    meter(ctx, this.px + 250, this.py + PH - 40, 200, 1 - remaining / total, 'cleared', PALETTE.amber);
  };
  return g;
}

// ---------------------------------------------------------------- identify
function makeIdentify(g, spec, makeCanvas, extra) {
  // options: correct + up to 2 decoys, shuffled deterministically by fragment uid
  const opts = [spec, ...(extra.decoys || [])].slice(0, 3);
  const seed = (extra.fragment?.uid || 1) * 2654435761;
  opts.sort((a, b) => ((seed ^ a.id.length) % 7) - ((seed ^ b.id.length) % 7));
  let sel = 0, strikes = 0, done = 0;
  g.reduced = false;

  g.update = function (dt) {
    this.t += dt;
    if (done > 0) { done += dt; if (done > 0.6) this.status = 'success'; return; }
    if (pressed('Escape')) return this.cancel();
    if (pressed('KeyA')) { sel = (sel + opts.length - 1) % opts.length; sfx.ui(); }
    if (pressed('KeyD')) { sel = (sel + 1) % opts.length; sfx.ui(); }
    // click-to-select
    if (pressed('MouseLeft')) {
      const i = optAt(mouse.x, mouse.y);
      if (i >= 0) sel = i;
    }
    if (pressed('Space') || pressed('KeyE') || pressed('MouseLeft')) {
      if (opts[sel].id === spec.id) { done = 0.001; sfx.reveal(); }
      else {
        strikes++; sfx.uiBack();
        if (strikes >= 2) { this.reduced = true; done = 0.001; sfx.complete(); }
      }
    }
  };

  const optBox = i => ({ x: g.px + 250 + (i % 1) * 0, y: g.py + 70 + i * 96, w: PW - 280, h: 84 });
  function optAt(mx, my) {
    for (let i = 0; i < opts.length; i++) { const b = optBox(i); if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return i; }
    return -1;
  }

  g.render = function (ctx, time) {
    this.frame(ctx, 'COMPARISON DESK — which species?', 'A/D choose · E confirm · 2 wrong = ID at reduced value');
    text(ctx, `strikes ${strikes}/2`, this.px + PW - 24, this.py + 40, { size: 11, align: 'right', color: strikes ? PALETTE.danger : PALETTE.creamDim });
    // the fragment under glass, left
    text(ctx, 'recovered', this.px + 30, this.py + 60, { size: 11, color: PALETTE.creamDim });
    drawFossil(ctx, spec, this.px + 40, this.py + 90, makeCanvas, Math.min(180 / (spec.footprint[0] * TILE), 1.6));
    // candidates, right
    opts.forEach((o, i) => {
      const b = optBox(i);
      roundRect(ctx, b.x, b.y, b.w, b.h, 8);
      ctx.fillStyle = i === sel ? 'rgba(200,121,30,0.18)' : 'rgba(0,0,0,0.06)';
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = i === sel ? PALETTE.amber : PALETTE.frameDark; ctx.stroke();
      ctx.save(); ctx.globalAlpha = 0.85;
      drawFossil(ctx, o, b.x + 8, b.y + 8, makeCanvas, Math.min((b.h - 16) / (o.footprint[1] * TILE), 1.4));
      ctx.restore();
      text(ctx, o.name, b.x + b.w - 12, b.y + b.h / 2 - 6, { size: 13, bold: i === sel, align: 'right' });
      text(ctx, o.latin, b.x + b.w - 12, b.y + b.h / 2 + 10, { size: 9, italic: true, align: 'right', color: PALETTE.creamDim });
    });
  };
  return g;
}

// ---------------------------------------------------------------- stabilize
function makeStabilize(g, spec) {
  let gauge = 0, zone = [0.66, 0.86], overT = 0;
  g.update = function (dt) {
    this.t += dt;
    overT = Math.max(0, overT - dt);
    if (pressed('Escape')) return this.cancel();
    const holding = keys.KeyE || keys.Space || mouse.left;
    if (holding) {
      gauge += 0.4 * dt;
      if (gauge >= 1) { gauge = 0; overT = 0.6; sfx.uiBack(); }   // overfill → glue everywhere, retry
    } else if (gauge > 0.02) {
      // released: judge it
      if (gauge >= zone[0] && gauge <= zone[1]) { this.status = 'success'; sfx.complete(); }
      else gauge = Math.max(0, gauge - 1.2 * dt);   // under/over-but-not-full: bleed back, try again
    }
  };
  g.render = function (ctx, time) {
    this.frame(ctx, 'CONSOLIDANT RIG — stabilize the bone', 'hold E to apply · release inside the amber band');
    const cx = VIEW_W / 2, top = this.py + 90, hgt = 200, w = 60;
    // tube
    roundRect(ctx, cx - w / 2, top, w, hgt, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fill();
    // zone band
    ctx.fillStyle = overT > 0 ? PALETTE.danger : PALETTE.amberSoft;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(cx - w / 2, top + hgt * (1 - zone[1]), w, hgt * (zone[1] - zone[0]));
    ctx.globalAlpha = 1;
    // fill
    ctx.fillStyle = overT > 0 ? PALETTE.danger : PALETTE.good;
    ctx.fillRect(cx - w / 2 + 3, top + hgt * (1 - gauge), w - 6, hgt * gauge);
    ctx.lineWidth = 2; ctx.strokeStyle = PALETTE.frameDark; roundRect(ctx, cx - w / 2, top, w, hgt, 8); ctx.stroke();
    text(ctx, overT > 0 ? 'overfilled! try again' : 'apply consolidant', cx, top + hgt + 16, { size: 12, align: 'center', color: overT > 0 ? PALETTE.danger : PALETTE.cream });
  };
  return g;
}

// ---------------------------------------------------------------- mount
function makeMount(g, spec, makeCanvas, extra) {
  const bones = extra.bones || spec.bones || ['piece'];
  const target = extra.boneIndex ?? 0;
  const mounted = extra.mountedSlots || new Set();
  let sel = 0, wobble = 0;

  g.update = function (dt) {
    this.t += dt;
    wobble = Math.max(0, wobble - dt * 3);
    if (pressed('Escape')) return this.cancel();
    if (pressed('KeyA')) { sel = (sel + bones.length - 1) % bones.length; sfx.ui(); }
    if (pressed('KeyD')) { sel = (sel + 1) % bones.length; sfx.ui(); }
    if (pressed('Space') || pressed('KeyE')) {
      if (sel === target) { this.status = 'success'; sfx.complete(); }
      else { wobble = 1; sfx.uiBack(); }
    }
  };

  g.render = function (ctx, time) {
    this.frame(ctx, 'MOUNT — assemble the skeleton', 'A/D pick the slot for this bone · E confirm');
    // ghost skeleton
    ctx.save(); ctx.globalAlpha = 0.18;
    const s = Math.min(360 / (spec.footprint[0] * TILE), 150 / (spec.footprint[1] * TILE), 3);
    drawFossil(ctx, spec, VIEW_W / 2 - spec.footprint[0] * TILE * s / 2, this.py + 70, makeCanvas, s);
    ctx.restore();
    // slot row
    const n = bones.length, sw = Math.min(80, (PW - 80) / n), y = this.py + PH - 96;
    const x0 = VIEW_W / 2 - (n * sw) / 2;
    bones.forEach((b, i) => {
      const x = x0 + i * sw + sw / 2;
      const wob = i === sel ? Math.sin(time * 30) * wobble * 3 : 0;
      roundRect(ctx, x - sw / 2 + 4 + wob, y, sw - 8, 44, 6);
      ctx.fillStyle = mounted.has(i) ? 'rgba(108,154,84,0.25)' : i === sel ? 'rgba(200,121,30,0.20)' : 'rgba(0,0,0,0.06)';
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = i === sel ? (wobble > 0 ? PALETTE.danger : PALETTE.amber) : PALETTE.frameDark; ctx.stroke();
      text(ctx, b, x + wob, y + 16, { size: 9, bold: i === sel, align: 'center', color: mounted.has(i) ? PALETTE.good : PALETTE.cream });
      if (mounted.has(i)) text(ctx, '✓', x + wob, y + 28, { size: 12, align: 'center', color: PALETTE.good });
    });
    text(ctx, `this bone: ${bones[target]}`, VIEW_W / 2, y - 18, { size: 13, bold: true, align: 'center', color: PALETTE.amber });
  };
  return g;
}

// ---------------------------------------------------------------- shared
function meter(ctx, x, y, w, p, label, col) {
  roundRect(ctx, x, y, w, 14, 7);
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fill();
  ctx.fillStyle = col;
  ctx.fillRect(x + 2, y + 2, (w - 4) * Math.max(0, Math.min(1, p)), 10);
  text(ctx, label, x + w + 10, y + 1, { size: 10, color: PALETTE.creamDim });
}

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
import { sfx, setBrushLevel } from '../core/audio.js';
import { PALETTE, RARITY_COLORS } from '../render/palette.js';
import { blueprintPanel, text, roundRect } from '../render/text.js';
import { drawFossil } from '../render/sprites.js';
import { drawBone, boneFootprint, boneCategory } from '../render/bones.js';

const PW = 600, PH = 380;

export function makeMinigame(kind, spec, makeCanvas, extra = {}) {
  const base = {
    kind, spec, extra, status: 'active',
    px: VIEW_W / 2 - PW / 2, py: VIEH(), t: 0,
    cancel() { this.status = 'cancelled'; sfx.uiBack(); },
    frame(ctx, title, purpose, hint) {
      ctx.fillStyle = 'rgba(20,16,12,0.6)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      blueprintPanel(ctx, this.px, this.py, PW, PH, { frameW: 10, r: 16 });
      // WORKBENCH dressing: wood tabletop band across the lower half
      const ty0 = this.py + PH * 0.42;
      ctx.fillStyle = 'rgba(110,79,51,0.28)';
      ctx.fillRect(this.px + 10, ty0, PW - 20, PH - (ty0 - this.py) - 10);
      ctx.strokeStyle = 'rgba(74,52,33,0.35)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const gy = ty0 + 8 + i * ((PH - (ty0 - this.py)) / 4.5);
        ctx.beginPath(); ctx.moveTo(this.px + 12, gy);
        ctx.bezierCurveTo(this.px + PW * 0.3, gy + 2, this.px + PW * 0.7, gy - 2, this.px + PW - 12, gy + 1);
        ctx.stroke();
      }
      // canvas work cloth in the centre
      ctx.fillStyle = 'rgba(240,232,210,0.45)';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(this.px + PW / 2 - 190, this.py + 70, 380, 230, 6); ctx.fill(); }
      // inner vignette
      const vg = ctx.createRadialGradient(this.px + PW / 2, this.py + PH / 2, PH * 0.3, this.px + PW / 2, this.py + PH / 2, PH * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(60,40,20,0.18)');
      ctx.fillStyle = vg;
      ctx.fillRect(this.px, this.py, PW, PH);
      text(ctx, title, this.px + 24, this.py + 16, { size: 13, bold: true, color: PALETTE.amber });
      if (purpose) text(ctx, purpose, this.px + 24, this.py + 34, { size: 10, color: PALETTE.creamDim });
      text(ctx, hint, this.px + PW / 2, this.py + PH - 26, { size: 12, align: 'center', color: PALETTE.creamDim });
    },
  };
  const games = { prep: makePrep, identify: makeIdentify, stabilize: makeStabilize, mount: makeMount };
  return (games[kind] || makeStabilize)(base, spec, makeCanvas, extra);
}
function VIEH() { return VIEW_H / 2 - PH / 2; }

// ---------------------------------------------------------------- prep (fail-able)
function makePrep(g, spec, makeCanvas, extra) {
  const boneName = extra.boneName || extra.fragment?.bone || (spec.bones || ['piece'])[0];
  const [bw, bh] = boneFootprint(boneName);
  const scale = Math.min(240 / (bw * TILE), 170 / (bh * TILE), 4);
  const aw = bw * TILE * scale, ah = bh * TILE * scale;
  const ax = VIEW_W / 2 - aw / 2, ay = VIEW_H / 2 - ah / 2 - 6;

  const cell = 10;
  const cols = Math.ceil((aw + 16) / cell), rows = Math.ceil((ah + 16) / cell);
  const dirt = new Uint8Array(cols * rows).fill(1);
  // fragile = cells over the bone body (inner ellipse). Clearing all of these
  // (the shape + edges) is the real work; the loose surround auto-sweeps after.
  const fragile = new Uint8Array(cols * rows);
  let fragileRemaining = 0;
  for (let cy = 0; cy < rows; cy++)
    for (let cx = 0; cx < cols; cx++) {
      const nx = (cx / cols - 0.5) * 2, ny = (cy / rows - 0.5) * 2;
      if (nx * nx + ny * ny < 0.82) { fragile[cy * cols + cx] = 1; fragileRemaining++; }
    }
  let remaining = dirt.length, total = dirt.length;
  let integrity = 1;
  let px = VIEW_W / 2, py = VIEW_H / 2, warnT = 0;
  let brushR = 15, lastSpeed = 0, sweep = -1;
  const dust = [];

  g.update = function (dt) {
    this.t += dt;
    warnT = Math.max(0, warnT - dt);
    if (pressed('Escape')) { setBrushLevel(0); return this.cancel(); }

    // auto-sweep: once the bone is fully exposed, whisk away the loose surround
    if (sweep >= 0) {
      sweep += dt;
      const keep = Math.max(0, 1 - sweep / 0.4);
      for (let i = 0; i < dirt.length; i++) if (dirt[i] && !fragile[i] && Math.random() > keep) { dirt[i] = 0; remaining--; }
      if (sweep > 0.4) { setBrushLevel(0); this.status = 'success'; sfx.complete(); }
      return;
    }

    if (mouse.wheel) brushR = Math.max(8, Math.min(24, brushR - mouse.wheel * 2));
    if (pressed('BracketLeft')) brushR = Math.max(8, brushR - 3);
    if (pressed('BracketRight')) brushR = Math.min(24, brushR + 3);

    const kdir = { x: (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), y: (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) };
    let nx = px, ny = py;
    if (kdir.x || kdir.y) { nx += kdir.x * 200 * dt; ny += kdir.y * 200 * dt; }
    else { nx = mouse.x; ny = mouse.y; }
    const speed = Math.hypot(nx - px, ny - py) / Math.max(0.001, dt);
    lastSpeed = speed; px = nx; py = ny;

    const scrubbing = mouse.left || keys.Space;
    setBrushLevel(scrubbing ? Math.min(1, speed / 500) : 0);

    if (scrubbing) {
      const dmgMul = brushR / 15;
      let cleared = 0;
      for (let cy = 0; cy < rows; cy++)
        for (let cx = 0; cx < cols; cx++) {
          const i = cy * cols + cx;
          if (!dirt[i]) continue;
          const wx = ax - 8 + cx * cell + cell / 2, wy = ay - 8 + cy * cell + cell / 2;
          if ((wx - px) ** 2 + (wy - py) ** 2 < brushR * brushR) {
            dirt[i] = 0; remaining--; cleared++;
            if (fragile[i]) {
              fragileRemaining--;
              if (speed > 130) {
                integrity -= 0.06 * dmgMul; warnT = 0.3; sfx.crumble();
                if (integrity <= 0) { setBrushLevel(0); this.status = 'failed'; return; }
              }
            }
          }
        }
      if (cleared > 0 && dust.length < 40)
        for (let d = 0; d < 2; d++) dust.push({ x: px + (Math.random() - 0.5) * brushR, y: py + brushR * 0.5, vx: (Math.random() - 0.5) * 26, vy: 12 + Math.random() * 22, life: 0.8 });
    }
    for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i]; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; if (d.life <= 0) dust.splice(i, 1); }
    // bone fully exposed → begin the auto-sweep
    if (fragileRemaining <= 0 && sweep < 0) { sweep = 0; sfx.dig(); }
  };

  g.render = function (ctx, time) {
    this.frame(ctx, 'PREP', 'remove the rock matrix', sweep >= 0 ? 'exposed! clearing…' : 'slow near the bone');
    drawBone(ctx, spec, boneName, ax, ay, makeCanvas, scale);
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        const i = cy * cols + cx;
        if (!dirt[i]) continue;
        ctx.fillStyle = (cx + cy) % 2 ? '#8A7355' : '#7C6749';
        ctx.fillRect(ax - 8 + cx * cell, ay - 8 + cy * cell, cell + 1, cell + 1);
      }
    ctx.fillStyle = 'rgba(150,125,95,0.7)';
    for (const d of dust) ctx.fillRect(d.x, d.y, 1.6, 1.6);
    if (sweep < 0) {
      const tilt = Math.max(-0.5, Math.min(0.5, lastSpeed / 900));
      ctx.save();
      ctx.translate(px, py); ctx.rotate(-0.7 + tilt);
      ctx.strokeStyle = warnT > 0 ? PALETTE.danger : 'rgba(200,121,30,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, brushR, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#6E4F33'; ctx.fillRect(-2, -26, 4, 14);
      ctx.fillStyle = '#8E96A4'; ctx.fillRect(-3, -13, 6, 4);
      ctx.fillStyle = '#D8C49A';
      for (let b = -3; b <= 3; b += 1.5) ctx.fillRect(b - 0.7 + tilt * 6, -9, 1.4, 9);
      ctx.restore();
    }
    meter(ctx, this.px + 24, this.py + PH - 44, 190, integrity, '', integrity < 0.4 ? PALETTE.danger : PALETTE.good);
    meter(ctx, this.px + 250, this.py + PH - 44, 190, 1 - remaining / total, '', PALETTE.amber);
  };
  return g;
}

// ---------------------------------------------------------------- identify
function makeIdentify(g, spec, makeCanvas, extra) {
  const boneName = extra.boneName || extra.fragment?.bone || (spec.bones || ['piece'])[0];
  // each candidate is shown with ITS version of the same bone category
  const boneOf = o => (o.bones || ['piece']).find(b => boneCategory(b) === boneCategory(boneName)) || (o.bones || ['piece'])[0];
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
    this.frame(ctx, 'COMPARE', 'identify the species', 'whose ' + boneCategory(boneName) + ' is this?');
    for (let i = 0; i < 2; i++) { ctx.fillStyle = i < strikes ? PALETTE.danger : 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(this.px + PW - 30 - i * 14, this.py + 26, 4, 0, Math.PI * 2); ctx.fill(); }
    // the recovered bone under glass, left
    text(ctx, 'recovered', this.px + 44, this.py + 66, { size: 10, color: PALETTE.creamDim });
    const [rbw, rbh] = boneFootprint(boneName);
    const rsc = Math.min(150 / (rbw * TILE), 140 / (rbh * TILE), 2.4);
    drawBone(ctx, spec, boneName, this.px + 44 + 90 - rbw * TILE * rsc / 2, this.py + 90, makeCanvas, rsc);
    // candidates, right
    opts.forEach((o, i) => {
      const b = optBox(i);
      // pinned specimen card
      roundRect(ctx, b.x, b.y, b.w, b.h, 6);
      ctx.fillStyle = i === sel ? 'rgba(255,252,240,0.9)' : 'rgba(250,244,226,0.75)';
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = i === sel ? PALETTE.amber : 'rgba(74,52,33,0.3)'; ctx.stroke();
      // the pin
      ctx.fillStyle = PALETTE.danger;
      ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + 5, 3, 0, Math.PI * 2); ctx.fill();
      // each candidate's version of THE SAME bone, normalised to slot height
      ctx.save(); ctx.globalAlpha = 0.92;
      const ob = boneOf(o);
      const [obw, obh] = boneFootprint(ob);
      const sc = Math.min((b.h - 20) / (obh * TILE), (b.w * 0.42) / (obw * TILE));
      drawBone(ctx, o, ob, b.x + 14, b.y + b.h / 2 - obh * TILE * sc / 2, makeCanvas, sc);
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
    this.frame(ctx, 'STABILIZE', 'consolidate the bone', 'release in the band');
    const cx = VIEW_W / 2, top = this.py + 96, hgt = 190, w = 74;
    // dripper nozzle above
    ctx.fillStyle = '#8E96A4';
    ctx.fillRect(cx - 5, top - 26, 10, 12);
    ctx.beginPath(); ctx.moveTo(cx - 4, top - 14); ctx.lineTo(cx + 4, top - 14); ctx.lineTo(cx, top - 7); ctx.closePath(); ctx.fill();
    // falling drop while holding
    if (keys.KeyE || keys.Space || mouse.left) {
      ctx.fillStyle = 'rgba(140,190,120,0.9)';
      const dy = ((time * 240) % (hgt * (1 - gauge) + 20));
      ctx.fillRect(cx - 1.5, top - 6 + dy, 3, 6);
    }
    // beaker: glass with lip
    ctx.fillStyle = 'rgba(210,230,240,0.18)';
    ctx.fillRect(cx - w / 2, top, w, hgt);
    ctx.strokeStyle = 'rgba(120,140,160,0.8)'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 - 5, top - 4); ctx.lineTo(cx - w / 2, top); ctx.lineTo(cx - w / 2, top + hgt);
    ctx.lineTo(cx + w / 2, top + hgt); ctx.lineTo(cx + w / 2, top); ctx.lineTo(cx + w / 2 + 5, top - 4);
    ctx.stroke();
    // zone etched on the glass
    ctx.strokeStyle = overT > 0 ? PALETTE.danger : PALETTE.amber;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(cx - w / 2 + 2, top + hgt * (1 - zone[1]), w - 4, hgt * (zone[1] - zone[0]));
    ctx.setLineDash([]);
    // consolidant fill with wobbling meniscus
    const level = top + hgt * (1 - gauge);
    ctx.fillStyle = overT > 0 ? 'rgba(180,85,60,0.65)' : 'rgba(140,190,120,0.6)';
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + 2, level + Math.sin(time * 5) * 2);
    ctx.quadraticCurveTo(cx, level + Math.sin(time * 5 + 2) * 3, cx + w / 2 - 2, level + Math.sin(time * 5 + 4) * 2);
    ctx.lineTo(cx + w / 2 - 2, top + hgt); ctx.lineTo(cx - w / 2 + 2, top + hgt);
    ctx.closePath(); ctx.fill();
    if (overT > 0) text(ctx, '!', cx, top + hgt + 10, { size: 16, bold: true, align: 'center', color: PALETTE.danger });
  };
  return g;
}

// ---------------------------------------------------------------- mount
function makeMount(g, spec, makeCanvas, extra) {
  const bones = extra.bones || spec.bones || ['piece'];
  const target = extra.boneIndex ?? 0;
  const boneName = extra.boneName || bones[target];
  const mounted = extra.mountedSlots || new Set();
  let sel = target, wobble = 0;

  const n = bones.length;
  const sw = Math.min(84, (PW - 80) / n);
  const rowY = () => g.py + PH - 108;
  const x0 = () => VIEW_W / 2 - (n * sw) / 2;
  const slotBox = i => ({ x: x0() + i * sw + 4, y: rowY(), w: sw - 8, h: 60 });

  g.update = function (dt) {
    this.t += dt;
    wobble = Math.max(0, wobble - dt * 3);
    if (pressed('Escape')) return this.cancel();
    if (pressed('KeyA')) { sel = (sel + n - 1) % n; sfx.ui(); }
    if (pressed('KeyD')) { sel = (sel + 1) % n; sfx.ui(); }
    if (pressed('MouseLeft')) {
      for (let i = 0; i < n; i++) { const b = slotBox(i); if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) { sel = i; break; } }
    }
    if (pressed('Space') || pressed('KeyE') || pressed('MouseLeft')) {
      if (sel === target) { this.status = 'success'; sfx.complete(); }
      else { wobble = 1; sfx.uiBack(); }
    }
  };

  g.render = function (ctx, time) {
    this.frame(ctx, 'MOUNT', 'mount to the skeleton', 'place the bone in its slot');
    // ghost skeleton on the armature
    const cx0 = VIEW_W / 2, standY = rowY() - 12;
    ctx.strokeStyle = '#8E96A4'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx0 - 40, standY); ctx.lineTo(cx0 - 20, this.py + 78);
    ctx.moveTo(cx0 + 40, standY); ctx.lineTo(cx0 + 20, this.py + 78);
    ctx.stroke();
    ctx.fillStyle = '#6E4F33';
    ctx.fillRect(cx0 - 90, standY, 180, 8);
    ctx.save(); ctx.globalAlpha = 0.18;
    const gs = Math.min(300 / (spec.footprint[0] * TILE), 120 / (spec.footprint[1] * TILE), 3);
    drawFossil(ctx, spec, cx0 - spec.footprint[0] * TILE * gs / 2, this.py + 66, makeCanvas, gs);
    ctx.restore();

    // the found bone, large, above the slots
    const [fbw, fbh] = boneFootprint(boneName);
    const fsc = Math.min(1.6, 70 / (fbh * TILE));
    drawBone(ctx, spec, boneName, cx0 - fbw * TILE * fsc / 2, rowY() - 88, makeCanvas, fsc);

    // slots — each rendered as ITS bone glyph, clickable
    bones.forEach((b, i) => {
      const box = slotBox(i);
      const wob = i === sel ? Math.sin(time * 30) * wobble * 3 : 0;
      roundRect(ctx, box.x + wob, box.y, box.w, box.h, 6);
      ctx.fillStyle = mounted.has(i) ? 'rgba(108,154,84,0.22)' : i === sel ? 'rgba(200,121,30,0.18)' : 'rgba(0,0,0,0.06)';
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = i === sel ? (wobble > 0 ? PALETTE.danger : PALETTE.amber) : PALETTE.frameDark; ctx.stroke();
      const [sbw, sbh] = boneFootprint(b);
      const ssc = Math.min((box.h - 22) / (sbh * TILE), (box.w - 10) / (sbw * TILE));
      ctx.save(); ctx.globalAlpha = mounted.has(i) ? 0.5 : 0.9;
      drawBone(ctx, spec, b, box.x + box.w / 2 - sbw * TILE * ssc / 2 + wob, box.y + 4, makeCanvas, ssc);
      ctx.restore();
      text(ctx, boneCategory(b), box.x + box.w / 2 + wob, box.y + box.h - 12, { size: 8, align: 'center', color: mounted.has(i) ? PALETTE.good : PALETTE.creamDim });
      if (mounted.has(i)) text(ctx, '✓', box.x + box.w - 8, box.y + 6, { size: 11, align: 'center', color: PALETTE.good });
    });
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

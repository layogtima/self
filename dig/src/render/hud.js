// HUD v5 - THE VISOR, corner-anchored. Chrome hugs the edges; the world owns
// the middle. Layout per Amit's faceplate sketch:
//
//   ┌─notch────────┐─ top bar ──────── cargo summary · LED ─┐
//   │ power ▰▰▰    │                                        ▏
//   │ ⌂ 142m ▸     │                                        ▏
//   │ quest line…  ╱                                    depth
//   ╰─────────────╱      (t h e   w o r l d)            ruler
//   │                                            toasts ▸   ▏
//   └─ [⚡][◎][🔧] ──── context line ────────────────────────┘
//
// All state arrives through `deps` getters - this module only draws (plus a
// few hit-rects the scene uses to route clicks).

import { VIEW_W, VIEW_H, TILE } from '../config.js';
import { PALETTE } from './palette.js';
import { text, chip, blueprintPanel, measure, roundRect } from './text.js';
import { MATERIALS, MATERIALS_BY_ID, GARBAGE_BY_ID } from '../content/materials.js';
import { STATIONS_BY_ID } from '../content/stations.js';
import { STRATA, realDepthAt, formatDepth } from '../content/strata.js';
import { codexEntry } from '../content/codex.js';
import { pickBlurb } from '../core/lore.js';

const BAR_TOP = 16;             // visor top bar height
const BAR_BOT = 22;             // visor bottom bar height
const CHROME = '#241C16';       // visor frame tone (darker than frameDark)
const CHROME_EDGE = 'rgba(75,227,232,0.28)';
const NOTCH_W = 264;            // top-left notch plate width
const NOTCH_H = 62;             // plate depth below the corner
const NOTCH_CUT = 34;           // chamfer size

/** shared material glyph (cargo summary, build bar, inventory) */
export function drawMatGlyph(ctx, id, x, y, s = 10) {
  const spec = MATERIALS_BY_ID[id];
  ctx.fillStyle = spec?.color || PALETTE.amberSoft;
  if (spec?.glyph === 'shard') {
    ctx.beginPath(); ctx.moveTo(x, y + s); ctx.lineTo(x + s * 0.4, y); ctx.lineTo(x + s * 0.8, y + s); ctx.closePath(); ctx.fill();
  } else if (spec?.glyph === 'cap') {
    ctx.fillRect(x + s * 0.35, y + s * 0.5, s * 0.2, s * 0.5);
    ctx.beginPath(); ctx.arc(x + s * 0.45, y + s * 0.5, s * 0.42, Math.PI, 0); ctx.fill();
  } else if (spec?.glyph === 'clod') {
    ctx.beginPath(); ctx.ellipse(x + s * 0.45, y + s * 0.62, s * 0.45, s * 0.34, 0.2, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillRect(x, y + s * 0.15, s * 0.85, s * 0.85);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x, y + s * 0.15, s * 0.85, s * 0.22);
  }
}

/** tiny procedural icon per buildable (build bar + inventory) */
export function drawBuildIcon(ctx, id, x, y, s = 20) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 20;
  ctx.scale(u, u);
  switch (id) {
    case 'soil':
      ctx.fillStyle = '#B7A98F'; ctx.fillRect(2, 4, 16, 14);
      ctx.fillStyle = '#84765C'; ctx.fillRect(4, 7, 3, 2); ctx.fillRect(11, 12, 3, 2);
      break;
    case 'roof':
      ctx.fillStyle = '#6E4F33'; ctx.fillRect(1, 7, 18, 5);
      ctx.fillStyle = '#8A6A45'; ctx.fillRect(1, 7, 18, 1.6);
      ctx.fillStyle = '#4A3421'; ctx.fillRect(9, 12, 2, 6);
      break;
    case 'smelter':   // brick furnace + chimney + ember mouth (matches the body)
      ctx.fillStyle = '#4A3A34'; ctx.fillRect(2, 6, 13, 12);
      ctx.strokeStyle = '#3A2C28'; ctx.lineWidth = 1;
      for (let r = 0; r < 3; r++) { ctx.beginPath(); ctx.moveTo(2, 9 + r * 3.5); ctx.lineTo(15, 9 + r * 3.5); ctx.stroke(); }
      ctx.fillStyle = '#4E4956'; ctx.fillRect(11, 2, 5, 6);      // chimney
      ctx.fillStyle = '#E0692A'; ctx.fillRect(5, 14, 6, 3);      // ember mouth
      break;
    case 'pyrolysis':   // rounded sealed tank on legs + sight-glass + pipe
      ctx.fillStyle = '#2B2733'; ctx.fillRect(4, 16, 2, 3); ctx.fillRect(13, 16, 2, 3);   // legs
      ctx.fillStyle = '#39423B';
      ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(15, 6); ctx.quadraticCurveTo(17, 11, 15, 16); ctx.lineTo(4, 16); ctx.quadraticCurveTo(2, 11, 4, 6); ctx.fill();
      ctx.fillStyle = '#4E4956'; ctx.fillRect(8, 2, 3, 5);       // top pipe
      ctx.fillStyle = '#16201A'; ctx.beginPath(); ctx.arc(12, 12, 2.6, 0, 7); ctx.fill();
      ctx.strokeStyle = '#9FBE9A'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(12, 12, 2.6, 0, 7); ctx.stroke();   // sight-glass
      break;
    case 'kiln':   // brick dome + vent + silica slot
      ctx.fillStyle = '#5A4A42';
      ctx.beginPath(); ctx.moveTo(3, 18); ctx.quadraticCurveTo(4, 5, 10, 4); ctx.quadraticCurveTo(16, 5, 17, 18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#4A3A34'; ctx.lineWidth = 0.8;
      for (let r = 1; r <= 2; r++) { ctx.beginPath(); ctx.moveTo(4 + r, 18); ctx.quadraticCurveTo(10, 6 + r * 4, 16 - r, 18); ctx.stroke(); }
      ctx.fillStyle = '#3A322E'; ctx.fillRect(8, 3, 4, 3);       // vent
      ctx.fillStyle = '#B39BC0'; ctx.fillRect(8, 11, 4, 7);      // silica glow slot
      break;
    case 'incubator':   // lit glass tank on a plinth
      ctx.fillStyle = '#2E2A34'; ctx.fillRect(3, 16, 14, 3);
      ctx.fillStyle = '#3A3E4A'; ctx.fillRect(4, 3, 12, 14);
      ctx.fillStyle = 'rgba(150,220,170,0.5)'; ctx.fillRect(6, 5, 8, 10);
      ctx.strokeStyle = '#6EA07A'; ctx.lineWidth = 1; ctx.strokeRect(6, 5, 8, 10);
      ctx.fillStyle = 'rgba(230,255,238,0.7)'; ctx.beginPath(); ctx.arc(10, 10, 2, 0, 7); ctx.fill();
      break;
    case 'solar':
      ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, 18); ctx.lineTo(10, 12); ctx.stroke();
      ctx.save(); ctx.translate(10, 12); ctx.rotate(-0.14);
      ctx.fillStyle = '#27405C'; ctx.fillRect(-8, -7, 16, 7);
      ctx.strokeStyle = '#4E6E96'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(-3, 0); ctx.moveTo(2.5, -7); ctx.lineTo(2.5, 0); ctx.stroke();
      ctx.restore();
      break;
    case 'wind-vane':
      ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, 18); ctx.lineTo(10, 6); ctx.stroke();
      ctx.strokeStyle = '#8E96A4'; ctx.lineWidth = 1.6;
      for (let b = 0; b < 3; b++) {
        const a = b * (Math.PI * 2 / 3) - 0.5;
        ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(10 + Math.cos(a) * 6, 6 + Math.sin(a) * 6); ctx.stroke();
      }
      break;
    case 'storage':
      ctx.fillStyle = '#6E4F33'; ctx.fillRect(3, 7, 14, 11);
      ctx.strokeStyle = '#4A3421'; ctx.lineWidth = 1.2;
      ctx.strokeRect(3, 7, 14, 11);
      ctx.beginPath(); ctx.moveTo(3, 7); ctx.lineTo(17, 18); ctx.stroke();
      break;
    case 'beacon':
      ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, 18); ctx.lineTo(10, 7); ctx.stroke();
      ctx.fillStyle = PALETTE.amber; ctx.beginPath(); ctx.arc(10, 5, 3, 0, 7); ctx.fill();
      break;
    case 'lamp-green': case 'lamp-blue': case 'lamp-teal': case 'lamp-amber': {
      const col = { 'lamp-green': '#96DCAA', 'lamp-blue': '#7FB8E8', 'lamp-teal': '#7FE8D8', 'lamp-amber': '#FFD27A' }[id];
      // overhead tube + downward cone (matches the placed object)
      ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(4, 17); ctx.stroke();     // bracket
      ctx.fillStyle = '#3A363F'; ctx.fillRect(3, 3, 14, 3);                    // housing
      ctx.fillStyle = col; ctx.fillRect(4, 5, 12, 1.6);                        // the tube
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(16, 6); ctx.lineTo(18, 18); ctx.lineTo(2, 18); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'lure': {
      ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, 18); ctx.lineTo(10, 8); ctx.stroke();
      ctx.fillStyle = '#7FC4A8'; ctx.beginPath(); ctx.arc(10, 6, 2.6, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(127,196,168,0.6)'; ctx.lineWidth = 1;
      for (const r of [4, 7]) { ctx.beginPath(); ctx.arc(10, 6, r, -0.9, -2.2, true); ctx.stroke(); }   // call rings
      break;
    }
    case 'planter': {
      ctx.fillStyle = '#6E4F33'; ctx.fillRect(4, 13, 12, 5);                   // trough
      ctx.fillStyle = '#5F9A54';
      for (const [x, h] of [[6, 6], [9, 8], [12, 5], [14, 7]]) { ctx.fillRect(x, 13 - h, 1.4, h); }   // sprouts
      ctx.fillStyle = '#C98BA8'; ctx.fillRect(9, 4, 2, 2);
      break;
    }
    case 'terrarium': {
      ctx.fillStyle = 'rgba(150,220,170,0.18)'; ctx.fillRect(3, 5, 14, 12);    // glass
      ctx.strokeStyle = '#6EA07A'; ctx.lineWidth = 1.2; ctx.strokeRect(3, 5, 14, 12);
      ctx.fillStyle = '#5F9A54'; ctx.fillRect(4, 14, 12, 3);                    // soil + plant
      ctx.fillRect(9, 9, 1.4, 5);
      break;
    }
    case 'st-clean':
      ctx.fillStyle = '#C7A98A'; ctx.fillRect(3, 12, 14, 3);
      ctx.strokeStyle = '#4A3421'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(6, 12); ctx.lineTo(11, 4); ctx.stroke();
      ctx.fillStyle = '#E0A24A'; ctx.fillRect(4, 9, 5, 3);
      break;
    case 'st-identify':
      ctx.strokeStyle = '#B39BC0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(9, 9, 5, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, 13); ctx.lineTo(17, 17); ctx.stroke();
      break;
    case 'st-stabilize':
      ctx.fillStyle = '#9FBE9A';
      ctx.beginPath(); ctx.moveTo(10, 4); ctx.quadraticCurveTo(15, 12, 10, 16); ctx.quadraticCurveTo(5, 12, 10, 4); ctx.fill();
      break;
    case 'st-mount':
      ctx.strokeStyle = '#D8B25E'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, 4); ctx.lineTo(10, 14); ctx.moveTo(5, 18); ctx.lineTo(15, 18); ctx.moveTo(10, 14); ctx.lineTo(5, 18); ctx.moveTo(10, 14); ctx.lineTo(15, 18); ctx.stroke();
      break;
    case 'incubator':
      ctx.strokeStyle = '#5C5766'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(10, 11, 6, 8, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(150,220,190,0.4)';
      ctx.beginPath(); ctx.ellipse(10, 11, 4, 6, 0, 0, 7); ctx.fill();
      break;
    default:
      ctx.strokeStyle = PALETTE.creamDim; ctx.lineWidth = 1.5; ctx.strokeRect(4, 4, 12, 12);
  }
  ctx.restore();
}

/**
 * @param {object} deps  ctx, player, world, power, status, inventory, satchel,
 *   collection, build, hazards, cam, toasts (array ref),
 *   state() -> {time, bootT, stunT, home, context, quest, findT}
 */
export function makeHud(deps) {
  const { ctx, player, world, power, status, inventory, satchel, build, hazards, cam } = deps;

  const hudOn = at => deps.state().bootT >= at;

  // ---------------------------------------------------------- geometry (shared)
  function toggleRects() {
    const by = VIEW_H - BAR_BOT - 6;
    return ['laser', 'scan', 'build', 'deconstruct'].map((mode, i) => ({ mode, x: 8 + i * 30, y: by - 22, w: 26, h: 26 }));
  }
  function buildBarRect() {
    const n = build.unlocked().length;
    const cell = 34, w = n * cell + 12;
    return { x: VIEW_W / 2 - w / 2, y: VIEW_H - BAR_BOT - 40, w, h: 40, cell };
  }
  // ---------------------------------------------------------- VISOR FRAME
  function drawFrame(rtime) {
    ctx.fillStyle = CHROME;
    ctx.fillRect(0, 0, VIEW_W, BAR_TOP);
    ctx.fillRect(0, VIEW_H - BAR_BOT, VIEW_W, BAR_BOT);
    ctx.fillStyle = 'rgba(75,227,232,0.12)';
    ctx.fillRect(0, BAR_TOP - 1, VIEW_W, 1);
    ctx.fillRect(0, VIEW_H - BAR_BOT, VIEW_W, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, (rtime * 8 | 0) % BAR_TOP, VIEW_W, 1);
    // corner brackets (skip top-left: the notch owns that corner)
    ctx.strokeStyle = CHROME_EDGE;
    ctx.lineWidth = 1.4;
    const inTop = BAR_TOP + 6, inBot = VIEW_H - BAR_BOT - 6, arm = 14;
    for (const [px, py, dx, dy] of [[VIEW_W - 8, inTop, -1, 1], [8, inBot, 1, -1], [VIEW_W - 8, inBot, -1, -1]]) {
      ctx.beginPath();
      ctx.moveTo(px, py + dy * arm); ctx.lineTo(px, py); ctx.lineTo(px + dx * arm, py);
      ctx.stroke();
    }
    const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.55, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
    vg.addColorStop(0, 'rgba(10,8,14,0)');
    vg.addColorStop(1, 'rgba(10,8,14,0.30)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // ---------------------------------------------------------- TOP-LEFT NOTCH
  // chamfered plate: power · home distance + direction · quest (width-capped)
  function drawNotch() {
    const { time, home, quest } = deps.state();
    if (!hudOn(0.4)) return;
    // plate
    ctx.fillStyle = CHROME;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(NOTCH_W, 0);
    ctx.lineTo(NOTCH_W, NOTCH_H - NOTCH_CUT);
    ctx.lineTo(NOTCH_W - NOTCH_CUT, NOTCH_H);
    ctx.lineTo(0, NOTCH_H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = CHROME_EDGE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(NOTCH_W, 0); ctx.lineTo(NOTCH_W, NOTCH_H - NOTCH_CUT); ctx.lineTo(NOTCH_W - NOTCH_CUT, NOTCH_H); ctx.lineTo(0, NOTCH_H);
    ctx.stroke();

    // row 1: power bar
    const frac = power.frac(), pState = power.state();
    const blink = pState !== 'ok' && Math.sin(time * (pState === 'reserve' ? 10 : 6)) > 0;
    ctx.fillStyle = blink ? PALETTE.danger : PALETTE.amber;
    ctx.beginPath();
    ctx.moveTo(12, 5); ctx.lineTo(8, 11); ctx.lineTo(11, 11); ctx.lineTo(9, 16); ctx.lineTo(15, 9); ctx.lineTo(12, 9); ctx.lineTo(14, 5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(22, 6, 118, 9);
    ctx.fillStyle = pState === 'reserve' ? PALETTE.danger : pState === 'low' ? '#E0A24A' : '#7FC46E';
    ctx.fillRect(22, 6, 118 * frac, 9);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(22, 6, 118, 9);
    text(ctx, `${Math.round(frac * 100)}`, 146, 5, { size: 9, bold: true, color: blink ? PALETTE.danger : PALETTE.parchment });
    if (pState === 'reserve') text(ctx, 'RESERVE', 172, 5, { size: 8, bold: true, color: PALETTE.danger });

    // row 2: home distance + direction chevron (the ONLY home indicator)
    if (hudOn(0.9)) {
      const dist = Math.round(Math.hypot(home.x - player.cx(), home.y - player.cy()) / TILE);
      text(ctx, `⌂ ${dist}m`, 10, 20, { size: 10, bold: true, color: PALETTE.amberSoft });
      const ang = Math.atan2(home.y - player.cy(), home.x - player.cx());
      ctx.save();
      ctx.translate(64, 26);
      ctx.rotate(ang);
      ctx.fillStyle = PALETTE.amberSoft;
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-3, -3.6); ctx.lineTo(-3, 3.6); ctx.closePath(); ctx.fill();
      ctx.restore();
      // condition icons ride the same row, right side
      let ix2 = 90;
      if (status.tier() !== 'dry') {
        const soaked = status.tier() === 'soaked';
        if (!soaked || Math.sin(time * 8) > -0.2) {
          ctx.fillStyle = soaked ? PALETTE.danger : '#7FB2DE';
          ctx.beginPath(); ctx.moveTo(ix2 + 3, 19); ctx.quadraticCurveTo(ix2 + 7, 26, ix2 + 3, 29); ctx.quadraticCurveTo(ix2 - 1, 26, ix2 + 3, 19); ctx.fill();
          text(ctx, soaked ? 'SOAKED' : 'WET', ix2 + 10, 20, { size: 8, bold: true, color: soaked ? PALETTE.danger : '#7FB2DE' });
        }
        ix2 += 56;
      }
      if (hazards.exposure01 > 0 || deps.state().stunT > 0) {
        ctx.fillStyle = 'rgba(140,180,90,0.9)';
        ctx.beginPath(); ctx.arc(ix2 + 3, 24, 3.6, 0, 7); ctx.fill();
        text(ctx, deps.state().stunT > 0 ? 'STUNNED' : 'GAS', ix2 + 10, 20, { size: 8, bold: true, color: '#8CB45A' });
      }
    }

    // row 3 (the tapering tail): quest ticker, width-restricted, ≤2 lines
    if (hudOn(2.4) && quest) {
      const maxW = NOTCH_W - 52;
      const full = `${quest.title.toUpperCase()} · ${quest.line}`;
      let line1 = full, line2 = '';
      if (measure(ctx, full, 8, false) > maxW) {
        // greedy wrap at word boundaries
        const words = full.split(' ');
        line1 = '';
        let i = 0;
        while (i < words.length && measure(ctx, line1 + words[i] + ' ', 8, false) <= maxW) line1 += words[i++] + ' ';
        line2 = words.slice(i).join(' ');
        while (measure(ctx, line2, 8, false) > maxW - 20 && line2.length > 3) line2 = line2.slice(0, -4) + '…';
      }
      text(ctx, line1, 10, 36, { size: 8, color: 'rgba(233,220,188,0.8)' });
      if (line2) text(ctx, line2, 10, 47, { size: 8, color: 'rgba(233,220,188,0.8)' });
    }
  }

  // ---------------------------------------------------------- TOP BAR (cargo summary)
  function drawTopBar() {
    if (!hudOn(1.4)) return;
    const { time, findT } = deps.state();
    const frags = satchel.items;
    const mats = inventory.entries();
    const rawN = inventory.garbageCount();

    // right-aligned inline summary: bones · up to 4 materials · junk · LED
    let x = VIEW_W - 22;
    // find LED (far right)
    const led = findT > 0 ? (Math.sin(time * 12) > 0 ? 1 : 0.15) : frags.length ? 0.4 : 0.08;
    ctx.fillStyle = `rgba(224,162,74,${led})`;
    ctx.beginPath(); ctx.arc(x + 8, 8, 3, 0, Math.PI * 2); ctx.fill();

    if (rawN > 0) {
      const t2 = `junk ×${rawN}`;
      x -= measure(ctx, t2, 9, true) + 16;
      ctx.fillStyle = '#8FA3B8';
      ctx.fillRect(x, 6, 5, 3.4); ctx.fillRect(x + 3.4, 3.6, 3.4, 3.4);
      text(ctx, t2, x + 11, 4, { size: 9, bold: true, color: '#8FA3B8' });
    }
    const shown = mats.slice(0, 4);
    for (let i = shown.length - 1; i >= 0; i--) {
      const [id, n] = shown[i];
      const t2 = `${n}`;
      x -= measure(ctx, t2, 9, true) + 24;
      drawMatGlyph(ctx, id, x, 4, 8);
      text(ctx, t2, x + 11, 4, { size: 9, bold: true, color: PALETTE.parchment });
    }
    if (mats.length > 4) { x -= 22; text(ctx, `+${mats.length - 4}`, x, 4, { size: 9, color: PALETTE.creamDim }); }
    // bones
    {
      const t2 = `×${frags.length}`;
      x -= measure(ctx, t2, 9, true) + 26;
      ctx.save(); ctx.translate(x + 6, 8); ctx.rotate(-0.5);
      ctx.fillStyle = '#CFC5A9';
      ctx.fillRect(-4.5, -1.3, 9, 2.6);
      ctx.beginPath(); ctx.arc(-4.5, 0, 2, 0, 7); ctx.arc(4.5, 0, 2, 0, 7); ctx.fill();
      ctx.restore();
      text(ctx, t2, x + 14, 4, { size: 9, bold: true, color: PALETTE.parchment });
    }
  }

  // ---------------------------------------------------------- DEPTH RULER (right edge)
  function drawDepthRuler() {
    if (!hudOn(0.9)) return;
    const depth = Math.max(0, world.depthOfRow(player.tx(), Math.floor((player.y + player.h) / TILE)));
    const rw = 5;
    const rx = VIEW_W - 8 - rw;
    const ry0 = BAR_TOP + 30, rh = VIEW_H - BAR_BOT - ry0 - 30;
    if (rh < 120) return;
    const n = STRATA.length;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = STRATA[i].colors.base;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(rx, ry0 + (i / n) * rh, rw, rh / n + 0.5);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(36,28,22,0.9)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(rx - 0.5, ry0 - 0.5, rw + 1, rh + 1);
    ctx.fillStyle = 'rgba(233,220,188,0.4)';
    for (let i = 1; i < n; i++) ctx.fillRect(rx - 3, ry0 + (i / n) * rh, 3, 1);
    // caret points LEFT at the current position
    const si = STRATA.findIndex(s2 => depth >= s2.depth[0] && (depth < s2.depth[1] || !Number.isFinite(s2.depth[1])));
    const band = STRATA[Math.max(0, si)];
    const to = Number.isFinite(band.depth[1]) ? band.depth[1] : band.depth[0] + 80;
    const within = Math.max(0, Math.min(1, (depth - band.depth[0]) / Math.max(1, to - band.depth[0])));
    const cy = ry0 + ((Math.max(0, si) + within) / n) * rh;
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath(); ctx.moveTo(rx - 4, cy); ctx.lineTo(rx - 10, cy - 4); ctx.lineTo(rx - 10, cy + 4); ctx.closePath(); ctx.fill();
    const label = formatDepth(realDepthAt(depth));
    const lw = measure(ctx, label, 10, true) + 8;
    ctx.fillStyle = 'rgba(20,16,22,0.65)';
    roundRect(ctx, rx - 12 - lw, cy - 8, lw, 15, 4); ctx.fill();
    text(ctx, label, rx - 12 - lw + 4, cy - 5, { size: 10, bold: true, color: PALETTE.amber });
  }

  // ---------------------------------------------------------- BOTTOM BAR + MODE TOGGLES
  function drawModeIcon(mode, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    const u = s / 20;
    ctx.scale(u, u);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.8;
    if (mode === 'laser') {           // diode firing a beam
      ctx.fillRect(2, 8, 7, 5);
      ctx.beginPath(); ctx.moveTo(9, 10.5); ctx.lineTo(18, 10.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(18, 10.5, 1.6, 0, 7); ctx.fill();
    } else if (mode === 'scan') {     // reticle
      ctx.beginPath(); ctx.arc(10, 10, 5.4, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(10, 6); ctx.moveTo(10, 14); ctx.lineTo(10, 18);
      ctx.moveTo(2, 10); ctx.lineTo(6, 10); ctx.moveTo(14, 10); ctx.lineTo(18, 10); ctx.stroke();
      ctx.fillRect(9, 9, 2, 2);
    } else if (mode === 'build') {    // constructor: block + wrench
      ctx.strokeRect(3, 9, 9, 9);
      ctx.beginPath(); ctx.arc(14, 6, 3.4, Math.PI * 0.2, Math.PI * 1.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12.4, 8.4); ctx.lineTo(9, 12); ctx.stroke();
    } else {                          // deconstructor: block coming apart + pry-bar
      ctx.strokeRect(3, 9, 9, 9);
      ctx.beginPath(); ctx.moveTo(6.5, 9); ctx.lineTo(9.5, 18); ctx.stroke();   // crack
      ctx.beginPath(); ctx.moveTo(11, 12); ctx.lineTo(17, 4); ctx.stroke();     // bar
      ctx.beginPath(); ctx.arc(17.4, 3.6, 1.8, Math.PI * 0.4, Math.PI * 1.5); ctx.stroke();   // hook
    }
    ctx.restore();
  }

  function drawBottomBar() {
    const { context } = deps.state();
    const by = VIEW_H - BAR_BOT;
    // mode toggles (left, riding the bar edge)
    if (hudOn(2.9)) {
      const MODE_COL = { laser: PALETTE.amber, scan: '#4BE3E8', build: '#9FBE9A', deconstruct: '#E88A6A' };
      const active = build.active ? 'build'
        : player.tool === 'scan' ? 'scan'
        : player.tool === 'deconstruct' ? 'deconstruct' : 'laser';
      for (const r of toggleRects()) {
        const on = r.mode === active;
        const lift = on ? -3 : 0;
        ctx.fillStyle = on ? '#2E241C' : CHROME;
        roundRect(ctx, r.x, r.y + lift, r.w, r.h, 6); ctx.fill();
        if (on) { ctx.strokeStyle = PALETTE.amber; ctx.lineWidth = 1.6; roundRect(ctx, r.x, r.y + lift, r.w, r.h, 6); ctx.stroke(); }
        else { ctx.strokeStyle = 'rgba(233,220,188,0.18)'; ctx.lineWidth = 1; roundRect(ctx, r.x, r.y + lift, r.w, r.h, 6); ctx.stroke(); }
        drawModeIcon(r.mode, r.x + 3, r.y + 3 + lift, 20, on ? MODE_COL[r.mode] : 'rgba(233,220,188,0.45)');
      }
      const label = { build: 'CONSTRUCTOR', scan: 'SCANNER', deconstruct: 'DECONSTRUCTOR', laser: `LASER mk${player.laserMk}` }[active];
      text(ctx, label, 130, by + 6, { size: 9, bold: true, color: MODE_COL[active] });
    }
    // context line (centre)
    if (context) text(ctx, context, VIEW_W / 2, by + 6, { size: 10, bold: true, align: 'center', color: PALETTE.parchment });
  }

  // ---------------------------------------------------------- TOASTS (BR)
  function drawToasts() {
    const toasts = deps.toasts || [];
    toasts.forEach((t2, i) => {
      ctx.globalAlpha = Math.min(1, t2.life * 1.5);
      const tw = measure(ctx, t2.text, 10, true);
      const w = tw + 24, h = 18;
      const x = VIEW_W - w - 24, y = VIEW_H - BAR_BOT - 26 - i * (h + 4);
      ctx.fillStyle = CHROME;
      roundRect(ctx, x, y, w, h, 5); ctx.fill();
      ctx.fillStyle = t2.color;
      ctx.fillRect(x + 4, y + 4, 3, h - 8);
      text(ctx, t2.text, x + 13, y + 4, { size: 10, bold: true, color: PALETTE.parchment });
      ctx.globalAlpha = 1;
    });
  }

  // ---------------------------------------------------------- BUILD BAR v3
  function drawBuildBar() {
    const items = build.unlocked();
    const cur = build.current();
    const r = buildBarRect();
    chip(ctx, r.x, r.y, r.w, r.h - 2, { r: 8, fill: CHROME, border: null });
    const hover = build.hoverIndex;
    items.forEach((b2, i) => {
      const cx2 = r.x + 6 + i * r.cell;
      const isSel = b2 === cur;
      const afford = inventory.canAfford(b2.cost);
      const lift = isSel ? -3 : 0;
      if (isSel) {
        ctx.strokeStyle = PALETTE.amber; ctx.lineWidth = 1.6;
        roundRect(ctx, cx2 - 1, r.y + 5 + lift, r.cell - 4, 30, 6); ctx.stroke();
      }
      if (afford) drawBuildIcon(ctx, b2.id, cx2 + 3, r.y + 9 + lift, 22);
      else {
        ctx.save();
        ctx.globalAlpha = 0.30;
        drawBuildIcon(ctx, b2.id, cx2 + 3, r.y + 9 + lift, 22);
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#14100C';
        roundRect(ctx, cx2 + 1, r.y + 7 + lift, r.cell - 8, 26, 4); ctx.fill();
        ctx.restore();
      }
    });
    const tipIdx = hover >= 0 ? hover : items.indexOf(cur);
    const b2 = items[tipIdx];
    if (b2) drawBuildTooltip(b2, r.x + 6 + tipIdx * r.cell + r.cell / 2, r.y - 8);
  }

  function drawBuildTooltip(b2, cx2, bottomY) {
    const costs = Object.entries(b2.cost);
    const blurb = pickBlurb(`build.${b2.id}`, '', 0);
    const w = Math.max(measure(ctx, b2.name, 11, true) + 20, Math.min(220, measure(ctx, blurb, 8) + 20), costs.length * 30 + 20);
    const h = 44 + (blurb ? 12 : 0);
    let x = Math.max(8, Math.min(VIEW_W - w - 8, cx2 - w / 2));
    const y = bottomY - h;
    chip(ctx, x, y, w, h, { r: 8, fill: PALETTE.frameDark });
    text(ctx, b2.name, x + 10, y + 6, { size: 11, bold: true, color: PALETTE.amber });
    let cx3 = x + 10;
    for (const [id, n] of costs) {
      drawMatGlyph(ctx, id, cx3, y + 22, 9);
      const enough = inventory.count(id) >= n;
      text(ctx, `${n}`, cx3 + 12, y + 21, { size: 10, bold: true, color: enough ? PALETTE.parchment : '#E85B4A' });
      cx3 += 30;
    }
    if (blurb) text(ctx, blurb.length > 46 ? blurb.slice(0, 45) + '…' : blurb, x + 10, y + 36, { size: 8, color: PALETTE.creamDim });
  }

  // ---------------------------------------------------------- BOOT
  function drawBootOverlay(rtime) {
    const { bootT } = deps.state();
    const p = Math.min(1, bootT / 3.5);
    ctx.fillStyle = `rgba(5,7,12,${(0.85 * (1 - p)).toFixed(2)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = `rgba(75,227,232,${(0.05 * (1 - p)).toFixed(3)})`;
    for (let y = (rtime * 60 | 0) % 3; y < VIEW_H; y += 3) ctx.fillRect(0, y, VIEW_W, 1);
    if (bootT < 1.2) text(ctx, 'OPTICS ONLINE', VIEW_W / 2, VIEW_H / 2 - 8, { size: 13, bold: true, align: 'center', color: '#4BE3E8' });
  }

  // ---------------------------------------------------------- INVENTORY (I)
  function drawInventoryOverlay(rtime) {
    ctx.fillStyle = 'rgba(20,16,12,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const pw = VIEW_W - 200, ph = VIEW_H - 100, px = 100, py = 50;
    blueprintPanel(ctx, px, py, pw, ph, { frameW: 10, r: 16 });
    text(ctx, 'HOLD MANIFEST', px + 28, py + 22, { size: 20, bold: true });
    text(ctx, `laser mk${player.laserMk} · I or Esc closes`, px + pw - 28, py + 26, { size: 10, align: 'right', color: PALETTE.creamDim });

    let y2 = py + 60;
    text(ctx, 'MATERIALS', px + 28, y2, { size: 11, bold: true, color: PALETTE.creamDim });
    y2 += 20;
    const owned = MATERIALS.filter(m => inventory.count(m.id) > 0);
    if (!owned.length) { text(ctx, 'nothing yet - dig, harvest, reclaim', px + 32, y2, { size: 11, color: PALETTE.creamDim }); y2 += 22; }
    for (const m of owned) {
      drawMatGlyph(ctx, m.id, px + 32, y2 + 1, 12);
      text(ctx, `${m.name}`, px + 52, y2, { size: 13, bold: true });
      text(ctx, `×${inventory.count(m.id)}`, px + 190, y2, { size: 13, bold: true, color: PALETTE.amber });
      text(ctx, m.use || '', px + 236, y2 + 2, { size: 10, color: PALETTE.creamDim });
      y2 += 22;
    }

    const junkCounts = {};
    for (const t2 of inventory.garbage) junkCounts[t2] = (junkCounts[t2] || 0) + 1;
    const junkTypes = Object.entries(junkCounts);
    if (junkTypes.length) {
      y2 += 8;
      text(ctx, 'RAW JUNK (each machine takes its own kind)', px + 28, y2, { size: 11, bold: true, color: PALETTE.creamDim });
      y2 += 20;
      for (const [t2, n] of junkTypes) {
        const entry = codexEntry(t2);
        const g = GARBAGE_BY_ID[t2];
        text(ctx, entry?.name || t2, px + 52, y2, { size: 12, bold: true, color: '#8FA3B8' });
        text(ctx, `×${n}`, px + 230, y2, { size: 12, bold: true, color: PALETTE.amber });
        const yields = Object.keys(g?.yields || {}).map(id => MATERIALS_BY_ID[id]?.name.toLowerCase()).join(', ');
        text(ctx, `→ ${yields}`, px + 276, y2 + 1, { size: 10, color: PALETTE.creamDim });
        y2 += 20;
      }
    }

    const frags = satchel.items;
    y2 += 8;
    text(ctx, `SATCHEL (${frags.length} bones)`, px + 28, y2, { size: 11, bold: true, color: PALETTE.creamDim });
    y2 += 20;
    for (const f of frags.slice(0, 6)) {
      const st = STATIONS_BY_ID[Object.keys(STATIONS_BY_ID).find(k => STATIONS_BY_ID[k].input === f.state)];
      text(ctx, `${f.bone}`, px + 52, y2, { size: 12, bold: true });
      text(ctx, f.state, px + 190, y2, { size: 11, color: PALETTE.amberSoft });
      text(ctx, st ? `next: ${st.name}` : f.state === 'mounted' ? 'mounted' : '', px + 286, y2 + 1, { size: 10, color: PALETTE.creamDim });
      y2 += 20;
    }
    if (frags.length > 6) text(ctx, `…and ${frags.length - 6} more`, px + 52, y2, { size: 10, color: PALETTE.creamDim });
  }

  return {
    BAR_TOP, BAR_BOT,
    buildBarRect,
    /** 'laser' | 'scan' | 'build' | 'deconstruct' | null - toggle under (mx,my) */
    modeToggleAt(mx, my) {
      for (const r of toggleRects()) {
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y - 3 && my <= r.y + r.h) return r.mode;
      }
      return null;
    },
    /** rects where mouse clicks belong to the UI, not the world */
    uiHotRects() {
      const rects = [
        { x: 0, y: 0, w: NOTCH_W, h: NOTCH_H },                                  // notch
        { x: 0, y: VIEW_H - BAR_BOT - 32, w: 130, h: BAR_BOT + 32 },             // toggle cluster (4 modes)
      ];
      if (build.active) { const r = buildBarRect(); rects.push({ x: r.x, y: r.y - 60, w: r.w, h: r.h + 60 }); }
      return rects;
    },
    draw(rtime) {
      drawFrame(rtime);
      drawNotch();
      drawTopBar();
      drawDepthRuler();
      drawBottomBar();
      drawToasts();
      if (build.active) drawBuildBar();
    },
    drawBootOverlay,
    drawInventoryOverlay,
  };
}

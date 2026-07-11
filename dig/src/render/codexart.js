// Codex illustrations: a tiny picture for every scannable thing, drawn from the
// SAME primitives the world uses (fauna art, scenery sprites, cave-prop vectors,
// fluid swatches, strata bands) so the card always matches what you scanned.
// Everything is drawn in a nominal 24x24 box and scaled to fit.

import { PALETTE } from './palette.js';
import { FAUNA_ART } from './fauna.js';
import { FAUNA_BY_ID } from '../content/fauna.js';
import { drawSprite, hasSprite, getFaunaSprite } from './sprites.js';
import { STRATA, STRATA_BY_ID } from '../content/strata.js';

const N = 24;   // nominal box

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} entry  codex entry
 * @param {number} x @param {number} y  top-left of the box
 * @param {number} size box side in px
 * @param {number} [time] for gentle animation on the big card
 */
export function drawCodexArt(ctx, entry, x, y, size, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / N, size / N);
  ctx.beginPath(); ctx.rect(0, 0, N, N); ctx.clip();

  const id = entry.id;
  if (entry.category === 'creature') drawCreature(ctx, id, time);
  else if (id.startsWith('rock-')) drawRock(ctx, id.slice(5));
  else if (entry.category === 'fluid') drawFluid(ctx, id, time);
  else if (entry.category === 'salvage') drawSalvage(ctx, id);
  else drawFeatureOrFlora(ctx, id, time);

  ctx.restore();
}

// ---- creatures: real sprite where one exists (matches the world), else the
// registry vector art, else inline for the ambient-only kinds
function drawCreature(ctx, id, time) {
  const spec = FAUNA_BY_ID[id];
  // prefer the actual PNG the world draws, so the card can never diverge from it
  const spr = getFaunaSprite(spec?.draw || id);
  if (spr && spr.box) {
    ctx.strokeStyle = 'rgba(74,52,33,0.35)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(2, 20.5); ctx.lineTo(22, 20.5); ctx.stroke();
    const b = spr.box;
    let dh = 19, dw = dh * (b.sw / b.sh);
    if (dw > 20) { dw = 20; dh = dw * (b.sh / b.sw); }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr.img, b.sx, b.sy, b.sw, b.sh, 12 - dw / 2, 20 - dh, dw, dh);
    return;
  }
  if (spec || FAUNA_ART[id]) {
    // feet on a little ground line, posed mid-walk
    ctx.strokeStyle = 'rgba(74,52,33,0.35)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(2, 20.5); ctx.lineTo(22, 20.5); ctx.stroke();
    ctx.save();
    ctx.translate(12, 20);
    const f = { t: time || 1.2, state: 'walk', dir: 1, spec };
    (FAUNA_ART[spec?.draw || id] || FAUNA_ART.generic)(ctx, f, time);
    ctx.restore();
    return;
  }
  // ambient-only kinds drawn as in the world
  switch (id) {
    case 'firefly': {
      const pulse = 0.5 + Math.abs(Math.sin(time * 3)) * 0.5;
      ctx.fillStyle = `rgba(255,210,90,${(0.25 * pulse).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(12, 12, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3A3028'; ctx.fillRect(10, 9, 4, 4);
      ctx.fillStyle = `rgba(255,210,90,${pulse.toFixed(2)})`; ctx.fillRect(10.6, 12.5, 2.8, 3);
      break;
    }
    case 'butterfly': {
      const open = 0.5 + Math.abs(Math.sin(time * 6)) * 0.5;
      ctx.fillStyle = 'rgba(216,160,184,0.35)';   // glasswing: mostly see-through
      ctx.strokeStyle = '#8A7355'; ctx.lineWidth = 0.8;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(12 + s * 4 * open, 11, 4, 6, s * 0.5, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#3A3028'; ctx.fillRect(11.4, 7, 1.2, 10);
      break;
    }
    case 'bird': {
      ctx.strokeStyle = 'rgba(40,34,30,0.85)'; ctx.lineWidth = 1.2;
      for (const [bx, by] of [[8, 10], [15, 8], [12, 15]]) {
        const flap = Math.sin(time * 9 + bx) * 2;
        ctx.beginPath(); ctx.moveTo(bx - 3.4, by - flap); ctx.lineTo(bx, by); ctx.lineTo(bx + 3.4, by - flap); ctx.stroke();
      }
      break;
    }
    case 'bat': {
      const flap = Math.sin(time * 12) * 2.4;
      ctx.strokeStyle = 'rgba(20,16,22,0.95)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(6, 12 - flap); ctx.lineTo(12, 13); ctx.lineTo(18, 12 - flap); ctx.stroke();
      ctx.fillStyle = '#141016'; ctx.fillRect(11, 11.4, 2, 3);
      break;
    }
    case 'glowworm': {
      ctx.fillStyle = '#4A3421';
      ctx.fillRect(0, 0, N, 7);   // cave ceiling
      for (let i = 0; i < 6; i++) {
        const gx = 3 + i * 3.4, gy = 9 + (i % 3) * 2.5;
        const pulse = 0.5 + Math.sin(time * 1.4 + i * 1.7) * 0.4;
        ctx.strokeStyle = 'rgba(160,235,190,0.25)';
        ctx.beginPath(); ctx.moveTo(gx, 7); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.fillStyle = `rgba(160,235,190,${(0.9 * pulse).toFixed(2)})`;
        ctx.fillRect(gx - 0.8, gy, 1.6, 1.6);
      }
      break;
    }
    default: FAUNA_ART.generic(ctx, { t: time, state: 'idle', dir: 1 }, time);
  }
}

// ---- features + flora: same shapes drawCaveProps/drawScenery use
function drawFeatureOrFlora(ctx, id, time) {
  // any scenery object the world draws from a sprite (trees, reeds, shard, bush,
  // boulder, flowers, ...) uses that same sprite here so the card matches
  if (hasSprite('scenery', id)) { drawSprite(ctx, 'scenery', id, 12, 23, 20, 22); return; }
  switch (id) {
    case 'mushroom': {
      ctx.fillStyle = '#4A3A2C'; ctx.fillRect(0, 20, N, 4);   // cave floor
      const pulse = 0.7 + Math.sin(time * 2) * 0.3;
      for (let m = 0; m < 3; m++) {
        const mx = 5 + m * 6, stem = 4 + (m % 3) * 1.6;
        ctx.fillStyle = '#C8B890';
        ctx.fillRect(mx, 20 - stem, 2, stem);
        ctx.fillStyle = `rgba(150,220,170,${(0.9 * pulse).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(mx + 1, 20 - stem, 3.4, Math.PI, 0); ctx.fill();
      }
      break;
    }
    case 'stalactite':
      ctx.fillStyle = '#4A3421'; ctx.fillRect(0, 0, N, 4);
      ctx.fillStyle = '#8A7A66';
      ctx.beginPath(); ctx.moveTo(7, 4); ctx.lineTo(12, 19); ctx.lineTo(17, 4); ctx.closePath(); ctx.fill();
      break;
    case 'stalagmite':
      ctx.fillStyle = '#4A3A2C'; ctx.fillRect(0, 20, N, 4);
      ctx.fillStyle = '#8A7A66';
      ctx.beginPath(); ctx.moveTo(7, 20); ctx.lineTo(12, 5); ctx.lineTo(17, 20); ctx.closePath(); ctx.fill();
      break;
    case 'roots': {
      ctx.fillStyle = '#4A3421'; ctx.fillRect(0, 0, N, 4);
      ctx.strokeStyle = '#6E5237'; ctx.lineWidth = 1.4;
      for (const [rx, len] of [[7, 13], [12, 17], [17, 11]]) {
        const sway = Math.sin(time * 1.8 + rx) * 1.6;
        ctx.beginPath(); ctx.moveTo(rx, 4); ctx.quadraticCurveTo(rx + sway, 4 + len * 0.6, rx + sway, 4 + len); ctx.stroke();
      }
      break;
    }
    case 'obsidian': {
      ctx.fillStyle = '#1A1620'; ctx.fillRect(2, 4, 20, 18);
      ctx.fillStyle = '#2C2636';
      ctx.beginPath(); ctx.moveTo(2, 8); ctx.lineTo(22, 5); ctx.lineTo(22, 22); ctx.lineTo(2, 22); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(180,170,210,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(14, 18); ctx.moveTo(16, 8); ctx.lineTo(12, 20); ctx.stroke();
      const g = 0.4 + Math.sin(time * 3) * 0.3;
      ctx.fillStyle = `rgba(210,200,235,${g.toFixed(2)})`; ctx.fillRect(15, 7, 3, 2);
      break;
    }
    case 'crystal':
    case 'tree-shardspire': {
      ctx.fillStyle = '#4A3A2C'; ctx.fillRect(0, 20, N, 4);
      const tw = 0.6 + Math.sin(time * 3) * 0.4;
      ctx.fillStyle = `rgba(200,180,230,${(0.6 + tw * 0.35).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(6, 20); ctx.lineTo(9, 8); ctx.lineTo(12, 20);
      ctx.moveTo(12, 20); ctx.lineTo(16, 3); ctx.lineTo(20, 20);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(15.4, 6); ctx.lineTo(14, 18); ctx.stroke();
      break;
    }
    default: {   // generic leafy fallback
      ctx.fillStyle = PALETTE.wood || '#6E4F33'; ctx.fillRect(11, 12, 2.4, 10);
      ctx.fillStyle = '#6C9A54';
      ctx.beginPath(); ctx.arc(12, 9, 6.5, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawFluid(ctx, id, time) {
  const body = { water: 'rgba(70,130,170,0.75)', brine: 'rgba(90,150,140,0.8)', tar: 'rgba(24,20,24,0.95)', lava: 'rgba(225,105,40,0.95)' }[id] || 'rgba(70,130,170,0.75)';
  ctx.fillStyle = '#4A3A2C'; ctx.fillRect(0, 0, 3, N); ctx.fillRect(N - 3, 0, 3, N); ctx.fillRect(0, N - 3, N, 3);   // basin
  ctx.fillStyle = body;
  ctx.fillRect(3, 9, N - 6, N - 12);
  // surface line per fluid
  if (id === 'water') { ctx.fillStyle = 'rgba(180,220,240,0.7)'; ctx.fillRect(3, 9 + Math.sin(time * 2) * 1, N - 6, 1.6); }
  else if (id === 'brine') { ctx.fillStyle = 'rgba(210,225,210,0.8)'; ctx.fillRect(3, 9, N - 6, 1.2); }
  else if (id === 'tar') { ctx.fillStyle = 'rgba(90,80,100,0.5)'; ctx.fillRect(5 + ((time * 3) % 10), 9.5, 4, 1.2); }
  else { const g = 0.6 + Math.sin(time * 3) * 0.4; ctx.fillStyle = `rgba(255,${200 + g * 40 | 0},120,0.9)`; ctx.fillRect(3, 9, N - 6, 2); }
}

function drawSalvage(ctx, id) {
  ctx.fillStyle = '#7A6A50'; ctx.fillRect(0, 0, N, N);   // buried in soil
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, N, N);
  if (id === 'scrap-metal') {
    ctx.fillStyle = '#AAB4C3'; ctx.fillRect(4, 11, 14, 3); ctx.fillRect(11, 5, 3, 14);
    ctx.fillStyle = '#965A3C'; ctx.fillRect(15, 13, 3, 3);
  } else if (id === 'bottle-cluster') {
    ctx.fillStyle = 'rgba(150,200,230,0.85)'; ctx.fillRect(7, 8, 4.4, 11); ctx.fillRect(13, 10, 4.4, 9);
    ctx.fillStyle = 'rgba(235,248,255,0.95)'; ctx.fillRect(7, 8, 1.6, 6);
    ctx.fillStyle = '#4E6E96'; ctx.fillRect(7.6, 6, 3, 2.4); ctx.fillRect(13.6, 8, 3, 2.4);
  } else if (id === 'tyre-chunk') {
    ctx.strokeStyle = '#282630'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(12, 14, 7, Math.PI * 1.0, Math.PI * 2.0); ctx.stroke();
    ctx.strokeStyle = '#3E3A46'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(12, 14, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else {   // circuit board
    ctx.fillStyle = '#46825A'; ctx.fillRect(5, 8, 14, 9);
    ctx.fillStyle = '#DCB450';
    ctx.fillRect(7, 10, 2, 5); ctx.fillRect(11, 10, 2, 5); ctx.fillRect(15, 10, 2, 5);
    ctx.strokeStyle = 'rgba(220,180,80,0.6)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(5, 13); ctx.lineTo(19, 13); ctx.stroke();
  }
}

function drawRock(ctx, stratumId) {
  const s = STRATA_BY_ID[stratumId] || STRATA[0];
  // layered band swatch + speckle, like a core sample
  ctx.fillStyle = s.colors.base; ctx.fillRect(0, 0, N, N);
  ctx.fillStyle = s.colors.alt; ctx.fillRect(0, 6, N, 5); ctx.fillRect(0, 16, N, 4);
  ctx.fillStyle = s.colors.band; ctx.fillRect(0, 11, N, 1.6); ctx.fillRect(0, 21, N, 1.4);
  ctx.fillStyle = s.colors.speckle;
  for (let i = 0; i < 9; i++) ctx.fillRect((i * 7.3) % (N - 2) + 1, (i * 5.1 + 2) % (N - 2) + 1, 1.6, 1.6);
}

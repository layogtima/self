// Tile rendering — ONE master texture, palette-ramped per stratum, for a tight
// consistent look. At boot we take a single 64×64 seamless master (assets/tiles/
// master.png — chunky cracked rock) and remap its LUMINANCE into each stratum's
// 4-colour ramp, baking a per-stratum 64×64 canvas (front) plus a darkened
// desaturated copy (the carved BACK WALL behind dug air). If the master is
// missing, a procedural atlas is the fallback.
//
//   drawTile(ctx, strataIndex, tx, ty, dx, dy)   — solid rock face
//   drawBack(ctx, strataIndex, tx, ty, dx, dy)   — back wall behind air
//   drawPlaced / grass cap helpers

import { TILE } from '../config.js';
import { STRATA } from '../content/strata.js';
import { makeRng } from '../core/rng.js';

const VARIANTS = 6;
const MASTER = 64;

export function buildTileset(makeCanvas, makeImage) {
  const front = {};   // stratumId -> {canvas} (ramped master)
  const back = {};    // stratumId -> {canvas} (darkened)
  let masterReady = false;

  // procedural atlas fallback (also the immediate look until the master loads)
  const atlas = makeCanvas(VARIANTS * TILE, (STRATA.length + 1) * TILE);
  const a = atlas.getContext('2d');
  const rng = makeRng(20240607);
  STRATA.forEach((s, si) => { for (let v = 0; v < VARIANTS; v++) paintTile(a, v * TILE, si * TILE, s, v, rng); });
  const placed = { colors: { base: '#B7A98F', alt: '#AC9E83', band: '#9D8F74', speckle: '#84765C' }, texture: { banding: 0.2, speckle: 0.5 } };
  for (let v = 0; v < VARIANTS; v++) paintTile(a, v * TILE, STRATA.length * TILE, placed, v, rng);

  // load + ramp the master
  if (makeImage) {
    const img = makeImage('assets/tiles/master.png');
    if (img) {
      img.onload = () => { try { rampAll(img); masterReady = true; } catch { /* keep procedural */ } };
      img.onerror = () => {};
    }
  }

  function rampAll(img) {
    // read the master's luminance once
    const mc = makeCanvas(MASTER, MASTER);
    const mctx = mc.getContext('2d');
    mctx.drawImage(img, 0, 0, MASTER, MASTER);
    const src = mctx.getImageData(0, 0, MASTER, MASTER);
    const lum = new Float32Array(MASTER * MASTER);
    for (let i = 0; i < lum.length; i++) {
      const r = src.data[i * 4], g = src.data[i * 4 + 1], b = src.data[i * 4 + 2];
      lum[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }
    for (const s of STRATA) { front[s.id] = ramp(s.colors, lum, 1); back[s.id] = ramp(s.colors, lum, 0.5); }
    front.placed = ramp(placed.colors, lum, 1);
  }

  // map luminance → a 4-stop ramp (speckle→band→alt→base dark→light), × brightness
  function ramp(colors, lum, mul) {
    const stops = [hex(colors.speckle), hex(colors.band), hex(colors.alt), hex(colors.base)];
    const cv = makeCanvas(MASTER, MASTER);
    const ctx = cv.getContext('2d');
    const out = ctx.createImageData(MASTER, MASTER);
    for (let i = 0; i < lum.length; i++) {
      const l = lum[i];
      const f = l * (stops.length - 1);
      const k = Math.min(stops.length - 2, Math.floor(f));
      const t = f - k;
      const c0 = stops[k], c1 = stops[k + 1];
      out.data[i * 4] = (c0[0] + (c1[0] - c0[0]) * t) * mul;
      out.data[i * 4 + 1] = (c0[1] + (c1[1] - c0[1]) * t) * mul;
      out.data[i * 4 + 2] = (c0[2] + (c1[2] - c0[2]) * t) * mul;
      out.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    return cv;
  }

  const blitCrop = (ctx, cv, tx, ty, dx, dy) => {
    const sx = ((tx * TILE) % MASTER + MASTER) % MASTER;
    const sy = ((ty * TILE) % MASTER + MASTER) % MASTER;
    ctx.drawImage(cv, sx, sy, TILE, TILE, dx, dy, TILE, TILE);
  };

  return {
    canvas: atlas,
    get ready() { return masterReady; },

    drawTile(ctx, strataIndex, tx, ty, dx, dy) {
      const s = STRATA[strataIndex];
      if (masterReady && front[s.id]) { blitCrop(ctx, front[s.id], tx, ty, dx, dy); return; }
      const variant = ((Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663)) >>> 0) % VARIANTS;
      ctx.drawImage(atlas, variant * TILE, strataIndex * TILE, TILE, TILE, dx, dy, TILE, TILE);
    },

    /** the carved back wall shown behind dug/cave air below the surface */
    drawBack(ctx, strataIndex, tx, ty, dx, dy) {
      const s = STRATA[strataIndex];
      if (masterReady && back[s.id]) { blitCrop(ctx, back[s.id], tx, ty, dx, dy); return; }
      const variant = ((Math.imul(tx, 92083) ^ Math.imul(ty, 47059)) >>> 0) % VARIANTS;
      ctx.globalAlpha = 1;
      ctx.drawImage(atlas, variant * TILE, strataIndex * TILE, TILE, TILE, dx, dy, TILE, TILE);
      ctx.fillStyle = 'rgba(20,16,26,0.5)';
      ctx.fillRect(dx, dy, TILE, TILE);
    },

    drawPlaced(ctx, variant, dx, dy) {
      if (masterReady && front.placed) { blitCrop(ctx, front.placed, variant, variant * 3, dx, dy); return; }
      ctx.drawImage(atlas, (variant % VARIANTS) * TILE, STRATA.length * TILE, TILE, TILE, dx, dy, TILE, TILE);
    },
  };
}

function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

// ---------------------------------------------------------------- procedural fallback
function paintTile(ctx, ox, oy, s, variant, rng) {
  const c = s.colors;
  ctx.fillStyle = variant % 2 ? c.alt : c.base;
  ctx.fillRect(ox, oy, TILE, TILE);
  if (s.texture.banding > 0) {
    ctx.fillStyle = c.band;
    const bands = 1 + Math.floor(s.texture.banding * 2.5);
    for (let b = 0; b < bands; b++) {
      const by = oy + ((variant * 5 + b * 6) % TILE);
      if (rng.hash2(ox + b, oy) < s.texture.banding) ctx.fillRect(ox, by, TILE, 1);
    }
  }
  if (s.texture.speckle > 0) {
    ctx.fillStyle = c.speckle;
    const grains = Math.round(s.texture.speckle * 7);
    for (let g = 0; g < grains; g++) {
      const gx = ox + (rng.hash2(ox + variant, g * 3 + 1) * (TILE - 2) | 0);
      const gy = oy + (rng.hash2(g * 7 + 1, oy + variant) * (TILE - 2) | 0);
      ctx.fillRect(gx, gy, 2, 2);
    }
  }
  // chunky dark crack lines (matches the master's structure so both looks agree)
  ctx.strokeStyle = 'rgba(30,22,20,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(ox + 0.5, oy + 0.5, TILE - 1, TILE - 1);
}

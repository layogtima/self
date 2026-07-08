// Tile rendering v3 - de-monotonized. Two generated seamless masters are
// assembled at boot into a 256×256 COMPOSITE (4×4 macro-cells of 64 px, each a
// hashed choice of master + 90° rotation), its luminance ramped into every
// stratum's palette (front + darkened back-wall + a grey landing-pad ramp).
// Repetition period: 16 tiles with internal variety instead of 4.
//
// On top of the base blit the game asks for:
//   drawTile(ctx, si, tx, ty, dx, dy, shade) - shade = extra darkening 0..1
//   drawBack(...) - carved back wall
//   drawPad(ctx, tx, ty, dx, dy) - landing-pad ground
//   drawAccent(ctx, stratumId, tx, ty, dx, dy) - sparse per-stratum motif

import { TILE } from '../config.js';
import { STRATA } from '../content/strata.js';
import { makeRng } from '../core/rng.js';

const VARIANTS = 6;
const MASTER = 64;
const COMP = 256;                 // composite size (4×4 macro cells)

export function buildTileset(makeCanvas, makeImage) {
  const front = {};   // stratumId -> composite canvas
  const back = {};
  let padCv = null;
  let masterReady = false;

  // procedural atlas fallback
  const atlas = makeCanvas(VARIANTS * TILE, (STRATA.length + 1) * TILE);
  const a = atlas.getContext('2d');
  const rng = makeRng(20240607);
  STRATA.forEach((s, si) => { for (let v = 0; v < VARIANTS; v++) paintTile(a, v * TILE, si * TILE, s, v, rng); });
  const placed = { colors: { base: '#B7A98F', alt: '#AC9E83', band: '#9D8F74', speckle: '#84765C' }, texture: { banding: 0.2, speckle: 0.5 } };
  for (let v = 0; v < VARIANTS; v++) paintTile(a, v * TILE, STRATA.length * TILE, placed, v, rng);

  // load both masters, then build composites
  const masters = {};
  if (makeImage) {
    let pending = 0;
    for (const [key, file] of [['a', 'assets/tiles/master.png'], ['b', 'assets/tiles/master-b.png']]) {
      const img = makeImage(file);
      if (!img) continue;
      pending++;
      img.onload = () => { masters[key] = img; if (--pending === 0 || masters.a) tryBuild(); };
      img.onerror = () => { if (--pending === 0 && masters.a) tryBuild(); };
    }
  }

  function tryBuild() {
    if (!masters.a) return;
    try { buildComposites(); masterReady = true; } catch { /* stay procedural */ }
  }

  function buildComposites() {
    // 1) assemble the structural composite from macro-cells
    const compCv = makeCanvas(COMP, COMP);
    const cc = compCv.getContext('2d');
    const pick = makeRng(777);
    for (let my = 0; my < COMP / MASTER; my++) {
      for (let mx = 0; mx < COMP / MASTER; mx++) {
        const useB = masters.b && pick.hash2(mx, my) > 0.5;
        const rot = Math.floor(pick.hash2(mx * 3 + 1, my * 7 + 1) * 4);
        cc.save();
        cc.translate(mx * MASTER + MASTER / 2, my * MASTER + MASTER / 2);
        cc.rotate(rot * Math.PI / 2);
        cc.drawImage(useB ? masters.b : masters.a, -MASTER / 2, -MASTER / 2, MASTER, MASTER);
        cc.restore();
      }
    }
    // 2) luminance of the composite
    const src = cc.getImageData(0, 0, COMP, COMP);
    const lum = new Float32Array(COMP * COMP);
    for (let i = 0; i < lum.length; i++) {
      lum[i] = (0.299 * src.data[i * 4] + 0.587 * src.data[i * 4 + 1] + 0.114 * src.data[i * 4 + 2]) / 255;
    }
    // 3) ramp per stratum (front + back) + the landing pad (grey)
    for (const s of STRATA) {
      front[s.id] = ramp(s.colors, lum, 1);
      back[s.id] = ramp(s.colors, lum, 0.48);
    }
    padCv = ramp({ speckle: '#4E4A52', band: '#615C66', alt: '#736D79', base: '#847E8B' }, lum, 1);
  }

  function ramp(colors, lum, mul) {
    const stops = [hex(colors.speckle), hex(colors.band), hex(colors.alt), hex(colors.base)];
    const cv = makeCanvas(COMP, COMP);
    const c = cv.getContext('2d');
    const out = c.createImageData(COMP, COMP);
    for (let i = 0; i < lum.length; i++) {
      // slight gamma to widen contrast (fights the flat-slab look)
      const l = Math.pow(lum[i], 1.25);
      const f = l * (stops.length - 1);
      const k = Math.min(stops.length - 2, Math.floor(f));
      const t = f - k;
      const c0 = stops[k], c1 = stops[k + 1];
      out.data[i * 4] = (c0[0] + (c1[0] - c0[0]) * t) * mul;
      out.data[i * 4 + 1] = (c0[1] + (c1[1] - c0[1]) * t) * mul;
      out.data[i * 4 + 2] = (c0[2] + (c1[2] - c0[2]) * t) * mul;
      out.data[i * 4 + 3] = 255;
    }
    c.putImageData(out, 0, 0);
    return cv;
  }

  const crop = (ctx, cv, tx, ty, dx, dy) => {
    const sx = ((tx * TILE) % COMP + COMP) % COMP;
    const sy = ((ty * TILE) % COMP + COMP) % COMP;
    ctx.drawImage(cv, sx, sy, TILE, TILE, dx, dy, TILE, TILE);
  };
  const jitter = (tx, ty) => (((Math.imul(tx, 40503) ^ Math.imul(ty, 30011)) >>> 0) % 100) / 100;

  return {
    canvas: atlas,
    get ready() { return masterReady; },

    /**
     * @param {number} shade extra darkening 0..1 (depth-within-stratum shading)
     */
    drawTile(ctx, strataIndex, tx, ty, dx, dy, shade = 0) {
      const s = STRATA[strataIndex];
      if (masterReady && front[s.id]) crop(ctx, front[s.id], tx, ty, dx, dy);
      else {
        const variant = ((Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663)) >>> 0) % VARIANTS;
        ctx.drawImage(atlas, variant * TILE, strataIndex * TILE, TILE, TILE, dx, dy, TILE, TILE);
      }
      // per-tile brightness jitter + within-stratum depth shade, one overlay
      const dark = shade * 0.14 + (jitter(tx, ty) - 0.5) * 0.07;
      if (dark > 0.01) { ctx.fillStyle = `rgba(18,12,10,${dark.toFixed(3)})`; ctx.fillRect(dx, dy, TILE, TILE); }
      else if (dark < -0.01) { ctx.fillStyle = `rgba(255,244,220,${(-dark).toFixed(3)})`; ctx.fillRect(dx, dy, TILE, TILE); }
    },

    drawBack(ctx, strataIndex, tx, ty, dx, dy) {
      const s = STRATA[strataIndex];
      if (masterReady && back[s.id]) { crop(ctx, back[s.id], tx, ty, dx, dy); return; }
      const variant = ((Math.imul(tx, 92083) ^ Math.imul(ty, 47059)) >>> 0) % VARIANTS;
      ctx.drawImage(atlas, variant * TILE, strataIndex * TILE, TILE, TILE, dx, dy, TILE, TILE);
      ctx.fillStyle = 'rgba(20,16,26,0.52)';
      ctx.fillRect(dx, dy, TILE, TILE);
    },

    /** the landing pad's artificial ground */
    drawPad(ctx, tx, ty, dx, dy) {
      if (masterReady && padCv) { crop(ctx, padCv, tx, ty, dx, dy); return; }
      ctx.fillStyle = '#736D79';
      ctx.fillRect(dx, dy, TILE, TILE);
    },

    /** sparse embedded motif - variety within a layer (~7% of tiles) */
    drawAccent(ctx, stratumId, tx, ty, dx, dy) {
      const r = jitter(tx * 3 + 1, ty * 5 + 2);
      ctx.save();
      ctx.globalAlpha = 0.8;
      switch (stratumId) {
        case 'anthropocene':  // brick shard
          ctx.fillStyle = '#8A5A4A'; ctx.fillRect(dx + 4, dy + 8, 6, 3); break;
        case 'quaternary':    // root thread
          ctx.strokeStyle = '#6E5237'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(dx + 5, dy + 1); ctx.quadraticCurveTo(dx + 8, dy + 8, dx + 5, dy + 15); ctx.stroke(); break;
        case 'cretaceous':    // shell arc
          ctx.strokeStyle = '#B8AF92'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(dx + 8, dy + 9, 3.5, Math.PI, 0); ctx.stroke(); break;
        case 'jurassic':      // spiral hint
          ctx.strokeStyle = '#7F9769'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(dx + 8, dy + 8, 3, 0, Math.PI * 1.5); ctx.stroke(); break;
        case 'carboniferous': // coal chunk
          ctx.fillStyle = '#26222E'; ctx.fillRect(dx + 4 + r * 5, dy + 5, 4, 3); break;
        case 'cambrian':
        case 'precambrian':   // crystal glint
          ctx.strokeStyle = '#D9CBE0'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(dx + 4, dy + 11); ctx.lineTo(dx + 8, dy + 5); ctx.lineTo(dx + 11, dy + 9); ctx.stroke(); break;
        default:              // pebble
          ctx.strokeStyle = 'rgba(60,45,35,0.7)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(dx + 8, dy + 9 + r * 3, 3, 2, 0.3, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
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
  ctx.strokeStyle = 'rgba(30,22,20,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(ox + 0.5, oy + 0.5, TILE - 1, TILE - 1);
}

// JAR · render — the only file allowed to know what a canvas is.
// render(world, canvas, view) draws one frame. Views: normal · temp (ironbow)
// · nutrient (viridis) · light · material-ID debug.

import { M, MAT_COUNT } from './config.js';

const IRONBOW = buildLut([
  [0.00, 2, 0, 12], [0.14, 34, 4, 85], [0.35, 138, 14, 118],
  [0.55, 219, 63, 50], [0.75, 252, 150, 10], [0.90, 255, 236, 105], [1, 255, 255, 255],
]);
const VIRIDIS = buildLut([
  [0.00, 68, 1, 84], [0.25, 59, 82, 139], [0.50, 33, 145, 140],
  [0.75, 94, 201, 98], [1.00, 253, 231, 37],
]);
// distinct hues for the material-ID debug view, indexed by material
const ID_COLORS = [
  [16, 16, 20], [128, 128, 136], [180, 90, 40], [230, 210, 60], [40, 90, 230],
  [140, 220, 250], [200, 200, 220], [90, 80, 90], [255, 60, 0], [180, 255, 60],
  [0, 200, 60], [130, 90, 130], [255, 240, 200], [255, 0, 180],
];

function buildLut(stops) {
  const lut = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0], b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++)
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    const f = (t - a[0]) / (b[0] - a[0] || 1);
    lut[i] = abgr(a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f);
  }
  return lut;
}
function abgr(r, g, b) { return (255 << 24) | (b << 16) | (g << 8) | r; }

const state = new WeakMap(); // canvas → {off, img, buf32, noise}

function getState(canvas, w) {
  let s = state.get(canvas);
  if (!s || s.W !== w.W || s.H !== w.H) {
    const off = document.createElement('canvas');
    off.width = w.W; off.height = w.H;
    const offCtx = off.getContext('2d');
    const img = offCtx.createImageData(w.W, w.H);
    const noise = new Float32Array(w.N);
    let n = 1234567 ^ w.seed;
    for (let i = 0; i < w.N; i++) {
      n = Math.imul(n ^ (n >>> 13), 0x5bd1e995) >>> 0;
      noise[i] = (n & 255) / 255 - 0.5;
    }
    s = { W: w.W, H: w.H, off, offCtx, img, buf32: new Uint32Array(img.data.buffer), noise };
    state.set(canvas, s);
  }
  return s;
}

export function render(w, canvas, view = 'normal') {
  const s = getState(canvas, w);
  const { buf32, noise } = s;
  const { N, material, temp, nutrient, energy, light, meta } = w;

  if (view === 'temp') {
    for (let i = 0; i < N; i++) {
      const t = (temp[i] + 0.2) / 1.4;
      buf32[i] = IRONBOW[t <= 0 ? 0 : t >= 1 ? 255 : (t * 255) | 0];
    }
  } else if (view === 'nutrient') {
    for (let i = 0; i < N; i++) {
      const t = nutrient[i] / 5;
      buf32[i] = VIRIDIS[t <= 0 ? 0 : t >= 1 ? 255 : (t * 255) | 0];
    }
  } else if (view === 'light') {
    for (let i = 0; i < N; i++) {
      const v = (light[i] * 255) | 0;
      buf32[i] = abgr(v, v, v);
    }
  } else if (view === 'id') {
    for (let i = 0; i < N; i++) {
      const c = ID_COLORS[material[i]];
      buf32[i] = abgr(c[0], c[1], c[2]);
    }
  } else {
    normalView(w, buf32, noise);
  }

  s.offCtx.putImageData(s.img, 0, 0);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(s.off, 0, 0, canvas.width, canvas.height);

  // agents on top: a 2×2 body + a directional nose pixel
  const sx = canvas.width / w.W, sy = canvas.height / w.H;
  const a = w.agents;
  for (let g = 0; g < a.cap; g++) {
    if (!a.alive[g]) continue;
    const px = a.x[g] * sx, py = a.y[g] * sy;
    ctx.fillStyle = view === 'normal' ? '#f2b03c' : '#ffffff';
    ctx.fillRect(px - sx, py - sy, sx * 2, sy * 2);
    ctx.fillStyle = view === 'normal' ? '#7a4210' : '#000000';
    ctx.fillRect(px + (a.vx[g] >= 0 ? sx * 0.5 : -sx * 1.5), py - sy * 0.5, sx, sy);
  }
}

function normalView(w, buf32, noise) {
  const { N, W, material, temp, nutrient, energy, light, meta } = w;
  for (let i = 0; i < N; i++) {
    const m = material[i], sh = noise[i], l = light[i];
    let r, g, b;
    switch (m) {
      case M.AIR: { // the jar's air glows faintly with the light that reaches it
        r = 10 + l * 26; g = 11 + l * 30; b = 16 + l * 38; break;
      }
      case M.ROCK: r = 76 + sh * 22; g = 73 + sh * 20; b = 72 + sh * 20; break;
      case M.SOIL: { // richer soil reads darker
        const rich = Math.min(1, nutrient[i] / 4);
        r = 122 - rich * 26 + sh * 22; g = 84 - rich * 18 + sh * 16; b = 56 - rich * 12 + sh * 12; break;
      }
      case M.SAND: r = 194 + sh * 26; g = 168 + sh * 24; b = 116 + sh * 18; break;
      case M.WATER: {
        const surf = i >= W && material[i - W] !== M.WATER;
        r = surf ? 70 : 34 + l * 20; g = surf ? 126 : 84 + l * 26; b = surf ? 158 : 130 + l * 28; break;
      }
      case M.ICE: r = 168 + sh * 16; g = 202 + sh * 12; b = 224 + sh * 10; break;
      case M.STEAM: r = 176 + sh * 20; g = 186 + sh * 20; b = 198 + sh * 20; break;
      case M.SMOKE: r = 66 + sh * 14; g = 62 + sh * 12; b = 60 + sh * 12; break;
      case M.FIRE: { // flicker keyed off the burn timer, not Math.random
        const f = ((meta[i] * 37 + i) & 63) / 63;
        r = 255; g = 120 + f * 110; b = 20 + f * 40; break;
      }
      case M.SEED: r = 196 + sh * 20; g = 188 + sh * 18; b = 92 + sh * 14; break;
      case M.PLANT: { // energy shows: starving plants go olive, thriving ones vivid
        const e = energy[i] / 255;
        r = 34 + e * 30 + sh * 14; g = 96 + e * 92 + sh * 20; b = 38 + e * 20 + sh * 10; break;
      }
      case M.DEAD: r = 104 + sh * 18; g = 88 + sh * 16; b = 66 + sh * 12; break;
      case M.MYC: { // dead man's fingers: pale, soil-born runs darker
        const soilborn = meta[i] & 128;
        r = soilborn ? 196 : 224 + sh * 18; g = soilborn ? 186 : 214 + sh * 16; b = soilborn ? 168 : 192 + sh * 14; break;
      }
      case M.FRUIT: r = 214 + sh * 20; g = 96 + sh * 16; b = 168 + sh * 18; break;
      default: r = 255; g = 0; b = 255;
    }
    buf32[i] = (255 << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
  }
}

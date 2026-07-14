// The substrate cross-section: a grid of SOIL the ants excavate into AIR galleries,
// an OUTWORLD arena on top for foraging, a temp/humidity gradient, seeds + midden.

import { COLS, ROWS, SURFACE, ENTRANCE_X, S } from './config.js';

function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, sm = t => t * t * (3 - 2 * t);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * sm(xf) + (c - a) * sm(yf) + (a - b - c + d) * sm(xf) * sm(yf);
}

export function makeNest() {
  const cell = new Uint8Array(COLS * ROWS);      // S.AIR / S.SOIL / S.ROCK
  const temp = new Float32Array(COLS * ROWS);    // 0..1 (warm = brood sweet spot band)
  const moist = new Float32Array(COLS * ROWS);   // 0..1 (humid deeper)
  const idx = (x, y) => y * COLS + x;

  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    cell[idx(x, y)] = y < SURFACE ? S.AIR : S.SOIL;
    // undiggable pebbles sprinkled in the deep soil
    if (y > SURFACE + 6 && noise2(x * 0.5, y * 0.5) > 0.86 && hash(x * 3.3, y * 7.1) > 0.6) cell[idx(x, y)] = S.ROCK;
    // temperature: warm band a little below the surface (a heat cable at one depth)
    const warmBand = SURFACE + ROWS * 0.28;
    temp[idx(x, y)] = Math.max(0, 1 - Math.abs(y - warmBand) / (ROWS * 0.5));
    moist[idx(x, y)] = Math.min(1, Math.max(0, (y - SURFACE) / (ROWS - SURFACE)) * 1.1);
  }

  // pre-dig a starter burrow: an entrance shaft into a small founding chamber, so
  // the colony is alive on frame one (claustral founding already underway)
  const carve = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const nx = x + dx, ny = y + dy; if (nx > 0 && nx < COLS - 1 && ny > 0 && ny < ROWS - 1 && dx * dx + dy * dy <= r * r) cell[idx(nx, ny)] = S.AIR; } };
  for (let y = SURFACE; y < SURFACE + 14; y++) carve(ENTRANCE_X, y, 1);        // shaft
  const chamberY = SURFACE + 16;
  carve(ENTRANCE_X, chamberY, 5);                                              // founding chamber
  carve(ENTRANCE_X - 7, chamberY + 3, 3);
  carve(ENTRANCE_X + 6, chamberY + 4, 3);

  // garden flora along the surface: grass clumps + seed-bearing stalks (the seed
  // source foragers harvest). Kept clear of the nest mouth.
  const plants = [];
  for (let x = 3; x < COLS - 3; x++) {
    if (Math.abs(x - ENTRANCE_X) < 4) continue;
    const r = hash(x * 1.7, 3.3);
    if (r > 0.9) plants.push({ x, h: 5 + hash(x, 9) * 8, kind: hash(x, 2) > 0.55 ? 'stalk' : 'grass', ph: hash(x, 5) * 6 });
    else if (r > 0.62) plants.push({ x, h: 2 + hash(x, 4) * 2.5, kind: 'grass', ph: hash(x, 7) * 6 });
  }
  // O(1) climbable-column table: topmost row of each stalk (plants aren't in the
  // soil grid, so ants need this side-channel to know a stalk is climbable)
  const stalkTop = new Int16Array(COLS).fill(-1);
  for (const p of plants) if (p.kind === 'stalk') { const c = Math.max(0, Math.min(COLS - 1, Math.round(p.x))); stalkTop[c] = Math.round(SURFACE - p.h); }

  return {
    cell, temp, moist, idx, plants, stalkTop,
    surface: SURFACE, entrance: { x: ENTRANCE_X, y: SURFACE },
    chamber: { x: ENTRANCE_X, y: chamberY },
    seeds: [],                 // {x,y} in the outworld / granary
    midden: new Float32Array(COLS),   // pellet pile height per column at the surface
    stores: 6,                 // seed store (colony food); starts with founding reserves

    at(x, y) { return (x < 0 || x >= COLS || y < 0 || y >= ROWS) ? S.ROCK : cell[idx(x, y)]; },
    solid(x, y) { return this.at(x, y) !== S.AIR; },
    isSoil(x, y) { return this.at(x, y) === S.SOIL; },
    tempAt(x, y) { return (x < 0 || x >= COLS || y < 0 || y >= ROWS) ? 0 : temp[idx(x, y)]; },

    dig(x, y) {                // returns true if a soil cell was removed (→ pellet)
      if (this.at(x, y) !== S.SOIL) return false;
      cell[idx(x, y)] = S.AIR; return true;
    },
    dropPellet(x) {            // pellet carried to the surface builds the crater rim
      const c = Math.max(0, Math.min(COLS - 1, x | 0));
      this.midden[c] = Math.min(6, this.midden[c] + 0.5);
    },
    addSeed(x, y) { this.seeds.push({ x, y, taken: false }); },
    nearestSeed(x, y, maxD) {
      let best = null, bd = maxD * maxD;
      for (const s of this.seeds) { if (s.taken) continue; const d = (s.x - x) ** 2 + (s.y - y) ** 2; if (d < bd) { bd = d; best = s; } }
      return best;
    },
  };
}

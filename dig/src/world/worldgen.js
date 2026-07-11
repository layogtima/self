// Deterministic world generation. Builds the tile grid + fossil sites from a
// seed. Fossils are placed lore-legally: only in the stratum matching their
// `period`, weighted by the biome's environment preference.

import {
  WORLD_W, WORLD_H, SURFACE_BASE, T_AIR, T_ROCK, T_BEDROCK, CAMP_HALF_L, CAMP_HALF_R,
} from '../config.js';
import { makeRng, clamp01 } from '../core/rng.js';
import { STRATA, strataIndexAtDepth } from '../content/strata.js';
import { fossilsForPeriod } from '../content/fossils.js';
import { envWeightAt } from '../content/biomes.js';
import { GARBAGE } from '../content/materials.js';
import { RARITY_WEIGHTS } from '../config.js';

/**
 * A single buried bone. You collate a species by finding all its bones (which
 * are scattered as separate 1-tile pockets, clustered near each other).
 * @typedef {Object} BonePocket
 * @property {string} id         instance id
 * @property {string} fossilId   species id
 * @property {string} bone       bone name (from spec.bones)
 * @property {number} boneIndex  index into spec.bones
 * @property {number} tx
 * @property {number} ty
 */

const spawnCol = WORLD_W >> 1;
function inCamp(tx) { return tx >= spawnCol - CAMP_HALF_L && tx <= spawnCol + CAMP_HALF_R; }

/**
 * @param {number} seed
 * @returns {{tiles:Uint8Array, surface:Int16Array, pockets:BonePocket[], pocketMap:Map<number,number>}}
 */
export function generateWorld(seed) {
  const rng = makeRng(seed);
  const tiles = new Uint8Array(WORLD_W * WORLD_H);
  const surface = new Int16Array(WORLD_W);

  for (let x = 0; x < WORLD_W; x++) {
    surface[x] = Math.round(SURFACE_BASE + (rng.noise2(x * 0.045, 7.3) - 0.5) * 10);
  }

  for (let x = 0; x < WORLD_W; x++) {
    const surf = surface[x];
    for (let y = 0; y < WORLD_H; y++) {
      const i = y * WORLD_W + x;
      if (y < surf) { tiles[i] = T_AIR; continue; }
      if (y >= WORLD_H - 3) { tiles[i] = T_BEDROCK; continue; }
      const depth = y - surf;
      // sparse noise pockets (a nice surprise, and lets sites peek out)
      const cave = depth > 8 && rng.noise2(x * 0.07 + 100, y * 0.07 + 100) > 0.80;
      tiles[i] = cave ? T_AIR : T_ROCK;
    }
  }

  carveWormCaves(rng, tiles, surface);
  carveShallowCaves(rng, tiles, surface);
  carveCaverns(rng, tiles, surface);
  seedFluids(rng, tiles, surface);

  const { pockets, pocketMap } = placeBones(rng, tiles, surface);
  const { garbage, garbageMap } = seedGarbage(rng, tiles, surface, pocketMap);
  const gasMap = seedGas(rng, tiles, surface, pocketMap);
  return { tiles, surface, pockets, pocketMap, garbage, garbageMap, gasMap };
}

/**
 * Trapped gas: ~26 small blobs sealed in deep rock (depth 60+). Lasering one
 * open releases a buoyant cloud (game/hazards.js) - vent it up a shaft or
 * route around. Faint olive speckle telegraphs gas-bearing rock.
 * @returns {Set<number>} tile indices holding gas
 */
function seedGas(rng, tiles, surface, pocketMap) {
  const gasMap = new Set();
  for (let n = 0; n < 26; n++) {
    const cx = 4 + Math.floor(rng.next() * (WORLD_W - 8));
    if (inCamp(cx)) continue;
    const cy = surface[cx] + 60 + Math.floor(rng.next() * (WORLD_H - surface[cx] - 80));
    if (cy >= WORLD_H - 5) continue;
    // 2x2-ish blob
    for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1], [rng.next() > 0.5 ? 2 : -1, 0]]) {
      const x = cx + ox, y = cy + oy;
      if (x < 1 || x >= WORLD_W - 1 || y >= WORLD_H - 4) continue;
      const idx = y * WORLD_W + x;
      if (tiles[idx] === T_ROCK && !pocketMap.has(idx)) gasMap.add(idx);
    }
  }
  return gasMap;
}

/**
 * Anthropocene garbage: ~90 deposits of raw junk in the top band, clustered
 * 2-4 tiles of the same type. Dig one out and it goes in your hold as raw
 * garbage for the Reclaimer. (Parallel to - not replacing - the museum-worthy
 * modern "fossils" like the smartphone.)
 * @returns {{garbage:Array<{id:string,type:string,tx:number,ty:number}>, garbageMap:Map<number,number>}}
 */
function seedGarbage(rng, tiles, surface, pocketMap) {
  const garbage = [];
  const garbageMap = new Map();    // tile index -> garbage index
  const totalFreq = GARBAGE.reduce((s, g) => s + g.freq, 0);

  for (let n = 0; n < 90; n++) {
    // weighted type pick
    let r = rng.next() * totalFreq, type = GARBAGE[0];
    for (const g of GARBAGE) { r -= g.freq; if (r <= 0) { type = g; break; } }

    // deposit centre: any column outside the pod span, depth within the band
    let cx = 0;
    for (let tries = 0; tries < 20; tries++) { cx = 3 + Math.floor(rng.next() * (WORLD_W - 6)); if (!inCamp(cx)) break; }
    if (inCamp(cx)) continue;
    const cd = type.band[0] + 1 + Math.floor(rng.next() * Math.max(1, type.band[1] - type.band[0] - 1));

    // cluster 2-4 same-type tiles around the centre
    const cluster = 2 + Math.floor(rng.next() * 3);
    for (let c = 0; c < cluster; c++) {
      for (let tries = 0; tries < 12; tries++) {
        const tx = Math.max(1, Math.min(WORLD_W - 2, cx + Math.round((rng.next() - 0.5) * 5)));
        if (inCamp(tx)) continue;
        const ty = surface[tx] + Math.max(1, cd + Math.round((rng.next() - 0.5) * 3));
        if (ty >= WORLD_H - 4) continue;
        const idx = ty * WORLD_W + tx;
        if (tiles[idx] !== T_ROCK || garbageMap.has(idx) || pocketMap.has(idx)) continue;   // bones win ties
        const depth = ty - surface[tx];
        if (depth < type.band[0] || depth > type.band[1]) continue;
        garbageMap.set(idx, garbage.length);
        garbage.push({ id: `${type.id}@${tx},${ty}`, type: type.id, tx, ty });
        break;
      }
    }
  }
  return { garbage, garbageMap };
}

/** carve a tile (guarded: never bedrock, never above the near-surface) */
function carveAt(tiles, surface, x, y) {
  if (x < 1 || x >= WORLD_W - 1 || y >= WORLD_H - 3) return;
  const surf = surface[Math.max(0, Math.min(WORLD_W - 1, x))];
  if (y < surf + 4) return;
  tiles[y * WORLD_W + x] = T_AIR;
}

/**
 * Worm caves: seeded random-walk tunnels, 2–3 tiles wide, snaking laterally
 * with a downward bias - real cave systems worth following.
 */
function carveWormCaves(rng, tiles, surface) {
  const worms = 13;
  for (let w = 0; w < worms; w++) {
    let x = 8 + rng.next() * (WORLD_W - 16);
    let y = SURFACE_BASE + 14 + rng.next() * (WORLD_H - SURFACE_BASE - 70);
    let heading = rng.next() * Math.PI * 2;
    const steps = 45 + Math.floor(rng.next() * 85);
    const fat = rng.next() > 0.6 ? 1.6 : 1.1;    // some tunnels are roomier
    for (let s = 0; s < steps; s++) {
      const cx = Math.round(x), cy = Math.round(y);
      const r = Math.ceil(fat);
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (dx * dx + dy * dy <= fat * fat + 0.5) carveAt(tiles, surface, cx + dx, cy + dy);
      heading += (rng.next() - 0.5) * 0.9;
      // gentle downward bias so systems descend with you
      const dirX = Math.cos(heading), dirY = Math.sin(heading) * 0.8 + 0.12;
      x += dirX; y += dirY;
      if (x < 4 || x > WORLD_W - 4 || y > WORLD_H - 8) break;
    }
  }
}

/**
 * Seed fluids into cave basins - real substances in strict geological order:
 *   TAR     4–40    petroleum seeps in the anthropocene/quaternary fill
 *   WATER   45–140  fresh aquifers in the permeable sedimentary strata
 *   BRINE   300–400 evaporite-basin brines (Devonian–Cambrian)
 *   LAVA    380+    the molten basement (magma chambers stamped below)
 * We flood-fill a cave pocket from a seed, then fill its lowest ~4 rows so it
 * reads as a settled pool. The flow CA (world/fluids.js) takes over once the
 * player breaches one - each fluid at its own viscosity.
 */
function seedFluids(rng, tiles, surface) {
  const T_WATER = 4, T_LAVA = 5, T_BRINE = 7, T_TAR = 8;
  const at = (x, y) => (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) ? T_ROCK : tiles[y * WORLD_W + x];
  const depthAt = (x, y) => y - surface[Math.max(0, Math.min(WORLD_W - 1, x))];

  const pools = (count, dMin, dMax, fluid, maxCells) => {
    for (let n = 0; n < count; n++) {
      // find an air seed in the band whose column has solid below (a basin bottom)
      let sx = -1, sy = -1;
      for (let tries = 0; tries < 40; tries++) {
        const x = 6 + Math.floor(rng.next() * (WORLD_W - 12));
        const d = dMin + Math.floor(rng.next() * (dMax - dMin));
        const y = surface[x] + d;
        if (y >= WORLD_H - 5) continue;
        if (at(x, y) === T_AIR && at(x, y + 1) !== T_AIR && at(x, y + 1) !== T_WATER) { sx = x; sy = y; break; }
      }
      if (sx < 0) continue;
      // bounded flood of the connected air pocket
      const seen = new Set([sy * WORLD_W + sx]);
      const stack = [[sx, sy]];
      const cells = [];
      while (stack.length && cells.length < maxCells) {
        const [x, y] = stack.pop();
        cells.push([x, y]);
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + ox, ny = y + oy, k = ny * WORLD_W + nx;
          if (!seen.has(k) && at(nx, ny) === T_AIR && depthAt(nx, ny) >= dMin - 4) { seen.add(k); stack.push([nx, ny]); }
        }
      }
      if (cells.length < 4) continue;
      // fill the lowest rows of the pocket
      const maxRow = Math.max(...cells.map(c => c[1]));
      for (const [x, y] of cells) {
        if (y >= maxRow - 4 && at(x, y + 1) !== T_AIR) tiles[y * WORLD_W + x] = fluid;   // has a floor
        else if (y >= maxRow - 4) tiles[y * WORLD_W + x] = fluid;
      }
    }
  };

  // strict geological order, surface -> core: tar (petroleum seeps in the loose
  // anthropocene/quaternary fill) -> fresh groundwater (permeable sedimentary
  // strata) -> evaporite brines (Devonian-Cambrian marine basins) -> magma.
  pools(5, 4, 40, T_TAR, 24);
  pools(10, 45, 140, T_WATER, 70);
  pools(6, 300, 400, T_BRINE, 60);

  // the basement runs MOLTEN: below ~depth 380 the caves thin out, so stamp
  // magma chambers straight into the rock (elliptical, brim-full of lava)
  for (let n = 0; n < 20; n++) {
    const cx = 5 + Math.floor(rng.next() * (WORLD_W - 10));
    const cy = surface[cx] + 380 + Math.floor(rng.next() * 60);
    if (cy >= WORLD_H - 6) continue;
    const rx = 3 + rng.next() * 5, ry = 2 + rng.next() * 2.5;
    for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) {
      for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 1 || x >= WORLD_W - 1 || y >= WORLD_H - 4) continue;
        const i = y * WORLD_W + x;
        if (tiles[i] === T_ROCK || tiles[i] === T_AIR) tiles[i] = T_LAVA;
      }
    }
  }
}

/**
 * Shallow grottoes: strings of small CHAMBERS linked by 2-tall crawls, just
 * under the grass (depth 5-25). At most TWO skylight wells in the whole world,
 * and each keeps the grass lip intact - a hole under an overhang, not a sliced
 * lawn. These are the sunlit front-porch caves the early fauna lives in.
 */
function carveShallowCaves(rng, tiles, surface) {
  let wells = 0;
  for (let c = 0; c < 6; c++) {
    let x = 8 + rng.next() * (WORLD_W - 16);
    let y = surface[Math.floor(x)] + 8 + rng.next() * 10;
    let heading = rng.next() < 0.5 ? 0 : Math.PI;   // mostly lateral
    const steps = 40 + Math.floor(rng.next() * 40);
    let sinceChamber = 3 + Math.floor(rng.next() * 4);
    for (let s2 = 0; s2 < steps; s2++) {
      const cx = Math.round(x), cy = Math.round(y);
      // corridor: 2-tall crawl
      carveAt(tiles, surface, cx, cy);
      carveAt(tiles, surface, cx, cy + 1);
      // every ~7 steps, blow out a proper room
      if (--sinceChamber <= 0) {
        sinceChamber = 6 + Math.floor(rng.next() * 4);
        const rx = 2 + rng.next() * 2, ry = 1.5 + rng.next();
        for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++)
          for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx++)
            if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) carveAt(tiles, surface, cx + dx, cy + dy);
      }
      heading += (rng.next() - 0.5) * 0.7;
      x += Math.cos(heading);
      y += Math.sin(heading) * 0.35;                 // stay shallow
      const sRef = surface[Math.max(0, Math.min(WORLD_W - 1, Math.round(x)))];
      const d = y - sRef;
      if (d < 6) y = sRef + 6;
      if (d > 25) y -= 1.5;
      if (x < 4 || x > WORLD_W - 4) break;
      // skylight well: RARE (2 per world max), 1-wide, grass lip kept
      if (wells < 2 && rng.next() < 0.012) {
        wells += 1;
        const sx = Math.round(x);
        const surfRow = surface[Math.max(0, Math.min(WORLD_W - 1, sx))];
        for (let yy = surfRow + 1; yy <= Math.round(y) + 1; yy++) {
          const i = yy * WORLD_W + sx;
          if (yy < WORLD_H - 3 && tiles[i] === T_ROCK) tiles[i] = T_AIR;
        }
      }
    }
  }
}

/** occasional large caverns in the deeper half - pause, look around, feel small */
function carveCaverns(rng, tiles, surface) {
  const caverns = 7;
  for (let c = 0; c < caverns; c++) {
    const cx = Math.floor(10 + rng.next() * (WORLD_W - 20));
    const cy = Math.floor(SURFACE_BASE + 70 + rng.next() * (WORLD_H - SURFACE_BASE - 130));
    const rx = 4 + rng.next() * 6, ry = 2.5 + rng.next() * 3.5;
    for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) {
      for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
          carveAt(tiles, surface, cx + dx, cy + dy);
        }
      }
    }
  }
}

/**
 * Scatter bones. Each placed species drops ALL its bones as separate 1-tile
 * pockets clustered around a centre column within its stratum - so a dig site
 * feels like an articulated find you excavate piece by piece. Every species
 * gets at least one full cluster (guaranteed completable), plus extra clusters
 * weighted by rarity. Nothing spawns under the camp.
 */
function placeBones(rng, tiles, surface) {
  const pockets = [];
  const pocketMap = new Map();     // tile index -> pocket index
  const used = new Set();

  // depth band (below the LOCAL surface) that a bone must land in to be legal
  const bandFor = si => {
    const s = STRATA[si];
    return [s.id, s.depth[0], Number.isFinite(s.depth[1]) ? s.depth[1] : s.depth[0] + 50];
  };

  /** try to place ALL of a species' bones as a cluster; returns true only if the
   *  whole set seated legally (in the right stratum, in rock, outside the camp). */
  const placeCluster = (spec, si) => {
    const [periodId, dTop, dBot] = bandFor(si);
    const thickness = Math.max(4, dBot - dTop);
    let cx = 0;
    for (let tries = 0; tries < 24; tries++) { cx = 4 + Math.floor(rng.next() * (WORLD_W - 8)); if (!inCamp(cx)) break; }
    if (inCamp(cx)) return false;
    const cyDepth = dTop + 2 + Math.floor(rng.next() * (thickness - 3));
    const bones = spec.bones || ['piece'];
    const staged = [];
    for (let bi = 0; bi < bones.length; bi++) {
      let seated = false;
      for (let tries = 0; tries < 40; tries++) {
        const tx = Math.max(1, Math.min(WORLD_W - 2, cx + Math.round((rng.next() - 0.5) * 12)));
        if (inCamp(tx)) continue;
        const ty = surface[tx] + cyDepth + Math.round((rng.next() - 0.5) * 6);
        if (ty < SURFACE_BASE + 4 || ty >= WORLD_H - 4) continue;
        const idx = ty * WORLD_W + tx;
        if (tiles[idx] !== T_ROCK || used.has(idx)) continue;
        // the bone must actually sit in ITS stratum (surface varies per column)
        if (strataIndexAtDepth(ty - surface[tx]) !== si) continue;
        staged.push({ idx, tx, ty, bi });
        seated = true;
        break;
      }
      if (!seated) return false;   // incomplete cluster - abandon it (bones stay buried elsewhere)
    }
    // commit the whole set
    for (const { idx, tx, ty, bi } of staged) {
      used.add(idx);
      pocketMap.set(idx, pockets.length);
      pockets.push({ id: `${spec.id}#${bi}@${tx},${ty}`, fossilId: spec.id, bone: bones[bi], boneIndex: bi, tx, ty });
    }
    return true;
  };

  for (let si = 0; si < STRATA.length; si++) {
    const s = STRATA[si];
    const pool = fossilsForPeriod(s.id);
    if (!pool.length) continue;
    for (const spec of pool) {
      // GUARANTEE at least one complete cluster (up to many attempts), so every
      // species is completable, then add rarity-scaled extras.
      let got = false;
      for (let a = 0; a < 60 && !got; a++) got = placeCluster(spec, si);
      const extra = Math.round((RARITY_WEIGHTS[spec.rarity] ?? 0.2) * 3);
      for (let c = 0; c < extra; c++) placeCluster(spec, si);
    }
  }
  return { pockets, pocketMap };
}

/** (retained for tests) footprint fully inside solid rock, not overlapping */
function fitsInRock(tiles, occupied, tx, ty, fw, fh) {
  if (ty < SURFACE_BASE + 4) return false;
  for (let dy = -1; dy <= fh; dy++) {
    for (let dx = -1; dx <= fw; dx++) {
      const x = tx + dx, y = ty + dy;
      if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) return false;
      const idx = y * WORLD_W + x;
      // the footprint proper must be rock and unoccupied
      if (dx >= 0 && dx < fw && dy >= 0 && dy < fh) {
        if (tiles[idx] !== T_ROCK || occupied.has(idx)) return false;
      }
    }
  }
  return true;
}

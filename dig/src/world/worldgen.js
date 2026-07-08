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
  carveCaverns(rng, tiles, surface);

  const { pockets, pocketMap } = placeBones(rng, tiles, surface);
  return { tiles, surface, pockets, pocketMap };
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
 * with a downward bias — real cave systems worth following.
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

/** occasional large caverns in the deeper half — pause, look around, feel small */
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
 * pockets clustered around a centre column within its stratum — so a dig site
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
      if (!seated) return false;   // incomplete cluster — abandon it (bones stay buried elsewhere)
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

// Mutable world state: the tile grid + buried bone pockets + damage, with
// dig/place operations and save/restore. World structure is derived from the
// seed; only the player's dig deltas and collected bones are persisted.

import {
  WORLD_W, WORLD_H, SURFACE_BASE, TILE,
  T_AIR, T_ROCK, T_PLACED, T_BEDROCK, T_WATER, T_LAVA,
  CAMP_HALF_L, CAMP_HALF_R, CAMP_DEPTH,
} from '../config.js';
import { generateWorld } from './worldgen.js';
import { makeFluids } from './fluids.js';
import { STRATA, strataIndexAtDepth, stratumAtDepth } from '../content/strata.js';

export function makeWorld(seed) {
  const gen = generateWorld(seed);
  const tiles = gen.tiles;
  const surface = gen.surface;
  const pockets = gen.pockets;
  const pocketMap = gen.pocketMap;      // tile index -> pocket index
  const damage = new Map();             // tile index -> hits taken
  const excavated = new Set();          // pocket indices already dug out
  const dug = new Set();                // player-cleared tile indices (for save)
  const placed = new Set();             // player-placed tile indices (for save)

  const spawnCol = WORLD_W >> 1;
  const inBounds = (tx, ty) => tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H;

  const world = {
    seed, tiles, surface, pockets, WORLD_W, WORLD_H, spawnCol,

    tileAt(tx, ty) {
      if (!inBounds(tx, ty)) return ty < 0 ? T_AIR : T_BEDROCK;
      return tiles[ty * WORLD_W + tx];
    },
    solidAt(tx, ty) {
      if (ty < 0) return false;
      if (tx < 0 || tx >= WORLD_W || ty >= WORLD_H) return true;
      const t = tiles[ty * WORLD_W + tx];
      return t !== T_AIR && t !== T_WATER && t !== T_LAVA;   // fluids don't block
    },
    /** T_WATER | T_LAVA | 0 (none) */
    fluidAt(tx, ty) {
      if (!inBounds(tx, ty)) return 0;
      const t = tiles[ty * WORLD_W + tx];
      return (t === T_WATER || t === T_LAVA) ? t : 0;
    },
    depthAt(tx) {
      const c = Math.max(0, Math.min(WORLD_W - 1, tx));
      return surface[c];
    },
    depthOfRow(tx, ty) {
      const c = Math.max(0, Math.min(WORLD_W - 1, tx));
      return ty - surface[c];
    },
    stratumIndexAt(tx, ty) { return strataIndexAtDepth(this.depthOfRow(tx, ty)); },
    stratumAt(tx, ty) { return stratumAtDepth(this.depthOfRow(tx, ty)); },

    /** the camp span is off-limits: no digging under homebase */
    inCampZone(tx, ty) {
      if (tx < spawnCol - CAMP_HALF_L || tx > spawnCol + CAMP_HALF_R) return false;
      return this.depthOfRow(tx, ty) < CAMP_DEPTH;
    },

    /** buried bone pocket at this tile (if not yet dug out), else null */
    pocketAt(tx, ty) {
      if (!inBounds(tx, ty)) return null;
      const p = pocketMap.get(ty * WORLD_W + tx);
      return p !== undefined && !excavated.has(p) ? pockets[p] : null;
    },

    damageAt(tx, ty) { return damage.get(ty * WORLD_W + tx) || 0; },

    hpAt(tx, ty) {
      const t = this.tileAt(tx, ty);
      if (t === T_PLACED) return 1;
      if (t === T_ROCK) return this.stratumAt(tx, ty).hp;
      return Infinity;
    },

    diggable(tx, ty) {
      if (this.inCampZone(tx, ty)) return false;
      const t = this.tileAt(tx, ty);
      return t === T_ROCK || t === T_PLACED;
    },

    /**
     * Apply one dig hit. Returns:
     *   null — not diggable
     *   {broke:false} — chipped, not yet broken
     *   {broke:true, bone?:pocket} — tile cleared; if it held a bone pocket,
     *      `bone` is the pocket you just recovered.
     */
    dig(tx, ty) {
      if (!this.diggable(tx, ty)) return null;
      const idx = ty * WORLD_W + tx;
      const hp = this.hpAt(tx, ty);
      const hits = (damage.get(idx) || 0) + 1;
      if (hits < hp) { damage.set(idx, hits); return { broke: false }; }

      damage.delete(idx);
      const wasPlaced = tiles[idx] === T_PLACED;
      tiles[idx] = T_AIR;
      if (wasPlaced) placed.delete(idx); else dug.add(idx);
      fluids.wake(tx, ty);   // a fluid neighbour may now pour into this cell

      const pIndex = pocketMap.get(idx);
      if (pIndex !== undefined && !excavated.has(pIndex)) {
        excavated.add(pIndex);
        return { broke: true, bone: pockets[pIndex] };
      }
      return { broke: true };
    },

    /** advance fluid flow within the visible window */
    stepFluids(bounds, dt) { fluids.step(bounds, dt); },

    place(tx, ty) {
      if (!inBounds(tx, ty)) return false;
      const idx = ty * WORLD_W + tx;
      if (tiles[idx] !== T_AIR) return false;
      tiles[idx] = T_PLACED;
      placed.add(idx);
      dug.delete(idx);
      return true;
    },

    variantAt(tx, ty) { return (Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663)) >>> 0; },

    // -- save/restore ----------------------------------------------------------
    exportDeltas() {
      return { dug: [...dug], placed: [...placed] };
    },
    applyDeltas(save) {
      if (!save) return;
      for (const idx of save.dug || []) {
        if (tiles[idx] !== T_BEDROCK) {
          tiles[idx] = T_AIR; dug.add(idx);
          const p = pocketMap.get(idx);
          if (p !== undefined) excavated.add(p);   // a dug pocket tile = already recovered
        }
      }
      for (const idx of save.placed || []) {
        if (tiles[idx] !== T_BEDROCK) { tiles[idx] = T_PLACED; placed.add(idx); }
      }
    },
  };

  const fluids = makeFluids(world);
  fluids.seedActive();

  return world;
}

export { SURFACE_BASE, TILE };

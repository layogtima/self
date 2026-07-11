// Mutable world state: the tile grid + buried bone pockets + damage, with
// dig/place operations and save/restore. World structure is derived from the
// seed; only the player's dig deltas and collected bones are persisted.

import {
  WORLD_W, WORLD_H, SURFACE_BASE, TILE,
  T_AIR, T_ROCK, T_PLACED, T_BEDROCK, T_WATER, T_LAVA, T_ROOF, T_RUBBLE, FLUID_SPECS,
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
  const garbage = gen.garbage;          // anthropocene junk deposits
  const garbageMap = gen.garbageMap;    // tile index -> garbage index
  const scavenged = new Set();          // garbage indices already recovered
  const gasMap = gen.gasMap;            // tile indices holding trapped gas
  const damage = new Map();             // tile index -> hits taken
  const excavated = new Set();          // pocket indices already dug out
  const dug = new Set();                // player-cleared tile indices (for save)
  const placed = new Map();             // player-placed tile index -> tile id (for save)
  const harvested = new Set();          // air tiles whose feature (mushroom/crystal) was picked

  const spawnCol = WORLD_W >> 1;
  const inBounds = (tx, ty) => tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H;

  const world = {
    seed, tiles, surface, pockets, garbage, WORLD_W, WORLD_H, spawnCol,

    tileAt(tx, ty) {
      if (!inBounds(tx, ty)) return ty < 0 ? T_AIR : T_BEDROCK;
      return tiles[ty * WORLD_W + tx];
    },
    solidAt(tx, ty) {
      if (ty < 0) return false;
      if (tx < 0 || tx >= WORLD_W || ty >= WORLD_H) return true;
      const t = tiles[ty * WORLD_W + tx];
      return t !== T_AIR && FLUID_SPECS[t] === undefined;   // fluids don't block
    },
    /** fluid tile id (water/brine/tar/lava) | 0 (none) */
    fluidAt(tx, ty) {
      if (!inBounds(tx, ty)) return 0;
      const t = tiles[ty * WORLD_W + tx];
      return FLUID_SPECS[t] !== undefined ? t : 0;
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

    /** buried garbage deposit at this tile (if not yet scavenged), else null */
    garbageAt(tx, ty) {
      if (!inBounds(tx, ty)) return null;
      const g = garbageMap.get(ty * WORLD_W + tx);
      return g !== undefined && !scavenged.has(g) ? garbage[g] : null;
    },

    damageAt(tx, ty) { return damage.get(ty * WORLD_W + tx) || 0; },

    /** gas-bearing rock (telegraphed with an olive speckle by the renderer) */
    gasAt(tx, ty) {
      if (!inBounds(tx, ty)) return false;
      const idx = ty * WORLD_W + tx;
      return gasMap.has(idx) && tiles[idx] === T_ROCK;
    },

    // -- harvestable features (mushrooms/crystals; ground truth in game/features.js)
    isHarvested(tx, ty) { return harvested.has(ty * WORLD_W + tx); },
    harvest(tx, ty) {
      if (!inBounds(tx, ty)) return false;
      const idx = ty * WORLD_W + tx;
      if (harvested.has(idx)) return false;
      harvested.add(idx);
      return true;
    },

    hpAt(tx, ty) {
      const t = this.tileAt(tx, ty);
      if (t === T_RUBBLE) return 1;
      if (t === T_ROCK) return this.stratumAt(tx, ty).hp;
      return Infinity;
    },

    /** the laser cuts geology (rock, cave-in rubble) - never what you built */
    diggable(tx, ty) {
      if (this.inCampZone(tx, ty)) return false;
      const t = this.tileAt(tx, ty);
      return t === T_ROCK || t === T_RUBBLE;
    },

    /**
     * Deconstruct a built tile (T_PLACED soil / T_ROOF panel). Returns the tile
     * id removed, or 0 if there was nothing built here. Natural rock and rubble
     * are untouched - those belong to the laser.
     */
    removePlaced(tx, ty) {
      if (!inBounds(tx, ty)) return 0;
      const idx = ty * WORLD_W + tx;
      const t = tiles[idx];
      if (t !== T_PLACED && t !== T_ROOF) return 0;
      tiles[idx] = T_AIR;
      placed.delete(idx);
      damage.delete(idx);
      fluids.wake(tx, ty);
      return t;
    },

    /**
     * Apply one dig hit. Returns:
     *   null - not diggable
     *   {broke:false} - chipped, not yet broken
     *   {broke:true, bone?:pocket} - tile cleared; if it held a bone pocket,
     *      `bone` is the pocket you just recovered.
     */
    /** @param {number} [power] hits applied per strike (laser mk tier: 1/2/4) */
    dig(tx, ty, power = 1) {
      if (!this.diggable(tx, ty)) return null;
      const idx = ty * WORLD_W + tx;
      const hp = this.hpAt(tx, ty);
      const hits = (damage.get(idx) || 0) + power;
      if (hits < hp) { damage.set(idx, hits); return { broke: false }; }

      damage.delete(idx);
      const wasPlaced = tiles[idx] === T_RUBBLE;   // rubble was "placed" by the cave-in
      tiles[idx] = T_AIR;
      if (wasPlaced) placed.delete(idx); else dug.add(idx);
      fluids.wake(tx, ty);   // a fluid neighbour may now pour into this cell

      const out = { broke: true };
      if (gasMap.has(idx)) { gasMap.delete(idx); out.gas = true; }   // released once, ever
      const pIndex = pocketMap.get(idx);
      if (pIndex !== undefined && !excavated.has(pIndex)) {
        excavated.add(pIndex);
        out.bone = pockets[pIndex];
        return out;
      }
      const gIndex = garbageMap.get(idx);
      if (gIndex !== undefined && !scavenged.has(gIndex)) {
        scavenged.add(gIndex);
        out.garbage = garbage[gIndex];
      }
      return out;
    },

    /** advance fluid flow within the visible window */
    stepFluids(bounds, dt) { fluids.step(bounds, dt); },

    /** @param {number} [t] placeable tile id - T_PLACED soil (default) or T_ROOF */
    place(tx, ty, t = T_PLACED) {
      if (!inBounds(tx, ty)) return false;
      const idx = ty * WORLD_W + tx;
      if (tiles[idx] !== T_AIR) return false;
      tiles[idx] = t;
      placed.set(idx, t);
      dug.delete(idx);
      return true;
    },

    variantAt(tx, ty) { return (Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663)) >>> 0; },

    // -- save/restore ----------------------------------------------------------
    exportDeltas() {
      return { dug: [...dug], placedTiles: [...placed.entries()], harvested: [...harvested] };
    },
    applyDeltas(save) {
      if (!save) return;
      for (const idx of save.harvested || []) harvested.add(idx);
      for (const idx of save.dug || []) {
        if (tiles[idx] !== T_BEDROCK) {
          tiles[idx] = T_AIR; dug.add(idx);
          const p = pocketMap.get(idx);
          if (p !== undefined) excavated.add(p);   // a dug pocket tile = already recovered
          const g = garbageMap.get(idx);
          if (g !== undefined) scavenged.add(g);   // same for garbage
        }
      }
      for (const [idx, t] of save.placedTiles || []) {
        if (tiles[idx] !== T_BEDROCK) { tiles[idx] = t; placed.set(idx, t); }
      }
      for (const idx of save.placed || []) {   // legacy array form
        if (tiles[idx] !== T_BEDROCK) { tiles[idx] = T_PLACED; placed.set(idx, T_PLACED); }
      }
    },
  };

  const fluids = makeFluids(world);
  fluids.seedActive();

  return world;
}

export { SURFACE_BASE, TILE };

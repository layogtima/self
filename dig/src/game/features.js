// THE ground truth for procedural decorations. drawCaveProps (render), the
// scanner, and the scan highlight all consult this one module, so a feature the
// scanner names is always a feature you can see - no phantom mushrooms.
// Placement is a seed-independent positional hash (core/rng.js hashCol), so it
// is stable across saves and identical for render + scan by construction.

import { T_AIR, WORLD_W, TILE } from '../config.js';
import { STRATA } from '../content/strata.js';
import { biomeAtX } from '../content/biomes.js';
import { hashCol } from '../core/rng.js';

/**
 * Cave decorations at an air tile.
 * @returns {null|{ceiling:'roots'|'stalactite'|'vines'|null,
 *                 floor:'stalagmite'|'mushroom'|'crystal'|null,
 *                 h:number, si:number, depth:number, geode?:boolean}}
 */
export function caveFeaturesAt(world, tx, ty) {
  if (world.tileAt(tx, ty) !== T_AIR) return null;
  const depth = world.depthOfRow(tx, ty);
  if (depth < 3) return null;
  const h = hashCol(tx * 13 + 5, ty * 7 + 3);
  const si = world.stratumIndexAt(tx, ty);

  // geode pocket: the whole void is crystal-lined - ceiling teeth + floor cluster
  const geode = world.geodeAt?.(tx, ty);
  if (geode) {
    const ceiling = world.solidAt(tx, ty - 1) ? 'crystal-tip' : null;
    const floor = world.solidAt(tx, ty + 1) && !world.isHarvested?.(tx, ty) ? 'crystal' : null;
    if (ceiling || floor) return { ceiling, floor, h, si, depth, geode: true };
  }

  let ceiling = null, floor = null;
  if (world.solidAt(tx, ty - 1)) {
    // vines are the anthropocene's fingerprint: everywhere in the sunlit
    // shallows AND draping the deeper caverns (feral pothos ate the planet)
    if (depth >= 3 && depth < 60 && h > 0.66 && h < 0.82) ceiling = 'vines';
    else if (depth < 42 && h > 0.82 && h < 0.9) ceiling = 'roots';
    else if (h > 0.9 - Math.min(0.06, depth / 4000)) ceiling = 'stalactite';   // deeper = toothier
  }
  if (world.solidAt(tx, ty + 1)) {
    // under the Crystal Barrens, crystals grow shallow (the biome's signature)
    const crystalBiome = biomeAtX(tx, WORLD_W).id === 'crystal';
    const crystalDepthOk = si >= STRATA.length - 2 || (crystalBiome && depth > 20);
    if (h > 0.9 - Math.min(0.06, depth / 4000) && h < 0.94) floor = 'stalagmite';
    else if (depth > 8 && h > 0.965) floor = world.isHarvested?.(tx, ty) ? null : 'mushroom';   // shallow grottoes glow too
    else if (crystalDepthOk && h > 0.93 && h <= 0.965) floor = world.isHarvested?.(tx, ty) ? null : 'crystal';
  }
  return (ceiling || floor) ? { ceiling, floor, h, si, depth } : null;
}

/** which features can be harvested (E with the scanner) → material id.
 *  Minerals only: living things (mushrooms) are scan targets, never resources -
 *  their patterns unlock blueprints and DG-3 synthesizes the rest. */
export const HARVESTABLE = { crystal: 'crystal' };

/**
 * Surface scenery at a column: 'tree' | 'dressing' | null (grass tufts are
 * ubiquitous and not scannable). Thresholds come from the biome so a savanna
 * is sparse and a wetland is thick - and the scanner agrees by construction.
 */
export function sceneryAt(tx, world = null) {
  // nothing roots in a pond: if this column's surface row is water, it's a bank
  if (world) {
    const surf = world.surface[Math.max(0, Math.min(WORLD_W - 1, tx))];
    if (world.fluidAt?.(tx, surf - 1) || world.fluidAt?.(tx, surf)) return null;
  }
  const sc = biomeAtX(tx, WORLD_W).scenery;
  if (hashCol(tx, 55) > sc.treeP) return 'tree';
  if (hashCol(tx, 40) > sc.dressP) return 'dressing';
  return null;
}

/** the SPECIFIC dressing at a column ('bush'|'boulder'|'reeds'|'flowers'|'shard'),
 *  or null. One source of truth for the renderer, scanner AND sheltering fauna. */
export function dressingAt(tx, world = null) {
  if (sceneryAt(tx, world) !== 'dressing') return null;
  const pool = biomeAtX(tx, WORLD_W).scenery.dressings || ['bush', 'boulder', 'flowers'];
  return pool[Math.floor(hashCol(tx, 71) * pool.length) % pool.length];
}

/** the kinds a creature will bed down under */
const SHELTERS = new Set(['tree', 'bush', 'boulder', 'shard']);
/**
 * Nearest surface shelter (a tree/bush/rock) to a world x, as a world x - what a
 * creature walks to at dusk (or a nocturnal roost by day). Scans columns outward.
 * @returns {number|null} shelter centre world-x, or null if none within range
 */
export function findShelter(world, fromX, range = 44) {
  const c0 = Math.floor(fromX / TILE);
  for (let d = 0; d <= range; d++) {
    for (const tx of (d === 0 ? [c0] : [c0 - d, c0 + d])) {
      if (tx < 2 || tx >= WORLD_W - 2) continue;
      const s = sceneryAt(tx, world);
      const kind = s === 'tree' ? 'tree' : s === 'dressing' ? dressingAt(tx, world) : null;
      if (kind && SHELTERS.has(kind)) return tx * TILE + TILE / 2;
    }
  }
  return null;
}

// ---- forage: the flora a herbivore actually eats -------------------------------
// A grazer only crops where food GROWS: the edible dressings (flowers/reeds/bush -
// boulders/shards are not food) or the staple, a grass tuft. So herds gather at
// the green and go hungry on bare ground. One source of truth for feed + spawn.
export const FORAGE = new Set(['flowers', 'reeds', 'bush']);

/** does this column carry a grass tuft? (ground cover, not scannable - same hash
 *  the renderer uses at game.js drawScenery, minus water) */
export function hasTuft(tx, world = null) {
  if (world) {
    const surf = world.surface[Math.max(0, Math.min(WORLD_W - 1, tx))];
    if (world.fluidAt?.(tx, surf - 1) || world.fluidAt?.(tx, surf)) return false;   // no grass on a pond
  }
  return hashCol(tx, 88) < biomeAtX(tx, WORLD_W).scenery.tuftP;
}

/** grazing flora at a surface column: an edible dressing kind, 'grass', or null */
export function forageAt(tx, world = null) {
  const s = sceneryAt(tx, world);
  if (s === 'dressing') { const d = dressingAt(tx, world); return FORAGE.has(d) ? d : null; }
  return hasTuft(tx, world) ? 'grass' : null;   // trees + bare ground can still carry grass
}

/** nearest surface grazing flora to a world x, as a world x (what a hungry
 *  herbivore ambles toward). Scans columns outward, like findShelter. */
export function findForage(world, fromX, range = 40) {
  const c0 = Math.floor(fromX / TILE);
  for (let d = 0; d <= range; d++) {
    for (const tx of (d === 0 ? [c0] : [c0 - d, c0 + d])) {
      if (tx < 2 || tx >= WORLD_W - 2) continue;
      if (forageAt(tx, world)) return tx * TILE + TILE / 2;
    }
  }
  return null;
}

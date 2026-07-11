// THE ground truth for procedural decorations. drawCaveProps (render), the
// scanner, and the scan highlight all consult this one module, so a feature the
// scanner names is always a feature you can see - no phantom mushrooms.
// Placement is a seed-independent positional hash (core/rng.js hashCol), so it
// is stable across saves and identical for render + scan by construction.

import { T_AIR, WORLD_W } from '../config.js';
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

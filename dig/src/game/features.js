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
 * @returns {null|{ceiling:'roots'|'stalactite'|null,
 *                 floor:'stalagmite'|'mushroom'|'crystal'|null,
 *                 h:number, si:number, depth:number}}
 */
export function caveFeaturesAt(world, tx, ty) {
  if (world.tileAt(tx, ty) !== T_AIR) return null;
  const depth = world.depthOfRow(tx, ty);
  if (depth < 3) return null;
  const h = hashCol(tx * 13 + 5, ty * 7 + 3);
  const si = world.stratumIndexAt(tx, ty);

  let ceiling = null, floor = null;
  if (world.solidAt(tx, ty - 1)) {
    if (depth < 42 && h > 0.82) ceiling = 'roots';
    else if (h > 0.9) ceiling = 'stalactite';
  }
  if (world.solidAt(tx, ty + 1)) {
    // under the Crystal Barrens, crystals grow shallow (the biome's signature)
    const crystalBiome = biomeAtX(tx, WORLD_W).id === 'crystal';
    const crystalDepthOk = si >= STRATA.length - 2 || (crystalBiome && depth > 20);
    if (h > 0.9 && h < 0.94) floor = 'stalagmite';
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
export function sceneryAt(tx) {
  const sc = biomeAtX(tx, WORLD_W).scenery;
  if (hashCol(tx, 55) > sc.treeP) return 'tree';
  if (hashCol(tx, 40) > sc.dressP) return 'dressing';
  return null;
}

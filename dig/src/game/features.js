// THE ground truth for procedural decorations. drawCaveProps (render), the
// scanner, and the scan highlight all consult this one module, so a feature the
// scanner names is always a feature you can see - no phantom mushrooms.
// Placement is a seed-independent positional hash (core/rng.js hashCol), so it
// is stable across saves and identical for render + scan by construction.

import { T_AIR } from '../config.js';
import { STRATA } from '../content/strata.js';
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
    if (h > 0.9 && h < 0.94) floor = 'stalagmite';
    else if (depth > 14 && h > 0.965) floor = world.isHarvested?.(tx, ty) ? null : 'mushroom';
    else if (si >= STRATA.length - 2 && h > 0.93 && h <= 0.965) floor = world.isHarvested?.(tx, ty) ? null : 'crystal';
  }
  return (ceiling || floor) ? { ceiling, floor, h, si, depth } : null;
}

/** which features can be harvested (E with the scanner) → material id */
export const HARVESTABLE = { mushroom: 'mushroom', crystal: 'crystal' };

/**
 * Surface scenery at a column: 'tree' | 'dressing' | null (grass tufts are
 * ubiquitous and not scannable). Same hash gates as drawScenery.
 */
export function sceneryAt(tx) {
  if (hashCol(tx, 55) > 0.93) return 'tree';
  if (hashCol(tx, 40) > 0.9) return 'dressing';
  return null;
}

// The scanner. Given the aim point (world px), resolve the nearest scannable
// thing to a codex id: a live creature (from ambient.scanTargets), a fluid or
// cave feature tile, flora on the surface, or the rock stratum itself. Holding
// the scan logs the entry + returns it for a card.

import { TILE, T_WATER, T_LAVA, T_AIR, T_ROCK } from '../config.js';
import { biomeAtX } from '../content/biomes.js';

const REACH = TILE * 6;

/**
 * @param {number} wx world x  @param {number} wy world y
 * @param {object} world  @param {Array} creatures  scanTargets() output
 * @returns {string|null} codex id under the reticle
 */
export function scanTargetAt(wx, wy, world, creatures) {
  // 1) nearest live creature within reach
  let best = null, bd = REACH * REACH;
  for (const c of creatures) {
    const d = (c.x - wx) ** 2 + (c.y - wy) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  if (best) return best.kind;

  // 2) the tile under the reticle
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  const t = world.tileAt(tx, ty);
  if (t === T_WATER) return 'water';
  if (t === T_LAVA) return 'lava';

  // 3) a cave feature just below a solid ceiling / above a solid floor (heuristic
  //    mirrors the render: mushrooms/crystals on floors, stalactites on ceilings)
  if (t === T_AIR && world.depthOfRow(tx, ty) > 3) {
    const si = world.stratumIndexAt(tx, ty);
    if (world.solidAt(tx, ty + 1)) {
      if (si >= 7) return 'crystal';
      return 'mushroom';
    }
    if (world.solidAt(tx, ty - 1)) return 'stalactite';
  }

  // 4) surface flora / grass → the biome's tree; else the rock sample
  if (t === T_AIR && world.depthOfRow(tx, ty) <= 1) {
    const biome = biomeAtX(tx, world.WORLD_W);
    return biome.id === 'tundra' ? 'tree-conifer' : biome.id === 'coast' ? 'tree-palm' : 'tree-badlands';
  }
  if (t === T_ROCK) return `rock-${world.stratumAt(tx, ty).id}`;
  return null;
}

// The scanner. Given the aim point (world px), resolve the nearest scannable
// thing to a codex id AND its world rect (so the reticle can bracket exactly
// what will be catalogued): a live creature (ambient.scanTargets), a cave
// feature (game/features.js is the ground truth - scan never names something
// the render doesn't draw), a fluid tile, surface flora, or the rock itself.

import { TILE, T_WATER, T_LAVA, T_BRINE, T_TAR, T_AIR, T_ROCK, T_OBSIDIAN } from '../config.js';
import { biomeAtX } from '../content/biomes.js';
import { caveFeaturesAt, sceneryAt, HARVESTABLE } from './features.js';

const REACH = TILE * 6;

/** shape a creature scan-target into a resolved codex rect */
function creatureHit(c) {
  const [sw, sh] = c.size || [14, 12];
  return { id: c.kind, kind: 'creature', ref: c.ref || null, x: c.x - sw / 2 - 3, y: c.y - sh - 3, w: sw + 6, h: sh + 6 };
}

/**
 * Every scannable thing under the reticle, ORDERED so a tap locks the most
 * likely target first and re-taps cycle through the rest: all creatures within
 * reach (nearest-first), then the single tile/flora/fluid/rock beneath the
 * point as the final fallback. This is how overlapping/stacked creatures become
 * reachable - the resolver no longer collapses them to just the nearest.
 * @returns {Array<{id,kind,x,y,w,h,ref?,harvest?}>}  possibly empty
 */
export function resolveScanCandidates(wx, wy, world, creatures) {
  const out = [];
  // creatures, nearest-center first
  const near = creatures
    .map(c => ({ c, d: (c.x - wx) ** 2 + (c.y - wy) ** 2 }))
    .filter(o => o.d < REACH * REACH)
    .sort((a, b) => a.d - b.d);
  for (const o of near) out.push(creatureHit(o.c));
  // then whatever tile/flora/fluid/rock sits under the point (one entry)
  const tile = resolveTile(wx, wy, world);
  if (tile) out.push(tile);
  return out;
}

/**
 * @param {number} wx world x  @param {number} wy world y
 * @param {object} world  @param {Array<{kind,x,y,size?}>} creatures  scanTargets() output
 * @returns {null|{id:string, kind:'creature'|'feature'|'fluid'|'flora'|'rock',
 *                 x:number, y:number, w:number, h:number, harvest?:string}}
 *          the top candidate (nearest creature, else the tile under the point)
 */
export function resolveScan(wx, wy, world, creatures) {
  // 1) nearest live creature within reach
  let best = null, bd = REACH * REACH;
  for (const c of creatures) {
    const d = (c.x - wx) ** 2 + (c.y - wy) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  if (best) return creatureHit(best);
  return resolveTile(wx, wy, world);
}

/** the single non-creature thing under the point (tile/flora/fluid/rock), or null */
function resolveTile(wx, wy, world) {
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  const tileRect = { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
  const t = world.tileAt(tx, ty);

  // obsidian reads as a mineral feature
  if (t === T_OBSIDIAN) return { id: 'obsidian', kind: 'feature', ...tileRect };

  // 2) fluids under the reticle
  if (t === T_WATER) return { id: 'water', kind: 'fluid', ...tileRect };
  if (t === T_LAVA) return { id: 'lava', kind: 'fluid', ...tileRect };
  if (t === T_BRINE) return { id: 'brine', kind: 'fluid', ...tileRect };
  if (t === T_TAR) return { id: 'tar', kind: 'fluid', ...tileRect };

  // 3) cave decorations - EXACTLY what the render draws (features.js)
  const f = caveFeaturesAt(world, tx, ty);
  if (f) {
    // both halves present: pick by which half of the tile the reticle is in
    const topHalf = wy - ty * TILE < TILE / 2;
    let id = topHalf ? (f.ceiling || f.floor) : (f.floor || f.ceiling);
    if (id === 'crystal-tip') id = 'crystal';        // geode ceiling teeth = crystal codex
    const cat = id === 'vines' ? 'flora' : 'feature';
    return { id, kind: cat, ...tileRect, harvest: HARVESTABLE[id] };
  }

  // 4) surface flora - only where drawScenery actually put something
  if (t === T_AIR && world.depthOfRow(tx, ty) <= 1) {
    for (const ox of [0, -1, 1, -2, 2]) {
      const c = tx + ox;
      const s = sceneryAt(c, world);
      if (!s) continue;
      const groundY = world.surface[Math.max(0, Math.min(world.WORLD_W - 1, c))] * TILE;
      const biome = biomeAtX(c, world.WORLD_W);
      const id = s === 'tree' ? biome.scenery.tree : null;   // dressings aren't codex entries yet
      if (!id) continue;
      const rect = { x: c * TILE + TILE / 2 - 28, y: groundY - 72, w: 56, h: 74 };
      if (wx >= rect.x - 8 && wx <= rect.x + rect.w + 8) return { id, kind: 'flora', ...rect };
    }
    return null;
  }

  // 5) a buried garbage deposit reads through the rock (tell scrap from bottles)
  if (t === T_ROCK) {
    const g = world.garbageAt?.(tx, ty);
    if (g) return { id: g.type, kind: 'salvage', ...tileRect };
    return { id: `rock-${world.stratumAt(tx, ty).id}`, kind: 'rock', ...tileRect };
  }
  return null;
}

/** @returns {string|null} codex id under the reticle (legacy shape) */
export function scanTargetAt(wx, wy, world, creatures) {
  return resolveScan(wx, wy, world, creatures)?.id ?? null;
}

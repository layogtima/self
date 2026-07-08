// Flowing fluids — a bounded cellular automaton over the tile grid. Water and
// lava spread DOWN, then sideways into adjacent AIR. Only tiles within a window
// around the camera are processed, and only cells flagged "active" (recently
// touched), so the whole world never simulates at once. Conserves volume: fluid
// moves, it doesn't multiply, so a breached pool drains and settles.

import { WORLD_W, WORLD_H, T_AIR, T_WATER, T_LAVA } from '../config.js';

export function makeFluids(world) {
  const tiles = world.tiles;
  const active = new Set();            // packed indices to (re)check
  const lavaSpeed = 0.35;              // lava flows slower (checked prob per frame)

  const isFluid = t => t === T_WATER || t === T_LAVA;

  /** mark a cell + neighbours active (call when something changes near it) */
  function wake(tx, ty) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const x = tx + dx, y = ty + dy;
        if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) active.add(y * WORLD_W + x);
      }
  }

  return {
    wake,
    isFluid,

    /** seed the initial active set from all fluid tiles once at load */
    seedActive() {
      for (let i = 0; i < tiles.length; i++) if (isFluid(tiles[i])) active.add(i);
    },

    /** call each frame with the camera tile bounds */
    step(bounds, dt) {
      if (!active.size) return;
      const { x0, x1, y0, y1 } = bounds;
      const next = new Set();
      // process bottom-up so a column of fluid falls in one pass
      const cells = [...active].filter(i => {
        const x = i % WORLD_W, y = (i / WORLD_W) | 0;
        return x >= x0 - 2 && x <= x1 + 2 && y >= y0 - 2 && y <= y1 + 2;
      }).sort((a, b) => b - a);
      // carry the un-processed (off-screen) actives forward so they resume later
      for (const i of active) {
        const x = i % WORLD_W, y = (i / WORLD_W) | 0;
        if (!(x >= x0 - 2 && x <= x1 + 2 && y >= y0 - 2 && y <= y1 + 2)) next.add(i);
      }

      for (const i of cells) {
        const t = tiles[i];
        if (!isFluid(t)) continue;
        const x = i % WORLD_W, y = (i / WORLD_W) | 0;
        if (t === T_LAVA && Math.random() > lavaSpeed) { next.add(i); continue; }

        // 1) fall straight down
        const below = (y + 1) * WORLD_W + x;
        if (y + 1 < WORLD_H && tiles[below] === T_AIR) {
          tiles[below] = t; tiles[i] = T_AIR;
          wakeInto(next, x, y); wakeInto(next, x, y + 1);
          continue;
        }
        // 2) spread sideways into air (prefer the side with air below → it keeps falling)
        const dirs = Math.random() < 0.5 ? [-1, 1] : [1, -1];
        let moved = false;
        for (const dx of dirs) {
          const sx = x + dx;
          if (sx < 0 || sx >= WORLD_W) continue;
          const side = y * WORLD_W + sx;
          if (tiles[side] === T_AIR) {
            tiles[side] = t; tiles[i] = T_AIR;
            wakeInto(next, x, y); wakeInto(next, sx, y);
            moved = true; break;
          }
        }
        if (!moved) {
          // settled but keep watching a couple frames in case a wall is dug away
          next.add(i);
        }
      }
      active.clear();
      for (const i of next) active.add(i);
      // hard cap so a pathological world can't grow the active set unbounded
      if (active.size > 6000) { let n = 0; for (const i of active) { if (n++ > 6000) active.delete(i); } }
    },

    activeCount() { return active.size; },
  };

  function wakeInto(set, tx, ty) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const x = tx + dx, y = ty + dy;
        if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) set.add(y * WORLD_W + x);
      }
  }
}

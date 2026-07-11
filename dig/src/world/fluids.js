// Flowing fluids - a bounded cellular automaton over the tile grid. Water,
// brine, tar and lava spread DOWN, then sideways into adjacent AIR, each at its
// own VISCOSITY (config FLUID_SPECS: water pours, brine sloshes, lava creeps,
// tar barely moves). Only tiles within a window around the camera are
// processed, and only cells flagged "active" (recently touched), so the whole
// world never simulates at once. Conserves volume: fluid moves, it doesn't
// multiply, so a breached pool drains and settles.

import { WORLD_W, WORLD_H, T_AIR, T_WATER, T_LAVA, T_BRINE, T_OBSIDIAN, FLUID_SPECS, FLUID_ACTIVE_CAP } from '../config.js';

export function makeFluids(world) {
  const tiles = world.tiles;
  const active = new Set();            // packed indices to (re)check

  const isFluid = t => FLUID_SPECS[t] !== undefined;

  /**
   * Quench a lava tile that touches water/brine: molten rock hitting water is
   * the classic - it flashes the water to steam and freezes to volcanic glass.
   * Returns true if a reaction happened (the lava cell is consumed).
   */
  function tryReact(x, y) {
    const i = y * WORLD_W + x;
    if (tiles[i] !== T_LAVA) return false;
    for (const [ox, oy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + ox, ny = y + oy;
      if (nx < 0 || nx >= WORLD_W || ny < 0 || ny >= WORLD_H) continue;
      const nt = tiles[ny * WORLD_W + nx];
      if (nt === T_WATER || nt === T_BRINE) {
        tiles[i] = T_OBSIDIAN;                       // lava -> volcanic glass
        tiles[ny * WORLD_W + nx] = T_AIR;            // water flashes to steam
        world.reactAt?.(x, y, 'quench');            // scene drains this for steam + hiss
        wake(x, y); wake(nx, ny);
        return true;
      }
    }
    return false;
  }

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
        // reactions first: lava meeting water freezes to obsidian this frame
        if (t === T_LAVA && tryReact(x, y)) continue;
        if (Math.random() > FLUID_SPECS[t].visc) { next.add(i); continue; }   // viscosity gate

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
      // cap the active set, but evict the cells FARTHEST from the camera so the
      // fluid you're looking at always keeps simulating (Set-order eviction used
      // to freeze on-screen pools on the big world)
      if (active.size > FLUID_ACTIVE_CAP) {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const arr = [...active].sort((a, b) => {
          const ax = a % WORLD_W, ay = (a / WORLD_W) | 0, bx = b % WORLD_W, by = (b / WORLD_W) | 0;
          return ((bx - cx) ** 2 + (by - cy) ** 2) - ((ax - cx) ** 2 + (ay - cy) ** 2);   // farthest first
        });
        for (let k = 0; k < arr.length - FLUID_ACTIVE_CAP; k++) active.delete(arr[k]);
      }
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

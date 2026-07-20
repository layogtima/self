// JAR · pass 3 — matter movement (the falling-sand layer).
// Bottom-up sweep for fallers, top-down sweep for risers, alternating x
// direction per tick to avoid directional bias. flag[] guards against a cell
// moving twice in one pass. Nothing ever leaves the grid: the jar is sealed.

import { M } from './config.js';
import { rnd } from './prng.js';

export function matterPass(w) {
  const { W, H, material, flag } = w;
  flag.fill(0);
  const ltr = (w.tick & 1) === 0;

  // ---- fallers: soil, sand, seed, deadmatter, water ----
  for (let y = H - 2; y >= 0; y--) {
    const row = y * W;
    for (let xi = 0; xi < W; xi++) {
      const x = ltr ? xi : W - 1 - xi;
      const i = row + x, m = material[i];
      if (flag[i]) continue;
      const dn = i + W;
      switch (m) {
        case M.SAND: case M.DEAD: case M.SEED: case M.FRUIT: {
          if (material[dn] === M.AIR) { move(w, i, dn); }
          else if (material[dn] === M.WATER && rnd(w) < (m === M.SEED ? 0.25 : 0.45)) swap(w, i, dn);
          else if (rnd(w) < (m === M.SAND ? 0.9 : 0.5)) {
            // seeds included: a cast seed must tumble OFF its parent stalk,
            // or it sits on the tip forever — blocking growth, never germinating
            const s = rnd(w) < 0.5 ? 1 : -1;
            if (ok(w, x + s) && material[dn + s] === M.AIR && material[i + s] === M.AIR) move(w, i, dn + s);
            else if (ok(w, x - s) && material[dn - s] === M.AIR && material[i - s] === M.AIR) move(w, i, dn - s);
          }
          break;
        }
        case M.SOIL: {
          if (material[dn] === M.AIR) move(w, i, dn);
          else if (material[dn] === M.WATER && rnd(w) < 0.35) swap(w, i, dn);
          else if (rnd(w) < 0.12) { // slow slump: soil holds steeper faces than sand
            const s = rnd(w) < 0.5 ? 1 : -1;
            if (ok(w, x + s) && material[dn + s] === M.AIR && material[i + s] === M.AIR) move(w, i, dn + s);
          }
          break;
        }
        case M.WATER: {
          if (material[dn] === M.AIR) { move(w, i, dn); break; }
          const s = ((x ^ y ^ w.tick) & 1) === 0 ? 1 : -1;
          if (ok(w, x + s) && material[dn + s] === M.AIR) move(w, i, dn + s);
          else if (ok(w, x - s) && material[dn - s] === M.AIR) move(w, i, dn - s);
          else if (ok(w, x + s) && material[i + s] === M.AIR) move(w, i, i + s);
          else if (ok(w, x - s) && material[i - s] === M.AIR) move(w, i, i - s);
          break;
        }
      }
    }
  }

  // ---- risers: steam, smoke (top-down so a rising cell isn't re-processed) ----
  for (let y = 1; y < H; y++) {
    const row = y * W;
    for (let xi = 0; xi < W; xi++) {
      const x = ltr ? xi : W - 1 - xi;
      const i = row + x, m = material[i];
      if (flag[i] || (m !== M.STEAM && m !== M.SMOKE)) continue;
      const up = i - W;
      const p = m === M.STEAM ? 0.85 : 0.6;
      if (material[up] === M.AIR && rnd(w) < p) { move(w, i, up); continue; }
      if (m === M.STEAM && material[up] === M.WATER && rnd(w) < 0.6) { swap(w, i, up); continue; }
      const s = rnd(w) < 0.5 ? 1 : -1;
      if (ok(w, x + s) && material[up + s] === M.AIR && rnd(w) < p) move(w, i, up + s);
      else if (ok(w, x + s) && material[i + s] === M.AIR && rnd(w) < 0.3) move(w, i, i + s);
    }
  }
}

function ok(w, x) { return x >= 0 && x < w.W; }

function move(w, from, to) {
  w.material[to] = w.material[from];
  w.material[from] = M.AIR;
  w.meta[to] = w.meta[from]; w.meta[from] = 0;
  w.energy[to] = w.energy[from]; w.energy[from] = 0;
  w.flag[to] = 1; w.flag[from] = 1;
}

function swap(w, a, b) {
  const m = w.material[a]; w.material[a] = w.material[b]; w.material[b] = m;
  const t = w.meta[a]; w.meta[a] = w.meta[b]; w.meta[b] = t;
  const e = w.energy[a]; w.energy[a] = w.energy[b]; w.energy[b] = e;
  w.flag[a] = 1; w.flag[b] = 1;
}

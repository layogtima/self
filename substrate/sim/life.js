// JAR · pass 4 — life (the Creatures ambition, scoped ruthlessly).
// Light is computed here per column, not stored between ticks. Then one sweep
// handles nutrient percolation, seeds, plants, mycelium, and fruit.
//
// Mass ledger for every rule in this file (organic units, 1 cell = 1):
//   seed→plant 1:1 · plant growth: nutrient −1 → plant +1 · tip→seed 1:1
//   death→deadmatter 1:1 · dead→mycelium 1:1 · mycelium dissolve → nutrient +1
//   (soil-born mycelium reverts to soil, net 0) · fruit: nutrient −1 → fruit +1
// Energy (from light) is the only thing that enters the jar. Mass never does.

import { M, TRANSMIT } from './config.js';
import { rnd } from './prng.js';

export function lifePass(w) {
  const { W, H, material, light, cfg } = w;
  // ---- light: per-column scan from the lid down; canopy shades itself ----
  for (let x = 0; x < W; x++) {
    let l = 1.0;
    for (let y = 0, i = x; y < H; y++, i += W) {
      light[i] = l;
      l *= TRANSMIT[material[i]];
      if (l < 0.002) { // column is dark from here on
        for (let yy = y + 1, ii = i + W; yy < H; yy++, ii += W) light[ii] = 0;
        break;
      }
    }
  }

  const { nutrient, energy, meta, temp, flag } = w;
  flag.fill(0);
  const ltr = (w.tick & 1) === 0;

  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let xi = 0; xi < W; xi++) {
      const x = ltr ? xi : W - 1 - xi;
      const i = row + x;
      const m = material[i];
      // nutrient percolates down until soil, mycelium (the transport network
      // holds what it digests), or a rock shelf catches it
      if (nutrient[i] > 0 && m !== M.SOIL && m !== M.ROCK && m !== M.MYC && y < H - 1 && material[i + W] !== M.ROCK) {
        nutrient[i + W] += nutrient[i]; nutrient[i] = 0;
      }
      if (flag[i]) continue;

      switch (m) {
        case M.SEED: {
          const below = i + W;
          if (y < H - 1 && material[below] === M.SOIL && light[i] >= cfg.PLANT_LIGHT_MIN &&
              (damp(w, x, y) || damp(w, x, y + 1) || nutrient[below] >= 1.5)) {
            material[i] = M.PLANT; energy[i] = 60; meta[i] = 0; flag[i] = 1;
          } else if (rnd(w) < 0.02 && ++meta[i] >= Math.min(255, cfg.SEED_TTL)) {
            material[i] = M.DEAD; meta[i] = 0; // dormancy ran out; the seed rots
          }
          break;
        }
        case M.PLANT: plantCell(w, i, x, y); break;
        case M.MYC: mycCell(w, i, x, y); break;
        case M.DEAD:
          // spores are everywhere; any corpse can sprout its own decomposer
          if (rnd(w) < 0.0004) { material[i] = M.MYC; meta[i] = 0; flag[i] = 1; }
          break;
        case M.SOIL:
          // nutrient slowly evens out through the bed, so an exhausted root
          // ball recharges from its neighbours instead of starving forever
          if (rnd(w) < 0.15) {
            const r4 = rnd(w), j = r4 < 0.25 ? (x > 0 ? i - 1 : -1) : r4 < 0.5 ? (x < W - 1 ? i + 1 : -1)
                     : r4 < 0.75 ? (y > 0 ? i - W : -1) : (y < H - 1 ? i + W : -1);
            if (j >= 0 && material[j] === M.SOIL) {
              const dN = (nutrient[i] - nutrient[j]) * 0.25;
              nutrient[i] -= dN; nutrient[j] += dN;
            }
          }
          break;
        case M.FRUIT:
          if (rnd(w) < 0.05 && ++meta[i] >= Math.min(255, cfg.FRUIT_TTL)) {
            material[i] = M.DEAD; meta[i] = 0;
          }
          break;
      }
    }
  }
}

function damp(w, x, y) {
  const { W, H, material } = w, i = y * W + x;
  return (x > 0 && isWet(material[i - 1])) || (x < W - 1 && isWet(material[i + 1])) ||
         (y > 0 && isWet(material[i - W])) || (y < H - 1 && isWet(material[i + W]));
}
function isWet(m) { return m === M.WATER || m === M.ICE; }

function plantCell(w, i, x, y) {
  const { W, material, energy, meta, temp, light, nutrient, flag, cfg } = w;
  if (temp[i] < cfg.FREEZE_KILL) { material[i] = M.DEAD; energy[i] = 0; meta[i] = 0; return; }
  const isDamp = damp(w, x, y) || (y < w.H - 1 && damp(w, x, y + 1));
  // photosynthesis: light × moisture — the only energy inlet the jar has
  if (energy[i] < 255 && rnd(w) < light[i] * cfg.PLANT_PHOTO * (isDamp ? 1 : 0.35)) energy[i]++;
  // crude phloem: vertical energy sharing keeps the shaded base alive
  if (y > 0 && material[i - W] === M.PLANT && rnd(w) < 0.5) {
    const up = i - W, diff = energy[i] - energy[up];
    if (diff > 1) { energy[i]--; energy[up]++; }
    else if (diff < -1) { energy[i]++; energy[up]--; }
  }
  if (rnd(w) < cfg.PLANT_METAB) {
    if (energy[i] === 0) { material[i] = M.DEAD; meta[i] = 0; return; }
    energy[i]--;
  }
  if (meta[i] < 255 && rnd(w) < cfg.PLANT_AGE_P) meta[i]++;
  // a mature tip casts itself off as a seed (mass moves, plant shrinks)
  if (meta[i] >= cfg.PLANT_MATURITY && y > 0 && material[i - W] === M.AIR && rnd(w) < cfg.SEED_RATE) {
    material[i] = M.SEED; energy[i] = 0; meta[i] = 0; flag[i] = 1;
    return;
  }
  // growth: costs energy AND one unit of nutrient mass pulled from nearby
  if (energy[i] > cfg.PLANT_GROW_COST && rnd(w) < cfg.PLANT_GROW_P) {
    const target = pickGrowth(w, i, x, y);
    if (target >= 0 && takeNutrient(w, i, x, y, 1.0)) {
      material[target] = M.PLANT;
      energy[target] = cfg.PLANT_GROW_COST >> 1;
      meta[target] = 0;
      energy[i] -= cfg.PLANT_GROW_COST;
      flag[target] = 1;
    }
  }
}

function pickGrowth(w, i, x, y) {
  // grow toward the light: up, up-left, up-right, weighted by the light field
  const { W, material, light, cfg } = w;
  if (y === 0) return -1;
  let best = -1, bestL = cfg.PLANT_LIGHT_MIN * 0.5;
  const cands = [i - W, x > 0 ? i - W - 1 : -1, x < W - 1 ? i - W + 1 : -1];
  for (const j of cands) {
    if (j < 0 || material[j] !== M.AIR) continue;
    const l = light[j] * (0.9 + rnd(w) * 0.2);
    if (l > bestL) { bestL = l; best = j; }
  }
  return best;
}

function takeNutrient(w, i, x, y, want) {
  // roots: walk down the plant's own column to the soil it stands in, then
  // tap a root ball — up to 6 soil deep × 3 wide under the stalk
  const { W, H, material, nutrient } = w;
  const cells = [i, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1];
  let j = i + W, depth = 0;
  while (depth < 24 && ((j / W) | 0) < H && material[j] === M.PLANT) { j += W; depth++; }
  for (let dS = 0; dS < 10 && ((j / W) | 0) < H && material[j] === M.SOIL; dS++, j += W) {
    cells.push(j);
    if ((j % W) > 0) cells.push(j - 1);
    if ((j % W) < W - 1) cells.push(j + 1);
  }
  let have = 0;
  for (const c of cells) if (c >= 0) have += nutrient[c];
  if (have < want) return false;
  let left = want;
  for (const c of cells) {
    if (c < 0 || left <= 0) continue;
    const take = Math.min(nutrient[c], left);
    nutrient[c] -= take; left -= take;
  }
  return true;
}

function mycCell(w, i, x, y) {
  const { W, H, material, meta, nutrient, flag, cfg } = w;
  const soilborn = meta[i] & 128;
  let age = meta[i] & 127;
  if (age < 127 && rnd(w) < 0.02) age++;
  meta[i] = soilborn | age;
  const fed = nutrient[i] > 0.3 || hasNeighbor(w, x, y, M.DEAD);
  const isDamp = damp(w, x, y) || (y < H - 1 && damp(w, x, y + 1)) || fed;
  // dissolve: old age, or dried out with nothing left to eat
  if ((age > 30 && rnd(w) < cfg.DECOMPOSE_RATE) || (!isDamp && rnd(w) < cfg.MYC_DRY_P)) {
    if (soilborn) { material[i] = M.SOIL; meta[i] = 0; }
    else { material[i] = M.AIR; meta[i] = 0; nutrient[i] += 1; } // corpse → nutrient
    return;
  }
  // spread: through deadmatter (decomposing it); creep through soil only
  // while actively digesting a corpse — hyphae radiate from food, they don't
  // colonise the whole bed
  const digesting = hasNeighbor(w, x, y, M.DEAD);
  const nb = [y > 0 ? i - W : -1, y < H - 1 ? i + W : -1, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1];
  for (const j of nb) {
    if (j < 0 || flag[j]) continue;
    const mj = material[j];
    if (mj === M.DEAD && rnd(w) < cfg.MYC_SPREAD_P) {
      material[j] = M.MYC; meta[j] = 0; flag[j] = 1;
    } else if (mj === M.SOIL && digesting && rnd(w) < cfg.MYC_SOIL_P) {
      material[j] = M.MYC; meta[j] = 128; flag[j] = 1; // remembers it was soil
    }
  }
  // fruiting body: one unit of nutrient mass becomes a visible bloom
  if (y > 0 && material[i - W] === M.AIR && rnd(w) < cfg.MYC_FRUIT_P) {
    const below = y < H - 1 ? i + W : i;
    if (nutrient[i] + nutrient[below] >= cfg.MYC_FRUIT_NUTRIENT) {
      let left = 1.0;
      const t1 = Math.min(nutrient[i], left); nutrient[i] -= t1; left -= t1;
      if (left > 0) nutrient[below] -= left;
      material[i - W] = M.FRUIT; meta[i - W] = 0; flag[i - W] = 1;
    }
  }
}

function hasNeighbor(w, x, y, mat) {
  const { W, H, material } = w, i = y * W + x;
  return (x > 0 && material[i - 1] === mat) || (x < W - 1 && material[i + 1] === mat) ||
         (y > 0 && material[i - W] === mat) || (y < H - 1 && material[i + W] === mat);
}

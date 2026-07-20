// JAR · pass 5 — creatures (the DF layer). One species for v0.1: the grazer.
// Off-grid struct-of-arrays agents, cap 64. Drives + gradients only, no
// brains: wander (noise-driven), seek plants when hungry (local window, no
// global pathfinding), follow the temperature gradient toward comfort —
// creatures FEEL the heat layer. Reproduce on surplus, die into deadmatter.
//
// Energy↔mass exchange (keeps the organic ledger honest):
//   eat: plant cell (1 mass) → EAT_GAIN energy + 0.5 gut mass
//   metabolism: spent energy is exhaled as trace nutrient (mass back to loop)
//   gut ≥ 1 → 1 deadmatter droplet · death → body mass returns as deadmatter

import { M } from './config.js';
import { rnd } from './prng.js';
import { spawnGrazer } from './world.js';

const PASSABLE = new Uint8Array(16);
PASSABLE[M.AIR] = PASSABLE[M.WATER] = PASSABLE[M.STEAM] = PASSABLE[M.SMOKE] = PASSABLE[M.SEED] = 1;
const EDIBLE = new Uint8Array(16);
EDIBLE[M.PLANT] = EDIBLE[M.FRUIT] = 1;

// grazers browse the canopy: a plant cell is only edible if it's a tip (air
// above). The stalk survives grazing and regrows — this is what keeps the
// predator-prey loop from exterminating its own food supply. Fruit is always fair game.
function edibleAt(w, j) {
  const m = w.material[j];
  if (m === M.FRUIT) return true;
  return m === M.PLANT && j >= w.W && w.material[j - w.W] === M.AIR;
}

export function creaturePass(w) {
  const a = w.agents, { W, H, material, temp, nutrient, cfg } = w;
  const e2m = 0.5 / cfg.GRAZER_EAT_GAIN; // mass-equivalent of one energy unit

  for (let g = 0; g < a.cap; g++) {
    if (!a.alive[g]) continue;
    let x = a.x[g], y = a.y[g];
    let cx = x | 0, cy = y | 0;
    const ci = cy * W + cx;

    // ---- metabolism: every unit of energy spent is exhaled back into the
    // loop as its nutrient mass-equivalent — the ledger stays exact ----
    const moving = Math.abs(a.vx[g]) > 0.02 ? cfg.GRAZER_MOVE_COST : 0;
    let burn = cfg.GRAZER_METAB + moving;

    // ---- temperature: discomfort steers, extremes damage ----
    const t = temp[ci];
    const dev = t - cfg.GRAZER_COMFORT;
    let steerX = 0;
    if (Math.abs(dev) > cfg.GRAZER_BAND) {
      // sample the local gradient; walk toward comfort along x
      const tl = cx > 1 ? temp[ci - 2] : t, tr = cx < W - 2 ? temp[ci + 2] : t;
      steerX = (dev > 0 ? (tl < tr ? -1 : 1) : (tl > tr ? -1 : 1)) * 1.5;
      if (Math.abs(dev) > cfg.GRAZER_LETHAL) burn += 0.4; // cooking/freezing
    }
    a.energy[g] -= burn;
    nutrient[ci] += burn * e2m;

    // ---- grazing: always nibble what's in reach (that's how energy climbs
    // past the reproduction threshold); actively SEEK food only when hungry ----
    let ate = false;
    if (a.energy[g] < 230) {
      const nb = [ci, cx > 0 ? ci - 1 : -1, cx < W - 1 ? ci + 1 : -1, ci - W, cy < H - 1 ? ci + W : -1];
      for (const j of nb) {
        if (j >= 0 && edibleAt(w, j)) {
          material[j] = M.AIR; w.energy[j] = 0; w.meta[j] = 0;
          a.energy[g] = Math.min(255, a.energy[g] + cfg.GRAZER_EAT_GAIN);
          a.gut[g] += 0.5;
          ate = true;
          break;
        }
      }
    }
    if (!ate && a.energy[g] < cfg.GRAZER_HUNGRY) {
      const R = cfg.GRAZER_SENSE | 0;
      let best = -1, bestD = 1e9;
      for (let oy = -R; oy <= R; oy++) {
        const yy = cy + oy;
        if (yy < 0 || yy >= H) continue;
        for (let ox = -R; ox <= R; ox++) {
          const xx = cx + ox;
          if (xx < 0 || xx >= W) continue;
          const jj = yy * W + xx;
          if (EDIBLE[material[jj]] && edibleAt(w, jj)) {
            const d = ox * ox + oy * oy;
            if (d < bestD) { bestD = d; best = jj; }
          }
        }
      }
      if (best >= 0) {
        const bx = best % W, by = (best / W) | 0;
        if (bestD <= 2.5 && edibleAt(w, best)) { // in reach: eat it
          material[best] = M.AIR; w.energy[best] = 0; w.meta[best] = 0;
          a.energy[g] = Math.min(255, a.energy[g] + cfg.GRAZER_EAT_GAIN);
          a.gut[g] += 0.5;
          ate = true;
        } else {
          steerX = Math.sign(bx - x) * 2;
          if (by < cy - 1 && rnd(w) < 0.3) a.vy[g] -= 0.8; // hop toward hanging food
        }
      }
    }

    // ---- wander ----
    a.heading[g] += (rnd(w) - 0.5) * 0.6;
    let dir = Math.cos(a.heading[g]) + steerX;
    dir = Math.max(-1, Math.min(1, dir));
    a.vx[g] = dir * cfg.GRAZER_SPEED;

    // ---- movement: gravity, ground walk, 1-cell step climb, float in water ----
    const inWater = material[ci] === M.WATER;
    a.vy[g] += inWater ? -0.02 : 0.12;             // buoyant vs. falling
    a.vy[g] = Math.max(-1.2, Math.min(1.2, a.vy[g] * (inWater ? 0.9 : 1)));
    let nx = x + a.vx[g], ny = y + a.vy[g];
    nx = Math.max(1, Math.min(W - 2, nx));
    ny = Math.max(1, Math.min(H - 2, ny));
    // vertical
    if (PASSABLE[material[(ny | 0) * W + cx]]) y = ny;
    else if (a.vy[g] > 0) a.vy[g] = 0; else a.vy[g] = 0;
    cy = y | 0;
    // horizontal, with step-up
    const ti = cy * W + (nx | 0);
    if (PASSABLE[material[ti]]) x = nx;
    else if (cy > 1 && PASSABLE[material[ti - W]] && PASSABLE[material[cy * W + cx - W]]) { x = nx; y = cy - 1; }
    else a.heading[g] += Math.PI * (0.7 + rnd(w) * 0.6); // blocked: turn around
    a.x[g] = x; a.y[g] = y;
    cx = x | 0; cy = y | 0;

    // ---- droppings: gut mass returns as deadmatter ----
    if (a.gut[g] >= 1) {
      const di = dropSpot(w, cx, cy);
      if (di >= 0) { material[di] = M.DEAD; w.meta[di] = 0; a.gut[g] -= 1; }
    }

    // ---- reproduce ----
    if (a.energy[g] > cfg.GRAZER_REPRO_AT && !ate) {
      const child = spawnGrazer(w, x, y, a.energy[g] / 2);
      if (child >= 0) a.energy[g] /= 2;
    }

    // ---- death: exactly the mass the body carried goes back to the jar —
    // whole units as deadmatter, the fractional remainder as nutrient ----
    if (a.energy[g] <= 0) {
      a.alive[g] = 0;
      let mass = a.gut[g] + Math.max(0, a.energy[g]) * e2m;
      while (mass >= 1) {
        const di = dropSpot(w, cx, cy);
        if (di < 0) break;
        material[di] = M.DEAD; w.meta[di] = 0; mass -= 1;
      }
      nutrient[cy * W + cx] += mass; // remainder, down to the last crumb
    }
  }
}

function dropSpot(w, cx, cy) {
  // nearest air cell at/under the agent (checked outward)
  const { W, H, material } = w;
  const spots = [cy * W + cx, (cy + 1) * W + cx, cy * W + cx - 1, cy * W + cx + 1, (cy - 1) * W + cx];
  for (const i of spots) {
    if (i >= 0 && i < w.N && material[i] === M.AIR) return i;
  }
  return -1;
}

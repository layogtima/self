// JAR · pass 2 — temperature-driven state changes (the ONI layer).
// water ⇄ ice ⇄ steam, fire consuming burnables, smoke settling out as
// nutrient ash. Mass note: every conversion here is 1 cell → 1 cell; smoke
// decay deposits its cell of mass into the nutrient field, so even burning
// keeps matter in the jar.

import { M } from './config.js';
import { rnd } from './prng.js';

const BURNABLE = new Uint8Array(16);
BURNABLE[M.PLANT] = BURNABLE[M.DEAD] = BURNABLE[M.MYC] = BURNABLE[M.SEED] = BURNABLE[M.FRUIT] = 1;

export function statePass(w) {
  const { W, H, N, material, temp, meta, nutrient, cfg } = w;
  for (let i = 0; i < N; i++) {
    const m = material[i];
    if (m === M.AIR || m === M.ROCK) continue;
    const t = temp[i];
    switch (m) {
      case M.WATER:
        if (t <= cfg.FREEZE) material[i] = M.ICE;
        else if (t >= cfg.BOIL) material[i] = M.STEAM;
        else if (t > cfg.EVAP_T && i >= W && material[i - W] === M.AIR && rnd(w) < cfg.EVAP_P)
          material[i] = M.STEAM; // surface evaporation below boil
        break;
      case M.ICE:
        if (t > cfg.MELT) material[i] = M.WATER;
        break;
      case M.STEAM:
        if (t < cfg.CONDENSE) material[i] = M.WATER;
        break;
      case M.FIRE: {
        temp[i] = Math.min(1.6, t + cfg.FIRE_HEAT);
        if (i >= W) temp[i - W] = Math.min(1.6, temp[i - W] + cfg.FIRE_HEAT * 0.6);
        // spread to adjacent burnables
        const x = i % W;
        const nb = [i >= W ? i - W : -1, i < N - W ? i + W : -1, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1];
        for (const j of nb) {
          if (j >= 0 && BURNABLE[material[j]] && rnd(w) < cfg.IGNITE_P) {
            material[j] = M.FIRE; meta[j] = cfg.FIRE_TTL; w.energy[j] = 0;
          }
        }
        if (--meta[i] === 0) { material[i] = M.SMOKE; meta[i] = cfg.SMOKE_TTL; }
        break;
      }
      case M.SMOKE:
        if (--meta[i] === 0) {
          material[i] = M.AIR;
          nutrient[i] += 1; // ash: the burned cell's mass returns to the loop
          w.ledger.smokeSettled += 1;
        }
        break;
      default:
        // spontaneous ignition of any burnable at extreme heat
        if (BURNABLE[m] && t > cfg.IGNITE_T && rnd(w) < 0.5) {
          material[i] = M.FIRE; meta[i] = cfg.FIRE_TTL; w.energy[i] = 0;
        }
    }
  }
}

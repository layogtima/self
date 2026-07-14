// Pheromone fields — the shared chemical medium. One scalar grid per channel; each
// diffuses a touch and evaporates every tick (like dig's fluid CA). BOTH the ants
// and the player deposit here — the same field, which is what makes comms two-way.

import { COLS, ROWS, CH } from './config.js';

// per-channel volatility: alarm is loud + fleeting, trail lingers, queen is slow
const EVAP = { TRAIL: 0.986, ALARM: 0.90, RECRUIT: 0.95, BROOD: 0.97, NECRO: 0.985, QUEEN: 0.999 };
const DIFF = { TRAIL: 0.08, ALARM: 0.22, RECRUIT: 0.14, BROOD: 0.10, NECRO: 0.06, QUEEN: 0.05 };

export function makePheromones() {
  const idx = (x, y) => y * COLS + x;
  const f = {}, scratch = {};
  for (const ch of CH) { f[ch] = new Float32Array(COLS * ROWS); scratch[ch] = new Float32Array(COLS * ROWS); }

  return {
    field: f,
    deposit(ch, x, y, amt) {
      const xi = x | 0, yi = y | 0;
      if (xi < 0 || xi >= COLS || yi < 0 || yi >= ROWS) return;
      f[ch][idx(xi, yi)] = Math.min(4, f[ch][idx(xi, yi)] + amt);
    },
    sample(ch, x, y) {   // bilinear
      const xi = Math.floor(x), yi = Math.floor(y), tx = x - xi, ty = y - yi;
      if (xi < 0 || xi >= COLS - 1 || yi < 0 || yi >= ROWS - 1) return 0;
      const a = f[ch], i = idx(xi, yi);
      return a[i] * (1 - tx) * (1 - ty) + a[i + 1] * tx * (1 - ty) + a[i + COLS] * (1 - tx) * ty + a[i + COLS + 1] * tx * ty;
    },
    grad(ch, x, y) {     // ascent direction (toward stronger signal)
      const gx = this.sample(ch, x + 1, y) - this.sample(ch, x - 1, y);
      const gy = this.sample(ch, x, y + 1) - this.sample(ch, x, y - 1);
      return [gx, gy];
    },
    step(nest) {
      for (const ch of CH) {
        const a = f[ch], s = scratch[ch], k = DIFF[ch], ev = EVAP[ch];
        for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
          const i = idx(x, y);
          // pheromone doesn't diffuse through soil walls (only within air)
          const c = a[i];
          const avg = (a[i - 1] + a[i + 1] + a[i - COLS] + a[i + COLS]) * 0.25;
          s[i] = (c + (avg - c) * k) * ev;
          if (s[i] < 0.002) s[i] = 0;
        }
        f[ch].set(s);
      }
    },
  };
}

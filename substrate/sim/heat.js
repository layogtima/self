// JAR · pass 1 — heat diffusion (the WARMTH core, promoted to a world layer).
// Per-material conductivity, double-buffered, relaxed toward a vertically
// graded ambient: warm floor, cool lid. That gradient IS the weather system —
// steam rises off the pond, condenses under the lid, falls back as rain.

import { HEAT_K } from './config.js';
import { ambientAt } from './world.js';

export function heatPass(w) {
  const { W, H, material, temp, temp2, cfg } = w;
  const relax = 1 - cfg.DECAY;
  for (let y = 0; y < H; y++) {
    const row = y * W;
    const amb = ambientAt(w, y);
    const up = y > 0 ? -W : 0, dn = y < H - 1 ? W : 0;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      const t = temp[i];
      const l = x > 0 ? temp[i - 1] : t;
      const r = x < W - 1 ? temp[i + 1] : t;
      const u = temp[i + up], d = temp[i + dn];
      const lap = l + r + u + d - 4 * t;
      let nt = t + HEAT_K[material[i]] * 0.5 * lap;
      nt += (amb - nt) * relax;
      temp2[i] = nt;
    }
  }
  w.temp = temp2;
  w.temp2 = temp;
}

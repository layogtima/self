// JAR · tick — the fixed pass order. Documented here, never reordered casually:
//   1 heat diffusion → 2 state changes → 3 matter movement → 4 life (incl.
//   light scan) → 5 creatures → 6 bookkeeping/stats.
// Pure and headless: runs in Node with zero DOM references.

import { heatPass } from './heat.js';
import { statePass } from './state.js';
import { matterPass } from './matter.js';
import { lifePass } from './life.js';
import { creaturePass } from './creatures.js';
import { recordStats } from './stats.js';

const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();

export function tick(w) {
  const t0 = now();
  heatPass(w); const t1 = now();
  statePass(w); const t2 = now();
  matterPass(w); const t3 = now();
  lifePass(w); const t4 = now();
  creaturePass(w); const t5 = now();
  w.tick++;
  if (w.tick % 30 === 0) recordStats(w);
  const t6 = now();
  const timings = {
    heat: t1 - t0, state: t2 - t1, matter: t3 - t2,
    life: t4 - t3, creatures: t5 - t4, stats: t6 - t5, total: t6 - t0,
  };
  // EMA for the live HUD; raw values returned for the bench
  const p = w.perf, k = 0.08;
  for (const key in timings) p[key] += (timings[key] - p[key]) * k;
  return timings;
}

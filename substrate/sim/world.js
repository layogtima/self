// JAR · world — createWorld / hashWorld / paint & spawn helpers.
// Pure data + pure functions. Zero DOM references; runs headless in Node.

import { M, DEFAULTS } from './config.js';
import { rnd, fnv } from './prng.js';

export function createWorld(seed, config = {}) {
  const cfg = { ...DEFAULTS, ...config };
  const W = cfg.GRID_W, H = cfg.GRID_H, N = W * H;
  const cap = cfg.AGENT_CAP;
  const w = {
    W, H, N, seed, cfg,
    rngS: seed | 0,
    tick: 0,
    material: new Uint8Array(N),
    temp: new Float32Array(N),
    temp2: new Float32Array(N),
    nutrient: new Float32Array(N),
    energy: new Uint8Array(N),
    meta: new Uint8Array(N),
    light: new Float32Array(N),
    flag: new Uint8Array(N),      // per-pass scratch: moved / just-changed
    agents: {
      cap,
      x: new Float32Array(cap), y: new Float32Array(cap),
      vx: new Float32Array(cap), vy: new Float32Array(cap),
      energy: new Float32Array(cap), gut: new Float32Array(cap),
      heading: new Float32Array(cap), alive: new Uint8Array(cap),
    },
    perf: { heat: 0, state: 0, matter: 0, life: 0, creatures: 0, stats: 0, total: 0 },
    ledger: { smokeSettled: 0, roundingDrift: 0 },
    series: null, // attached by stats.js on first record
  };
  // ambient temperature everywhere to start
  for (let i = 0; i < N; i++) w.temp[i] = ambientAt(w, (i / W) | 0);
  return w;
}

// sealed jar, warm floor, cool lid — the vertical gradient drives the rain cycle
export function ambientAt(w, y) {
  return w.cfg.AMBIENT - w.cfg.LAPSE * (1 - y / w.H);
}

export function hashWorld(w) {
  let h = 2166136261;
  h = fnv(h, w.material);
  h = fnv(h, w.energy);
  h = fnv(h, w.meta);
  h = fnv(h, new Uint8Array(w.temp.buffer));
  h = fnv(h, new Uint8Array(w.nutrient.buffer));
  const a = w.agents;
  h = fnv(h, a.alive);
  h = fnv(h, new Uint8Array(a.x.buffer));
  h = fnv(h, new Uint8Array(a.y.buffer));
  h = fnv(h, new Uint8Array(a.energy.buffer));
  h = fnv(h, new Uint8Array(a.gut.buffer));
  h = fnv(h, new Uint8Array(a.heading.buffer));
  h ^= w.rngS; h = Math.imul(h, 16777619);
  h ^= w.tick; h = Math.imul(h, 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ---- paint & spawn (the brushes call these; presets too) ----

export function paint(w, cx, cy, r, mat, opts = {}) {
  const r2 = r * r;
  for (let y = Math.max(0, cy - r | 0); y <= Math.min(w.H - 1, cy + r | 0); y++)
    for (let x = Math.max(0, cx - r | 0); x <= Math.min(w.W - 1, cx + r | 0); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      const i = y * w.W + x;
      if (opts.onlyInto !== undefined && w.material[i] !== opts.onlyInto) continue;
      w.material[i] = mat;
      w.energy[i] = mat === M.PLANT ? 60 : 0;
      w.meta[i] = 0;
      if (opts.nutrient !== undefined) w.nutrient[i] = opts.nutrient;
    }
}

export function injectHeat(w, cx, cy, r, amount) {
  const r2 = r * r;
  for (let y = Math.max(0, cy - r | 0); y <= Math.min(w.H - 1, cy + r | 0); y++)
    for (let x = Math.max(0, cx - r | 0); x <= Math.min(w.W - 1, cx + r | 0); x++) {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const i = y * w.W + x;
      w.temp[i] = Math.max(-0.5, Math.min(1.6, w.temp[i] + amount * (1 - d2 / r2)));
    }
}

export function spawnGrazer(w, x, y, energy = 70) {
  const a = w.agents;
  for (let i = 0; i < a.cap; i++) {
    if (a.alive[i]) continue;
    a.alive[i] = 1;
    a.x[i] = x; a.y[i] = y;
    a.vx[i] = 0; a.vy[i] = 0;
    a.energy[i] = energy; a.gut[i] = 0;
    a.heading[i] = rnd(w) * Math.PI * 2;
    return i;
  }
  return -1;
}

export function agentCount(w) {
  let n = 0;
  for (let i = 0; i < w.agents.cap; i++) n += w.agents.alive[i];
  return n;
}

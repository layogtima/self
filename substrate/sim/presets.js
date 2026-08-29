// JAR · scenario presets — seeded, one click each. Every preset is a pure
// function of (seed, config) so a preset+seed pair IS the save format.

import { M } from './config.js';
import { createWorld, paint, spawnGrazer, ambientAt } from './world.js';
import { rnd } from './prng.js';

function surfaceY(w, x) {
  // rolling soil surface; same formula everywhere so presets can find it
  return Math.round(w.H * 0.62
    + w.H * 0.030 * Math.sin(x * 0.020 + 1.7)
    + w.H * 0.015 * Math.sin(x * 0.053 + 4.1));
}

function terrain(w, opts = {}) {
  const { W, H, material, nutrient } = w;
  const floorY = H - 5, wallW = 3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (y >= floorY || x < wallW || x >= W - wallW) { material[i] = M.ROCK; continue; }
    const s = surfaceY(w, x);
    if (y >= s) {
      material[i] = M.SOIL;
      nutrient[i] = 1.8 + rnd(w) * 1.6;
    }
  }
  // a couple of buried boulders
  paint(w, W * 0.22, H * 0.80, 7, M.ROCK);
  paint(w, W * 0.74, H * 0.86, 9, M.ROCK);
  // sand drift on the right slope
  for (let x = Math.round(W * 0.70); x < Math.round(W * 0.86); x++) {
    const s = surfaceY(w, x);
    for (let y = s; y < s + 4; y++) material[y * W + x] = M.SAND;
  }
  // pond: carve a basin mid-jar and fill to a level
  if (!opts.noPond) {
    const cx = W * 0.42, halfW = W * (opts.pondSize || 0.13);
    for (let x = Math.round(cx - halfW); x <= Math.round(cx + halfW); x++) {
      const depth = Math.round(10 * Math.cos(((x - cx) / halfW) * Math.PI / 2) ** 0.8) + 2;
      const s = surfaceY(w, x);
      for (let y = s - 2; y < s + depth; y++) {
        const i = y * W + x;
        material[i] = y < s - 2 + 3 ? M.AIR : M.WATER;
        if (material[i] === M.WATER) nutrient[i] = 0;
      }
      for (let y = s + depth; y < s + depth + 2; y++) material[y * W + x] = M.SOIL; // basin liner stays soil
    }
  }
}

function sprinkleSeeds(w, count) {
  for (let k = 0; k < count; k++) {
    const x = Math.round(w.W * (0.08 + rnd(w) * 0.84));
    const y = surfaceY(w, x) - 2 - Math.round(rnd(w) * 20);
    if (w.material[y * w.W + x] === M.AIR) { w.material[y * w.W + x] = M.SEED; }
  }
}

function buryMycelium(w, spots) {
  for (let k = 0; k < spots; k++) {
    const x = Math.round(w.W * (0.15 + rnd(w) * 0.7));
    const y = surfaceY(w, x) + 3 + Math.round(rnd(w) * 6);
    for (let o = 0; o < 5; o++) {
      const i = (y + (o % 2)) * w.W + x + (o - 2);
      if (w.material[i] === M.SOIL) { w.material[i] = M.MYC; w.meta[i] = 128; } // soil-born
    }
  }
}

function plantPatches(w, count) {
  // pre-grown stalks: the standing crop that carries grazers through the
  // early transient while the seed bank establishes
  for (let k = 0; k < count; k++) {
    const x = Math.round(w.W * (0.10 + rnd(w) * 0.8));
    const s = surfaceY(w, x);
    if (w.material[s * w.W + x] !== M.SOIL) continue;
    const h = 3 + Math.round(rnd(w) * 3);
    for (let o = 1; o <= h; o++) {
      const i = (s - o) * w.W + x;
      if (w.material[i] !== M.AIR) break;
      w.material[i] = M.PLANT; w.energy[i] = 90; w.meta[i] = Math.round(rnd(w) * 40);
    }
  }
}

function releaseGrazers(w, count) {
  for (let k = 0; k < count; k++) {
    const x = w.W * (0.15 + rnd(w) * 0.7);
    spawnGrazer(w, x, surfaceY(w, x | 0) - 4, 90);
  }
}

function settleTemps(w) {
  for (let i = 0; i < w.N; i++) w.temp[i] = ambientAt(w, (i / w.W) | 0);
}

export const PRESETS = {
  genesis: {
    label: 'Genesis', blurb: 'soil bed, pond, seeds, mycelium, 6 grazers — the reference jar',
    make(seed, cfg) {
      const w = createWorld(seed, cfg);
      terrain(w); plantPatches(w, 10); sprinkleSeeds(w, 20); buryMycelium(w, 3); releaseGrazers(w, 5);
      return w;
    },
  },
  drought: {
    label: 'Drought', blurb: 'heat lamp on, a puddle where the pond was',
    make(seed, cfg) {
      const w = createWorld(seed, { ...cfg, AMBIENT: 0.62, LAPSE: 0.10 });
      terrain(w, { pondSize: 0.05 }); plantPatches(w, 10); sprinkleSeeds(w, 20); buryMycelium(w, 3); releaseGrazers(w, 5);
      settleTemps(w);
      return w;
    },
  },
  coldsnap: {
    label: 'Cold Snap', blurb: 'ambient plunge — watch the pond seize and life stall',
    make(seed, cfg) {
      const w = createWorld(seed, { ...cfg, AMBIENT: 0.04, LAPSE: 0.10 });
      terrain(w); plantPatches(w, 10); sprinkleSeeds(w, 20); buryMycelium(w, 3); releaseGrazers(w, 5);
      settleTemps(w);
      return w;
    },
  },
  flood: {
    label: 'Flood', blurb: 'the jar half-fills; life moves to the shorelines',
    make(seed, cfg) {
      const w = createWorld(seed, cfg);
      terrain(w); plantPatches(w, 10); sprinkleSeeds(w, 20); buryMycelium(w, 3); releaseGrazers(w, 5);
      for (let y = Math.round(w.H * 0.50); y < Math.round(w.H * 0.62); y++)
        for (let x = 3; x < w.W - 3; x++) {
          const i = y * w.W + x;
          if (w.material[i] === M.AIR) w.material[i] = M.WATER;
        }
      return w;
    },
  },
  overgrowth: {
    label: 'Sealed Overgrowth', blurb: 'no grazers: what does unchecked growth do to the loop?',
    make(seed, cfg) {
      const w = createWorld(seed, cfg);
      terrain(w); plantPatches(w, 16); sprinkleSeeds(w, 26); buryMycelium(w, 4);
      return w;
    },
  },
  sterile: {
    label: 'Sterile', blurb: 'no mycelium — why the loop dies without decomposers',
    make(seed, cfg) {
      const w = createWorld(seed, cfg);
      terrain(w); plantPatches(w, 10); sprinkleSeeds(w, 20); releaseGrazers(w, 5);
      return w;
    },
  },
};

#!/usr/bin/env node
// JAR · headless bench + regression + longevity runner. Node only, no DOM.
//
//   node bench.js                        3000-tick perf run, Genesis, seed 1
//   node bench.js --seed 7 --ticks 9000
//   node bench.js --preset drought
//   node bench.js --longevity            200k ticks + ecosystem PASS/FAIL
//   node bench.js --grid 384x576         desktop-stretch grid
//
// The printed hashWorld is the regression contract: any refactor that changes
// it for a fixed seed+preset+ticks is a physics change and must be intentional.

import { PRESETS } from './sim/presets.js';
import { tick } from './sim/tick.js';
import { hashWorld } from './sim/world.js';
import { snapshot } from './sim/stats.js';

const args = process.argv.slice(2);
const get = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const has = name => args.includes('--' + name);

const presetName = get('preset', 'genesis');
const seed = parseInt(get('seed', '1'), 10);
const longevity = has('longevity');
const ticks = longevity ? parseInt(get('ticks', '200000'), 10) : parseInt(get('ticks', '3000'), 10);
const grid = get('grid', null);

const cfg = {};
if (grid) { const [gw, gh] = grid.split('x').map(Number); cfg.GRID_W = gw; cfg.GRID_H = gh; }

const preset = PRESETS[presetName];
if (!preset) { console.error('unknown preset:', presetName, '— have:', Object.keys(PRESETS).join(', ')); process.exit(2); }

const world = preset.make(seed, cfg);
const start = snapshot(world);
console.log(`JAR bench · preset=${presetName} seed=${seed} grid=${world.W}x${world.H} (${world.N} cells) ticks=${ticks}`);
console.log(`  start: plants=${start.counts[10]} seeds=${start.counts[9]} myc=${start.counts[12]} grazers=${start.grazers}` +
  ` waterMass=${start.waterMass} organicMass=${start.organicMass.toFixed(1)}`);

const PASSES = ['heat', 'state', 'matter', 'life', 'creatures', 'total'];
const samples = Object.fromEntries(PASSES.map(p => [p, new Float32Array(Math.min(ticks, 50000))]));
const sampleEvery = Math.max(1, Math.floor(ticks / 50000));
let sampleN = 0;

const t0 = Date.now();
for (let t = 0; t < ticks; t++) {
  const tm = tick(world);
  if (t % sampleEvery === 0 && sampleN < 50000) {
    for (const p of PASSES) samples[p][sampleN] = tm[p];
    sampleN++;
  }
  if (longevity && (t + 1) % 10000 === 0) {
    const s = snapshot(world);
    console.log(`  tick ${String(t + 1).padStart(6)} · plants=${String(s.counts[10]).padStart(4)}` +
      ` seeds=${String(s.counts[9]).padStart(3)} dead=${String(s.counts[11]).padStart(4)}` +
      ` myc=${String(s.counts[12]).padStart(4)} grazers=${String(s.grazers).padStart(2)}` +
      ` nutrient=${s.nutrient.toFixed(0).padStart(5)} waterMass=${s.waterMass}` +
      ` organic=${s.organicMass.toFixed(1)} meanT=${s.meanTemp.toFixed(3)}`);
  }
}
const wallMs = Date.now() - t0;

function pct(arr, n, q) {
  const a = Array.from(arr.slice(0, n)).sort((x, y) => x - y);
  return a[Math.min(n - 1, Math.floor(q * n))];
}
console.log(`\n  per-pass ms (p50 / p95 / max over ${sampleN} sampled ticks):`);
for (const p of PASSES) {
  console.log(`    ${p.padEnd(9)} ${pct(samples[p], sampleN, 0.5).toFixed(3)} / ` +
    `${pct(samples[p], sampleN, 0.95).toFixed(3)} / ${pct(samples[p], sampleN, 1).toFixed(3)}`);
}
console.log(`  wall: ${(wallMs / 1000).toFixed(1)}s · ${(ticks / (wallMs / 1000)).toFixed(0)} ticks/s`);

const end = snapshot(world);
const waterDrift = end.waterMass - start.waterMass;
const organicDrift = end.organicMass - start.organicMass;
console.log(`\n  end: plants=${end.counts[10]} seeds=${end.counts[9]} dead=${end.counts[11]}` +
  ` myc=${end.counts[12]} fruit=${end.counts[13]} grazers=${end.grazers} nutrient=${end.nutrient.toFixed(1)}`);
console.log(`  waterMass ${start.waterMass} → ${end.waterMass} (drift ${waterDrift})`);
console.log(`  organicMass ${start.organicMass.toFixed(1)} → ${end.organicMass.toFixed(1)} (drift ${organicDrift.toFixed(2)})`);
console.log(`  hashWorld: ${hashWorld(world)}`);

if (longevity) {
  const eps = Math.max(4, start.organicMass * 0.02);
  const checks = [
    ['grazers alive', end.grazers > 0],
    ['plants alive', end.counts[10] > 0],
    ['mycelium alive', end.counts[12] > 0],
    ['water conserved', waterDrift === 0],
    [`organic within ±${eps.toFixed(1)}`, Math.abs(organicDrift) <= eps],
  ];
  let pass = true;
  console.log('\n  longevity checks:');
  for (const [name, ok] of checks) { console.log(`    ${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) pass = false; }
  console.log(pass ? '\n  THE JAR DID NOT NEED YOU. PASS.' : '\n  the jar died. FAIL — export the config, that collapse is data.');
  process.exit(pass ? 0 : 1);
}

// JAR · pass 6 — bookkeeping. Ecosystem health is a graph, not a vibe.
// Every 30 ticks: population counts, mass per material, mean temp, nutrient
// total → ring buffer → sparklines in the shell, CSV/JSON export, and the
// conservation ledger the longevity test asserts against.
//
// Conserved quantities:
//   WATER mass = water + ice + steam cells. Must never drift. Ever.
//   ORGANIC mass = seed+plant+dead+myc(fungal)+fruit+smoke cells + nutrient
//     total + agent mass-equivalent (energy·e2m + gut). Photosynthesis adds
//     energy, never mass; drift beyond rounding is a bug.

import { M, MAT_COUNT } from './config.js';

export const SERIES_CAP = 1024;
const CHANNELS = [
  'tick', 'plant', 'seed', 'dead', 'myc', 'fruit', 'water', 'ice', 'steam',
  'grazers', 'nutrient', 'meanTemp', 'waterMass', 'organicMass',
];

export function snapshot(w) {
  const { N, material, temp, nutrient, meta, cfg } = w;
  const counts = new Uint32Array(MAT_COUNT);
  let nutrientTotal = 0, tempSum = 0, mycFungal = 0;
  for (let i = 0; i < N; i++) {
    counts[material[i]]++;
    nutrient[i] > 0 && (nutrientTotal += nutrient[i]);
    tempSum += temp[i];
    if (material[i] === M.MYC && !(meta[i] & 128)) mycFungal++; // fungal-born carries organic mass; soil-born reverts to soil
  }
  const a = w.agents;
  let grazers = 0, agentMass = 0;
  const e2m = 0.5 / cfg.GRAZER_EAT_GAIN;
  for (let g = 0; g < a.cap; g++) {
    if (!a.alive[g]) continue;
    grazers++;
    agentMass += a.energy[g] * e2m + a.gut[g];
  }
  const waterMass = counts[M.WATER] + counts[M.ICE] + counts[M.STEAM];
  const organicMass = counts[M.SEED] + counts[M.PLANT] + counts[M.DEAD] + mycFungal +
    counts[M.FRUIT] + counts[M.SMOKE] + counts[M.FIRE] + nutrientTotal + agentMass;
  return {
    tick: w.tick, counts, grazers,
    nutrient: nutrientTotal, meanTemp: tempSum / N,
    waterMass, organicMass, mycFungal, mycAll: counts[M.MYC],
  };
}

export function recordStats(w) {
  if (!w.series) {
    w.series = { len: 0, idx: 0, data: {} };
    for (const c of CHANNELS) w.series.data[c] = new Float32Array(SERIES_CAP);
  }
  const s = snapshot(w), d = w.series.data, k = w.series.idx;
  d.tick[k] = s.tick;
  d.plant[k] = s.counts[M.PLANT]; d.seed[k] = s.counts[M.SEED];
  d.dead[k] = s.counts[M.DEAD]; d.myc[k] = s.mycAll; d.fruit[k] = s.counts[M.FRUIT];
  d.water[k] = s.counts[M.WATER]; d.ice[k] = s.counts[M.ICE]; d.steam[k] = s.counts[M.STEAM];
  d.grazers[k] = s.grazers; d.nutrient[k] = s.nutrient; d.meanTemp[k] = s.meanTemp;
  d.waterMass[k] = s.waterMass; d.organicMass[k] = s.organicMass;
  w.series.idx = (k + 1) % SERIES_CAP;
  if (w.series.len < SERIES_CAP) w.series.len++;
  w.lastSnapshot = s;
}

// ring buffer → chronological array of one channel
export function seriesOf(w, channel) {
  if (!w.series) return [];
  const { len, idx, data } = w.series, out = new Array(len), arr = data[channel];
  for (let k = 0; k < len; k++) out[k] = arr[(idx - len + k + SERIES_CAP) % SERIES_CAP];
  return out;
}

export function toCSV(w) {
  if (!w.series) return '';
  const cols = CHANNELS.map(c => seriesOf(w, c));
  const lines = [CHANNELS.join(',')];
  for (let r = 0; r < cols[0].length; r++)
    lines.push(cols.map(c => +c[r].toFixed(3)).join(','));
  return lines.join('\n');
}

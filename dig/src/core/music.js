// Generative ambient music — minimal AF, atmospheric, zero assets.
// Two detuned triangle drones through a slow-breathing lowpass, a feedback-delay
// shimmer, and sparse pentatonic plucks every few seconds. Depth-aware: the
// deeper you dig, the lower the root, the darker the filter, the rarer the notes.

import { getAudioContext, getMusicBus } from './audio.js';

const PENTA = [0, 3, 5, 7, 10];      // minor pentatonic offsets (semitones)

let started = false;
let nodes = null;
let depth = 0;
let pluckTimer = 2.5;

function semitone(root, n) { return root * Math.pow(2, n / 12); }

export function startMusic() {
  const AC = getAudioContext();
  const bus = getMusicBus();
  if (!AC || !bus || started) return;
  started = true;

  // drone: two detuned triangles → lowpass → gain
  const droneGain = AC.createGain();
  droneGain.gain.value = 0;
  droneGain.gain.setTargetAtTime(0.05, AC.currentTime, 4);   // slow fade-in

  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  lp.Q.value = 0.6;

  const o1 = AC.createOscillator(); o1.type = 'triangle'; o1.frequency.value = 110;
  const o2 = AC.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 110; o2.detune.value = 6;
  // quiet detuned saw layer — orchestral string body under the triangles
  const o3 = AC.createOscillator(); o3.type = 'sawtooth'; o3.frequency.value = 110; o3.detune.value = -4;
  const sawG = AC.createGain(); sawG.gain.value = 0.22;
  o3.connect(sawG).connect(lp);
  o1.connect(lp); o2.connect(lp);
  lp.connect(droneGain).connect(bus);

  // filter breathing LFO
  const lfo = AC.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.05;
  const lfoAmt = AC.createGain(); lfoAmt.gain.value = 140;
  lfo.connect(lfoAmt).connect(lp.frequency);

  // shimmer: pluck send → feedback delay → bus
  const delay = AC.createDelay(2);
  delay.delayTime.value = 0.48;
  const fb = AC.createGain(); fb.gain.value = 0.42;
  const wet = AC.createGain(); wet.gain.value = 0.5;
  delay.connect(fb).connect(delay);
  delay.connect(wet).connect(bus);

  o1.start(); o2.start(); o3.start(); lfo.start();
  nodes = { droneGain, lp, o1, o2, o3, delay, wet };
}

/** call each frame from any scene; drives plucks + depth response */
export function updateMusic(dt) {
  const AC = getAudioContext();
  if (!AC || !nodes) return;

  // depth response (smoothed by setTargetAtTime)
  const d01 = Math.min(1, Math.max(0, depth / 300));
  const root = 110 * Math.pow(2, -d01 * 0.7);          // drops ~a fifth by the basement
  nodes.o1.frequency.setTargetAtTime(root, AC.currentTime, 2);
  nodes.o2.frequency.setTargetAtTime(root * 1.5, AC.currentTime, 2);   // drone fifth
  nodes.o3.frequency.setTargetAtTime(root, AC.currentTime, 2);
  nodes.lp.frequency.setTargetAtTime(750 - d01 * 520, AC.currentTime, 2);

  // sparse plucks — rarer as you descend
  pluckTimer -= dt;
  if (pluckTimer <= 0) {
    pluckTimer = 3 + Math.random() * (5 + d01 * 6);
    pluck(AC, root * 4, d01);
  }
}

export function setMusicDepth(d) { depth = d; }

function pluck(AC, base, d01) {
  // soft distant horn: detuned saws, lowpassed, slow attack — Isla Nublar at dusk
  const n = PENTA[(Math.random() * PENTA.length) | 0] + (Math.random() < 0.3 ? 12 : 0);
  const f = semitone(base, n);
  const t0 = AC.currentTime;
  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 800 - d01 * 350;
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.035 * (1 - d01 * 0.3), t0 + 0.28);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
  lp.connect(g);
  g.connect(getMusicBus());
  g.connect(nodes.delay);
  for (const det of [-4, 5]) {
    const o = AC.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.detune.value = det;
    o.connect(lp);
    o.start(t0); o.stop(t0 + 2.3);
  }
}

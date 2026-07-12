// audio.js — all sound is synthesised (zero assets).
//
// Each firefly species is a voice in a chord. When a species SYNCS, its pad
// swells in; three synced species = a full major triad (A / C# / E) blooming
// out of a low, uneasy drone. A one-shot shimmer marks the moment of sync.
import { SPECIES } from './util.js';

const ROOT = 220; // A3
const semi = (n) => ROOT * Math.pow(2, n / 12);

export function makeAudio() {
  let ctx = null;
  let master, wet, drone;
  const pads = {};       // species -> { gain, level }
  let started = false;

  function start() {
    if (started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    started = true;

    master = ctx.createGain();
    master.gain.value = 0.4;                 // soft overall
    // gentle high-cut so nothing is ever harsh
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass'; soften.frequency.value = 2600; soften.Q.value = 0.3;
    master.connect(soften); soften.connect(ctx.destination);

    // simple feedback delay for a cavernous space
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.34;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    wet = ctx.createGain(); wet.gain.value = 0.22;
    delay.connect(fb); fb.connect(delay);
    delay.connect(wet); wet.connect(master);
    // shared "send" node other voices route reverb into
    wet._in = delay;

    buildDrone();
    for (const k in SPECIES) buildPad(k);
  }

  // ---- low uneasy drone bed ----
  function buildDrone() {
    const g = ctx.createGain(); g.gain.value = 0.0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
    g.connect(lp); lp.connect(master);

    const a = ctx.createOscillator(); a.type = 'sine'; a.frequency.value = 55;      // A1
    const b = ctx.createOscillator(); b.type = 'sine'; b.frequency.value = 55 * 1.005; // faint detune
    const c = ctx.createOscillator(); c.type = 'sine'; c.frequency.value = 82.4;     // hollow fifth
    a.connect(g); b.connect(g); c.connect(g);

    // slow tremolo makes it breathe
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.015;
    lfo.connect(lfoG); lfoG.connect(g.gain);

    [a, b, c, lfo].forEach((o) => o.start());
    g.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 6); // whisper-quiet bed
    drone = g;
  }

  // ---- one sustaining pad per species ----
  function buildPad(species) {
    const sp = SPECIES[species];
    const g = ctx.createGain(); g.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    g.connect(lp); lp.connect(master); g.connect(wet._in);

    // soft sine pad, note + gentle octave -> warm, never harsh
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = semi(sp.note);
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = semi(sp.note + 12);
    const o2g = ctx.createGain(); o2g.gain.value = 0.35;
    o1.connect(g); o2.connect(o2g); o2g.connect(g);
    o1.start(); o2.start();

    pads[species] = { gain: g, target: 0 };
  }

  // called each frame with the sync blend (0..1) per species
  function setSync(species, blend) {
    if (!started || !pads[species]) return;
    pads[species].target = blend * 0.06;   // subtle
    const g = pads[species].gain.gain;
    g.setTargetAtTime(pads[species].target, ctx.currentTime, 0.6); // slow swell
  }

  // one-shot shimmer when a species first syncs (soft bell)
  function ping(species) {
    if (!started) return;
    const sp = SPECIES[species];
    const now = ctx.currentTime;
    for (const mult of [1, 2]) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = semi(sp.note) * mult * 2;
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(g); g.connect(master); g.connect(wet._in);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.06 / mult, now + 0.04); // soft attack
      g.gain.exponentialRampToValueAtTime(0.0006, now + 2.2);  // long gentle tail
      o.start(now); o.stop(now + 2.3);
    }
  }

  // a triumphant flourish (level solved / exit)
  function chord() {
    if (!started) return;
    const now = ctx.currentTime;
    [0, 4, 7, 12, 16].forEach((n, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.value = semi(n);
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(g); g.connect(master); g.connect(wet._in);
      const t0 = now + i * 0.08;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.12, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0006, t0 + 2.4);
      o.start(t0); o.stop(t0 + 2.5);
    });
  }

  // soft confirmation blip when a firefly deposits into a socket
  function tick(species) {
    if (!started) return;
    const sp = SPECIES[species];
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.value = semi(sp.note + 12);
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(master);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.09, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0006, now + 0.35);
    o.start(now); o.stop(now + 0.4);
  }

  return { start, setSync, ping, chord, tick, isOn: () => started };
}

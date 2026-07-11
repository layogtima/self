// Tiny WebAudio SFX - synthesized, no asset files. Two buses: sfx + music
// (music engine lives in core/music.js and plugs into getMusicBus()).

let AC = null;
let sfxBus = null;
let musicBus = null;
let sfxVolume = 0.8;
let musicVolume = 0.5;
let noiseBuf = null;

export function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return AC; }
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  AC = new Ctx();
  sfxBus = AC.createGain();
  sfxBus.gain.value = sfxVolume;
  sfxBus.connect(AC.destination);
  musicBus = AC.createGain();
  musicBus.gain.value = musicVolume;
  musicBus.connect(AC.destination);
  return AC;
}

export function getAudioContext() { return AC; }
export function getMusicBus() { return musicBus; }

export function setVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, v));
  if (sfxBus) sfxBus.gain.value = sfxVolume;
}
export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v));
  if (musicBus) musicBus.gain.value = musicVolume;
}

function noise() {
  if (!noiseBuf) {
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.1, AC.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function thud(vol, cutoff, dur) {
  if (!AC) return;
  const src = AC.createBufferSource();
  src.buffer = noise();
  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = cutoff;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
  src.connect(lp).connect(g).connect(sfxBus);
  src.start(); src.stop(AC.currentTime + dur);
}

function tone(f0, f1, dur, type, vol, delay = 0) {
  if (!AC) return;
  const t0 = AC.currentTime + delay;
  const o = AC.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(sfxBus);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

// -- brass: detuned saws through a lowpass, slow attack. The JP feeling. -----
function brass(freq, dur, vol, delay = 0, attack = 0.09) {
  if (!AC) return;
  const t0 = AC.currentTime + delay;
  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1150; lp.Q.value = 0.5;
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.setValueAtTime(vol, t0 + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  lp.connect(g).connect(sfxBus);
  for (const det of [-5, 4]) {
    const o = AC.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.detune.value = det;
    o.connect(lp);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
}

// timpani-ish boom under the fanfares
function boom(vol, delay = 0) {
  if (!AC) return;
  const t0 = AC.currentTime + delay;
  const o = AC.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(72, t0);
  o.frequency.exponentialRampToValueAtTime(38, t0 + 0.5);
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
  o.connect(g).connect(sfxBus);
  o.start(t0); o.stop(t0 + 0.75);
}

/** distant dino rumble - filtered growl sweep, deeper than the drone */
export function rumble() {
  if (!AC) return;
  const t0 = AC.currentTime;
  const src = AC.createBufferSource();
  src.buffer = noise();
  src.loop = true;
  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(120, t0);
  lp.frequency.linearRampToValueAtTime(60, t0 + 1.8);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.16, t0 + 0.5);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 2.2);
  src.connect(lp).connect(g).connect(sfxBus);
  src.start(t0); src.stop(t0 + 2.3);
  const o = AC.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(42, t0);
  o.frequency.linearRampToValueAtTime(30, t0 + 2);
  const og = AC.createGain();
  og.gain.setValueAtTime(0.0001, t0);
  og.gain.linearRampToValueAtTime(0.08, t0 + 0.5);
  og.gain.exponentialRampToValueAtTime(0.001, t0 + 2.2);
  o.connect(og).connect(sfxBus);
  o.start(t0); o.stop(t0 + 2.3);
}

// laser: a short filtered-saw zap + a sizzle of noise
function laserZap(f0, f1, dur, vol) {
  if (!AC) return;
  const t0 = AC.currentTime;
  const o = AC.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 2200;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(lp).connect(g).connect(sfxBus);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

// -- real sound samples (Freesound, CC0/CC-BY - see CREDITS.md) ---------------
// Ambient loops prefer a decoded sample; a synthesized fallback covers the gap
// before a sample loads (or if a file is missing). One-shots (thunder/drip) use
// samples when available.
// Decoded PCM is huge (a 50s stereo loop ≈ 20 MB). v5.3: decode LAZILY - only
// when a loop actually becomes audible - and keep at most MAX_DECODED resident,
// evicting the least-recently-heard SILENT loop. A session that never nears lava
// or a cave never pays for those beds; the surface set stays bounded.
const samples = {};        // name -> AudioBuffer (currently decoded + resident)
const sampleUsed = {};     // name -> monotonic tick of last time its loop was audible
const sampleLoading = {};  // name -> true while a fetch/decode is in flight
let useTick = 0;
const MAX_DECODED = 4;
const loopSample = {       // loop id -> sample name
  rain: 'rain-loop', wind: 'wind-loop', crickets: 'crickets-night',
  surfpad: 'forest-day', cave: 'cave-ambience', water: 'water-stream', lava: 'lava-bubbling',
};
const idForSample = name => Object.keys(loopSample).find(id => loopSample[id] === name);

/** decode one loop's sample on demand, upgrade its running loop, then trim resident PCM */
async function ensureSample(name) {
  if (!AC || samples[name] || sampleLoading[name]) return;
  sampleLoading[name] = true;
  try {
    const res = await fetch(`assets/sounds/${name}.mp3`);
    if (res.ok) {
      samples[name] = await AC.decodeAudioData(await res.arrayBuffer());
      const id = idForSample(name);
      if (id && loops[id] && !loops[id].usingSample) upgradeLoop(id);   // swap synth → sample seamlessly
      evictExcessSamples();
    }
  } catch { /* keep the synth fallback */ }
  finally { delete sampleLoading[name]; }
}

/** keep resident decoded buffers bounded: drop the oldest SILENT loops' PCM */
function evictExcessSamples() {
  const decoded = Object.keys(samples);
  if (decoded.length <= MAX_DECODED) return;
  const silent = decoded
    .filter(n => { const id = idForSample(n); return !id || (loops[id]?.level ?? 0) < 0.02; })
    .sort((a, b) => (sampleUsed[a] || 0) - (sampleUsed[b] || 0));
  while (Object.keys(samples).length > MAX_DECODED && silent.length) {
    const n = silent.shift();
    const id = idForSample(n);
    if (id && loops[id]?.usingSample) { loops[id].stopSource?.(); loops[id].usingSample = false; }   // silent, so no gap
    delete samples[n];   // re-decoded on demand if we come back
  }
}

/** manual prefetch (unused at boot now - loops decode lazily on first audible use) */
export async function loadSamples(names) { for (const n of names) ensureSample(n); }

const LOWPASS = { cave: 900, water: 1100 };   // damp the harsher beds
function upgradeLoop(id) {
  const l = loops[id];
  if (!l || !samples[loopSample[id]]) return;
  l.stopSource?.();
  const src = AC.createBufferSource();
  src.buffer = samples[loopSample[id]];
  src.loop = true;
  if (LOWPASS[id]) {
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = LOWPASS[id];
    src.connect(lp).connect(l.gain);
  } else {
    src.connect(l.gain);
  }
  src.start();
  l.stopSource = () => { try { src.stop(); } catch { /* already stopped */ } };
  l.usingSample = true;
}

// -- persistent ambient loops with smooth gain automation ---------------------
const loops = {};   // name -> {gain, set(v), usingSample, stopSource}
function ensureLoop(name, build) {
  if (!AC) return null;
  if (loops[name]) return loops[name];
  const g = AC.createGain();
  g.gain.value = 0;
  g.connect(sfxBus);
  const loop = {
    gain: g, usingSample: false, level: 0,
    set(v) {
      loop.level = v;
      // audible for the first time → decode its sample lazily (and mark it heard for LRU)
      const sn = loopSample[name];
      if (sn && v > 0.005) { sampleUsed[sn] = ++useTick; ensureSample(sn); }
      g.gain.setTargetAtTime(Math.max(0, v), AC.currentTime, 0.5);
    },
  };
  loops[name] = loop;
  // prefer the real sample if it's already decoded; else build the synth fallback
  if (loopSample[name] && samples[loopSample[name]]) { loop.usingSample = true; upgradeLoop(name); }
  else if (build) { const nodes = []; build(g, nodes); loop.stopSource = () => nodes.forEach(n => { try { n.stop(); } catch { /* ok */ } }); }
  return loop;
}

/** rain wash (sample: rain-loop) - synth fallback: soft lowpassed noise */
export function setRainLevel(v) {
  const l = ensureLoop('rain', (g, nodes) => {
    const src = AC.createBufferSource();
    src.buffer = noise(); src.loop = true; src.playbackRate.value = 0.5;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.3;
    src.connect(lp).connect(g); src.start(); nodes.push(src);
  });
  l?.set(v * (l.usingSample ? 0.3 : 0.06));
}

/** surface ambience (sample: forest-day birdsong) - synth fallback: warm pad */
export function setSurfacePad(v) {
  const l = ensureLoop('surfpad', (g, nodes) => {
    const o1 = AC.createOscillator(); o1.type = 'sine'; o1.frequency.value = 220;
    const o2 = AC.createOscillator(); o2.type = 'sine'; o2.frequency.value = 277; o2.detune.value = 4;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
    o1.connect(lp); o2.connect(lp); lp.connect(g); o1.start(); o2.start(); nodes.push(o1, o2);
  });
  l?.set(v * (l.usingSample ? 0.26 : 0.012));
}

/** night crickets (sample: crickets-night) - synth fallback: pulsing sines */
export function setCricketLevel(v) {
  const l = ensureLoop('crickets', (g, nodes) => {
    for (const [f, rate] of [[4200, 11], [3700, 9]]) {
      const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const am = AC.createGain(); am.gain.value = 0;
      const lfo = AC.createOscillator(); lfo.type = 'square'; lfo.frequency.value = rate;
      const lfoG = AC.createGain(); lfoG.gain.value = 0.5;
      lfo.connect(lfoG).connect(am.gain);
      o.connect(am).connect(g); o.start(); lfo.start(); nodes.push(o, lfo);
    }
  });
  l?.set(v * (l.usingSample ? 0.32 : 0.012));
}

/** wind (sample: wind-loop) - synth fallback: low noise */
export function setWindLevel(v) {
  const l = ensureLoop('wind', (g, nodes) => {
    const src = AC.createBufferSource();
    src.buffer = noise(); src.loop = true; src.playbackRate.value = 0.35;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480;
    src.connect(lp).connect(g); src.start(); nodes.push(src);
  });
  l?.set(v * (l.usingSample ? 0.24 : 0.06));
}

/** underground cave ambience (sample: cave-ambience) - no synth fallback */
export function setCaveLevel(v) { ensureLoop('cave', null)?.set(v * 0.3); }
/** near flowing water (sample: water-stream) */
export function setWaterLevel(v) { ensureLoop('water', null)?.set(v * 0.3); }
/** near lava (sample: lava-bubbling) */
export function setLavaLevel(v) { ensureLoop('lava', null)?.set(v * 0.32); }

/** brushing swish for the prep minigame - synth (no sample) */
export function setBrushLevel(v) {
  const l = ensureLoop('brush', (g, nodes) => {
    const src = AC.createBufferSource();
    src.buffer = noise(); src.loop = true; src.playbackRate.value = 1.6;
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.7;
    src.connect(bp).connect(g); src.start(); nodes.push(src);
  });
  l?.set(v * 0.09);
}

export function thunder() {
  if (!AC) return;
  const t0 = AC.currentTime;
  const src = AC.createBufferSource();
  src.buffer = noise(); src.loop = true;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.setValueAtTime(220, t0);
  lp.frequency.exponentialRampToValueAtTime(50, t0 + 2.4);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.3, t0 + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 2.6);
  src.connect(lp).connect(g).connect(sfxBus);
  src.start(t0); src.stop(t0 + 2.7);
}

export const sfx = {
  laser: () => { laserZap(1400, 700, 0.06, 0.03); thud(0.05, 1600, 0.05); },
  laserBreak: () => { laserZap(1700, 400, 0.11, 0.045); thud(0.12, 900, 0.1); },
  crumble: () => { thud(0.2, 300, 0.25); tone(300, 90, 0.4, 'sawtooth', 0.04); },  // a fragment lost
  glue: () => tone(180, 240, 0.12, 'sine', 0.03),
  plink: () => tone(1900 + Math.random() * 700, 900, 0.09, 'sine', 0.02),
  flutter: () => { thud(0.05, 2400, 0.12); thud(0.04, 2000, 0.1); },
  chirp: () => { tone(2400, 3100, 0.06, 'sine', 0.015); tone(2800, 2400, 0.05, 'sine', 0.012); },
  birdsong: () => {   // a bright little two-to-three note phrase
    const base = 2200 + Math.random() * 500;
    tone(base, base * 1.2, 0.09, 'sine', 0.02);
    tone(base * 1.4, base * 1.3, 0.08, 'sine', 0.018, 0.12);
    if (Math.random() < 0.5) tone(base * 1.1, base * 1.5, 0.1, 'sine', 0.016, 0.26);
  },
  dig: () => thud(0.18, 650, 0.08),
  digHard: () => { thud(0.13, 900, 0.06); tone(900 + Math.random() * 200, 500, 0.05, 'square', 0.025); },
  break: () => thud(0.24, 420, 0.12),
  jump: () => tone(200, 400, 0.09, 'square', 0.04),
  land: () => thud(0.15, 320, 0.07),

  // fossils - brass, wonder, John-Williams-shaped intervals
  hint: () => tone(1180, 1560, 0.25, 'sine', 0.045),                     // "something here…"
  discover: () => {                                                       // rising fourth swell
    brass(196.0, 0.5, 0.05);            // G3
    brass(261.6, 0.9, 0.055, 0.22);     // C4
    boom(0.12, 0.22);
  },
  reveal: () => {                                                         // I → IV swell, full wonder
    brass(261.6, 0.7, 0.045);           // C4
    brass(329.6, 0.7, 0.045, 0.02);     // E4
    brass(392.0, 0.9, 0.05, 0.25);      // G4
    brass(523.3, 1.3, 0.05, 0.5);       // C5
    boom(0.14, 0.5);
  },
  mission: () => {                                                        // MISSION COMPLETE
    brass(261.6, 0.6, 0.05);
    brass(392.0, 0.6, 0.05, 0.25);
    brass(523.3, 0.7, 0.055, 0.5);
    brass(659.3, 1.6, 0.055, 0.78);
    boom(0.16, 0.78);
    boom(0.12, 1.3);
  },
  // minigames
  scanLock: n => { tone(500 + n * 160, 520 + n * 170, 0.1, 'triangle', 0.05); },
  buff: () => thud(0.1, 1400, 0.05),

  // pulley
  rig: () => { thud(0.2, 500, 0.1); tone(300, 260, 0.12, 'square', 0.03, 0.05); },
  attach: () => tone(240, 300, 0.08, 'square', 0.05),
  creak: () => tone(160 + Math.random() * 60, 130, 0.06, 'sawtooth', 0.02),
  detach: () => { tone(320, 190, 0.14, 'square', 0.04); thud(0.14, 400, 0.08); },

  // lab / ui
  station: () => tone(320, 300, 0.06, 'sine', 0.045),
  complete: () => { tone(660, 990, 0.12, 'triangle', 0.05); tone(990, 1480, 0.18, 'sine', 0.045); },
  ui: () => tone(440, 520, 0.05, 'sine', 0.035),
  uiBack: () => tone(400, 300, 0.06, 'sine', 0.035),
};

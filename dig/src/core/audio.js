// Tiny WebAudio SFX — synthesized, no asset files. Two buses: sfx + music
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

/** distant dino rumble — filtered growl sweep, deeper than the drone */
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

// -- persistent ambient loops with smooth gain automation ---------------------
const loops = {};   // name -> {gain, set(v)}
function ensureLoop(name, build) {
  if (!AC) return null;
  if (loops[name]) return loops[name];
  const g = AC.createGain();
  g.gain.value = 0;
  g.connect(sfxBus);
  build(g);
  loops[name] = { gain: g, set(v) { g.gain.setTargetAtTime(Math.max(0, v), AC.currentTime, 0.4); } };
  return loops[name];
}

/** rain wash: looped noise through a band */
export function setRainLevel(v) {
  const l = ensureLoop('rain', g => {
    const src = AC.createBufferSource();
    src.buffer = noise(); src.loop = true; src.playbackRate.value = 0.7;
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.4;
    src.connect(bp).connect(g);
    src.start();
  });
  l?.set(v * 0.11);
}

/** night crickets: pulsing high sines */
export function setCricketLevel(v) {
  const l = ensureLoop('crickets', g => {
    for (const [f, rate] of [[4200, 11], [3700, 9]]) {
      const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const am = AC.createGain(); am.gain.value = 0;
      const lfo = AC.createOscillator(); lfo.type = 'square'; lfo.frequency.value = rate;
      const lfoG = AC.createGain(); lfoG.gain.value = 0.5;
      lfo.connect(lfoG).connect(am.gain);
      o.connect(am).connect(g);
      o.start(); lfo.start();
    }
  });
  l?.set(v * 0.018);
}

/** wind: low rumbling noise */
export function setWindLevel(v) {
  const l = ensureLoop('wind', g => {
    const src = AC.createBufferSource();
    src.buffer = noise(); src.loop = true; src.playbackRate.value = 0.35;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480;
    src.connect(lp).connect(g);
    src.start();
  });
  l?.set(v * 0.06);
}

/** brushing swish for the prep minigame — gain follows stroke speed */
export function setBrushLevel(v) {
  const l = ensureLoop('brush', g => {
    const src = AC.createBufferSource();
    src.buffer = noise(); src.loop = true; src.playbackRate.value = 1.6;
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.7;
    src.connect(bp).connect(g);
    src.start();
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
  dig: () => thud(0.18, 650, 0.08),
  digHard: () => { thud(0.13, 900, 0.06); tone(900 + Math.random() * 200, 500, 0.05, 'square', 0.025); },
  break: () => thud(0.24, 420, 0.12),
  jump: () => tone(200, 400, 0.09, 'square', 0.04),
  land: () => thud(0.15, 320, 0.07),

  // fossils — brass, wonder, John-Williams-shaped intervals
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

// Audio pipeline. Everything here is SYNTHESIZED — deep-space ambience and
// all SFX are WebAudio oscillators/noise, so the game ships with zero audio
// assets and always has sound. When real files are curated, drop them in
// public/assets/audio/ and use loadAudio()/playBuffer() — same graph, same
// master gain, ambience crossfades out automatically if a music buffer plays.
//
// Browsers require a user gesture before audio: call init() on first
// pointerdown (main.js does). M toggles mute.

let ctx = null;
let master = null;
let ambGroup = null;
let muted = false;
let shimmerTimer = null;

function now() { return ctx.currentTime; }

function env(node, t0, attack, peak, decay, end = 0.0001) {
  node.gain.setValueAtTime(0.0001, t0);
  node.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  node.gain.exponentialRampToValueAtTime(end, t0 + attack + decay);
}

function brownNoiseBuffer(seconds = 4) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buf;
}

// ── ambience: detuned subs + engine hush + sporadic shimmer ────────────────
function startAmbience() {
  ambGroup = ctx.createGain();
  ambGroup.gain.value = 0.32;
  ambGroup.connect(master);

  for (const [freq, type, g, lfoRate] of [
    [55, 'sine', 0.34, 0.05],
    [82.4, 'triangle', 0.14, 0.073],
    [110.1, 'sine', 0.05, 0.031],
  ]) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = g;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = lfoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = g * 0.45;
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(ambGroup);
    osc.start(); lfo.start();
  }

  // engine hush: looped brown noise through a low shelf
  const noise = ctx.createBufferSource();
  noise.buffer = brownNoiseBuffer();
  noise.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 220;
  const ng = ctx.createGain();
  ng.gain.value = 0.16;
  noise.connect(lp).connect(ng).connect(ambGroup);
  noise.start();

  // sporadic shimmer: lonely FM plinks echoing in the void
  const delay = ctx.createDelay(2);
  delay.delayTime.value = 0.42;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  delay.connect(fb).connect(delay);
  const wet = ctx.createGain();
  wet.gain.value = 0.5;
  delay.connect(wet).connect(ambGroup);

  function shimmer() {
    if (!ctx || ctx.state !== 'running') return;
    const t = now();
    const carrier = ctx.createOscillator();
    carrier.frequency.value = 500 + Math.random() * 1100;
    const mod = ctx.createOscillator();
    mod.frequency.value = carrier.frequency.value * (Math.random() < 0.5 ? 1.5 : 2.01);
    const modGain = ctx.createGain();
    modGain.gain.value = 120;
    mod.connect(modGain).connect(carrier.frequency);
    const g = ctx.createGain();
    env(g, t, 0.02, 0.05, 2.5 + Math.random() * 2);
    carrier.connect(g);
    g.connect(ambGroup);
    g.connect(delay);
    carrier.start(t); mod.start(t);
    carrier.stop(t + 5); mod.stop(t + 5);
    shimmerTimer = setTimeout(shimmer, 6000 + Math.random() * 14000);
  }
  shimmerTimer = setTimeout(shimmer, 3000);
}

// ── synthesized SFX ─────────────────────────────────────────────────────────
const SFX = {
  ui() {
    const t = now();
    const o = ctx.createOscillator();
    o.type = 'square'; o.frequency.value = 880;
    const g = ctx.createGain();
    env(g, t, 0.005, 0.06, 0.06);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.12);
  },
  build() {
    const t = now();
    const thunk = ctx.createOscillator();
    thunk.frequency.setValueAtTime(160, t);
    thunk.frequency.exponentialRampToValueAtTime(52, t + 0.14);
    const tg = ctx.createGain();
    env(tg, t, 0.005, 0.5, 0.22);
    thunk.connect(tg).connect(master);
    thunk.start(t); thunk.stop(t + 0.4);
    [660, 880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const g = ctx.createGain();
      env(g, t + 0.1 + i * 0.07, 0.01, 0.12, 0.5);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 1.2);
    });
  },
  blink() {
    const t = now();
    const noise = ctx.createBufferSource();
    noise.buffer = brownNoiseBuffer(1);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(220, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.4);
    const g = ctx.createGain();
    env(g, t, 0.03, 0.4, 0.42);
    noise.connect(bp).connect(g).connect(master);
    noise.start(t); noise.stop(t + 0.7);
  },
  jump() {
    const t = now();
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(48, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.25);
    const g = ctx.createGain();
    env(g, t, 0.01, 0.5, 0.3);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.5);
  },
  land() {
    const t = now();
    const noise = ctx.createBufferSource();
    noise.buffer = brownNoiseBuffer(0.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 140;
    const g = ctx.createGain();
    env(g, t, 0.005, 0.6, 0.18);
    noise.connect(lp).connect(g).connect(master);
    noise.start(t); noise.stop(t + 0.3);
  },
  planetCharge() {
    const t = now();
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(36, t);
    o.frequency.exponentialRampToValueAtTime(72, t + 1.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.65, t + 1.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 1.6);
  },
  planetBoom() {
    const t = now();
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(52, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 1.4);
    const g = ctx.createGain();
    env(g, t, 0.008, 0.9, 1.5);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 1.8);
    const noise = ctx.createBufferSource();
    noise.buffer = brownNoiseBuffer(1);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 400;
    const ng = ctx.createGain();
    env(ng, t, 0.01, 0.4, 0.7);
    noise.connect(lp).connect(ng).connect(master);
    noise.start(t); noise.stop(t + 1);
  },
  warp() {
    const t = now();
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(760, t + 2.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = ctx.createGain();
    env(g, t, 0.3, 0.22, 2.4);
    o.connect(lp).connect(g).connect(master);
    o.start(t); o.stop(t + 3);
  },
};

// ── public API ──────────────────────────────────────────────────────────────
export function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.7;
  master.connect(ctx.destination);
  startAmbience();
}

export function sfx(name) {
  if (!ctx || muted || !SFX[name]) return;
  try { SFX[name](); } catch (_) { /* audio must never crash the game */ }
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.7;
  return muted;
}

export function isReady() { return !!ctx && ctx.state === 'running'; }

// pipeline slot for real files (public/assets/audio/*.ogg|mp3)
const bufferCache = new Map();
export async function loadAudio(url) {
  if (!ctx) return null;
  if (!bufferCache.has(url)) {
    bufferCache.set(url, fetch(url)
      .then((r) => r.arrayBuffer())
      .then((ab) => ctx.decodeAudioData(ab))
      .catch(() => null));
  }
  return bufferCache.get(url);
}

export async function playBuffer(url, { loop = false, gain = 0.6, duckAmbience = false } = {}) {
  const buf = await loadAudio(url);
  if (!buf) return null;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = loop;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(master);
  if (duckAmbience && ambGroup) ambGroup.gain.linearRampToValueAtTime(0.08, now() + 2);
  src.start();
  return src;
}

// The planet engine: one module owning TIME and WEATHER. Everything that makes
// the world feel like a place - sky colours, sun/moon, stars, wind, rain/snow,
// storms with lightning - reads from here. All transitions are smooth ramps.

import { VIEW_W, VIEW_H } from '../config.js';
import { lerp, clamp01 } from '../core/rng.js';

const DAY_LENGTH = 420;            // seconds for a full cycle (~7 min)
const TRANSITION = 15;             // weather crossfade seconds

// sky keyframes around the cycle (t = 0..1; 0 = dawn)
const SKY = [
  { t: 0.00, top: '#8FA6C4', bot: '#E8B48A' },   // dawn
  { t: 0.12, top: '#9CC4E4', bot: '#C4DCEA' },   // morning
  { t: 0.35, top: '#7FB2DE', bot: '#BCD7E8' },   // noon
  { t: 0.55, top: '#96B4D4', bot: '#E0A878' },   // late afternoon
  { t: 0.65, top: '#5E5A88', bot: '#C97B5E' },   // dusk
  { t: 0.75, top: '#1C2238', bot: '#3A3A5C' },   // night
  { t: 0.92, top: '#141A2E', bot: '#2E3050' },   // deep night
  { t: 1.00, top: '#8FA6C4', bot: '#E8B48A' },   // wrap to dawn
];

// weather chain: from -> [[to, weight], ...]
const CHAIN = {
  clear: [['clear', 5], ['overcast', 3]],
  overcast: [['clear', 3], ['rain', 3], ['overcast', 2]],
  rain: [['overcast', 3], ['rain', 2], ['storm', 1.5]],
  storm: [['rain', 3], ['overcast', 1]],
};
const DWELL = { clear: [60, 160], overcast: [40, 100], rain: [40, 120], storm: [25, 60] };

function hx(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
// mix operates on [r,g,b] arrays so results can be composed without re-parsing
function mixArr(A, B, t) { return [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]; }
function rgb(A) { return `rgb(${Math.round(A[0])},${Math.round(A[1])},${Math.round(A[2])})`; }

export function makeEnvironment(startClock = DAY_LENGTH * 0.18) {
  let clock = startClock;          // start mid-morning
  let weather = 'clear';
  let nextWeather = 'clear';
  let blend = 1;                   // 0..1 progress of crossfade into nextWeather
  let dwell = 90;
  let lightning = 0;               // flash alpha
  let thunderIn = -1;              // seconds until the boom
  let windPhase = 0;

  const rand = () => Math.random();

  function intensityOf(w) { return w === 'rain' ? 0.7 : w === 'storm' ? 1 : w === 'overcast' ? 0.25 : 0; }

  const env = {
    get t01() { return (clock % DAY_LENGTH) / DAY_LENGTH; },
    get weather() { return blend >= 0.5 ? nextWeather : weather; },
    /** the state we're crossfading toward - a free ~15s telegraph for quests */
    get incoming() { return nextWeather; },
    /** while false, rain/storm remap to overcast (new-game grace period) */
    rainAllowed: true,
    lightning: 0,

    /** 0 = full day, 1 = deep night (smooth) */
    night01() {
      const t = this.t01;
      if (t < 0.6) return 0;
      if (t < 0.75) return clamp01((t - 0.6) / 0.15);      // dusk ramp
      if (t < 0.92) return 1;
      return clamp01(1 - (t - 0.92) / 0.08);                // pre-dawn ramp
    },

    /** rain/snow/gloom strength 0..1, crossfaded between states */
    precip01() { return lerp(intensityOf(weather), intensityOf(nextWeather), blend); },
    isStormy() { return this.weather === 'storm'; },
    /** wind 0..1 - breathes on its own + rises with weather */
    wind01() { return clamp01(0.2 + Math.sin(windPhase) * 0.15 + this.precip01() * 0.55); },

    /** {top, bot} sky colours for now (weather-darkened) */
    skyColors() {
      const t = this.t01;
      let i = 0;
      while (i < SKY.length - 2 && SKY[i + 1].t < t) i++;
      const a = SKY[i], b = SKY[i + 1];
      const f = clamp01((t - a.t) / Math.max(0.001, b.t - a.t));
      const gloom = this.precip01() * 0.45;
      const top = rgb(mixArr(mixArr(hx(a.top), hx(b.top), f), hx('#3A4048'), gloom));
      const bot = rgb(mixArr(mixArr(hx(a.bot), hx(b.bot), f), hx('#4A5058'), gloom));
      return { top, bot };
    },

    /** sun/moon screen positions (arc across the sky) + star alpha */
    sunMoon() {
      const t = this.t01;
      const dayArc = clamp01((t + 0.05) / 0.7);            // sun crosses during 0..0.65
      const nightArc = clamp01((t - 0.62) / 0.38);
      const arcX = p => 60 + p * (VIEW_W - 120);
      const arcY = p => 150 - Math.sin(p * Math.PI) * 110;
      return {
        sun: t < 0.68 ? { x: arcX(dayArc), y: arcY(dayArc), a: 1 - this.night01() } : null,
        moon: t > 0.58 ? { x: arcX(nightArc), y: arcY(nightArc), a: this.night01() } : null,
        stars: this.night01(),
      };
    },

    update(dt) {
      clock += dt;
      windPhase += dt * 0.23;
      // weather machine
      if (blend < 1) blend = Math.min(1, blend + dt / TRANSITION);
      else {
        weather = nextWeather;
        dwell -= dt;
        if (dwell <= 0) {
          const opts = CHAIN[weather];
          let total = opts.reduce((s, o) => s + o[1], 0), r = rand() * total;
          for (const [to, w] of opts) { r -= w; if (r <= 0) { nextWeather = to; break; } }
          if (!env.rainAllowed && (nextWeather === 'rain' || nextWeather === 'storm')) nextWeather = 'overcast';
          blend = nextWeather === weather ? 1 : 0;
          const [d0, d1] = DWELL[nextWeather];
          dwell = d0 + rand() * (d1 - d0);
        }
      }
      // lightning during storms
      this.lightning = Math.max(0, this.lightning - dt * 3);
      if (this.weather === 'storm' && this.precip01() > 0.8 && rand() < dt * 0.12) {
        this.lightning = 0.9;
        thunderIn = 0.5 + rand() * 1.5;
      }
      if (thunderIn > 0) {
        thunderIn -= dt;
        if (thunderIn <= 0) { env.onThunder?.(); thunderIn = -1; }
      }
    },

    /** test hook */
    _force(w, b = 1) { weather = w; nextWeather = w; blend = b; },
    _setClock(c) { clock = c; },
  };
  return env;
}

export { DAY_LENGTH };

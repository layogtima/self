// Touch controls (v5.0) - DG-3's mobile cockpit. The layer puppets the same
// mutable input state everything already reads (keys, mouse, presses), so no
// gameplay system knows phones exist. Two dialects, chosen per frame by the
// active scene via scene.touchMode():
//
//   'direct'  finger = cursor. A quick tap commits mouse.x/y + a REAL
//             MouseLeft press AT TOUCH END (atomically - the attract reel
//             stomps mouse coords every frame on the title, so committing
//             early would click where the reel last aimed). A sustained drag
//             presses at the drag point and holds mouse.left with a live
//             cursor (settings sliders, minigame scrubbing). With the scene's
//             scroll flag, vertical drags become mouse.wheel ticks instead
//             (fractional accumulation - integer steps feel ratchety).
//
//   'game'    twin-thumb: LEFT zone is a floating joystick (anchor on touch,
//             drag sets A/D, hard-down sets S); RIGHT zone is hybrid aim -
//             a short tap is an absolute click (scan that saiga, tap the
//             build bar), a drag is RELATIVE twin-stick aim: the cursor rides
//             rover + drag-vector (clamped near dig reach) with the laser
//             held. Build/Deconstruct force an absolute cursor: the finger
//             carries the ghost (lifted ~40px so it isn't under the finger)
//             and a tap fires one placement pulse - a held relative drag
//             would paint tiles along the whole path and drain the hold.
//
// On-canvas buttons (JUMP holds Space; E; K winch; a contextual pill for
// P/G/U moments; pause + journal chips) call humanPress()/hold() - REAL,
// non-synthetic input, so the title's autopilot filter doesn't eat it.
// touchcancel ≡ touchend and releases ONLY touch-owned inputs - never
// releaseAll(), a hybrid device may be holding real keys.

import { VIEW_W, VIEW_H, TILE, DIG_REACH } from '../config.js';
import { keys, mouse, pointer, humanPress, hold } from './input.js';

const TAP_SLOP = 14;          // px of drift before a touch stops being a tap
const TAP_TIME = 0.3;         // seconds before a still touch becomes a hold
const STICK_DEAD = 12;        // joystick deadzone px
const STICK_DOWN = 26;        // hard-down threshold for KeyS
const AIM_GAIN = 1.6;         // drag px -> aim px
const WHEEL_PX = 28;          // journal scroll px per wheel tick

export const touch = {
  active: typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches,

  // -- internals (exposed for tests: drive start/move/end in VIEW coords) ------
  _touches: new Map(),        // id -> {zone,x,y,sx,sy,t,btn}
  _taps: [],                  // committed taps waiting for the next frame
  _pulse: false,              // mouse.left is a 1-frame tap pulse
  _held: new Set(),           // key codes this layer is currently holding
  _wheelAcc: 0,
  _st: { mode: 'direct' },    // last scene state (render uses it)
  _insets: { t: 0, r: 0, b: 0, l: 0 },

  // ---------------------------------------------------------------- events
  start(id, x, y) {
    this.active = true;
    pointer.moved = true;               // the calibration quest gates on this
    const st = this._st;
    const b = this._buttonAt(x, y);
    if (b) {
      this._touches.set(id, { zone: 'btn', btn: b.id, x, y, sx: x, sy: y, t: 0 });
      humanPress(b.code);
      if (b.holdable) { hold(b.code, true); this._held.add(b.code); }
      return;
    }
    const zone = st.mode === 'game' && this._inStickZone(x, y) ? 'stick' : 'pend';
    this._touches.set(id, { zone, x, y, sx: x, sy: y, t: 0 });
  },

  move(id, x, y) {
    const t = this._touches.get(id);
    if (!t) return;
    t.x = x; t.y = y;
    if (t.zone === 'pend' && Math.hypot(x - t.sx, y - t.sy) > TAP_SLOP) this._classify(t);
    if (t.zone === 'stick' && Math.abs(x - t.sx) > 60) t.sx = x - 60 * Math.sign(x - t.sx);   // re-anchor: direction flips answer fast
  },

  end(id) {
    const t = this._touches.get(id);
    this._touches.delete(id);
    if (!t) return;
    if (t.zone === 'btn') {
      const b = this._buttons().find(b2 => b2.id === t.btn);
      if (b?.holdable) { hold(b.code, false); this._held.delete(b.code); }
      return;
    }
    if (t.zone === 'stick') { this._releaseStick(); return; }
    if (t.zone === 'pend') this._taps.push({ x: t.x, y: t.y });   // a clean tap - commit next frame
    if (t.zone === 'drag' || t.zone === 'aim') { mouse.left = false; }
  },

  cancel(id) { this.end(id); },

  /** a pending touch outlived the tap window or slop: decide what it is */
  _classify(t) {
    const st = this._st;
    if (st.mode !== 'game') {
      if (st.scroll && Math.abs(t.y - t.sy) > Math.abs(t.x - t.sx)) { t.zone = 'wheel'; return; }
      t.zone = 'drag';                                  // slider/scrub: press where the drag lives
      mouse.x = t.x; mouse.y = t.y;
      humanPress('MouseLeft');
      mouse.left = true;
      return;
    }
    if (st.cursor === 'absolute') { t.zone = 'ghost'; return; }   // build/decon: carry the ghost, no fire
    t.zone = 'aim';                                     // twin-stick: aim + hold the laser
    mouse.left = true;
  },

  // ---------------------------------------------------------------- per-frame
  /** write held state into keys/mouse. Runs BEFORE the scene update. */
  frame(dt, scene) {
    if (!this.active) return;
    const st = scene?.touchMode ? scene.touchMode() : { mode: 'direct' };
    this._st = typeof st === 'string' ? { mode: st } : st;

    let stick = null, aim = null, ghost = null, wheel = null, drag = null;
    for (const t of this._touches.values()) {
      t.t += dt;
      if (t.zone === 'pend' && t.t > TAP_TIME) this._classify(t);
      if (t.zone === 'stick') stick = t;
      if (t.zone === 'aim') aim = t;
      if (t.zone === 'ghost') ghost = t;
      if (t.zone === 'wheel') wheel = t;
      if (t.zone === 'drag') drag = t;
    }

    // one clean tap per frame: coords + press land together, atomically -
    // and always AFTER any scene that overwrites mouse coords ran last frame
    if (this._pulse) { mouse.left = false; this._pulse = false; }
    if (this._taps.length && !drag && !aim) {
      const tap = this._taps.shift();
      mouse.x = tap.x; mouse.y = tap.y;
      humanPress('MouseLeft');
      mouse.left = true;
      this._pulse = true;
    }

    // the joystick
    if (stick) {
      const dx = stick.x - stick.sx, dy = stick.y - stick.sy;
      this._setHeld('KeyA', dx < -STICK_DEAD);
      this._setHeld('KeyD', dx > STICK_DEAD);
      this._setHeld('KeyS', dy > STICK_DOWN && Math.abs(dy) > Math.abs(dx) * 1.1);
    } else if (this._stickHeld) this._releaseStick();

    // the cursor
    if (this._st.mode === 'game') {
      const a = this._st.anchor;
      if (aim && a) {
        const R = DIG_REACH * 0.95;    // full extension still lands a dig (inReach is strict)
        let vx = (aim.x - aim.sx) * AIM_GAIN, vy = (aim.y - aim.sy) * AIM_GAIN;
        const d = Math.hypot(vx, vy);
        if (d > R) { vx *= R / d; vy *= R / d; }
        mouse.x = a.x + vx; mouse.y = a.y + vy;
        mouse.left = true;                              // re-assert: a tap pulse may have cleared it
      } else if (ghost) {
        mouse.x = ghost.x; mouse.y = ghost.y - 40;      // the ghost rides above the finger
      } else if (!this._pulse && this._st.idle) {
        // nobody's aiming: the headlight settles ahead of the rover
        const k = Math.min(1, dt * 5);
        mouse.x += (this._st.idle.x - mouse.x) * k;
        mouse.y += (this._st.idle.y - mouse.y) * k;
      }
    } else if (drag) { mouse.x = drag.x; mouse.y = drag.y; mouse.left = true; }

    // drag-to-scroll -> wheel ticks (fractional accumulator keeps the leftovers)
    if (wheel) {
      this._wheelAcc += (wheel.sy - wheel.y) / WHEEL_PX;   // swipe up = scroll down
      wheel.sy = wheel.y;                                  // rebase every frame
      const ticks = Math.trunc(this._wheelAcc);
      if (ticks) { mouse.wheel += ticks; this._wheelAcc -= ticks; }
    }
  },

  _stickHeld: false,
  _setHeld(code, on) {
    if (on) { hold(code, true); this._held.add(code); this._stickHeld = true; }
    else if (this._held.has(code)) { hold(code, false); this._held.delete(code); }
  },
  _releaseStick() {
    for (const code of ['KeyA', 'KeyD', 'KeyS']) if (this._held.has(code)) { hold(code, false); this._held.delete(code); }
    this._stickHeld = false;
  },

  // ---------------------------------------------------------------- layout
  _inStickZone(x, y) {
    if (x > VIEW_W * 0.38) return false;
    if (y < 64) return false;                           // notch + quest ticker
    if (y > VIEW_H - 76 && x < 150) return false;       // mode toggles live here
    return true;
  },

  _buttons() {
    const st = this._st;
    const R = VIEW_W - this._insets.r, B = VIEW_H - this._insets.b;
    if (st.mode !== 'game') {
      return st.chips ? [
        { id: 'pause', code: 'Escape', holdable: true, x: R - 28, y: 56, r: 19, label: '❚❚' },
        { id: 'journal', code: 'Tab', x: R - 74, y: 56, r: 19, label: '≡' },
      ] : [];
    }
    const list = [
      { id: 'jump', code: 'Space', holdable: true, x: R - 64, y: B - 76, r: 37, label: 'JUMP' },
      { id: 'act', code: 'KeyE', x: R - 152, y: B - 58, r: 28, label: 'E' },
      { id: 'winch', code: 'KeyK', x: R - 66, y: B - 172, r: 24, label: 'K' },
      { id: 'pause', code: 'Escape', holdable: true, x: R - 28, y: 56, r: 19, label: '❚❚' },
      { id: 'journal', code: 'Tab', x: R - 74, y: 56, r: 19, label: '≡' },
    ];
    if (st.context) list.push({ id: 'ctx', code: st.context.code, x: R - 158, y: B - 132, r: 25, label: st.context.label });
    return list;
  },

  _buttonAt(x, y) {
    for (const b of this._buttons()) {
      if (Math.hypot(x - b.x, y - b.y) <= b.r + 6) return b;
    }
    return null;
  },

  /** screen rects the game must treat as UI (never dig under a thumb) */
  hotRects() {
    if (!this.active) return [];
    return this._buttons().map(b => ({ x: b.x - b.r - 6, y: b.y - b.r - 6, w: (b.r + 6) * 2, h: (b.r + 6) * 2 }));
  },

  // ---------------------------------------------------------------- render
  render(ctx) {
    if (!this.active) return;
    const st = this._st;
    ctx.save();
    // joystick ghost: anchor ring + thumb dot while steering
    if (st.mode === 'game') {
      for (const t of this._touches.values()) {
        if (t.zone !== 'stick') continue;
        ctx.strokeStyle = 'rgba(75,227,232,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(t.sx, t.sy, 34, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(75,227,232,0.4)';
        const dx = Math.max(-34, Math.min(34, t.x - t.sx)), dy = Math.max(-34, Math.min(34, t.y - t.sy));
        ctx.beginPath(); ctx.arc(t.sx + dx, t.sy + dy, 13, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (const b of this._buttons()) {
      const heldNow = [...this._touches.values()].some(t => t.zone === 'btn' && t.btn === b.id);
      ctx.fillStyle = heldNow ? 'rgba(224,162,74,0.5)' : 'rgba(14,12,10,0.42)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = heldNow ? 'rgba(246,232,200,0.9)' : 'rgba(75,227,232,0.45)';
      ctx.stroke();
      ctx.fillStyle = heldNow ? '#2A1F10' : 'rgba(246,232,200,0.85)';
      ctx.font = `bold ${b.r > 30 ? 13 : 11}px ui-monospace, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x, b.y + 1);
    }
    ctx.restore();
  },
};

/** wire real DOM touch events to the state machine (main.js, once) */
export function attachTouch(canvas, onFirstGesture) {
  if (typeof canvas.addEventListener !== 'function') return;
  const toView = tch => {
    const r = canvas.getBoundingClientRect();
    return { x: (tch.clientX - r.left) * (VIEW_W / r.width), y: (tch.clientY - r.top) * (VIEW_H / r.height) };
  };
  const readInsets = () => {
    try {
      const cs = getComputedStyle(document.documentElement);
      const px = v => parseFloat(cs.getPropertyValue(v)) || 0;
      const r = canvas.getBoundingClientRect();
      const s = VIEW_W / r.width;   // CSS px -> stage px
      touch._insets = { t: px('--sai-t') * s, r: px('--sai-r') * s, b: px('--sai-b') * s, l: px('--sai-l') * s };
    } catch { /* stubs / very old browsers: zero insets */ }
  };
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();                     // kills the synthetic mouse events
    if (onFirstGesture) onFirstGesture();
    readInsets();
    for (const t of e.changedTouches) { const p = toView(t); touch.start(t.identifier, p.x, p.y); }
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) { const p = toView(t); touch.move(t.identifier, p.x, p.y); }
  }, { passive: false });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    for (const t of e.changedTouches) touch.end(t.identifier);
  }, { passive: false });
  canvas.addEventListener('touchcancel', e => {
    for (const t of e.changedTouches) touch.cancel(t.identifier);
  });
  // a real mouse or keyboard takes over: tuck the thumb controls away
  addEventListener('mousemove', () => { touch.active = false; });
  addEventListener('keydown', () => { touch.active = false; });
}

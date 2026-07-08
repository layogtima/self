// Keyboard + mouse state. Edge-triggered "pressed" set is cleared each frame by
// the scene manager after update, so scenes can poll `pressed('KeyE')`.

import { VIEW_W, VIEW_H } from '../config.js';

export const keys = {};
export const mouse = { x: 0, y: 0, left: false, right: false, wheel: 0 };  // wheel: ±ticks this frame
const justPressed = new Set();
const listeners = [];

/** was this key pressed since the last endFrame()? */
export function pressed(code) { return justPressed.has(code); }

/** subscribe to a raw keydown (for scene changes); returns unsubscribe */
export function onKey(fn) { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); }

export function endFrame() { justPressed.clear(); mouse.wheel = 0; }

/** was ANY key/button pressed since last endFrame? (dismisses cards) */
export function anyPressed() { return justPressed.size > 0; }

const PREVENT = new Set(['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Tab',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

// arrow keys play exactly like WASD
const ALIAS = { ArrowLeft: 'KeyA', ArrowRight: 'KeyD', ArrowUp: 'KeyW', ArrowDown: 'KeyS' };

export function attachInput(canvas, onFirstGesture) {
  addEventListener('keydown', e => {
    if (PREVENT.has(e.code)) e.preventDefault();
    if (onFirstGesture) onFirstGesture();
    const code = ALIAS[e.code] || e.code;
    if (!e.repeat) {
      justPressed.add(code);
      for (const fn of listeners) fn(code);
    }
    keys[code] = true;
  });
  addEventListener('keyup', e => { keys[ALIAS[e.code] || e.code] = false; });

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (VIEW_W / r.width);
    mouse.y = (e.clientY - r.top) * (VIEW_H / r.height);
  });
  canvas.addEventListener('mousedown', e => {
    if (onFirstGesture) onFirstGesture();
    if (e.button === 0) { mouse.left = true; justPressed.add('MouseLeft'); }
    if (e.button === 2) { mouse.right = true; justPressed.add('MouseRight'); }
  });
  addEventListener('mouseup', e => {
    if (e.button === 0) mouse.left = false;
    if (e.button === 2) mouse.right = false;
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    mouse.wheel += Math.sign(e.deltaY);
  }, { passive: false });
}

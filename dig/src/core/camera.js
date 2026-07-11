// Smooth follow camera with world clamp + decaying screen shake.
// v5.1: the camera rides zoomed - it frames a WIN_W x WIN_H world window that
// apply() scales up to the full stage. sx/sy/wx/wy convert between world px
// and stage (mouse/HUD) px; everything drawing inside apply() stays in world px.

import { WIN_W, WIN_H, VIEW_ZOOM, WORLD_W, WORLD_H, TILE } from '../config.js';

export function makeCamera() {
  return {
    x: 0, y: 0, shake: 0,

    /** @param {number} cx target centre x (world px) @param {number} cy */
    follow(cx, cy, dt, snap = false) {
      const tx = Math.max(0, Math.min(WORLD_W * TILE - WIN_W, cx - WIN_W / 2));
      const ty = Math.max(0, Math.min(WORLD_H * TILE - WIN_H, cy - WIN_H / 2));
      if (snap) { this.x = tx; this.y = ty; return; }
      const k = Math.min(1, 10 * dt);
      this.x += (tx - this.x) * k;
      this.y += (ty - this.y) * k;
    },

    addShake(m, enabled = true) { if (enabled) this.shake = Math.min(8, this.shake + m); },
    decay(dt) { this.shake = Math.max(0, this.shake - this.shake * 10 * dt - 0.5 * dt); },

    /** world px -> stage px (where a world point lands on screen) */
    sx(wx) { return (wx - this.x) * VIEW_ZOOM; },
    sy(wy) { return (wy - this.y) * VIEW_ZOOM; },
    /** stage px (mouse) -> world px */
    wx(mx) { return mx / VIEW_ZOOM + this.x; },
    wy(my) { return my / VIEW_ZOOM + this.y; },

    /** apply zoom + translate (with shake) to a ctx; caller wraps in save/restore */
    apply(ctx) {
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      ctx.scale(VIEW_ZOOM, VIEW_ZOOM);
      ctx.translate(-Math.round(this.x + sx), -Math.round(this.y + sy));
    },

    bounds() {
      return {
        x0: Math.floor(this.x / TILE) - 1,
        x1: Math.floor((this.x + WIN_W) / TILE) + 1,
        y0: Math.floor(this.y / TILE) - 1,
        y1: Math.floor((this.y + WIN_H) / TILE) + 1,
      };
    },
  };
}

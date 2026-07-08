// Smooth follow camera with world clamp + decaying screen shake.

import { VIEW_W, VIEW_H, WORLD_W, WORLD_H, TILE } from '../config.js';

export function makeCamera() {
  return {
    x: 0, y: 0, shake: 0,

    /** @param {number} cx target centre x (world px) @param {number} cy */
    follow(cx, cy, dt, snap = false) {
      const tx = Math.max(0, Math.min(WORLD_W * TILE - VIEW_W, cx - VIEW_W / 2));
      const ty = Math.max(0, Math.min(WORLD_H * TILE - VIEW_H, cy - VIEW_H / 2));
      if (snap) { this.x = tx; this.y = ty; return; }
      const k = Math.min(1, 10 * dt);
      this.x += (tx - this.x) * k;
      this.y += (ty - this.y) * k;
    },

    addShake(m, enabled = true) { if (enabled) this.shake = Math.min(8, this.shake + m); },
    decay(dt) { this.shake = Math.max(0, this.shake - this.shake * 10 * dt - 0.5 * dt); },

    /** apply translate (with shake) to a ctx; caller wraps in save/restore */
    apply(ctx) {
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      ctx.translate(-Math.round(this.x + sx), -Math.round(this.y + sy));
    },

    bounds() {
      return {
        x0: Math.floor(this.x / TILE) - 1,
        x1: Math.floor((this.x + VIEW_W) / TILE) + 1,
        y0: Math.floor(this.y / TILE) - 1,
        y1: Math.floor((this.y + VIEW_H) / TILE) + 1,
      };
    },
  };
}

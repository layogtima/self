// The winch: your way home. Invisible until you need it — press K underground
// and a rig materialises at the surface directly above you, drops a line, and
// reels you up. During extraction the winch OWNS the motion (a real pendulum:
// θ'' = -(g/len)·sinθ, damped, A/D torques the swing) and ignores terrain — it's
// a winch, not a climb. At the top you POP out of the hole with an impulse and
// normal physics catch you mid-air.

import { TILE, REEL_SPEED, ROPE_MIN_LEN, GRAVITY } from '../config.js';
import { keys } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { PALETTE } from '../render/palette.js';

export function makePulley() {
  return {
    active: false,
    anchor: null,      // {x, y} world px of the wheel
    len: 0,
    theta: 0,          // rope angle from straight-down (radians)
    omega: 0,          // angular velocity
    creakT: 0,
    spin: 0,
    spawnT: 0,         // rig materialise animation 0..1

    isUnderground(p, world) {
      const col = Math.max(0, Math.min(world.WORLD_W - 1, p.tx()));
      return p.y + p.h > world.surface[col] * TILE + 2;
    },

    /** K: summon the winch at the surface straight above and start reeling */
    tryAttach(p, world) {
      if (this.active || !this.isUnderground(p, world)) return false;
      const col = Math.max(0, Math.min(world.WORLD_W - 1, p.tx()));
      const ax = (col + 0.5) * TILE;
      const ay = world.surface[col] * TILE - 10;
      const dx = p.cx() - ax, dy = p.cy() - ay;
      this.anchor = { x: ax, y: ay };
      this.len = Math.max(ROPE_MIN_LEN, Math.hypot(dx, dy));
      // angle from straight-down; positive = to the right of the anchor
      this.theta = Math.atan2(dx, dy);
      this.omega = p.vx / Math.max(1, this.len);   // carry momentum into the swing
      this.active = true;
      this.spawnT = 0;
      sfx.rig();
      sfx.attach();
      return true;
    },

    /**
     * Owns player motion while active — call INSTEAD of updatePlayer.
     * @returns {{popped?:boolean, cancelled?:boolean}}
     */
    updateReel(p, world, dt) {
      if (!this.active) return {};
      this.spawnT = Math.min(1, this.spawnT + dt * 4);

      // Space = let go (only where you wouldn't materialise inside rock)
      if (keys.Space) {
        const vx = this.omega * this.len * Math.cos(this.theta);
        const vy = -REEL_SPEED;   // was travelling up the rope
        if (!this.playerInsideSolid(p, world)) {
          this.release(p, vx, vy);
          return { cancelled: true };
        }
      }

      // pendulum physics with a shortening rope
      const g = GRAVITY;
      const accel = -(g / Math.max(20, this.len)) * Math.sin(this.theta);
      this.omega += accel * dt;
      // A/D torque the swing
      const dir = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      this.omega += dir * 2.2 * dt;
      this.omega *= (1 - 1.1 * dt);              // air damping
      this.theta += this.omega * dt;

      // reel in
      this.len = Math.max(ROPE_MIN_LEN, this.len - REEL_SPEED * dt);
      this.spin += REEL_SPEED * dt / 8;

      // place the player on the rope (terrain ignored — it's a winch)
      const bx = this.anchor.x + Math.sin(this.theta) * this.len;
      const by = this.anchor.y + Math.cos(this.theta) * this.len;
      p.x = bx - p.w / 2;
      p.y = by - 6;                               // hook grips the chassis top
      p.facing = this.theta >= 0 ? 1 : -1;
      p.vx = 0; p.vy = 0;

      this.creakT -= dt;
      if (this.creakT <= 0) { sfx.creak(); this.creakT = 0.22 + Math.random() * 0.1; }

      // the POP: reached the wheel → fling up out of the hole
      if (this.len <= ROPE_MIN_LEN + 0.5) {
        const mouthY = this.anchor.y;             // capture before release() nulls it
        const popVx = Math.sin(this.theta) * 40 + (Math.random() < 0.5 ? -50 : 50);
        this.release(p, popVx, -270);
        p.y = mouthY - p.h - 2;                   // clear of the hole mouth
        sfx.detach();
        return { popped: true };
      }
      return {};
    },

    playerInsideSolid(p, world) {
      const x0 = Math.floor(p.x / TILE), x1 = Math.floor((p.x + p.w - 1) / TILE);
      const y0 = Math.floor(p.y / TILE), y1 = Math.floor((p.y + p.h - 1) / TILE);
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++)
          if (world.solidAt(tx, ty)) return true;
      return false;
    },

    release(p, vx, vy) {
      p.vx = vx; p.vy = vy;
      this.active = false;
      this.anchor = null;
    },

    /** ragdoll body angle for the sprite (rope angle, sign matches screen x) */
    dangleAngle() { return -this.theta; },

    /** world-space draw: rig + rope down to the player */
    draw(ctx, p, time) {
      if (!this.active || !this.anchor) return;
      const { x, y } = this.anchor;
      const s = this.spawnT;                      // materialise: rises + fades in

      ctx.save();
      ctx.globalAlpha = Math.min(1, s * 1.5);
      const rise = (1 - s) * 8;

      // rope
      ctx.strokeStyle = '#6E5A43';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 3 + rise);
      ctx.lineTo(p.cx(), p.y + 4);
      ctx.stroke();

      // A-frame posts
      ctx.strokeStyle = PALETTE.wood;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 12 + rise); ctx.lineTo(x, y + rise);
      ctx.moveTo(x + 9, y + 12 + rise); ctx.lineTo(x, y + rise);
      ctx.stroke();

      // wheel
      ctx.fillStyle = PALETTE.frame;
      ctx.beginPath(); ctx.arc(x, y + rise, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = PALETTE.amber;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const a = this.spin;
      ctx.moveTo(x - Math.cos(a) * 4, y + rise - Math.sin(a) * 4);
      ctx.lineTo(x + Math.cos(a) * 4, y + rise + Math.sin(a) * 4);
      ctx.moveTo(x - Math.cos(a + 1.57) * 4, y + rise - Math.sin(a + 1.57) * 4);
      ctx.lineTo(x + Math.cos(a + 1.57) * 4, y + rise + Math.sin(a + 1.57) * 4);
      ctx.stroke();
      ctx.restore();
    },
  };
}

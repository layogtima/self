// Player: AABB physics vs the tile world. Logic ported verbatim from the proven
// POC (constants unchanged) - only the world queries are now injected.

import {
  TILE, GRAVITY, MAX_FALL, MOVE_SPEED, GROUND_ACCEL, AIR_ACCEL, FRICTION,
  JUMP_V, COYOTE_TIME, JUMP_BUFFER, PLAYER_W, PLAYER_H,
} from '../config.js';
import { keys } from '../core/input.js';
import { sfx } from '../core/audio.js';

export function makePlayer(spawnX, spawnY) {
  return {
    x: spawnX, y: spawnY, w: PLAYER_W, h: PLAYER_H,
    vx: 0, vy: 0,
    onGround: false, coyote: 0, jumpBuf: 0, jumpHeld: false,
    facing: 1, walkT: 0, lastVy: 0,
    digCd: 0, swingT: 0, swingAim: 0.9, placeCd: 0,
    fastFallT: 0, chute: false,  // parachute auto-deploys on a long fast fall
    beam: null,               // {x,y} world target while the laser fires this frame
    tool: 'laser',            // 'laser' | 'scan' (Ctrl toggles)
    laserMk: 1,               // 1 | 2 | 3 - dig power 1/2/4 (upgrade at the pod)
    inWater: false, inLava: false, inBrine: false, inTar: false,

    cx() { return this.x + this.w / 2; },
    cy() { return this.y + this.h / 2; },
    tx() { return Math.floor(this.cx() / TILE); },

    /** call on Space/W keydown */
    bufferJump() { this.jumpBuf = JUMP_BUFFER; },
  };
}

/**
 * @param {ReturnType<makePlayer>} p
 * @param {import('../world/world.js').makeWorld} world
 * @param {number} dt
 */
export function updatePlayer(p, world, dt) {
  const dir = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  if (dir !== 0) {
    p.facing = dir;
    const accel = p.onGround ? GROUND_ACCEL : AIR_ACCEL;
    p.vx += dir * accel * dt;
    p.vx = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, p.vx));
    p.walkT += dt * Math.abs(p.vx) / MOVE_SPEED;
  } else {
    const f = (p.onGround ? FRICTION : FRICTION * 0.25) * dt;
    if (Math.abs(p.vx) <= f) p.vx = 0; else p.vx -= Math.sign(p.vx) * f;
  }

  p.coyote = p.onGround ? COYOTE_TIME : Math.max(0, p.coyote - dt);
  p.jumpBuf = Math.max(0, p.jumpBuf - dt);
  const jumpKey = keys.Space || keys.KeyW;
  if (p.jumpBuf > 0 && p.coyote > 0) {
    p.vy = -JUMP_V; p.coyote = 0; p.jumpBuf = 0; p.jumpHeld = true; sfx.jump();
  }
  if (p.jumpHeld && !jumpKey && p.vy < 0) { p.vy *= 0.45; p.jumpHeld = false; }
  if (!jumpKey) p.jumpHeld = false;

  // fluids: sample what the rover is submerged in (chassis centre)
  const fluid = world.fluidAt ? world.fluidAt(p.tx(), Math.floor(p.cy() / TILE)) : 0;
  p.inWater = fluid === 4;   // T_WATER
  p.inLava = fluid === 5;    // T_LAVA
  p.inBrine = fluid === 7;   // T_BRINE
  p.inTar = fluid === 8;     // T_TAR
  if (p.inWater) {
    // buoyancy: gentle sink, strong drag, jump = swim stroke upward
    p.vy = Math.min(p.vy + GRAVITY * 0.18 * dt, 90);
    p.vx *= 0.86; p.vy *= 0.9;
    if (p.jumpBuf > 0) { p.vy = -270; p.jumpBuf = 0; }   // swim stroke (v5.7: +~1 tile of rise)
  } else if (p.inBrine) {
    // hypersaline = dense: you barely sink and pop out with one stroke
    p.vy = Math.min(p.vy + GRAVITY * 0.08 * dt, 36);
    p.vx *= 0.84; p.vy *= 0.86;
    if (p.jumpBuf > 0) { p.vy = -175; p.jumpBuf = 0; }
  } else if (p.inTar) {
    // asphalt seep: everything is slow, strokes barely help - wade out shallow
    p.vy = Math.min(p.vy + GRAVITY * 0.12 * dt, 24);
    p.vx *= 0.7; p.vy *= 0.8;
    if (p.jumpBuf > 0) { p.vy = -62; p.jumpBuf = 0; }
  } else if (p.chute || (!p.onGround && p.fastFallT > 0.35)) {
    // parachute: a long fast fall auto-deploys a canopy that eases you down
    p.chute = true;
    p.vy = Math.min(p.vy + GRAVITY * 0.25 * dt, 150);   // gentle terminal velocity
    p.vx *= 0.94;
  } else {
    p.vy = Math.min(p.vy + GRAVITY * dt, MAX_FALL);
  }
  moveAndCollide(p, world, dt);

  // parachute bookkeeping: accumulate fast-fall time; stow the chute on landing
  const inLiquid = p.inWater || p.inBrine || p.inTar;
  if (!p.onGround && !inLiquid && p.vy > 520) p.fastFallT += dt;
  else if (p.vy < 200 || inLiquid) p.fastFallT = 0;
  if (p.onGround || inLiquid) p.chute = false;

  p.digCd = Math.max(0, p.digCd - dt);
  p.swingT = Math.max(0, p.swingT - dt);
  p.placeCd = Math.max(0, p.placeCd - dt);
}

function moveAndCollide(p, world, dt) {
  const solid = (tx, ty) => world.solidAt(tx, ty);

  // horizontal
  p.x += p.vx * dt;
  {
    const y0 = Math.floor(p.y / TILE), y1 = Math.floor((p.y + p.h - 0.001) / TILE);
    if (p.vx > 0) {
      const tx = Math.floor((p.x + p.w - 0.001) / TILE);
      for (let ty = y0; ty <= y1; ty++) if (solid(tx, ty)) { p.x = tx * TILE - p.w; p.vx = 0; break; }
    } else if (p.vx < 0) {
      const tx = Math.floor(p.x / TILE);
      for (let ty = y0; ty <= y1; ty++) if (solid(tx, ty)) { p.x = (tx + 1) * TILE; p.vx = 0; break; }
    }
  }

  // vertical
  p.lastVy = p.vy;
  p.y += p.vy * dt;
  const wasGrounded = p.onGround;
  p.onGround = false;
  {
    const x0 = Math.floor(p.x / TILE), x1 = Math.floor((p.x + p.w - 0.001) / TILE);
    if (p.vy > 0) {
      const ty = Math.floor((p.y + p.h - 0.001) / TILE);
      for (let tx = x0; tx <= x1; tx++) if (solid(tx, ty)) {
        p.y = ty * TILE - p.h;
        if (!wasGrounded && p.lastVy > 320) sfx.land();
        p.vy = 0; p.onGround = true; break;
      }
    } else if (p.vy < 0) {
      const ty = Math.floor(p.y / TILE);
      for (let tx = x0; tx <= x1; tx++) if (solid(tx, ty)) { p.y = (ty + 1) * TILE; p.vy = 0; break; }
    }
  }
}

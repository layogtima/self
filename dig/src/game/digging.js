// Dig resolver. The probe cuts with a LASER: walk into a wall and the beam melts
// through it; S drills down; the mouse aims precisely. The camp span is off-limits
// (the beam won't fire near homebase). Recovered bones are handed to the caller;
// a still-buried neighbour bone emits a "something here…" telegraph.

import { TILE, DIG_REACH, DIG_COOLDOWN } from '../config.js';
import { keys, mouse } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { PALETTE } from '../render/palette.js';

function keyboardTarget(p, world) {
  const cx = p.tx();
  const top = Math.floor(p.y / TILE);
  const mid = Math.floor(p.cy() / TILE);
  const bot = Math.floor((p.y + p.h - 0.001) / TILE);
  if (keys.KeyA || keys.KeyD) {
    const col = cx + (keys.KeyD ? 1 : keys.KeyA ? -1 : p.facing);
    for (const ty of [top, mid, bot]) if (world.diggable(col, ty)) return { tx: col, ty };
    return { tx: col, ty: mid };
  }
  if (keys.KeyW) return { tx: cx, ty: top - 1 };
  return { tx: cx, ty: Math.floor((p.y + p.h + 1) / TILE) };
}

function wallTarget(p, world) {
  const dir = keys.KeyD ? 1 : keys.KeyA ? -1 : 0;
  if (!dir) return null;
  if (Math.abs(p.vx) > 6) return null;
  const edge = dir > 0 ? p.x + p.w : p.x;
  const col = Math.floor((edge + dir * 2) / TILE);
  const top = Math.floor(p.y / TILE);
  const bot = Math.floor((p.y + p.h - 0.001) / TILE);
  for (const ty of [top, bot]) if (world.diggable(col, ty)) return { tx: col, ty };
  return null;
}

function digTarget(p, world, cam) {
  if (mouse.left) return { tx: Math.floor((mouse.x + cam.x) / TILE), ty: Math.floor((mouse.y + cam.y) / TILE) };
  if (keys.KeyS) return { tx: p.tx(), ty: Math.floor((p.y + p.h + 1) / TILE) };
  if (keys.KeyJ) return keyboardTarget(p, world);
  return wallTarget(p, world);
}

function inReach(p, tx, ty) {
  const dx = (tx + 0.5) * TILE - p.cx();
  const dy = (ty + 0.5) * TILE - p.cy();
  return dx * dx + dy * dy <= DIG_REACH * DIG_REACH;
}

/**
 * Run laser digging for one frame. Sets p.beam (for the render) each firing
 * frame and clears it when idle.
 * @returns {{bone?:object, nearBone?:object, camp?:boolean}}
 */
export function updateDigging(p, world, cam, particles, fx, dt) {
  const out = {};
  p.beam = null;
  if (p.digCd > 0) return out;
  const aim = digTarget(p, world, cam);
  if (!aim) return out;

  // camp guard: the beam won't fire near homebase
  if (world.inCampZone(aim.tx, aim.ty)) {
    if (world.tileAt(aim.tx, aim.ty) === 1) out.camp = true;   // T_ROCK — you tried
    return out;
  }
  if (!world.diggable(aim.tx, aim.ty) || !inReach(p, aim.tx, aim.ty)) return out;

  // fire the beam (presentation): lens → target tile centre
  const wx = (aim.tx + 0.5) * TILE, wy = (aim.ty + 0.5) * TILE;
  p.beam = { x: wx, y: wy };
  p.facing = wx >= p.cx() ? 1 : -1;

  p.digCd = DIG_COOLDOWN;
  const stratum = world.stratumAt(aim.tx, aim.ty);
  const res = world.dig(aim.tx, aim.ty);

  if (res.broke) {
    particles.burst(wx, wy, PALETTE.amber, 7, 120);         // molten sparks
    particles.burst(wx, wy, stratum.colors.speckle, 6);
    fx.shake(1.4);
    sfx.laserBreak();
    if (res.bone) {
      out.bone = res.bone;
      fx.shake(2.5);
      particles.burst(wx, wy, PALETTE.bone, 16, 200);
    } else {
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const near = world.pocketAt(aim.tx + ox, aim.ty + oy);
        if (near) { out.nearBone = near; particles.burst(wx, wy, PALETTE.bone, 4, 90); break; }
      }
    }
  } else {
    particles.burst(wx, wy, PALETTE.amber, 3, 90);
    fx.shake(0.5);
    sfx.laser();
  }
  return out;
}

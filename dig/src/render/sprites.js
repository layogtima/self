// Sprites: PROBE DG-3 (drawn vectorially) and fossils (procedural silhouette now,
// drop-in PNG later). Fossil art contract — see docs/CONTENT.md:
//   put assets/sprites/fossils/<id>.png (footprint*16 px, transparent) and it is
//   auto-loaded and used instead of the generated silhouette. No code change.

import { TILE, PLAYER_H } from '../config.js';
import { PALETTE } from './palette.js';
import { makeRng } from '../core/rng.js';
import { FOSSILS } from '../content/fossils.js';

// ---------------------------------------------------------------- the probe
const METAL = '#8E96A4';
const METAL_DARK = '#6C7480';

/**
 * Draw PROBE DG-3 — a small boxy excavation robot. Single glowing lens
 * (canonically the lantern light), antenna, tread-feet, scoop arm.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx centre x  @param {number} topY top y
 * @param {number} facing 1|-1  @param {number} time seconds
 * @param {number} swingT 0..0.16  @param {number} swingAim radians
 * @param {number} vx  @param {number} walkT
 * @param {{dangle?:number}} [opts]  dangle: rope angle for the ragdoll winch pose
 */
export function drawProbe(ctx, cx, topY, facing, time, swingT, swingAim, vx, walkT, opts = {}) {
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(topY));

  const dangling = typeof opts.dangle === 'number';
  if (dangling) {
    // ragdoll: whole chassis pivots from the rope hook + loose wobble
    ctx.rotate(opts.dangle + Math.sin(time * 6.5) * 0.14);
  }
  ctx.scale(facing, 1);

  const ink = PALETTE.ink;
  const moving = Math.abs(vx) > 10;
  const step = moving ? Math.sin(walkT * 16) * 2 : 0;
  const bob = dangling ? 0 : moving ? Math.abs(Math.sin(walkT * 16)) * 1 : Math.sin(time * 1.6) * 0.6;

  // antenna
  ctx.strokeStyle = METAL;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-2, 4 + bob);
  ctx.lineTo(-3.5, -1 + bob + (dangling ? Math.sin(time * 9) * 1.5 : 0));
  ctx.stroke();
  ctx.fillStyle = PALETTE.danger;
  ctx.beginPath(); ctx.arc(-3.5, -1.6 + bob, 1.4, 0, Math.PI * 2); ctx.fill();

  // chassis (rounded box)
  ctx.fillStyle = ink;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-6, 3 + bob, 12, 12, 3); else ctx.rect(-6, 3 + bob, 12, 12);
  ctx.fill();
  // panel line + rivet
  ctx.strokeStyle = METAL_DARK;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-5, 11 + bob); ctx.lineTo(5, 11 + bob); ctx.stroke();
  ctx.fillStyle = METAL_DARK;
  ctx.fillRect(-5, 13 + bob, 1.5, 1.5);

  // lens eye — glows (this IS the lantern); flares bright while the laser fires
  const firing = !!opts.firing;
  const glow = firing ? 1 : 0.75 + Math.sin(time * 3) * 0.25;
  ctx.fillStyle = METAL;
  ctx.beginPath(); ctx.arc(2.5, 7.5 + bob, 3.2, 0, Math.PI * 2); ctx.fill();
  if (firing) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath(); ctx.arc(2.5, 7.5 + bob, 5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = firing ? '#FFF3D0' : PALETTE.lantern;
  ctx.globalAlpha = glow;
  ctx.beginPath(); ctx.arc(2.5, 7.5 + bob, 2.1, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = firing ? '#FFFFFF' : PALETTE.amber;
  ctx.beginPath(); ctx.arc(3.1, 7 + bob, 0.9, 0, Math.PI * 2); ctx.fill();

  // tread-feet (dangle loosely on the winch)
  ctx.fillStyle = METAL_DARK;
  if (dangling) {
    const sway = Math.sin(time * 8) * 2;
    ctx.fillRect(-5 + sway * 0.4, 16, 4.5, 5);
    ctx.fillRect(1 - sway * 0.4, 17, 4.5, 5);
  } else {
    ctx.fillRect(-5 + step, PLAYER_H - 5, 4.5, 5);
    ctx.fillRect(1 - step, PLAYER_H - 5, 4.5, 5);
  }
  ctx.fillStyle = ink;
  ctx.fillRect(-4 + (dangling ? 0 : step), PLAYER_H - 3, 2.5, 1);
  ctx.fillRect(2 - (dangling ? 0 : step), PLAYER_H - 3, 2.5, 1);

  // scoop arm
  ctx.strokeStyle = METAL;
  const swinging = swingT > 0;
  const prog = swinging ? 1 - swingT / 0.16 : 0;
  let armA = 0.7;
  if (swinging) {
    const aim = Math.abs(facing === 1 ? swingAim : Math.PI - swingAim);
    armA = (aim - 1.1) + Math.sin(prog * Math.PI) * 1.4;
  } else if (dangling) {
    armA = 1.4 + Math.sin(time * 7.5) * 0.3;   // arm hangs loose
  }
  const sx = 2, sy = 12 + bob;
  const hx = sx + Math.cos(armA) * 6, hy = sy + Math.sin(armA) * 6;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
  const tipX = sx + Math.cos(armA) * 14, tipY = sy + Math.sin(armA) * 14;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipX, tipY); ctx.stroke();
  // scoop
  ctx.save();
  ctx.translate(tipX, tipY); ctx.rotate(armA);
  ctx.fillStyle = METAL;
  ctx.beginPath();
  ctx.moveTo(0, -3.5); ctx.lineTo(5, -2); ctx.lineTo(5, 2); ctx.lineTo(0, 3.5);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  ctx.restore();
}

/** @deprecated alias — older call sites; the dwarf retired to poc/ */
export const drawDwarf = drawProbe;

// ---------------------------------------------------------------- fossils
const fossilImages = {};   // id -> HTMLImageElement (loaded) | false (missing)
const silhouetteCache = {}; // id -> offscreen canvas

/**
 * Kick off async loads of any drop-in PNGs. Missing files fall back to the
 * procedural silhouette forever — the game never blocks on art.
 * @param {(src:string)=>HTMLImageElement} makeImage  factory (real or stub-null)
 */
export function loadFossilSprites(makeImage) {
  if (!makeImage) return;
  for (const f of FOSSILS) {
    const img = makeImage(`assets/sprites/fossils/${f.id}.png`);
    if (!img) continue;
    img.onload = () => { fossilImages[f.id] = img; };
    img.onerror = () => { fossilImages[f.id] = false; };
  }
}

/**
 * Procedural "embedded bones" silhouette for a fossil, baked once.
 * Reads like a specimen half-exposed in matrix: a body blob + rib/limb strokes.
 * @returns {HTMLCanvasElement}
 */
function silhouette(spec, makeCanvas) {
  if (silhouetteCache[spec.id]) return silhouetteCache[spec.id];
  const [fw, fh] = spec.footprint;
  const w = fw * TILE, h = fh * TILE;
  const cv = makeCanvas(w, h);
  const ctx = cv.getContext('2d');
  const rng = makeRng(hashId(spec.id));

  ctx.fillStyle = PALETTE.bone;
  ctx.strokeStyle = PALETTE.bone;
  ctx.lineCap = 'round';

  const cx = w / 2, cy = h / 2;
  // central body mass — an organic blob
  ctx.beginPath();
  const lobes = 7 + Math.floor(rng.next() * 4);
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const rr = (0.28 + rng.hash2(i, 3) * 0.16);
    const px = cx + Math.cos(a) * w * rr;
    const py = cy + Math.sin(a) * h * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();

  // ribs / segments / limbs radiating out — count scales with size
  const ribs = 3 + Math.floor((fw + fh) * 0.9);
  ctx.lineWidth = Math.max(1.5, Math.min(fw, fh) * 1.4);
  for (let i = 0; i < ribs; i++) {
    const a = (i / ribs) * Math.PI * 2 + rng.hash2(i, 9) * 0.5;
    const r0 = Math.min(w, h) * 0.18;
    const r1 = Math.min(w, h) * (0.32 + rng.hash2(i, 4) * 0.22);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }

  // shadow speckle so it reads as fossilised, not painted
  ctx.fillStyle = PALETTE.boneShadow;
  for (let i = 0; i < fw * fh * 3; i++) {
    ctx.fillRect((rng.hash2(i, 1) * w) | 0, (rng.hash2(i, 2) * h) | 0, 1, 1);
  }

  silhouetteCache[spec.id] = cv;
  return cv;
}

/**
 * Draw a fossil specimen at (dx,dy) top-left, world or UI space, scaled to its
 * footprint. Uses the drop-in PNG if loaded, else the procedural silhouette.
 */
export function drawFossil(ctx, spec, dx, dy, makeCanvas, scale = 1) {
  const [fw, fh] = spec.footprint;
  const w = fw * TILE * scale, h = fh * TILE * scale;
  const img = fossilImages[spec.id];
  if (img) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, dx, dy, w, h);
    return;
  }
  const sil = silhouette(spec, makeCanvas);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sil, dx, dy, w, h);
}

function hashId(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---------------------------------------------------------------- generic sprite loader
// Drop-in PNGs for scenery + stations. assets/sprites/<dir>/<id>.png; missing →
// caller draws its own procedural fallback.
const spriteImages = {};   // `${dir}/${id}` -> HTMLImageElement | false

export function loadSprites(makeImage, dir, ids) {
  if (!makeImage) return;
  for (const id of ids) {
    const key = `${dir}/${id}`;
    const img = makeImage(`assets/sprites/${dir}/${id}.png`);
    if (!img) continue;
    img.onload = () => { spriteImages[key] = img; };
    img.onerror = () => { spriteImages[key] = false; };
  }
}

/** draw a loaded sprite centred-bottom at (x, baseY); returns false if not loaded */
export function drawSprite(ctx, dir, id, x, baseY, w, h) {
  const img = spriteImages[`${dir}/${id}`];
  if (!img) return false;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(x - w / 2), Math.round(baseY - h), w, h);
  return true;
}

export function hasSprite(dir, id) { return !!spriteImages[`${dir}/${id}`]; }

// ---------------------------------------------------------------- buried bone nub
// A single bone in the ground reads as a small knuckle of cream pixels; some are
// tiny skulls (per the ref). Deliberately faint until the tile is exposed.
export function drawBoneNub(ctx, pocket, dx, dy, exposed) {
  const seed = hashId(pocket.id);
  const r = (n) => ((Math.imul(seed + n, 2654435761) >>> 0) % 1000) / 1000;
  ctx.save();
  ctx.globalAlpha = exposed ? 0.95 : 0.5;
  ctx.fillStyle = PALETTE.bone;
  const cx = dx + 8, cy = dy + 8;
  if (r(1) > 0.7) {
    // tiny skull: round cranium + snout + two dark eye pixels
    ctx.beginPath(); ctx.arc(cx - 1, cy, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx + 1, cy - 1, 4, 3);
    ctx.fillStyle = PALETTE.dark;
    ctx.fillRect(cx - 2, cy - 1, 1.4, 1.4);
    ctx.fillRect(cx, cy - 1, 1.4, 1.4);
  } else {
    // a bone: two knuckles + shaft, rotated
    const a = r(2) * Math.PI;
    ctx.translate(cx, cy); ctx.rotate(a);
    ctx.fillRect(-4, -1.3, 8, 2.6);
    ctx.beginPath(); ctx.arc(-4, 0, 1.8, 0, Math.PI * 2); ctx.arc(4, 0, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (exposed) {
    ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 200 + seed) * 0.3;
    ctx.fillStyle = PALETTE.lantern;
    ctx.fillRect(dx + 7, dy + 3, 1, 1);
    ctx.globalAlpha = 1;
  }
}

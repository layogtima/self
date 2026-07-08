// Sprites: PROBE DG-3 (drawn vectorially) and fossils (procedural silhouette now,
// drop-in PNG later). Fossil art contract — see docs/CONTENT.md:
//   put assets/sprites/fossils/<id>.png (footprint*16 px, transparent) and it is
//   auto-loaded and used instead of the generated silhouette. No code change.

import { TILE, PLAYER_H } from '../config.js';
import { PALETTE } from './palette.js';
import { makeRng } from '../core/rng.js';
import { FOSSILS } from '../content/fossils.js';

// ---------------------------------------------------------------- THE ROVER
// Modelled on the real thing: black 3D-printed chassis with vent holes, chunky
// chain-link tank treads, messy yellow/red wires, and an OLED screen face with
// two glowing cyan eyes. The eyes carry the personality (opts.mood):
//   'idle' | 'sleepy' | 'drive' | 'laser' | 'find' | 'winch'
const CHASSIS = '#1E1B22';
const CHASSIS_LIT = '#332F3A';
const TREAD = '#15131A';
const TREAD_LINK = '#2B2733';
const SCREEN = '#0A1418';
const EYE = '#4BE3E8';
const EYE_GLOW = 'rgba(75,227,232,0.35)';
const WIRE_Y = '#E8B23A';
const WIRE_R = '#C4432E';

/**
 * Draw the rover. Hitbox is PLAYER_W×PLAYER_H; art hangs on it.
 * @param {{dangle?:number, mood?:string, blinkSeed?:number}} [opts]
 * Also exports the laser emitter offset via drawProbe.emitter (set per call).
 */
export function drawProbe(ctx, cx, topY, facing, time, swingT, swingAim, vx, walkT, opts = {}) {
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(topY));
  const dangling = typeof opts.dangle === 'number';
  if (dangling) ctx.rotate(opts.dangle + Math.sin(time * 6.5) * 0.14);
  ctx.scale(facing, 1);

  const mood = opts.mood || 'idle';
  const profile = !dangling && (mood === 'drive' || mood === 'laser');
  const moving = Math.abs(vx) > 10;
  const bob = dangling ? 0 : moving ? Math.abs(Math.sin(walkT * 18)) * 0.8 : Math.sin(time * 1.4) * 0.5;

  if (profile) drawSideProfile(ctx, mood, time, walkT, bob);
  else drawFrontView(ctx, mood, time, walkT, bob, dangling, moving, opts.blinkSeed || 0);

  ctx.restore();
  drawProbe.emitter = { x: cx + facing * 7, y: topY + PLAYER_H - 7 };
}

// ---- front view: the Wall-E "looking at you" pose --------------------------
function drawFrontView(ctx, mood, time, walkT, bob, dangling, moving, blinkSeed) {
  // treads: fat rounded band, links cycle
  const trY = PLAYER_H - 9 + (dangling ? -2 : 0);
  ctx.fillStyle = TREAD;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-8, trY, 16, 9, 4.5); ctx.fill(); }
  else ctx.fillRect(-8, trY, 16, 9);
  const roll = (walkT * 26) % 4;
  ctx.fillStyle = TREAD_LINK;
  for (let i = -1; i < 4; i++) {
    const lx = -7 + ((i * 4 + roll) % 16 + 16) % 16 - 1;
    ctx.fillRect(lx, trY + 0.5, 2.4, 2);
    ctx.fillRect(lx, trY + 6.5, 2.4, 2);
  }
  ctx.fillStyle = CHASSIS_LIT;
  ctx.beginPath(); ctx.arc(-5, trY + 4.5, 1.4, 0, 7); ctx.arc(5, trY + 4.5, 1.4, 0, 7); ctx.fill();

  // chassis + vents
  const chY = 6 + bob;
  ctx.fillStyle = CHASSIS;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-7, chY, 14, PLAYER_H - 13, 2.5); ctx.fill(); }
  else ctx.fillRect(-7, chY, 14, PLAYER_H - 13);
  ctx.fillStyle = '#0C0A10';
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 4; c++) ctx.fillRect(-5 + c * 3, chY + 8 + r * 3, 1.4, 1.4);

  // wires
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = WIRE_Y;
  ctx.beginPath();
  ctx.moveTo(-5, chY + 1);
  ctx.bezierCurveTo(-7, chY - 4 + Math.sin(time * 2) * 0.5, -1, chY - 5, 1, chY - 1);
  ctx.stroke();
  ctx.strokeStyle = WIRE_R;
  ctx.beginPath();
  ctx.moveTo(4, chY + 1);
  ctx.bezierCurveTo(6, chY - 3, 1, chY - 4 - Math.sin(time * 2.3) * 0.5, -1, chY - 1);
  ctx.stroke();

  // OLED face
  const scX = -6, scY = chY - 1, scW = 12, scH = 8.5;
  ctx.fillStyle = SCREEN;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(scX, scY, scW, scH, 1.5); ctx.fill(); }
  else ctx.fillRect(scX, scY, scW, scH);
  drawEyes(ctx, scX + scW / 2, scY + scH / 2, mood, time, moving, blinkSeed, 2);
}

// ---- side profile: the tank-tread Wall-E driving pose ----------------------
function drawSideProfile(ctx, mood, time, walkT, bob) {
  // long tread band with road wheels + idler
  const trY = PLAYER_H - 10;
  ctx.fillStyle = TREAD;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-10, trY, 20, 10, 5); ctx.fill(); }
  else ctx.fillRect(-10, trY, 20, 10);
  // scrolling links around the band
  const roll = (walkT * 30) % 5;
  ctx.fillStyle = TREAD_LINK;
  for (let i = -1; i < 5; i++) {
    const lx = -9 + ((i * 5 + roll) % 20 + 20) % 20 - 1;
    ctx.fillRect(lx, trY + 0.5, 3, 2);
    ctx.fillRect(lx, trY + 7.5, 3, 2);
  }
  // road wheels (rotate)
  const spin = walkT * 3.2;
  for (const wx of [-5.5, 0, 5.5]) {
    ctx.fillStyle = CHASSIS_LIT;
    ctx.beginPath(); ctx.arc(wx, trY + 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = TREAD;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(wx - Math.cos(spin) * 2.2, trY + 5 - Math.sin(spin) * 2.2);
    ctx.lineTo(wx + Math.cos(spin) * 2.2, trY + 5 + Math.sin(spin) * 2.2);
    ctx.stroke();
  }

  // chassis leaning slightly forward when driving
  const chY = 7 + bob;
  ctx.save();
  ctx.rotate(0.03);
  ctx.fillStyle = CHASSIS;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-8, chY, 16, PLAYER_H - 16, 2.5); ctx.fill(); }
  else ctx.fillRect(-8, chY, 16, PLAYER_H - 16);
  // vents on the back half
  ctx.fillStyle = '#0C0A10';
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 3; c++) ctx.fillRect(-6 + c * 3, chY + 6 + r * 3, 1.4, 1.4);
  // wires trailing off the back
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = WIRE_Y;
  ctx.beginPath();
  ctx.moveTo(-4, chY + 1);
  ctx.bezierCurveTo(-9, chY - 3 + Math.sin(time * 3) * 1, -11, chY + 2, -8, chY + 4);
  ctx.stroke();
  ctx.strokeStyle = WIRE_R;
  ctx.beginPath();
  ctx.moveTo(-2, chY + 1);
  ctx.bezierCurveTo(-7, chY - 4 - Math.sin(time * 2.6) * 1, -10, chY - 1, -9, chY + 2);
  ctx.stroke();

  // side eye panel at the front: a single forward-looking cyan eye strip
  const eX = 3, eY = chY + 1.5, eW = 6.5, eH = 6;
  ctx.fillStyle = SCREEN;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(eX - 1, eY - 1, eW + 2, eH + 2, 1.5); ctx.fill(); }
  else ctx.fillRect(eX - 1, eY - 1, eW + 2, eH + 2);
  drawEyes(ctx, eX + eW / 2, eY + eH / 2, mood, time, true, 0, 1);
  ctx.restore();
}

// the whole personality lives in ~40 lines of eye
function drawEyes(ctx, cx, cy, mood, time, moving, seed, eyeCount = 2) {
  const blink = Math.max(0, Math.sin(time * 0.9 + seed) - 0.985) * 66;   // brief periodic blink
  let w = 3.4, h = 3.4, dy = 0, dx = 0, lidTop = 0, arc = false, swirl = false;
  if (mood === 'sleepy') { lidTop = 0.6; dy = 0.8; }
  if (mood === 'drive') { dx = moving ? 1 : 0; }
  if (mood === 'laser') { h = 1.4; dy = 0.3; }
  if (mood === 'find') { arc = true; }
  if (mood === 'winch') { swirl = true; }
  const shut = Math.min(1, blink + lidTop);

  ctx.save();
  const eyeXs = eyeCount === 1 ? [cx + dx] : [cx - 3 + dx, cx + 3 + dx];
  // glow bloom
  ctx.fillStyle = EYE_GLOW;
  ctx.beginPath();
  for (const ex of eyeXs) ctx.arc(ex, cy + dy, 3.6, 0, 7);
  ctx.fill();
  ctx.fillStyle = EYE;
  for (const ex of eyeXs) {
    if (arc) {                                  // ^ ^ happy
      ctx.lineWidth = 1.3; ctx.strokeStyle = EYE;
      ctx.beginPath(); ctx.arc(ex, cy + 1.4 + dy, 2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else if (swirl) {                          // dizzy spiral
      ctx.lineWidth = 1; ctx.strokeStyle = EYE;
      ctx.beginPath();
      for (let a = 0; a < 4.5; a += 0.4) {
        const r = 0.5 + a * 0.42;
        const px = ex + Math.cos(a + time * 6) * r, py = cy + dy + Math.sin(a + time * 6) * r;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else {
      const eh = Math.max(0.5, h * (1 - shut));
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(ex - w / 2, cy + dy - eh / 2, w, eh, 1.2); ctx.fill(); }
      else ctx.fillRect(ex - w / 2, cy + dy - eh / 2, w, eh);
      // dark pupil dot (the ref eyes have one)
      if (eh > 2) { ctx.fillStyle = SCREEN; ctx.fillRect(ex - 0.7, cy + dy - 0.7, 1.4, 1.4); ctx.fillStyle = EYE; }
    }
  }
  // sleepy z's
  if (mood === 'sleepy') {
    ctx.fillStyle = EYE;
    const zt = (time * 0.6) % 1;
    ctx.globalAlpha = 1 - zt;
    ctx.font = 'bold 5px monospace';
    ctx.fillText('z', cx + 7, cy - 4 - zt * 6);
    ctx.globalAlpha = 1;
  }
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

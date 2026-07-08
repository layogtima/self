// Per-bone rendering. A found "spine" should look like a spine, not the whole
// animal. Each bone name maps to a canonical CATEGORY, and each category has a
// small procedural glyph (cream + shadow speckle, per-species hash variation).
// The whole-skeleton silhouette (render/sprites.js drawFossil) is reserved for
// COMPLETED contexts (dossier, vitrine, museum, journal-complete).

import { TILE } from '../config.js';
import { PALETTE } from './palette.js';
import { makeRng } from '../core/rng.js';

// keyword → canonical category
const RULES = [
  [/skull|cranium|head/, 'skull'],
  [/jaw|beak|fang|teeth/, 'jaw'],
  [/spine|vertebra|neck|back(?!.*plate)/, 'spine'],
  [/rib/, 'ribs'],
  [/pelvis|hip/, 'pelvis'],
  [/femur|leg|limb|flipper|arm|claw/, 'limb'],
  [/tail/, 'tail'],
  [/tusk/, 'tusks'],
  [/horn/, 'horns'],
  [/frill/, 'frill'],
  [/plate|sail/, 'plates'],
  [/wing/, 'wing'],
  [/carapace|segment|shell|coil/, 'shell'],
  [/frond|leaf/, 'frond'],
  [/amber/, 'amber'],
  [/layer|core|imprint|stromatolite/, 'slab'],
  [/device|bottle|shoe|sneaker|tyre|tire|phone|piece|amber|resin/, 'artifact'],
];

export function boneCategory(name) {
  const n = String(name).toLowerCase();
  for (const [re, cat] of RULES) if (re.test(n)) return cat;
  return 'limb';   // safe default: a long bone
}

// how big each category draws, in "bone units" (roughly tiles)
const CAT_SIZE = {
  skull: [2.0, 1.6], jaw: [1.8, 0.9], spine: [1.0, 2.4], ribs: [2.0, 1.8],
  pelvis: [1.8, 1.4], limb: [0.9, 2.4], tail: [2.6, 1.0], tusks: [2.2, 1.0],
  horns: [1.8, 1.4], frill: [2.0, 1.6], plates: [1.8, 1.6], wing: [2.4, 1.6],
  shell: [1.8, 1.8], frond: [1.4, 2.2], amber: [1.4, 1.4], slab: [2.0, 1.4], artifact: [1.4, 1.4],
};

const cache = {};

export function boneFootprint(name) {
  return CAT_SIZE[boneCategory(name)] || [1.4, 1.4];
}

/** draw a specific bone at (dx,dy) top-left, scaled */
export function drawBone(ctx, spec, boneName, dx, dy, makeCanvas, scale = 1) {
  const cv = bake(spec, boneName, makeCanvas);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, dx, dy, cv.width * scale, cv.height * scale);
}

function bake(spec, boneName, makeCanvas) {
  const key = `${spec.id}:${boneName}`;
  if (cache[key]) return cache[key];
  const cat = boneCategory(boneName);
  const [uw, uh] = CAT_SIZE[cat] || [1.4, 1.4];
  const w = Math.round(uw * TILE), h = Math.round(uh * TILE);
  const cv = makeCanvas(w, h);
  const ctx = cv.getContext('2d');
  const rng = makeRng(hashStr(key));
  ctx.fillStyle = PALETTE.bone;
  ctx.strokeStyle = PALETTE.bone;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const cx = w / 2, cy = h / 2;

  const drawers = {
    skull() {
      ctx.beginPath(); ctx.ellipse(cx, cy - h * 0.08, w * 0.32, h * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      // snout
      ctx.fillRect(cx + w * 0.1, cy - h * 0.05, w * 0.28, h * 0.22);
      // eye socket + nostril (shadow)
      ctx.fillStyle = PALETTE.dark;
      ctx.beginPath(); ctx.arc(cx - w * 0.02, cy - h * 0.06, w * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(cx + w * 0.3, cy - h * 0.02, w * 0.05, h * 0.05);
      // teeth
      ctx.fillStyle = PALETTE.bone;
      for (let i = 0; i < 4; i++) ctx.fillRect(cx + w * 0.12 + i * w * 0.06, cy + h * 0.14, 2, 3);
    },
    jaw() {
      ctx.lineWidth = h * 0.16;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.36, cy - h * 0.1);
      ctx.quadraticCurveTo(cx - w * 0.1, cy + h * 0.28, cx + w * 0.36, cy + h * 0.05);
      ctx.stroke();
      ctx.fillStyle = PALETTE.bone;
      for (let i = 0; i < 5; i++) { const t = i / 5; ctx.fillRect(cx - w * 0.3 + t * w * 0.6, cy + h * 0.05 + Math.sin(t * 3) * h * 0.06, 2, 4); }
    },
    spine() {
      // stacked vertebrae down the middle
      const n = 5;
      for (let i = 0; i < n; i++) {
        const yy = h * 0.12 + (i / (n - 1)) * h * 0.72;
        ctx.beginPath(); ctx.ellipse(cx, yy, w * 0.22, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();
        // process spike
        ctx.fillRect(cx - 1, yy - h * 0.06, 2, h * 0.05);
      }
    },
    ribs() {
      ctx.lineWidth = 2.4;
      // central column
      ctx.fillRect(cx - 1.5, h * 0.12, 3, h * 0.76);
      for (let i = 0; i < 4; i++) {
        const yy = h * 0.2 + i * h * 0.18;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(cx, yy);
          ctx.quadraticCurveTo(cx + s * w * 0.32, yy + h * 0.06, cx + s * w * 0.28, yy + h * 0.2);
          ctx.stroke();
        }
      }
    },
    pelvis() {
      ctx.lineWidth = h * 0.14;
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.28, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.28, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx - w * 0.22, cy, w * 0.08, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + w * 0.22, cy, w * 0.08, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    },
    limb() {   // long bone with knuckle ends
      ctx.lineWidth = w * 0.26;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.05, h * 0.16); ctx.lineTo(cx + w * 0.05, h * 0.84);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - w * 0.05, h * 0.16, w * 0.2, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.05, h * 0.84, w * 0.2, 0, Math.PI * 2); ctx.fill();
    },
    tail() {   // tapering chain of vertebrae
      const n = 6;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const xx = w * 0.14 + t * w * 0.72;
        ctx.beginPath(); ctx.ellipse(xx, cy + Math.sin(t * 3) * h * 0.12, w * 0.06 * (1 - t * 0.6) + 2, h * 0.14 * (1 - t * 0.6) + 2, 0, 0, Math.PI * 2); ctx.fill();
      }
    },
    tusks() {
      ctx.lineWidth = h * 0.16;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * w * 0.05, h * 0.2);
        ctx.quadraticCurveTo(cx + s * w * 0.4, cy, cx + s * w * 0.2, h * 0.82);
        ctx.stroke();
      }
    },
    horns() {
      ctx.beginPath(); ctx.ellipse(cx, cy + h * 0.2, w * 0.2, h * 0.16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = h * 0.1;
      for (const [s, up] of [[-1, 0.7], [1, 0.7], [0, 0.9]]) {
        ctx.beginPath(); ctx.moveTo(cx + s * w * 0.15, cy + h * 0.1);
        ctx.lineTo(cx + s * w * 0.22, cy - h * up * 0.5); ctx.stroke();
      }
    },
    frill() {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.34, cy + h * 0.24);
      for (let i = 0; i <= 6; i++) { const t = i / 6; ctx.lineTo(cx - w * 0.34 + t * w * 0.68, cy - h * 0.26 + Math.sin(t * Math.PI) * -h * 0.06 + (i % 2) * 3); }
      ctx.lineTo(cx + w * 0.24, cy + h * 0.24); ctx.closePath(); ctx.fill();
    },
    plates() {
      for (let i = 0; i < 3; i++) {
        const xx = w * 0.24 + i * w * 0.26;
        ctx.beginPath(); ctx.moveTo(xx, cy + h * 0.24); ctx.lineTo(xx - w * 0.08, cy - h * 0.24); ctx.lineTo(xx + w * 0.08, cy - h * 0.24); ctx.closePath(); ctx.fill();
      }
    },
    wing() {
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx - w * 0.36, cy); ctx.lineTo(cx + w * 0.36, cy - h * 0.2); ctx.stroke();
      for (let i = 0; i < 5; i++) { const t = i / 4; const bx = cx - w * 0.36 + t * w * 0.72; ctx.beginPath(); ctx.moveTo(bx, cy - t * h * 0.2); ctx.lineTo(bx + w * 0.04, cy + h * 0.28); ctx.stroke(); }
    },
    shell() {   // coiled/segmented
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let a = 0; a < 6.2; a += 0.25) { const r = 2 + a * (Math.min(w, h) * 0.05); const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      ctx.stroke();
    },
    frond() {
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, h * 0.9); ctx.lineTo(cx, h * 0.1); ctx.stroke();
      for (let i = 0; i < 6; i++) { const yy = h * 0.2 + i * h * 0.12; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, yy); ctx.lineTo(cx + s * w * 0.3, yy - h * 0.05); ctx.stroke(); } }
    },
    amber() {
      ctx.fillStyle = '#E0A24A';
      ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.3, h * 0.34, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.dark;
      ctx.beginPath(); ctx.arc(cx, cy, 2.4, 0, Math.PI * 2); ctx.fill();
    },
    slab() {
      ctx.fillRect(w * 0.16, h * 0.24, w * 0.68, h * 0.52);
      ctx.fillStyle = PALETTE.boneShadow;
      for (let i = 0; i < 4; i++) ctx.fillRect(w * 0.2, h * 0.3 + i * h * 0.12, w * 0.6, 1.5);
    },
    artifact() {
      ctx.fillStyle = '#8E96A4';
      ctx.fillRect(w * 0.28, h * 0.22, w * 0.44, h * 0.56);
      ctx.fillStyle = PALETTE.dark;
      ctx.fillRect(w * 0.34, h * 0.3, w * 0.32, h * 0.4);
    },
  };
  (drawers[cat] || drawers.limb)();

  // fossilised speckle
  ctx.fillStyle = PALETTE.boneShadow;
  for (let i = 0; i < uw * uh * 3; i++) ctx.fillRect((rng.hash2(i, 1) * w) | 0, (rng.hash2(i, 2) * h) | 0, 1, 1);

  cache[key] = cv;
  return cv;
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

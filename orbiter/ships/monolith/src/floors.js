import * as THREE from 'three';
import { makeRng } from './rng.js';

// The obscure starmap floor: the OG painted-park-promenade idea, re-themed.
// Deep indigo slate; the paths ARE constellation lines. Dashed orbital arcs,
// a great ecliptic ring, glyph circles. The same canvas doubles as an
// emissive map so the chart glows faintly in the dark.

const cache = new Map();

export function starmapMaterial(seed = 7, { size = 1024 } = {}) {
  if (cache.has(seed)) return cache.get(seed);
  const rng = makeRng(seed * 977 + 13);
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const C = size / 2;

  // slate base with subtle vignette
  const bg = ctx.createRadialGradient(C, C, size * 0.1, C, C, size * 0.62);
  bg.addColorStop(0, '#232a3a');
  bg.addColorStop(1, '#161b28');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // faint star dust
  for (let i = 0; i < 700; i++) {
    const a = rng.next() * 0.5 + 0.08;
    ctx.fillStyle = `rgba(200,215,235,${a * 0.35})`;
    ctx.fillRect(rng.next() * size, rng.next() * size, 1.6, 1.6);
  }

  // the great ecliptic ring + inner orbit arcs (dashed)
  ctx.strokeStyle = 'rgba(216,185,135,0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 12]);
  ctx.beginPath(); ctx.arc(C, C, size * 0.4, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 4; i++) {
    const r = size * rng.range(0.12, 0.34);
    const a0 = rng.next() * Math.PI * 2;
    ctx.setLineDash([6 + i * 4, 10]);
    ctx.strokeStyle = `rgba(140,200,210,${rng.range(0.35, 0.6)})`;
    ctx.beginPath(); ctx.arc(C, C, r, a0, a0 + rng.range(1.5, 4.5)); ctx.stroke();
  }
  ctx.setLineDash([]);

  // constellations: clustered walks of bright nodes joined by fine lines
  for (let k = 0; k < 9; k++) {
    let px = rng.range(0.15, 0.85) * size;
    let py = rng.range(0.15, 0.85) * size;
    const n = rng.int(4, 8);
    const hue = rng.chance(0.6) ? '190,225,235' : '235,205,150';
    ctx.strokeStyle = `rgba(${hue},0.55)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(px, py);
    const nodes = [[px, py]];
    for (let i = 1; i < n; i++) {
      px = THREE.MathUtils.clamp(px + rng.range(-90, 90), 30, size - 30);
      py = THREE.MathUtils.clamp(py + rng.range(-90, 90), 30, size - 30);
      ctx.lineTo(px, py);
      nodes.push([px, py]);
    }
    ctx.stroke();
    for (const [nx, ny] of nodes) {
      const r = rng.range(2, 4.5);
      const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 2.4);
      g.addColorStop(0, `rgba(${hue},0.95)`);
      g.addColorStop(1, `rgba(${hue},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(nx, ny, r * 2.4, 0, Math.PI * 2); ctx.fill();
    }
  }

  // glyph circles: tiny annotated rings, like a chart nobody alive can read
  for (let i = 0; i < 7; i++) {
    const gx = rng.range(0.12, 0.88) * size;
    const gy = rng.range(0.12, 0.88) * size;
    const gr = rng.range(9, 22);
    ctx.strokeStyle = 'rgba(156,196,168,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(gx, gy, gr * 0.45, rng.next() * 3, rng.next() * 3 + 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx + gr, gy);
    ctx.lineTo(gx + gr + rng.range(6, 16), gy - rng.range(4, 12));
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.22,
    roughness: 0.75,
    metalness: 0.08,
  });
  cache.set(seed, mat);
  return mat;
}

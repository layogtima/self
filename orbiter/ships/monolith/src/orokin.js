import * as THREE from 'three';
import { PALETTE } from './config.js';

// Orokin v2 — mushroom-organic. Every form is a surface of revolution grown
// from fungal anatomy: cap domes, gill ribs, stem columns, spore lamps, and
// the ring portals that started it all. No boxes, no gold, no corpo.

export const MATS = {
  porcelain: new THREE.MeshStandardMaterial({ color: PALETTE.porcelain, roughness: 0.55, metalness: 0.08 }),
  porcelainDark: new THREE.MeshStandardMaterial({ color: PALETTE.porcelainDark, roughness: 0.6, metalness: 0.1 }),
  celadon: new THREE.MeshStandardMaterial({ color: PALETTE.celadon, roughness: 0.5, metalness: 0.15 }),
  verdigris: new THREE.MeshStandardMaterial({ color: PALETTE.verdigris, roughness: 0.45, metalness: 0.25 }),
  brutal: new THREE.MeshStandardMaterial({ color: PALETTE.brutal, roughness: 0.92, metalness: 0.05 }),
  brutalDark: new THREE.MeshStandardMaterial({ color: PALETTE.brutalDark, roughness: 0.95, metalness: 0.05 }),
  glowWarm: (() => { const m = new THREE.MeshBasicMaterial({}); m.color.setRGB(...PALETTE.glowWarm); return m; })(),
  glowCyan: (() => { const m = new THREE.MeshBasicMaterial({}); m.color.setRGB(...PALETTE.glowCyan); return m; })(),
};

// ── the great ring portal (the Wondergate + every doorway) ──────────────────
export function lathePortal(r = 20) {
  const group = new THREE.Group();
  const pts = [];
  const steps = [
    [r * 0.78, -r * 0.10], [r * 0.82, -r * 0.16], [r * 0.94, -r * 0.16],
    [r * 1.00, -r * 0.08], [r * 1.06, -r * 0.10], [r * 1.10, 0],
    [r * 1.06, r * 0.10], [r * 1.00, r * 0.08], [r * 0.94, r * 0.16],
    [r * 0.82, r * 0.16], [r * 0.78, r * 0.10],
  ];
  for (const [x, y] of steps) pts.push(new THREE.Vector2(x, y));
  const ring = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), MATS.porcelain);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  group.add(ring);
  const glow = new THREE.Mesh(new THREE.TorusGeometry(r * 0.76, r * 0.02, 8, 48), MATS.glowCyan);
  group.add(glow);
  for (const s of [-1, 1]) {
    const trim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.97, r * 0.014, 6, 48), MATS.verdigris);
    trim.position.z = s * r * 0.13;
    group.add(trim);
  }
  return group;
}

// ── mushroom cap dome: convex bulge, flared lip, oculus hole at the top ─────
const capCache = new Map();
export function capDomeGeometry(R, oculusR, H) {
  const key = `${R}-${oculusR}-${H}`;
  if (capCache.has(key)) return capCache.get(key);
  const pts = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // radius runs lip → oculus; height follows a cap curve with a flared lip
    const r = R * (1 - t) + oculusR * t;
    const lip = t < 0.12 ? -Math.sin((0.12 - t) / 0.12 * Math.PI * 0.5) * H * 0.12 : 0;
    const y = Math.pow(Math.sin(t * Math.PI * 0.5), 0.8) * H + lip;
    pts.push(new THREE.Vector2(Math.max(r, 0.01), y));
  }
  const geo = new THREE.LatheGeometry(pts, 32);
  capCache.set(key, geo);
  return geo;
}

// ── gill ribs: thin radial blades under the cap rim ─────────────────────────
export function gillRibGeometry(R, H) {
  // a slender vertical blade curving inward, instanced radially
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(R * 0.24, 0);
  shape.quadraticCurveTo(R * 0.10, H * 0.55, 0, H * 0.9);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: false });
  geo.translate(-R * 0.995, 0, -0.35); // hang from the rim, pointing inward
  return geo;
}

// ── stem column: bulged base, narrow waist, cap-flared crown ────────────────
let columnGeo = null;
export function stemColumnGeometry() {
  if (columnGeo) return columnGeo;
  const pts = [];
  const profile = [
    [0.98, 0.00], [0.92, 0.03], [0.62, 0.08], [0.44, 0.18], [0.34, 0.34],
    [0.30, 0.52], [0.33, 0.70], [0.42, 0.82], [0.66, 0.90], [1.02, 0.95],
    [0.94, 0.985], [0.55, 1.0],
  ];
  for (const [x, y] of profile) pts.push(new THREE.Vector2(x, y));
  columnGeo = new THREE.LatheGeometry(pts, 14);
  return columnGeo;
}

// ── hanging spore lamp: lathe teardrop, emissive ────────────────────────────
let seedGeo = null;
export function seedLampGeometry() {
  if (seedGeo) return seedGeo;
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const rr = Math.sin(t * Math.PI) * (1 - t * 0.35);
    pts.push(new THREE.Vector2(Math.max(rr, 0.001), t * 2.2));
  }
  seedGeo = new THREE.LatheGeometry(pts, 10);
  return seedGeo;
}

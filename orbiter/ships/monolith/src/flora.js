import * as THREE from 'three';
import { makeRng } from './rng.js';

// Lattice life. No trees — the building itself is colonised: vine runners
// tracing structural edges with instanced leaf pairs, and faint mycelium
// filament decals creeping up from wall bases.

const vineMat = new THREE.MeshStandardMaterial({ color: 0x4e7a44, roughness: 0.85 });
const leafMats = [
  new THREE.MeshStandardMaterial({ color: 0x5f9e54, roughness: 0.8, side: THREE.DoubleSide, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x7ab86a, roughness: 0.8, side: THREE.DoubleSide, flatShading: true }),
];

// flattened diamond leaf
let leafGeo = null;
function getLeafGeo() {
  if (leafGeo) return leafGeo;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.5, 0.5, 0, 1.4);
  shape.quadraticCurveTo(-0.5, 0.5, 0, 0);
  leafGeo = new THREE.ShapeGeometry(shape, 4);
  return leafGeo;
}

// mycelium filament texture (branching web, faint teal)
let myceliumTex = null;
function getMyceliumTex() {
  if (myceliumTex) return myceliumTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const ctx = cv.getContext('2d');
  const rng = makeRng(4321);
  ctx.strokeStyle = 'rgba(150,235,220,0.5)';
  function branch(x, y, ang, len, w, depth) {
    if (depth <= 0 || len < 6) return;
    const nx = x + Math.cos(ang) * len;
    const ny = y + Math.sin(ang) * len;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
    const n = rng.int(1, 3);
    for (let i = 0; i < n; i++) {
      branch(nx, ny, ang + rng.range(-0.9, 0.9), len * rng.range(0.55, 0.8), w * 0.7, depth - 1);
    }
  }
  for (let i = 0; i < 7; i++) {
    branch(rng.range(60, 452), 512, -Math.PI / 2 + rng.range(-0.5, 0.5), rng.range(50, 110), 3, 6);
  }
  myceliumTex = new THREE.CanvasTexture(cv);
  return myceliumTex;
}

// a vine runner along a curve, with leaves — returns a group
export function vineAlongCurve(curve, { leaves = 18, radius = 0.14, seed = 1 } = {}) {
  const rng = makeRng(seed * 31 + 7);
  const group = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 5, false), vineMat);
  group.add(tube);
  const inst0 = new THREE.InstancedMesh(getLeafGeo(), leafMats[0], Math.ceil(leaves / 2));
  const inst1 = new THREE.InstancedMesh(getLeafGeo(), leafMats[1], Math.floor(leaves / 2));
  const dummy = new THREE.Object3D();
  let c0 = 0, c1 = 0;
  for (let i = 0; i < leaves; i++) {
    const t = (i + 0.5) / leaves;
    const p = curve.getPointAt(t);
    dummy.position.copy(p);
    dummy.rotation.set(rng.next() * Math.PI, rng.next() * Math.PI * 2, rng.next() * Math.PI);
    dummy.scale.setScalar(rng.range(0.5, 1.15));
    dummy.updateMatrix();
    if (i % 2 === 0) inst0.setMatrixAt(c0++, dummy.matrix);
    else inst1.setMatrixAt(c1++, dummy.matrix);
  }
  group.add(inst0, inst1);
  return group;
}

// a drooping cascade from a high anchor point
export function vineCascade(anchor, { drop = 12, sway = 5, seed = 1 } = {}) {
  const rng = makeRng(seed * 53 + 3);
  const group = new THREE.Group();
  const n = rng.int(2, 4);
  for (let k = 0; k < n; k++) {
    const dir = rng.next() * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3([
      anchor.clone(),
      anchor.clone().add(new THREE.Vector3(Math.cos(dir) * sway * 0.4, -drop * 0.3, Math.sin(dir) * sway * 0.4)),
      anchor.clone().add(new THREE.Vector3(Math.cos(dir) * sway, -drop * 0.7, Math.sin(dir) * sway)),
      anchor.clone().add(new THREE.Vector3(Math.cos(dir) * sway * 1.3, -drop, Math.sin(dir) * sway * 1.3)),
    ]);
    group.add(vineAlongCurve(curve, { leaves: 14, seed: seed * 10 + k }));
  }
  return group;
}

// an arc of vine over a ring doorway
export function vineOverDoor(center, yaw, r = 12, seed = 1) {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * 0.15 + (i / 8) * Math.PI * 0.7;
    pts.push(new THREE.Vector3(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15 + r * 0.55, 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const group = vineAlongCurve(curve, { leaves: 12, seed });
  group.position.copy(center);
  group.rotation.y = yaw;
  return group;
}

// mycelium decal creeping up a wall — position against the wall base
export function myceliumDecal(w = 16, h = 12) {
  const mat = new THREE.MeshBasicMaterial({
    map: getMyceliumTex(), transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.renderOrder = 30;
  return m;
}

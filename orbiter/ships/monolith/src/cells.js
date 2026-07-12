import * as THREE from 'three';
import gsap from 'gsap';
import { A, OCT_EDGE, OCT_IN, RING_DOOR, RING_DOOR_S, CHAMBER, HALL, ATRIUM } from './config.js';
import { makeGlassMaterial } from './glass.js';
import { octPoints } from './regions.js';
import { MATS, lathePortal, capDomeGeometry, gillRibGeometry, seedLampGeometry } from './orokin.js';
import { starmapMaterial } from './floors.js';
import { vineCascade, myceliumDecal } from './flora.js';
import { makeRng } from './rng.js';

// The piece kit. Every walkable piece (Atrium, grown chambers, grown halls,
// hull bays) is a `piece` with per-edge REPLACEABLE walls, so the growth
// engine can cut sunk ring doorways through any boundary at runtime.
//
// dir convention: 0=+x  1=+z  2=−x  3=−z ; opposite(d) = (d+2)%4

export const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
export const slotCenter = (col, row) => ({ x: col * A, z: row * A });

const sharedGlass = makeGlassMaterial();
export const glassMat = sharedGlass;

// ── wall builders (each returns a Group centred at wall midpoint, yawed) ────
function wallMatrix(group, mx, mz, dirIdx) {
  const [nx, nz] = DIRS[dirIdx];
  group.position.set(mx, 0, mz);
  group.rotation.y = Math.atan2(nx, nz);
  return group;
}

function ringDoorHole(door) {
  const { r, cy } = door;
  const x0 = Math.sqrt(r * r - cy * cy);
  const a0 = Math.atan2(-cy, x0);
  const hole = new THREE.Path();
  hole.moveTo(x0, 0);
  hole.absarc(0, cy, r, a0, Math.PI - a0, false);
  hole.lineTo(x0, 0);
  return hole;
}

function capsuleHole(w, h, cx, cy) {
  const r = Math.min(w, h) / 2;
  const hole = new THREE.Path();
  hole.moveTo(cx - w / 2 + r, cy - h / 2);
  hole.lineTo(cx + w / 2 - r, cy - h / 2);
  hole.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false);
  hole.lineTo(cx - w / 2 + r, cy + h / 2);
  hole.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false);
  return hole;
}

function wallShape(len, H) {
  const s = new THREE.Shape();
  s.moveTo(-len / 2, 0);
  s.lineTo(len / 2, 0);
  s.lineTo(len / 2, H);
  s.lineTo(-len / 2, H);
  s.closePath();
  return s;
}

function extrude(shape, mat, depth = RING_DOOR.wallT) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function solidWall(len, H, mat = MATS.porcelain) {
  const group = new THREE.Group();
  group.add(extrude(wallShape(len, H), mat));
  return group;
}

export function ringDoorWall(len, H, door = RING_DOOR, mat = MATS.porcelain) {
  const group = new THREE.Group();
  const shape = wallShape(len, H);
  shape.holes.push(ringDoorHole(door));
  group.add(extrude(shape, mat));
  const ring = lathePortal(door.r);
  ring.position.y = door.cy;
  ring.scale.set(1, 1, 0.5);
  group.add(ring);
  return group;
}

export function capsuleWall(len, H, mat = MATS.porcelain) {
  const group = new THREE.Group();
  const w = len - 16, h = H - 12, cy = H / 2 + 1;
  const shape = wallShape(len, H);
  shape.holes.push(capsuleHole(w, h, 0, cy));
  group.add(extrude(shape, mat));
  const rimShape = new THREE.Shape();
  rimShape.curves = capsuleHole(w + 6, h + 6, 0, cy).curves;
  rimShape.autoClose = true;
  rimShape.holes.push(capsuleHole(w, h, 0, cy));
  const rim = extrude(rimShape, MATS.verdigris, RING_DOOR.wallT + 3);
  group.add(rim);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sharedGlass);
  pane.position.y = cy;
  pane.renderOrder = 50;
  group.add(pane);
  return group;
}

// ── the octagon piece ───────────────────────────────────────────────────────
export function makeOctagonPiece(scene, { col, row, spec = CHAMBER, kind = 'chamber', floorSeed = 7 }) {
  const { x, z } = slotCenter(col, row);
  const { R, h, oculusR } = spec;
  const rng = makeRng(col * 37 + row * 101 + 5);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const edgeWalls = new Map(); // key: 0..7 (0,2,4,6 = cardinal dirs 0..3 doubled)

  // 8 walls: k = octagon edge index, normal at k·45°
  for (let k = 0; k < 8; k++) {
    const na = (k * Math.PI) / 4;
    const nx = Math.cos(na), nz = Math.sin(na);
    const mx = nx * OCT_IN, mz = nz * OCT_IN;
    const isCardinal = k % 2 === 0;
    const wall = isCardinal
      ? capsuleWall(OCT_EDGE, Math.min(h, 42))
      : (k % 4 === 1 ? capsuleWall(OCT_EDGE, Math.min(h, 42)) : solidWall(OCT_EDGE, h));
    // cardinal walls shorter than full height get a header band above
    const holder = new THREE.Group();
    holder.add(wall);
    if (isCardinal && h > 42) {
      const header = solidWall(OCT_EDGE, h - 42);
      header.position.y = 42;
      holder.add(header);
    } else if (!isCardinal && k % 4 === 1 && h > 42) {
      const header = solidWall(OCT_EDGE, h - 42);
      header.position.y = 42;
      holder.add(header);
    }
    holder.position.set(mx, 0, mz);
    holder.rotation.y = Math.atan2(nx, nz);
    group.add(holder);
    edgeWalls.set(k, holder);
  }

  // floor
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(R + 2, R + 4, 8, 8, 1, false, Math.PI / 2 - Math.PI / 8), MATS.porcelainDark);
  slab.position.y = -4;
  slab.receiveShadow = true;
  group.add(slab);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R - 1.5, 8, Math.PI / 2 - Math.PI / 8), starmapMaterial(floorSeed));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.06;
  floor.receiveShadow = true;
  group.add(floor);

  // mushroom cap dome + gills + oculus
  const capH = h * 0.42;
  const cap = new THREE.Mesh(capDomeGeometry(R * 0.99, oculusR, capH), new THREE.MeshStandardMaterial({
    color: 0xeae4d8, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide, emissive: 0x14120e, emissiveIntensity: 1,
  }));
  cap.position.y = h;
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);
  const gills = new THREE.InstancedMesh(gillRibGeometry(R, capH * 0.8), MATS.celadon, 16);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 16; i++) {
    dummy.position.set(0, h - 1, 0);
    dummy.rotation.set(0, (i / 16) * Math.PI * 2, 0);
    dummy.updateMatrix();
    gills.setMatrixAt(i, dummy.matrix);
  }
  group.add(gills);
  const drumH = 7;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(oculusR, oculusR, drumH, 20, 1, true), sharedGlass);
  drum.position.y = h + capH + drumH / 2 - 1;
  drum.renderOrder = 50;
  group.add(drum);
  const capGlass = new THREE.Mesh(new THREE.CircleGeometry(oculusR, 20), sharedGlass);
  capGlass.rotation.x = -Math.PI / 2;
  capGlass.position.y = h + capH + drumH - 1;
  capGlass.renderOrder = 50;
  group.add(capGlass);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(oculusR + 1.2, 1.2, 8, 32), MATS.verdigris);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h + capH;
  group.add(rim);

  // spore lamps + vines + mycelium
  const lampCount = kind === 'atrium' ? 0 : 4; // atrium dresses itself
  if (lampCount) {
    const lamps = new THREE.InstancedMesh(seedLampGeometry(), MATS.glowWarm, lampCount);
    for (let i = 0; i < lampCount; i++) {
      const a = rng.next() * Math.PI * 2;
      const r = rng.range(14, R * 0.6);
      dummy.position.set(Math.cos(a) * r, rng.range(h * 0.4, h * 0.85), Math.sin(a) * r);
      dummy.scale.setScalar(rng.range(0.9, 1.7));
      dummy.rotation.set(Math.PI, 0, 0);
      dummy.updateMatrix();
      lamps.setMatrixAt(i, dummy.matrix);
    }
    group.add(lamps);
    const key = new THREE.PointLight(0xffdfb0, 520, 170, 1.6);
    key.position.set(0, h - 6, 0);
    group.add(key);
  }
  for (let i = 0; i < 2; i++) {
    const a = rng.next() * Math.PI * 2;
    group.add(vineCascade(new THREE.Vector3(Math.cos(a) * R * 0.8, h - 4, Math.sin(a) * R * 0.8), { drop: h * 0.5, sway: 6, seed: col * 7 + row * 13 + i }));
  }
  const myc = myceliumDecal(18, 12);
  const ma = Math.PI / 4 + rng.int(0, 3) * (Math.PI / 2);
  myc.position.set(Math.cos(ma) * (OCT_IN - 2.6), 6, Math.sin(ma) * (OCT_IN - 2.6));
  myc.rotation.y = Math.atan2(Math.cos(ma), Math.sin(ma)) + Math.PI;
  group.add(myc);

  return {
    kind, col, row, x, z, group, edgeWalls, spec,
    walkPoly: octPoints(x, z, R, 4),
    // replace the wall on cardinal dir d (0..3) — octagon edge k = d*2
    replaceEdge(d, builder) {
      const k = d * 2;
      const old = edgeWalls.get(k);
      const na = (k * Math.PI) / 4;
      if (old) { group.remove(old); }
      if (!builder) { edgeWalls.set(k, null); return; }
      const holder = new THREE.Group();
      holder.add(builder());
      holder.position.set(Math.cos(na) * OCT_IN, 0, Math.sin(na) * OCT_IN);
      holder.rotation.y = Math.atan2(Math.cos(na), Math.sin(na));
      group.add(holder);
      edgeWalls.set(k, holder);
    },
  };
}

// ── the hall piece: slot-spanning corridor ──────────────────────────────────
export function makeHallPiece(scene, { col, row, orient = 'x', floorSeed = 3 }) {
  const { x, z } = slotCenter(col, row);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = orient === 'x' ? 0 : Math.PI / 2;
  scene.add(group);
  const { halfW, h } = HALL;
  const L = A;

  // floor strip + slab
  const slab = new THREE.Mesh(new THREE.BoxGeometry(L, 8, halfW * 2 + 6), MATS.porcelainDark);
  slab.position.y = -4;
  group.add(slab);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, halfW * 2), starmapMaterial(floorSeed));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.06;
  floor.receiveShadow = true;
  group.add(floor);
  // roof + skylight strip
  const roof = new THREE.Mesh(new THREE.BoxGeometry(L, 2, halfW * 2 + 4), MATS.porcelain);
  roof.position.y = h + 1;
  roof.castShadow = true;
  group.add(roof);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(L - 20, 4), sharedGlass);
  sky.rotation.x = Math.PI / 2;
  sky.position.y = h + 2.2;
  sky.renderOrder = 50;
  group.add(sky);
  const guide = new THREE.Mesh(new THREE.BoxGeometry(L - 8, 0.4, 1.6), MATS.glowCyan);
  guide.position.y = h - 0.4;
  group.add(guide);

  // side walls: slit capsule windows
  const edgeWalls = new Map();
  for (const s of [-1, 1]) {
    const wall = new THREE.Group();
    const shape = wallShape(L, h);
    for (let i = 0; i < 4; i++) {
      shape.holes.push(capsuleHole(18, 7, -L / 2 + 26 + i * 32, h / 2 + 1));
    }
    wall.add(extrude(shape, MATS.porcelain));
    for (let i = 0; i < 4; i++) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(18, 7), sharedGlass);
      pane.position.set(-L / 2 + 26 + i * 32, h / 2 + 1, 0);
      pane.renderOrder = 50;
      wall.add(pane);
    }
    wall.position.set(0, 0, s * halfW);
    wall.rotation.y = s > 0 ? 0 : Math.PI;
    group.add(wall);
    edgeWalls.set(s > 0 ? 'side+' : 'side-', wall);
  }
  // end walls: solid, replaceable with small ring doors
  for (const e of [-1, 1]) {
    const wall = solidWall(halfW * 2, h);
    wall.position.set(e * L / 2, 0, 0);
    wall.rotation.y = e > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(wall);
    edgeWalls.set(e > 0 ? 'end+' : 'end-', wall);
  }

  const hw = orient === 'x' ? { x: L / 2, z: halfW } : { x: halfW, z: L / 2 };
  const piece = {
    kind: 'hall', col, row, x, z, orient, group, edgeWalls, spec: HALL,
    walkPoly: [
      [x - hw.x + 2, z - hw.z + 1.5], [x + hw.x - 2, z - hw.z + 1.5],
      [x + hw.x - 2, z + hw.z - 1.5], [x - hw.x + 2, z + hw.z - 1.5],
    ],
    // d: cardinal dir 0..3 in WORLD space
    replaceEdge(d, builder) {
      const [dx, dz] = DIRS[d];
      const along = (orient === 'x' && dz === 0) || (orient === 'z' && dx === 0);
      const key = along
        ? ((orient === 'x' ? dx : dz) > 0 ? 'end+' : 'end-')
        : ((orient === 'x' ? dz : dx) > 0 ? 'side+' : 'side-');
      const old = edgeWalls.get(key);
      if (old) group.remove(old);
      if (!builder) { edgeWalls.set(key, null); return; }
      const wall = new THREE.Group();
      wall.add(builder());
      if (key.startsWith('end')) {
        wall.position.set((key === 'end+' ? 1 : -1) * L / 2, 0, 0);
        wall.rotation.y = key === 'end+' ? Math.PI / 2 : -Math.PI / 2;
      } else {
        wall.position.set(0, 0, key === 'side+' ? halfW : -halfW);
        wall.rotation.y = key === 'side+' ? 0 : Math.PI;
      }
      group.add(wall);
      edgeWalls.set(key, wall);
    },
  };
  return piece;
}

// intro animation for grown pieces
export function riseIn(piece) {
  piece.group.position.y = -26;
  piece.group.scale.set(0.9, 0.9, 0.9);
  gsap.to(piece.group.position, { y: 0, duration: 1.1, ease: 'power3.out' });
  gsap.to(piece.group.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'elastic.out(1, 0.6)' });
}

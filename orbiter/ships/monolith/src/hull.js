import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRng } from './rng.js';
import { A, FIELD, BAY_SLOTS, HALL } from './config.js';
import { MATS, } from './orokin.js';
import { glassMat, slotCenter, solidWall, DIRS } from './cells.js';
import { starmapMaterial } from './floors.js';

// The MONOLITH: a brutalist hull grown from seeded Voronoi cells. Massing
// prisms taper toward bow and stern; the growth field is a recessed deck at
// the centre; glowing seams trace every Voronoi edge (the Homeworld lights).
// Four observation bays are embedded at the field's ends — sealed, dark,
// waiting for the station to grow to them.

const RX = 780, RZ = 430;                    // footprint radii (superellipse)
const FIELD_X = (FIELD.cols + 0.55) * A;     // recessed growth field extent
const FIELD_Z = (FIELD.rows + 0.55) * A;
const DECK_Y = -2;

function inFootprint(x, z) {
  return Math.pow(Math.abs(x) / RX, 3) + Math.pow(Math.abs(z) / RZ, 3) <= 1;
}
function inField(x, z, m = 0) {
  return Math.abs(x) < FIELD_X + m && Math.abs(z) < FIELD_Z + m;
}

export function createHull(scene) {
  const rng = makeRng(4242);
  const group = new THREE.Group();
  scene.add(group);

  // ── seeds: jittered grid, mirrored across z, footprint only ──
  const seeds = [];
  for (let gx = -RX + 60; gx <= RX - 60; gx += 130) {
    for (let gz = 40; gz <= RZ - 40; gz += 120) {
      const px = gx + rng.range(-45, 45);
      const pz = gz + rng.range(-40, 40);
      if (!inFootprint(px, pz)) continue;
      seeds.push([px, pz], [px, -pz]);
    }
  }
  // spine row for continuous mass fore/aft of the field
  for (let gx = -RX + 80; gx <= RX - 80; gx += 150) {
    const px = gx + rng.range(-30, 30);
    if (Math.abs(px) < FIELD_X + 40) continue;
    seeds.push([px, rng.range(-25, 25)]);
  }

  const delaunay = Delaunay.from(seeds);
  const voronoi = delaunay.voronoi([-RX, -RZ, RX, RZ]);

  const prismGeos = [];
  const darkGeos = [];
  const windowSpots = [];

  for (let i = 0; i < seeds.length; i++) {
    const [sx, sz] = seeds[i];
    const poly = voronoi.cellPolygon(i);
    if (!poly) continue;
    // clip out: cells whose seed is inside the field become deck tiles
    const isDeck = inField(sx, sz, 30);
    // cells outside the footprint edge get culled by seed test
    if (!inFootprint(sx, sz)) continue;

    // shrink polygon toward seed for seam gaps
    const gap = isDeck ? 1.6 : 2.4;
    const shape = new THREE.Shape();
    let started = false;
    for (const [px, pz] of poly) {
      const dx = px - sx, dz = pz - sz;
      const d = Math.hypot(dx, dz) || 1;
      const k = Math.max(0, (d - gap) / d);
      const qx = sx + dx * k, qz = sz + dz * k;
      if (!started) { shape.moveTo(qx, qz); started = true; }
      else shape.lineTo(qx, qz);
    }
    shape.closePath();

    let height;
    if (isDeck) {
      height = 6; // deck tile: thin slab whose top is the walkable deck level
    } else {
      const taper = 1 - Math.pow(Math.abs(sx) / RX, 2.2);
      height = (26 + rng.next() * 62) * (0.3 + 0.7 * taper);
      if (rng.chance(0.12)) height += rng.range(30, 55); // occasional tower
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);       // extrusion now points -y; shape plane = top face
    geo.translate(0, isDeck ? -0.4 : height, 0); // deck tops just under piece floors
    (isDeck ? darkGeos : prismGeos).push(geo);

    if (!isDeck && height > 26) {
      // window strip spots on the two longest edges
      for (let e = 0; e < poly.length - 1 && windowSpots.length < 400; e++) {
        const [ax, az] = poly[e], [bx, bz] = poly[e + 1];
        const len = Math.hypot(bx - ax, bz - az);
        if (len < 36) continue;
        if (!rng.chance(0.4)) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2;
        const nx = mx - sx, nz = mz - sz;
        const nd = Math.hypot(nx, nz) || 1;
        windowSpots.push({
          x: mx + (nx / nd) * 0.3, z: mz + (nz / nd) * 0.3,
          yaw: Math.atan2(nx / nd, nz / nd),
          y: rng.range(8, height - 8),
          len: Math.min(len * 0.5, 30),
        });
      }
    }
  }

  const massing = new THREE.Mesh(
    mergeGeometries(prismGeos.map((g) => (g.index ? g.toNonIndexed() : g)), false),
    MATS.brutal
  );
  massing.castShadow = true;
  massing.receiveShadow = true;
  group.add(massing);
  const deckTiles = new THREE.Mesh(
    mergeGeometries(darkGeos.map((g) => (g.index ? g.toNonIndexed() : g)), false),
    MATS.brutalDark
  );
  deckTiles.receiveShadow = true;
  group.add(deckTiles);

  // ── belly: one footprint slab so the hull reads solid from the side ──
  {
    const belly = new THREE.Shape();
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      // superellipse param
      const cx = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 2 / 3) * RX;
      const cz = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 2 / 3) * RZ;
      i === 0 ? belly.moveTo(cx, cz) : belly.lineTo(cx, cz);
    }
    belly.closePath();
    const bellyGeo = new THREE.ExtrudeGeometry(belly, { depth: 30, bevelEnabled: false });
    bellyGeo.rotateX(Math.PI / 2);
    bellyGeo.translate(0, -4, 0);
    const bellyMesh = new THREE.Mesh(bellyGeo, MATS.brutalDark);
    bellyMesh.receiveShadow = true;
    group.add(bellyMesh);
  }

  // ── the seam glow: one emissive plane beneath everything; gaps reveal it ──
  const seamMat = new THREE.MeshBasicMaterial({});
  seamMat.color.setRGB(0.75, 1.5, 1.5);
  const seamPlane = new THREE.Mesh(new THREE.PlaneGeometry(RX * 2, RZ * 2), seamMat);
  seamPlane.rotation.x = -Math.PI / 2;
  seamPlane.position.y = DECK_Y - 0.8;
  group.add(seamPlane);

  // ── running light strips on prism rims (instanced) ──
  const stripMat = new THREE.MeshBasicMaterial({});
  stripMat.color.setRGB(2.1, 1.7, 1.1);
  const strips = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.5, 0.5), stripMat, windowSpots.length);
  const dummy = new THREE.Object3D();
  windowSpots.forEach((w, i) => {
    dummy.position.set(w.x, w.y, w.z);
    dummy.rotation.set(0, w.yaw + Math.PI / 2, 0);
    dummy.scale.set(w.len, 1, 1);
    dummy.updateMatrix();
    strips.setMatrixAt(i, dummy.matrix);
  });
  group.add(strips);

  // ── engines astern ──
  const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0x8fd0ff });
  for (const ez of [-120, 0, 120]) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(14, 20, 40, 12), MATS.brutalDark);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(-RX + 14, 22, ez * 0.8);
    group.add(nozzle);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(12, 16), engineGlowMat);
    glow.rotation.y = -Math.PI / 2;
    glow.position.set(-RX - 8, 22, ez * 0.8);
    group.add(glow);
  }

  // ── the four observation bays: sealed brutalist halls in the massing ──
  const bays = [];
  const BAY_W = 2 * (A / 2), BAY_D = 2 * (A / 2), BAY_H = 26; // full slot — walls land exactly on slot boundaries
  for (const slot of BAY_SLOTS) {
    const { x, z } = slotCenter(slot.col, slot.row);
    const bayGroup = new THREE.Group();
    bayGroup.position.set(x, 0, z);
    group.add(bayGroup);
    // orientation: window faces AWAY from the field centre
    const outDir = Math.abs(slot.col) > Math.abs(slot.row)
      ? (slot.col > 0 ? 0 : 2)
      : (slot.row > 0 ? 1 : 3);
    const yawOut = Math.atan2(DIRS[outDir][0], DIRS[outDir][1]);

    // floor + roof
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(BAY_W, BAY_D), starmapMaterial(slot.col * 10 + slot.row + 40));
    floor.rotation.x = -Math.PI / 2;
    floor.rotation.z = yawOut;
    floor.position.y = 0.06;
    bayGroup.add(floor);
    const slabG = new THREE.Mesh(new THREE.BoxGeometry(BAY_W + 8, 8, BAY_D + 8), MATS.brutalDark);
    slabG.position.y = -4;
    bayGroup.add(slabG);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(BAY_W + 8, 4, BAY_D + 8), MATS.brutal);
    roof.position.y = BAY_H + 2;
    bayGroup.add(roof);

    // walls: outward = huge capsule window (brutal frame), others solid brutal;
    // the field-facing wall is REPLACEABLE (growth cuts the door)
    const edgeWalls = new Map();
    for (let d = 0; d < 4; d++) {
      const [dx, dz] = DIRS[d];
      const isOut = d === outDir;
      const isIn = d === ((outDir + 2) % 4);
      const wallLen = (d % 2 === 0) ? BAY_D : BAY_W;
      const wall = new THREE.Group();
      if (isOut) {
        const w = wallLen - 14, hh = BAY_H - 8, cy = BAY_H / 2 + 1;
        const shape = wallShapeLocal(wallLen, BAY_H);
        shape.holes.push(capsuleHoleLocal(w, hh, 0, cy));
        wall.add(extrudeLocal(shape, MATS.brutal, 6));
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), glassMat);
        pane.position.y = cy;
        pane.renderOrder = 50;
        wall.add(pane);
      } else {
        wall.add(extrudeLocal(wallShapeLocal(wallLen, BAY_H), MATS.brutal, 6));
      }
      const halfSpan = (d % 2 === 0) ? BAY_W / 2 : BAY_D / 2;
      wall.position.set(dx * halfSpan, 0, dz * halfSpan);
      wall.rotation.y = Math.atan2(dx, dz);
      bayGroup.add(wall);
      edgeWalls.set(d, wall);
    }

    // dim until unsealed
    const bayLight = new THREE.PointLight(0x9fd8e8, 0, 110, 1.7);
    bayLight.position.set(0, BAY_H - 4, 0);
    bayGroup.add(bayLight);

    bays.push({
      kind: 'bay', col: slot.col, row: slot.row, x, z,
      group: bayGroup, edgeWalls, sealed: true, light: bayLight,
      spec: { h: BAY_H },
      walkPoly: [
        [x - BAY_W / 2 + 3, z - BAY_D / 2 + 3], [x + BAY_W / 2 - 3, z - BAY_D / 2 + 3],
        [x + BAY_W / 2 - 3, z + BAY_D / 2 - 3], [x - BAY_W / 2 + 3, z + BAY_D / 2 - 3],
      ],
      replaceEdge(d, builder) {
        const old = edgeWalls.get(d);
        if (old) bayGroup.remove(old);
        if (!builder) { edgeWalls.set(d, null); return; }
        const [dx, dz] = DIRS[d];
        const wall = new THREE.Group();
        wall.add(builder());
        const halfSpan = (d % 2 === 0) ? BAY_W / 2 : BAY_D / 2;
        wall.position.set(dx * halfSpan, 0, dz * halfSpan);
        wall.rotation.y = Math.atan2(dx, dz);
        bayGroup.add(wall);
        edgeWalls.set(d, wall);
      },
    });
  }

  function update() {}

  return { group, update, bays };
}

// tiny local copies (avoid circular import of cells' private helpers)
function wallShapeLocal(len, H) {
  const s = new THREE.Shape();
  s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, H); s.lineTo(-len / 2, H);
  s.closePath();
  return s;
}
function capsuleHoleLocal(w, h, cx, cy) {
  const r = Math.min(w, h) / 2;
  const hole = new THREE.Path();
  hole.moveTo(cx - w / 2 + r, cy - h / 2);
  hole.lineTo(cx + w / 2 - r, cy - h / 2);
  hole.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false);
  hole.lineTo(cx - w / 2 + r, cy + h / 2);
  hole.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false);
  return hole;
}
function extrudeLocal(shape, mat, depth) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

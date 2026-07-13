import * as THREE from 'three';
import { makeRng } from '../rng.js';

// Guests: a crowd of little articulated walkers. Each figure is built from
// shared body parts (torso, head, two legs, two arms, optional hat), and each
// part is ONE InstancedMesh across the whole crowd — so 300 people animate in
// ~7 draw calls. Legs and arms swing on a per-guest walk cycle driven by
// distance travelled (no foot-sliding); variety comes from height, build,
// skin/jumpsuit colour, kids, and hats.

const COUNT = 300;
const BOUNDS = { x0: 26, x1: 314, z0: -76, z1: 76 };

// unit-figure proportions (scaled per guest by height)
const HIP_Y = 0.72, LEG_LEN = 0.72, LEG_X = 0.15;
const TORSO_H = 0.58, SHOULDER_Y = 1.3, ARM_LEN = 0.6, ARM_X = 0.31;
const HEAD_Y = 1.54;

export function createGuests(scene) {
  const rng = makeRng(2049);
  const root = new THREE.Group();
  scene.add(root);

  // — part geometries, pivots at their animating joint —
  const torsoGeo = new THREE.BoxGeometry(0.46, TORSO_H, 0.28); torsoGeo.translate(0, 0.5 * TORSO_H, 0);
  const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
  const legGeo = new THREE.BoxGeometry(0.16, LEG_LEN, 0.18); legGeo.translate(0, -0.5 * LEG_LEN, 0); // pivot at hip
  const armGeo = new THREE.BoxGeometry(0.12, ARM_LEN, 0.14); armGeo.translate(0, -0.5 * ARM_LEN, 0); // pivot at shoulder
  const hatGeo = new THREE.ConeGeometry(0.24, 0.26, 7); hatGeo.translate(0, 0.13, 0);

  const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.0 });
  const mkInst = (geo) => {
    const m = new THREE.InstancedMesh(geo, mat, COUNT);
    m.castShadow = true;
    root.add(m);
    return m;
  };
  const parts = {
    torso: mkInst(torsoGeo), head: mkInst(headGeo),
    legL: mkInst(legGeo), legR: mkInst(legGeo),
    armL: mkInst(armGeo), armR: mkInst(armGeo), hat: mkInst(hatGeo),
  };

  const jumpsuits = [0xe6746a, 0x6a94e6, 0xe6c766, 0x74d66a, 0xb26ae6, 0xf0f0ee, 0xe6844c, 0x5cc7c2];
  const skins = [0xf2c9a0, 0xd9a066, 0xa8703c, 0x8a5a2c, 0xf7d9b8];
  const pantsShift = new THREE.Color(0.55, 0.55, 0.6); // multiply jumpsuit → darker legs
  const c = new THREE.Color(), c2 = new THREE.Color();

  const guests = [];
  const attractions = [];

  for (let i = 0; i < COUNT; i++) {
    const kid = rng.chance(0.16);
    const g = {
      pos: new THREE.Vector3(rng.range(BOUNDS.x0, BOUNDS.x1), 0, rng.range(BOUNDS.z0, BOUNDS.z1)),
      target: new THREE.Vector3(),
      speed: rng.range(1.1, 2.4) * (kid ? 0.8 : 1),
      heading: 0, dwell: 0,
      walkT: rng.next() * Math.PI * 2, amp: 0,
      height: (kid ? rng.range(0.6, 0.72) : rng.range(0.86, 1.14)),
      build: rng.range(0.86, 1.22),
      hasHat: !kid && rng.chance(0.28),
    };
    guests.push(g);

    // colours: jumpsuit (torso+arms), darker pants (legs), skin (head), hat accent
    c.setHex(jumpsuits[rng.int(0, jumpsuits.length - 1)]).offsetHSL(0, 0, rng.range(-0.05, 0.05));
    parts.torso.setColorAt(i, c); parts.armL.setColorAt(i, c); parts.armR.setColorAt(i, c);
    c2.copy(c).multiply(pantsShift);
    parts.legL.setColorAt(i, c2); parts.legR.setColorAt(i, c2);
    parts.head.setColorAt(i, c2.setHex(skins[rng.int(0, skins.length - 1)]));
    parts.hat.setColorAt(i, c2.setHex(jumpsuits[rng.int(0, jumpsuits.length - 1)]));
  }
  for (const p of Object.values(parts)) if (p.instanceColor) p.instanceColor.needsUpdate = true;

  function pickTarget(g) {
    if (attractions.length && rng.chance(0.6)) {
      const a = rng.pick(attractions);
      g.target.set(a.x + rng.range(-14, 14), 0, a.z + rng.range(-14, 14));
    } else {
      g.target.set(rng.range(BOUNDS.x0, BOUNDS.x1), 0, rng.range(BOUNDS.z0, BOUNDS.z1));
    }
    g.target.x = THREE.MathUtils.clamp(g.target.x, BOUNDS.x0, BOUNDS.x1);
    g.target.z = THREE.MathUtils.clamp(g.target.z, BOUNDS.z0, BOUNDS.z1);
  }

  const base = new THREE.Object3D();   // per-guest world transform
  const part = new THREE.Object3D();   // per-part local transform
  const dir = new THREE.Vector3();
  const m = new THREE.Matrix4();

  const setPart = (inst, i, px, py, pz, rx, sx = 1, sy = 1, sz = 1) => {
    part.position.set(px, py, pz);
    part.rotation.set(rx, 0, 0);
    part.scale.set(sx, sy, sz);
    part.updateMatrix();
    inst.setMatrixAt(i, m.multiplyMatrices(base.matrix, part.matrix));
  };

  function update(dt) {
    for (let i = 0; i < COUNT; i++) {
      const g = guests[i];
      let moving = false;
      if (g.dwell > 0) {
        g.dwell -= dt;
      } else {
        dir.subVectors(g.target, g.pos); dir.y = 0;
        const d = dir.length();
        if (d < 1.2) { g.dwell = rng.range(1, 7); pickTarget(g); }
        else {
          dir.divideScalar(d);
          g.pos.addScaledVector(dir, g.speed * dt);
          g.heading = Math.atan2(dir.x, dir.z);
          moving = true;
        }
      }

      // walk cycle: phase advances with distance, amplitude eases in/out
      g.walkT += moving ? g.speed * dt * 2.6 : 0;
      g.amp += ((moving ? 1 : 0) - g.amp) * Math.min(1, dt * 9);
      const swing = Math.sin(g.walkT) * 0.62 * g.amp;
      const bob = Math.abs(Math.sin(g.walkT)) * 0.05 * g.amp * g.height;

      base.position.set(g.pos.x, bob, g.pos.z);
      base.rotation.set(0, g.heading, 0);
      base.scale.setScalar(g.height);
      base.updateMatrix();

      setPart(parts.torso, i, 0, HIP_Y, 0, 0, g.build, 1, 1);
      setPart(parts.head, i, 0, HEAD_Y, 0, 0);
      setPart(parts.legL, i, -LEG_X, HIP_Y, 0, swing);
      setPart(parts.legR, i, LEG_X, HIP_Y, 0, -swing);
      setPart(parts.armL, i, -ARM_X * g.build, SHOULDER_Y, 0, -swing * 0.8);
      setPart(parts.armR, i, ARM_X * g.build, SHOULDER_Y, 0, swing * 0.8);
      setPart(parts.hat, i, 0, HEAD_Y + 0.16, 0, 0, g.hasHat ? 1 : 0, g.hasHat ? 1 : 0, g.hasHat ? 1 : 0);
    }
    for (const p of Object.values(parts)) p.instanceMatrix.needsUpdate = true;
  }

  function addAttraction(v, { announce = false } = {}) {
    attractions.push(v.clone());
    if (announce) {
      for (const g of guests) {
        if (rng.chance(0.4)) {
          g.target.set(v.x + rng.range(-12, 12), 0, v.z + rng.range(-12, 12));
          g.dwell = 0;
        }
      }
    }
    for (const g of guests) if (g.target.lengthSq() === 0) pickTarget(g);
  }

  return { update, addAttraction, count: COUNT, mesh: root };
}

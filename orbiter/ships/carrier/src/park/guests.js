import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRng } from '../rng.js';

// Guests: one InstancedMesh of tiny capsule-people in pastel jumpsuits.
// Each wanders between waypoints biased toward ride attractions; walking is
// sold with a per-instance bob phase. New attractions pull a fresh crowd.

const COUNT = 300;
const BOUNDS = { x0: 26, x1: 314, z0: -76, z1: 76 };

export function createGuests(scene) {
  const rng = makeRng(2049);

  // body: capsule + head merged so the whole crowd is ONE draw call
  const body = new THREE.CapsuleGeometry(0.32, 0.75, 3, 8);
  body.translate(0, 0.7, 0);
  const head = new THREE.SphereGeometry(0.24, 8, 6);
  head.translate(0, 1.5, 0);
  const geo = mergeGeometries([body, head], false);

  const mat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.0 });
  const inst = new THREE.InstancedMesh(geo, mat, COUNT);
  inst.castShadow = true;
  scene.add(inst);

  const color = new THREE.Color();
  const palette = [0xe6a29a, 0x9ab8e6, 0xe6d59a, 0xa8e69a, 0xc9a2e6, 0xf0f0ee, 0xe68a5c, 0x8ad2cf];
  const guests = [];
  const attractions = [];

  for (let i = 0; i < COUNT; i++) {
    guests.push({
      pos: new THREE.Vector3(rng.range(BOUNDS.x0, BOUNDS.x1), 0, rng.range(BOUNDS.z0, BOUNDS.z1)),
      target: new THREE.Vector3(),
      speed: rng.range(1.1, 2.4),
      phase: rng.next() * Math.PI * 2,
      heading: 0,
      dwell: 0,
    });
    color.setHex(palette[rng.int(0, palette.length - 1)]);
    color.offsetHSL(0, 0, rng.range(-0.06, 0.06));
    inst.setColorAt(i, color);
  }
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;

  function pickTarget(g) {
    // 60% head toward an attraction plaza, 40% wander anywhere
    if (attractions.length && rng.chance(0.6)) {
      const a = rng.pick(attractions);
      g.target.set(
        a.x + rng.range(-14, 14), 0, a.z + rng.range(-14, 14)
      );
    } else {
      g.target.set(rng.range(BOUNDS.x0, BOUNDS.x1), 0, rng.range(BOUNDS.z0, BOUNDS.z1));
    }
    g.target.x = THREE.MathUtils.clamp(g.target.x, BOUNDS.x0, BOUNDS.x1);
    g.target.z = THREE.MathUtils.clamp(g.target.z, BOUNDS.z0, BOUNDS.z1);
  }
  const dummy = new THREE.Object3D();
  const dir = new THREE.Vector3();

  function update(dt, elapsed) {
    for (let i = 0; i < COUNT; i++) {
      const g = guests[i];
      if (g.dwell > 0) {
        g.dwell -= dt;
      } else {
        dir.subVectors(g.target, g.pos);
        dir.y = 0;
        const d = dir.length();
        if (d < 1.2) {
          g.dwell = rng.range(1, 7);
          pickTarget(g);
        } else {
          dir.divideScalar(d);
          g.pos.addScaledVector(dir, g.speed * dt);
          g.heading = Math.atan2(dir.x, dir.z);
        }
      }
      const bob = g.dwell > 0 ? 0 : Math.abs(Math.sin(elapsed * 7 + g.phase)) * 0.09;
      dummy.position.set(g.pos.x, bob, g.pos.z);
      dummy.rotation.set(0, g.heading, 0);
      dummy.scale.setScalar(0.92 + (i % 5) * 0.045); // height variety incl. kids
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  }

  function addAttraction(v, { announce = false } = {}) {
    attractions.push(v.clone());
    if (announce) {
      // a chunk of the crowd drops everything and beelines for the new ride
      for (const g of guests) {
        if (rng.chance(0.4)) {
          g.target.set(v.x + rng.range(-12, 12), 0, v.z + rng.range(-12, 12));
          g.dwell = 0;
        }
      }
    }
    // seed initial pickTargets with attraction bias
    for (const g of guests) if (g.target.lengthSq() === 0) pickTarget(g);
  }

  return { update, addAttraction, count: COUNT, mesh: inst };
}

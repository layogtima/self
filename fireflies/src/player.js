// player.js — first-person controller: walking + gravity + AABB collision,
// a headlamp SpotLight, and the beam parameters the fireflies are lured by.
import * as THREE from 'three';
import { clamp } from './util.js';

const EYE = 1.62;         // eye height
const RADIUS = 0.35;      // collision cylinder radius
const SPEED = 4.2;
const GRAVITY = 20;
const BEAM_HALF = 0.42;   // half-angle of the attraction cone (radians, ~24°)
const BEAM_RANGE = 12;

export function makePlayer(scene, camera, input) {
  // ---- headlamp: a dim, warm spotlight riding the camera ----
  const lamp = new THREE.SpotLight('#ffe9b8', 0, 26, BEAM_HALF * 1.3, 0.55, 1.4);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.camera.near = 0.2;
  lamp.shadow.camera.far = 28;
  lamp.shadow.bias = -0.0006;
  const lampTarget = new THREE.Object3D();
  scene.add(lamp, lampTarget);
  lamp.target = lampTarget;

  // a soft personal bubble so your immediate surroundings are always readable
  const bubble = new THREE.PointLight('#cfe0ff', 2.2, 8, 1.7);
  scene.add(bubble);

  const pos = new THREE.Vector3(0, EYE, 6);
  const spawnPoint = new THREE.Vector3(0, EYE, 6);
  let vy = 0;
  let onGround = false;

  const beam = {
    origin: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    cosHalf: Math.cos(BEAM_HALF),
    range: BEAM_RANGE,
    on: false,
  };

  // scratch
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();

  // level supplies AABB colliders (array of THREE.Box3) + floorAt(x,z)
  let colliders = [];
  let floorAt = () => 0;
  function setLevel(level) {
    colliders = level.colliders || [];
    floorAt = level.floorAt || (() => 0);
    spawnPoint.copy(level.spawn || new THREE.Vector3(0, EYE, 6));
    pos.copy(spawnPoint);
    if (level.spawnYaw != null) input.state.yaw = level.spawnYaw;
    input.state.pitch = 0;
    vy = 0;
  }

  function update(t, dt) {
    camera.rotation.set(input.state.pitch, input.state.yaw, 0);

    // ground-plane basis (no vertical component -> walking, not flying)
    fwd.set(-Math.sin(input.state.yaw), 0, -Math.cos(input.state.yaw));
    right.set(fwd.z, 0, -fwd.x);

    const { f, s } = input.axis();
    move.set(0, 0, 0).addScaledVector(fwd, f).addScaledVector(right, s);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(SPEED * dt);

    pos.x += move.x; pos.z += move.z;
    resolve(); // circle-vs-AABB pushout (handles corners, no clip-through)

    // gravity + floor
    vy -= GRAVITY * dt;
    pos.y += vy * dt;
    const ground = floorAt(pos.x, pos.z) + EYE;
    if (pos.y <= ground) { pos.y = ground; vy = 0; onGround = true; } else { onGround = false; }

    // fell into the void — respawn at the level entrance
    if (pos.y < -25) { pos.copy(spawnPoint); vy = 0; }

    camera.position.copy(pos);

    // ---- beam / headlamp ----
    beam.on = input.state.beamHeld;
    camera.getWorldDirection(beam.dir);
    beam.origin.copy(pos).addScaledVector(beam.dir, 0.2);
    lamp.position.copy(pos);
    lampTarget.position.copy(pos).addScaledVector(beam.dir, 5);
    bubble.position.copy(pos);
    // lamp glows softly always, brightens when you actively shine the beam
    const want = beam.on ? 8 : 2.6;
    lamp.intensity = THREE.MathUtils.lerp(lamp.intensity, want, 1 - Math.pow(0.02, dt));
  }

  // resolve the player's radius against every box's XZ footprint. Two passes so
  // wedging into a corner settles cleanly instead of tunnelling through.
  function resolve() {
    const footY = pos.y - EYE;      // feet
    const headY = pos.y - EYE + 1.75;
    for (let pass = 0; pass < 2; pass++) {
      for (const c of colliders) {
        if (footY > c.max.y || headY < c.min.y) continue; // no vertical overlap
        const nx = clamp(pos.x, c.min.x, c.max.x);
        const nz = clamp(pos.z, c.min.z, c.max.z);
        const dx = pos.x - nx, dz = pos.z - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= RADIUS * RADIUS) continue;
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2), push = RADIUS - d;
          pos.x += (dx / d) * push; pos.z += (dz / d) * push;
        } else {
          // centre inside the box — eject along the shallowest face
          const l = pos.x - c.min.x, r = c.max.x - pos.x, b = pos.z - c.min.z, tp = c.max.z - pos.z;
          const m = Math.min(l, r, b, tp);
          if (m === l) pos.x = c.min.x - RADIUS;
          else if (m === r) pos.x = c.max.x + RADIUS;
          else if (m === b) pos.z = c.min.z - RADIUS;
          else pos.z = c.max.z + RADIUS;
        }
      }
    }
  }

  return { pos, beam, lamp, setLevel, update, isOnGround: () => onGround };
}

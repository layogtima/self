import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Two interactive cameras: a constrained management orbit over the park, and
// a free-fly drone for gawking at the hull from outside.

export function createManageControls(camera, dom) {
  const controls = new OrbitControls(camera, dom);
  controls.target.set(163, 10, -6);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 18;
  controls.maxDistance = 420;
  controls.maxPolarAngle = 1.48;
  controls.enablePan = true;
  controls.panSpeed = 0.7;
  return controls;
}

export function createFlyControls(camera, dom) {
  const state = {
    enabled: false,
    yaw: 0, pitch: 0,
    dragging: false,
    lastX: 0, lastY: 0,
    keys: new Set(),
  };
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const vel = new THREE.Vector3();

  function syncFromCamera() {
    euler.setFromQuaternion(camera.quaternion, 'YXZ');
    state.yaw = euler.y;
    state.pitch = euler.x;
  }

  dom.addEventListener('pointerdown', (e) => {
    if (!state.enabled) return;
    state.dragging = true;
    state.lastX = e.clientX; state.lastY = e.clientY;
  });
  window.addEventListener('pointerup', () => { state.dragging = false; });
  window.addEventListener('pointermove', (e) => {
    if (!state.enabled || !state.dragging) return;
    state.yaw -= (e.clientX - state.lastX) * 0.0028;
    state.pitch -= (e.clientY - state.lastY) * 0.0028;
    state.pitch = THREE.MathUtils.clamp(state.pitch, -1.45, 1.45);
    state.lastX = e.clientX; state.lastY = e.clientY;
  });
  window.addEventListener('keydown', (e) => state.keys.add(e.code));
  window.addEventListener('keyup', (e) => state.keys.delete(e.code));

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  function update(dt) {
    if (!state.enabled) return;
    euler.set(state.pitch, state.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    const boost = state.keys.has('ShiftLeft') || state.keys.has('ShiftRight') ? 4.5 : 1;
    const speed = 60 * boost;
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);

    const accel = new THREE.Vector3();
    if (state.keys.has('KeyW')) accel.add(forward);
    if (state.keys.has('KeyS')) accel.sub(forward);
    if (state.keys.has('KeyD')) accel.add(right);
    if (state.keys.has('KeyA')) accel.sub(right);
    if (state.keys.has('KeyE') || state.keys.has('Space')) accel.y += 1;
    if (state.keys.has('KeyQ') || state.keys.has('KeyC')) accel.y -= 1;

    vel.lerp(accel.normalize().multiplyScalar(speed), Math.min(1, dt * 3));
    camera.position.addScaledVector(vel, dt);
  }

  return {
    update,
    setEnabled(v) { state.enabled = v; if (v) syncFromCamera(); },
  };
}

// First-person walk controller: pointer-lock look, WASD on the ground plane,
// clamped to a set of walkable XZ regions with circular obstacle push-out.
export function createWalkControls(camera, dom, { regions, obstacles, onExit }) {
  const EYE = 1.75;
  const state = { enabled: false, yaw: 0, pitch: 0, keys: new Set() };
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const vel = new THREE.Vector3();

  function onMove(e) {
    if (!state.enabled) return;
    state.yaw -= e.movementX * 0.0022;
    state.pitch -= e.movementY * 0.0022;
    state.pitch = THREE.MathUtils.clamp(state.pitch, -1.3, 1.3);
  }
  document.addEventListener('mousemove', onMove);
  window.addEventListener('keydown', (e) => { if (state.enabled) state.keys.add(e.code); });
  window.addEventListener('keyup', (e) => state.keys.delete(e.code));
  document.addEventListener('pointerlockchange', () => {
    if (state.enabled && document.pointerLockElement !== dom) onExit?.();
  });
  const lockPointer = () => { try { const p = dom.requestPointerLock?.(); if (p && p.catch) p.catch(() => {}); } catch (_) {} };
  dom.addEventListener('pointerdown', () => {
    if (state.enabled && document.pointerLockElement !== dom) lockPointer();
  });

  const margin = 1.2;
  function inRegion(x, z) {
    for (const r of regions) {
      if (x >= r.x0 + margin && x <= r.x1 - margin && z >= r.z0 + margin && z <= r.z1 - margin) return true;
    }
    return false;
  }
  function pushOut(p) {
    for (const o of obstacles) {
      const dx = p.x - o.x, dz = p.z - o.z;
      const d = Math.hypot(dx, dz);
      if (d < o.r && d > 0.001) { p.x = o.x + (dx / d) * o.r; p.z = o.z + (dz / d) * o.r; }
    }
  }

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  function update(dt) {
    if (!state.enabled) return;
    euler.set(state.pitch, state.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    const run = state.keys.has('ShiftLeft') || state.keys.has('ShiftRight') ? 2.1 : 1;
    const speed = 9 * run;
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
    right.set(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();

    const accel = new THREE.Vector3();
    if (state.keys.has('KeyW')) accel.add(forward);
    if (state.keys.has('KeyS')) accel.sub(forward);
    if (state.keys.has('KeyD')) accel.add(right);
    if (state.keys.has('KeyA')) accel.sub(right);
    if (accel.lengthSq() > 0) accel.normalize().multiplyScalar(speed);
    vel.lerp(accel, Math.min(1, dt * 12));

    const p = camera.position;
    const nx = p.x + vel.x * dt, nz = p.z + vel.z * dt;
    if (inRegion(nx, nz)) { p.x = nx; p.z = nz; }
    else if (inRegion(nx, p.z)) { p.x = nx; vel.z = 0; }
    else if (inRegion(p.x, nz)) { p.z = nz; vel.x = 0; }
    else { vel.set(0, 0, 0); }
    pushOut(p);
    // gentle head-bob while moving
    const moving = vel.lengthSq() > 0.5;
    p.y = EYE + (moving ? Math.sin(performance.now() * 0.012) * 0.05 : 0);
  }

  return {
    update,
    setEnabled(v, spawn, look) {
      state.enabled = v;
      if (v) {
        if (spawn) camera.position.set(spawn.x, EYE, spawn.z);
        if (look) {
          const dir = look.clone().sub(camera.position);
          state.yaw = Math.atan2(-dir.x, -dir.z);
          state.pitch = 0;
        }
        vel.set(0, 0, 0);
        lockPointer();
      } else if (document.pointerLockElement === dom) {
        document.exitPointerLock?.();
      }
    },
  };
}

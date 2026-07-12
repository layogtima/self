import * as THREE from 'three';
import CameraControls from 'camera-controls';

CameraControls.install({ THREE });

// Three interactive cameras: damped management orbit (camera-controls), a
// free-fly drone, and a first-person walker with jump physics, optional
// gravity, and Nova's scale-shift.

export function createManageControls(camera, dom) {
  const cc = new CameraControls(camera, dom);
  cc.minDistance = 18;
  cc.maxDistance = 700;
  cc.maxPolarAngle = 1.48;
  cc.dollySpeed = 0.7;
  cc.truckSpeed = 1.6;
  cc.smoothTime = 0.18;
  cc.draggingSmoothTime = 0.08;
  return cc;
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

// First-person walker. Pointer-lock look, WASD, VOID JUMP (Space — every jump
// skips the whole ship through deep space; hooks fire at apex and landing),
// gravity toggle, scale shift, clamped to typed walkable regions.
import { inAnyRegion } from './regions.js';

export function createWalkControls(camera, dom, { regions, obstacles, onExit, onJump, onApex, onLand, groundY }) {
  const state = {
    enabled: false, yaw: 0, pitch: 0, keys: new Set(),
    eye: 1.75, scaleIdx: 1, // 0 ant, 1 normal, 2 kaiju
    velY: 0, grounded: true, gravityOn: true, apexFired: false,
  };
  const SCALES = [0.35, 1.75, 6.5];
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const vel = new THREE.Vector3();

  function onMove(e) {
    if (!state.enabled) return;
    state.yaw -= e.movementX * 0.0022;
    state.pitch -= e.movementY * 0.0022;
    state.pitch = THREE.MathUtils.clamp(state.pitch, -1.3, 1.3);
  }
  document.addEventListener('mousemove', onMove);
  window.addEventListener('keydown', (e) => {
    if (!state.enabled) return;
    state.keys.add(e.code);
    if (e.code === 'Space' && state.grounded) {
      state.velY = (state.gravityOn ? 10.5 : 4.5) * Math.sqrt(state.eye / 1.75);
      state.grounded = false;
      state.apexFired = false;
      onJump?.();
    }
  });
  window.addEventListener('keyup', (e) => state.keys.delete(e.code));
  document.addEventListener('pointerlockchange', () => {
    if (state.enabled && document.pointerLockElement !== dom) onExit?.();
  });
  const lockPointer = () => { try { const p = dom.requestPointerLock?.(); if (p && p.catch) p.catch(() => {}); } catch (_) {} };
  dom.addEventListener('pointerdown', () => {
    if (state.enabled && document.pointerLockElement !== dom) lockPointer();
  });

  function inRegion(x, z) {
    return inAnyRegion(regions, x, z, 1.2);
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
    const speed = 9 * run * (state.eye / 1.75);
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

    // vertical: void jump physics over TERRAIN — the ground height comes from
    // the biome heightfields via groundY(x,z)
    const gy = (groundY?.(p.x, p.z) ?? 0);
    const floorY = gy + state.eye;
    const nearApex = !state.grounded && Math.abs(state.velY) < 2.5;
    const g = (state.gravityOn ? 17 : 1.4) * (nearApex ? 0.45 : 1);
    if (state.grounded) {
      p.y = floorY; // ride the terrain
    } else {
      state.velY -= g * dt;
      p.y += state.velY * dt;
      if (!state.apexFired && state.velY <= 0) {
        state.apexFired = true;
        onApex?.();
      }
      if (p.y <= floorY) {
        onLand?.();
        p.y = floorY;
        state.velY = 0;
        state.grounded = true;
      }
    }
    // head-bob only when grounded and moving
    if (state.grounded && vel.lengthSq() > 0.5) {
      p.y = floorY + Math.sin(performance.now() * 0.012) * 0.05 * (state.eye / 1.75);
    }
  }

  return {
    update,
    setEnabled(v, spawn, look) {
      state.enabled = v;
      if (v) {
        if (spawn) camera.position.set(spawn.x, (groundY?.(spawn.x, spawn.z) ?? 0) + state.eye, spawn.z);
        if (look) {
          const dir = look.clone().sub(camera.position);
          state.yaw = Math.atan2(-dir.x, -dir.z);
          state.pitch = 0;
        }
        vel.set(0, 0, 0);
        state.velY = 0;
        state.grounded = true;
        lockPointer();
      } else if (document.pointerLockElement === dom) {
        document.exitPointerLock?.();
      }
    },
    setGravity(on) { state.gravityOn = on; },
    getGravity: () => state.gravityOn,
    cycleScale() {
      state.scaleIdx = (state.scaleIdx + 1) % 3;
      state.eye = SCALES[state.scaleIdx];
      camera.position.y = state.eye;
      return ['ant', 'person', 'kaiju'][state.scaleIdx];
    },
    teleport(spawn, look) {
      camera.position.set(spawn.x, (groundY?.(spawn.x, spawn.z) ?? 0) + state.eye, spawn.z);
      if (look) {
        const dir = look.clone().sub(camera.position);
        state.yaw = Math.atan2(-dir.x, -dir.z);
        state.pitch = 0;
      }
      vel.set(0, 0, 0);
    },
  };
}

// input.js — keyboard dict + pointer-lock mouse-look, with a touch fallback.
import * as THREE from 'three';

export function makeInput(domElement) {
  const keys = {};
  const state = {
    yaw: 0,
    pitch: 0,
    locked: false,
    beamHeld: false,   // hold to shine the beam (attract fireflies)
    depositTap: false, // consumed once per press
    moveX: 0,          // touch joystick, -1..1
    moveY: 0,
  };

  addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'KeyE' || e.code === 'KeyF') state.depositTap = true;
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });

  // ---- pointer lock look ----
  domElement.addEventListener('click', () => {
    if (document.pointerLockElement !== domElement) domElement.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === domElement;
  });
  addEventListener('mousemove', (e) => {
    if (!state.locked) return;
    state.yaw -= e.movementX * 0.0022;
    state.pitch = THREE.MathUtils.clamp(state.pitch - e.movementY * 0.0022, -1.45, 1.45);
  });
  addEventListener('mousedown', (e) => {
    if (!state.locked) return;
    if (e.button === 0) state.beamHeld = true;
    if (e.button === 2) state.depositTap = true;
  });
  addEventListener('mouseup', (e) => { if (e.button === 0) state.beamHeld = false; });
  addEventListener('contextmenu', (e) => e.preventDefault());

  // ---- touch fallback (left half = look-drag + move, right tap = beam) ----
  let lookId = null, lastX = 0, lastY = 0;
  domElement.addEventListener('touchstart', (e) => {
    for (const tch of e.changedTouches) {
      if (tch.clientX > innerWidth / 2) { state.beamHeld = true; }
      else if (lookId === null) { lookId = tch.identifier; lastX = tch.clientX; lastY = tch.clientY; }
    }
  }, { passive: true });
  domElement.addEventListener('touchmove', (e) => {
    for (const tch of e.changedTouches) {
      if (tch.identifier === lookId) {
        state.yaw -= (tch.clientX - lastX) * 0.005;
        state.pitch = THREE.MathUtils.clamp(state.pitch - (tch.clientY - lastY) * 0.005, -1.45, 1.45);
        lastX = tch.clientX; lastY = tch.clientY;
        // drag also nudges forward movement
        state.moveY = 1;
      }
    }
  }, { passive: true });
  domElement.addEventListener('touchend', (e) => {
    for (const tch of e.changedTouches) {
      if (tch.identifier === lookId) { lookId = null; state.moveY = 0; }
      else state.beamHeld = false;
    }
  }, { passive: true });

  function axis() {
    // returns {f, s} forward/strafe in -1..1 from WASD (+touch)
    let f = 0, s = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1;
    if (keys.KeyS || keys.ArrowDown) f -= 1;
    if (keys.KeyD || keys.ArrowRight) s += 1;
    if (keys.KeyA || keys.ArrowLeft) s -= 1;
    f += state.moveY;
    return { f: THREE.MathUtils.clamp(f, -1, 1), s: THREE.MathUtils.clamp(s, -1, 1) };
  }

  // consume the one-shot deposit press
  function takeDeposit() { const v = state.depositTap; state.depositTap = false; return v; }

  return { keys, state, axis, takeDeposit };
}

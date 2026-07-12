import * as THREE from 'three';

// The opening shot: stern quarter wide → hull sweep → viewport approach →
// dive THROUGH the glass → settle over the park. Position and look targets
// each ride their own CatmullRom spline; the glass fades for the crossing.

const DURATION = 34;

const POS_KEYS = [
  [-1500, 130, 680],
  [-1050, 170, 520],
  [-520, 120, 430],
  [-60, 95, 340],
  [140, 75, 230],
  [172, 58, 130],
  [178, 52, 60],   // through the glass (z≈91 crossed between these)
  [196, 64, 58],
];

const LOOK_KEYS = [
  [-700, 80, 0],
  [-350, 90, 0],
  [0, 70, 20],
  [140, 55, 60],
  [170, 40, 20],
  [166, 25, -10],
  [158, 12, -14],
  [150, 8, -22],   // settle wide over the park, carousel center-frame
];

export function createCinematic(camera, glassMat, { onDone, onTitle }) {
  const posCurve = new THREE.CatmullRomCurve3(POS_KEYS.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(LOOK_KEYS.map(p => new THREE.Vector3(...p)), false, 'centripetal');

  let t = 0;
  let running = true;
  let titleShown = false;
  const look = new THREE.Vector3();

  function ease(u) {
    // soft ease-in off the start, then decelerate into the park
    const s = u < 0.12 ? (u * u) / 0.12 : u;
    return 1 - Math.pow(1 - s, 1.75);
  }

  function finish() {
    running = false;
    glassMat.uniforms.uOpacity.value = 1;
    const endPos = posCurve.getPoint(1);
    const endLook = lookCurve.getPoint(1);
    camera.position.copy(endPos);
    camera.lookAt(endLook);
    onDone(endPos, endLook);
  }

  function update(dt) {
    if (!running) return;
    t += dt;
    if (t >= DURATION) { finish(); return; }
    const u = ease(THREE.MathUtils.clamp(t / DURATION, 0, 1));
    posCurve.getPointAt(u, camera.position);
    lookCurve.getPointAt(u, look);
    camera.lookAt(look);

    if (!titleShown && t > 5.5) { titleShown = true; onTitle(true); }
    if (titleShown && t > 15 && t < 15.2) onTitle(false);

    // fade the glass as we cross the viewport plane
    const nearGlass = camera.position.z < 130 && camera.position.z > 60 &&
      camera.position.x > 40 && camera.position.x < 310;
    const target = nearGlass ? 0 : 1;
    const g = glassMat.uniforms.uOpacity;
    g.value += (target - g.value) * Math.min(1, dt * 5);
  }

  function skip() { if (running) finish(); }
  return { update, skip, isRunning: () => running };
}

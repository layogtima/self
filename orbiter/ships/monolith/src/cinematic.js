import * as THREE from 'three';

// The opening shot, Blossom edition: far orbit wide of the flower → sweep
// over the petal corollas → dive straight down through the Atrium oculus →
// fall past the ribs → settle before the Wondergate, where NOVA is waiting.

const DURATION = 34;

const POS_KEYS = [
  [-1300, 130, -680],   // stern quarter — the OG hull sweep
  [-820, 100, -540],
  [-380, 85, -470],
  [-40, 90, -390],      // passing the chamfered side viewport
  [70, 130, -240],
  [10, 205, -60],       // climbing over the plateau deck + crowns
  [0, 160, 0],          // through the Atrium oculus (~y 156)
  [0, 80, 0],
  [4, 26, 26],
  [8, 12, 50],
];

const LOOK_KEYS = [
  [-600, 40, -220],
  [-260, 40, -200],
  [0, 30, -150],
  [0, 34, -90],
  [0, 46, 0],
  [0, 32, 0],
  [0, 22, 0],
  [0, 20, 0],
  [0, 20, -2],
  [0, 20, 0],   // the Wondergate
];

export function createCinematic(camera, glassMat, { onDone, onTitle }) {
  const posCurve = new THREE.CatmullRomCurve3(POS_KEYS.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(LOOK_KEYS.map(p => new THREE.Vector3(...p)), false, 'centripetal');

  let t = 0;
  let running = true;
  let titleShown = false;
  const look = new THREE.Vector3();

  function ease(u) {
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

    // fade the glass while dropping through the oculus crown
    const nearGlass = Math.abs(camera.position.x) < 50 && Math.abs(camera.position.z) < 50 &&
      camera.position.y > 128 && camera.position.y < 195;
    const target = nearGlass ? 0 : 1;
    const g = glassMat.uniforms.uOpacity;
    g.value += (target - g.value) * Math.min(1, dt * 5);
  }

  function skip() { if (running) finish(); }
  return { update, skip, isRunning: () => running };
}

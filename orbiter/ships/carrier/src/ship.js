import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRng } from './rng.js';

// The carrier. Spine runs along X: stern near x=-950, the habitat/park block
// (built in glass.js) occupies x ∈ [10, 330] at the bow. Hull massing is a
// seeded chain of stacked box segments merged into a handful of draw calls;
// repeated detail (greebles, window strips) is instanced.

const SEED = 42;

export function createShip(scene) {
  const rng = makeRng(SEED);
  const group = new THREE.Group();
  scene.add(group);

  const matHullA = new THREE.MeshStandardMaterial({ color: 0xc8cdd4, roughness: 0.62, metalness: 0.28 });
  const matHullB = new THREE.MeshStandardMaterial({ color: 0x99a1ab, roughness: 0.7, metalness: 0.3 });
  const matHullDark = new THREE.MeshStandardMaterial({ color: 0x3c434c, roughness: 0.82, metalness: 0.4 });

  const geosA = [];   // light plating
  const geosB = [];   // mid plating
  const geosDark = []; // recessed/undercut structure
  const segments = []; // {min, max} boxes for greeble/window scattering

  const tmpMat = new THREE.Matrix4();
  const tmpQuat = new THREE.Quaternion();
  const tmpPos = new THREE.Vector3();
  const tmpScl = new THREE.Vector3();

  function pushBox(list, cx, cy, cz, sx, sy, sz, ry = 0) {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    tmpQuat.setFromEuler(new THREE.Euler(0, ry, 0));
    tmpMat.compose(tmpPos.set(cx, cy, cz), tmpQuat, tmpScl.set(1, 1, 1));
    geo.applyMatrix4(tmpMat);
    list.push(geo);
    return { min: new THREE.Vector3(cx - sx / 2, cy - sy / 2, cz - sz / 2), max: new THREE.Vector3(cx + sx / 2, cy + sy / 2, cz + sz / 2) };
  }

  // --- spine segments, stern → bow ---
  let x = -950;
  let prevH = 55, prevW = 48;
  while (x < -20) {
    const len = rng.range(65, 135);
    const isNeck = rng.chance(0.22) && x > -850 && x < -180;
    const h = isNeck ? rng.range(22, 32) : THREE.MathUtils.clamp(prevH + rng.range(-14, 16), 38, 78);
    const w = isNeck ? rng.range(20, 30) : THREE.MathUtils.clamp(prevW + rng.range(-12, 14), 34, 66);
    const cy = 55 + rng.range(-6, 8);
    const cx = x + len / 2;

    if (isNeck) {
      // thin connector spine with dark trusswork
      pushBox(geosDark, cx, cy, 0, len, h, w);
      pushBox(geosB, cx, cy + h * 0.75, 0, len * 0.85, h * 0.55, w * 0.7);
      pushBox(geosB, cx, cy - h * 0.75, 0, len * 0.85, h * 0.55, w * 0.7);
    } else {
      // main block + inset plating layers for that stacked-plate look
      const seg = pushBox(geosA, cx, cy, 0, len, h * 2, w * 2);
      segments.push(seg);
      pushBox(geosB, cx, cy, 0, len * 0.92, h * 2.16, w * 1.72);
      pushBox(geosB, cx, cy, 0, len * 0.8, h * 1.7, w * 2.18);

      // superstructure stacks on top (1-3 tiers)
      let tierY = cy + h;
      let tierLen = len * rng.range(0.5, 0.8);
      let tierW = w * rng.range(0.9, 1.3);
      const tiers = rng.int(1, 3);
      for (let t = 0; t < tiers; t++) {
        const th = rng.range(10, 26);
        const tx = cx + rng.range(-0.18, 0.18) * len;
        const tier = pushBox(t === 0 ? geosA : geosB, tx, tierY + th / 2, rng.range(-0.15, 0.15) * w, tierLen, th, tierW);
        segments.push(tier);
        tierY += th;
        tierLen *= rng.range(0.55, 0.8);
        tierW *= rng.range(0.6, 0.85);
      }

      // under-hull pods / hangar modules (per ref: modules hang below)
      if (rng.chance(0.75)) {
        const pw = w * rng.range(0.45, 0.7);
        const ph = rng.range(14, 30);
        const px = cx + rng.range(-0.2, 0.2) * len;
        const pz = rng.chance(0.5) ? rng.range(-0.4, 0.4) * w : 0;
        pushBox(geosDark, px, cy - h - 4, pz, len * 0.5, 10, pw * 1.4);
        const pod = pushBox(geosB, px, cy - h - 8 - ph / 2, pz, len * rng.range(0.4, 0.62), ph, pw * 2);
        segments.push(pod);
      }

      // side sponsons
      if (rng.chance(0.6)) {
        const side = rng.chance(0.5) ? 1 : -1;
        const sw = rng.range(10, 20);
        const sponson = pushBox(geosA, cx + rng.range(-0.1, 0.1) * len, cy + rng.range(-0.3, 0.4) * h, side * (w + sw * 0.7), len * rng.range(0.45, 0.7), h * rng.range(0.5, 0.9), sw * 2);
        segments.push(sponson);
      }
    }
    prevH = h; prevW = w;
    x += len - 4; // slight overlap keeps the massing reading as one hull
  }

  // continuous keel so segments never read as floating plates
  pushBox(geosDark, -470, 48, 0, 980, 34, 30);

  // adaptor collar joining the hull chain to the habitat block
  pushBox(geosDark, -6, 58, 0, 44, 100, 130);
  segments.push(pushBox(geosB, -4, 58, 0, 34, 82, 108));

  // --- stern engine block ---
  pushBox(geosA, -985, 55, 0, 80, 130, 110);
  pushBox(geosB, -975, 55, 0, 100, 100, 84);
  const engineY = [30, 55, 80];
  const engineZ = [-32, 0, 32];
  const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0x8fd0ff });
  const engineGlows = [];
  for (const ey of engineY) for (const ez of engineZ) {
    if (Math.abs(ez) > 0 && ey === 55) continue; // 7 nozzles, plus-ish pattern
    const nozzle = new THREE.CylinderGeometry(9, 12, 26, 12);
    nozzle.rotateZ(Math.PI / 2);
    tmpMat.makeTranslation(-1035, ey, ez);
    nozzle.applyMatrix4(tmpMat);
    geosDark.push(nozzle);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(8.4, 16), engineGlowMat);
    disc.position.set(-1049, ey, ez);
    disc.rotation.y = -Math.PI / 2;
    group.add(disc);
    engineGlows.push(disc);
  }

  // --- bow prow beyond the habitat block: tapered cap ---
  pushBox(geosA, 360, 60, 0, 60, 150, 150);
  pushBox(geosB, 405, 60, 0, 40, 110, 110);
  pushBox(geosA, 438, 60, 0, 30, 70, 70);
  segments.push(pushBox(geosB, 360, 148, 0, 46, 26, 60));

  // merge the static hull — 3 draw calls total
  for (const [geos, mat] of [[geosA, matHullA], [geosB, matHullB], [geosDark, matHullDark]]) {
    const merged = mergeGeometries(geos, false);
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // --- greebles: instanced pools scattered on segment faces ---
  const greebleMats = {
    panel: new THREE.MeshStandardMaterial({ color: 0xb4bac2, roughness: 0.6, metalness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x555d66, roughness: 0.75, metalness: 0.4 }),
    pipe: new THREE.MeshStandardMaterial({ color: 0x8d949e, roughness: 0.5, metalness: 0.6 }),
  };
  const pools = [
    { geo: new THREE.BoxGeometry(1, 1, 1), mat: greebleMats.panel, count: 1600, kind: 'panel' },
    { geo: new THREE.BoxGeometry(1, 1, 1), mat: greebleMats.dark, count: 1200, kind: 'vent' },
    { geo: new THREE.CylinderGeometry(0.5, 0.5, 1, 6), mat: greebleMats.pipe, count: 800, kind: 'pipe' },
    { geo: new THREE.CylinderGeometry(0.14, 0.3, 1, 5), mat: greebleMats.dark, count: 300, kind: 'antenna' },
  ];

  const dummy = new THREE.Object3D();
  for (const pool of pools) {
    const inst = new THREE.InstancedMesh(pool.geo, pool.mat, pool.count);
    inst.castShadow = true;
    inst.receiveShadow = true;
    for (let i = 0; i < pool.count; i++) {
      const seg = rng.pick(segments);
      const size = seg.max.clone().sub(seg.min);
      // pick a face: top, +z, or -z (weighted toward sides where the camera looks)
      const face = rng.pick(['top', 'top', 'pz', 'pz', 'nz', 'nz']);
      const px = seg.min.x + rng.next() * size.x;
      dummy.rotation.set(0, 0, 0);
      if (pool.kind === 'antenna') {
        // antennas only on top
        const pz = seg.min.z + rng.next() * size.z;
        const h = rng.range(6, 24);
        dummy.position.set(px, seg.max.y + h / 2, pz);
        dummy.scale.set(1, h, 1);
      } else if (face === 'top') {
        const pz = seg.min.z + rng.next() * size.z;
        const sx = rng.range(3, 16), sy = rng.range(1, 5), sz = rng.range(3, 16);
        dummy.position.set(px, seg.max.y + sy / 2, pz);
        dummy.scale.set(sx, sy, sz);
        if (pool.kind === 'pipe') {
          dummy.rotation.z = Math.PI / 2;
          dummy.scale.set(rng.range(1.5, 3), rng.range(8, size.x * 0.8), rng.range(1.5, 3));
        }
      } else {
        const sign = face === 'pz' ? 1 : -1;
        const py = seg.min.y + rng.next() * size.y;
        const sx = rng.range(3, 14), sy = rng.range(2, 10), sz = rng.range(0.8, 3);
        dummy.position.set(px, py, (sign > 0 ? seg.max.z : seg.min.z) + sign * sz / 2);
        dummy.scale.set(sx, sy, sz);
        if (pool.kind === 'pipe') {
          dummy.rotation.x = Math.PI / 2;
          dummy.scale.set(rng.range(1.2, 2.5), rng.range(1.2, 2.5), rng.range(6, 30));
          dummy.rotation.z = Math.PI / 2;
        }
      }
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  }

  // --- window strips: warm emissive instanced planes in rows on side faces ---
  const winGeo = new THREE.PlaneGeometry(2.2, 1.2);
  const winMat = new THREE.MeshBasicMaterial({});
  winMat.color.setRGB(2.2, 1.75, 1.15); // HDR-hot so bloom catches the strips
  const winCount = 2600;
  const windows = new THREE.InstancedMesh(winGeo, winMat, winCount);
  const winColor = new THREE.Color();
  let wi = 0;
  while (wi < winCount) {
    const seg = rng.pick(segments);
    const size = seg.max.clone().sub(seg.min);
    if (size.x < 20) continue;
    const sign = rng.chance(0.5) ? 1 : -1;
    const rowY = seg.min.y + size.y * rng.range(0.25, 0.85);
    const rowLen = Math.min(rng.range(10, 60), size.x * 0.8);
    const startX = seg.min.x + rng.next() * (size.x - rowLen);
    const n = Math.floor(rowLen / 3);
    for (let k = 0; k < n && wi < winCount; k++) {
      if (rng.chance(0.12)) continue; // gaps make rows read as real windows
      dummy.position.set(startX + k * 3, rowY, (sign > 0 ? seg.max.z : seg.min.z) + sign * 0.25);
      dummy.rotation.set(0, sign > 0 ? 0 : Math.PI, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      windows.setMatrixAt(wi, dummy.matrix);
      winColor.setHSL(rng.chance(0.85) ? 0.09 : 0.55, 0.55, rng.range(0.55, 0.8));
      windows.setColorAt(wi, winColor);
      wi++;
    }
  }
  windows.instanceMatrix.needsUpdate = true;
  if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
  group.add(windows);

  // --- blinking nav lights ---
  const navLights = [];
  const navPositions = [
    [440, 60, 0], [-1000, 125, 0], [-500, 130, 0], [-200, 20, 60],
    [170, 150, 0], [-700, 40, -55], [-350, 90, 55], [330, 150, 30],
  ];
  for (const [nx, ny, nz] of navPositions) {
    const mat = new THREE.SpriteMaterial({
      color: rng.chance(0.5) ? 0xff5544 : 0x66ddff,
      transparent: true, opacity: 1, depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    s.position.set(nx, ny, nz);
    s.scale.setScalar(3.2);
    s.userData.phase = rng.next() * Math.PI * 2;
    s.userData.freq = rng.range(0.6, 1.4);
    group.add(s);
    navLights.push(s);
  }

  // --- scale cues: a couple of shuttles, one drifting ---
  const shuttleMat = new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.5, metalness: 0.3 });
  const shuttles = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 7, 4, 8), shuttleMat);
    body.rotation.z = Math.PI / 2;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 0.4), shuttleMat);
    fin.position.set(-3, 1.6, 0);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.1, 10), new THREE.MeshBasicMaterial({ color: 0x9fd8ff }));
    glow.position.x = -5.6; glow.rotation.y = -Math.PI / 2;
    s.add(body, fin, glow);
    s.position.set(rng.range(-600, 100), rng.range(90, 160), rng.range(120, 220));
    s.userData.drift = new THREE.Vector3(rng.range(3, 10), rng.range(-0.5, 0.5), rng.range(-1, 1));
    group.add(s);
    shuttles.push(s);
  }

  function update(dt, elapsed) {
    for (const nav of navLights) {
      const v = Math.sin(elapsed * Math.PI * nav.userData.freq + nav.userData.phase);
      nav.material.opacity = THREE.MathUtils.clamp(v * 4 - 2.6, 0, 1); // sharp blink
    }
    for (const s of shuttles) {
      s.position.addScaledVector(s.userData.drift, dt);
      if (s.position.x > 500) s.position.x = -900;
    }
    const flicker = 0.92 + Math.sin(elapsed * 31) * 0.04 + Math.sin(elapsed * 7.3) * 0.04;
    engineGlowMat.color.setRGB(0.56 * flicker, 0.82 * flicker, 1.0 * flicker);
  }

  return { group, update };
}

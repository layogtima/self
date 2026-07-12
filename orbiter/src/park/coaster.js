import * as THREE from 'three';

// The orange coaster. One closed CatmullRom loop threading the whole park;
// rails are two tubes offset along the curve's binormal, ties and supports
// are instanced, and a 6-car train rides the arc with height-driven speed.

const TRACK_POINTS = [
  [70, 8, -60], [130, 10, -66], [200, 22, -62], [240, 40, -40],
  [220, 44, -6], [180, 30, 8], [140, 38, -8], [104, 46, -28],
  [70, 34, -40], [50, 18, -18], [58, 9, 12], [96, 7, 30],
  [150, 12, 42], [210, 9, 38], [252, 12, 16], [250, 8, -24],
  [180, 6, -38], [110, 6, -44],
];

export function createCoaster(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const curve = new THREE.CatmullRomCurve3(
    TRACK_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    true, 'centripetal', 0.5
  );

  const SAMPLES = 700;
  const frames = curve.computeFrenetFrames(SAMPLES, true);
  const points = curve.getSpacedPoints(SAMPLES);

  // Frenet frames flip around inflections; smooth normals by forcing a
  // consistent up-ish orientation (parallel-transport-lite).
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= SAMPLES; i++) {
    const t = frames.tangents[i];
    const b = new THREE.Vector3().crossVectors(t, up).normalize();
    if (b.lengthSq() < 0.01) b.set(1, 0, 0);
    const n = new THREE.Vector3().crossVectors(b, t).normalize();
    frames.binormals[i].copy(b);
    frames.normals[i].copy(n);
  }

  const matRail = new THREE.MeshStandardMaterial({ color: 0xe06a1f, roughness: 0.42, metalness: 0.35 });
  const matTie = new THREE.MeshStandardMaterial({ color: 0xb54e14, roughness: 0.6, metalness: 0.3 });
  const matSupport = new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: 0.6, metalness: 0.3 });

  // rails: offset sample points along binormal, rebuild curves, tube them
  for (const side of [-1.05, 1.05]) {
    const railPts = [];
    for (let i = 0; i < SAMPLES; i += 4) {
      railPts.push(points[i].clone().addScaledVector(frames.binormals[i], side));
    }
    const railCurve = new THREE.CatmullRomCurve3(railPts, true);
    const railGeo = new THREE.TubeGeometry(railCurve, 400, 0.22, 5, true);
    const rail = new THREE.Mesh(railGeo, matRail);
    rail.castShadow = true;
    group.add(rail);
  }

  // ties
  const tieStep = 5;
  const tieCount = Math.floor(SAMPLES / tieStep);
  const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(2.9, 0.18, 0.5), matTie, tieCount);
  const dummy = new THREE.Object3D();
  const m3 = new THREE.Matrix4();
  for (let i = 0; i < tieCount; i++) {
    const s = i * tieStep;
    m3.makeBasis(frames.binormals[s], frames.normals[s], frames.tangents[s]);
    dummy.quaternion.setFromRotationMatrix(m3);
    dummy.position.copy(points[s]).addScaledVector(frames.normals[s], -0.25);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    ties.setMatrixAt(i, dummy.matrix);
  }
  ties.castShadow = true;
  group.add(ties);

  // supports: vertical columns down to the deck where track is high enough
  const supportIdx = [];
  for (let i = 0; i < SAMPLES; i += 24) if (points[i].y > 4) supportIdx.push(i);
  const supports = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.6, 1, 8), matSupport, supportIdx.length);
  supportIdx.forEach((s, i) => {
    const p = points[s];
    const h = p.y - 0.6;
    dummy.quaternion.identity();
    dummy.position.set(p.x, h / 2, p.z);
    dummy.scale.set(1, h, 1);
    dummy.updateMatrix();
    supports.setMatrixAt(i, dummy.matrix);
  });
  supports.castShadow = true;
  group.add(supports);

  // --- the train ---
  const CARS = 6;
  const CAR_GAP = 3.6; // meters along track
  const trackLen = curve.getLength();
  const matCar = new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.35, metalness: 0.4 });
  const matSeat = new THREE.MeshStandardMaterial({ color: 0x30353c, roughness: 0.8 });
  const matStripe = new THREE.MeshBasicMaterial({ color: 0xffb054 });
  const cars = [];
  for (let i = 0; i < CARS; i++) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 3.2), matCar);
    body.position.y = 0.7;
    body.castShadow = true;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.4), matSeat);
    seat.position.set(0, 1.35, -1.1);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.2, 3.26), matStripe);
    stripe.position.y = 0.9;
    car.add(body, seat, stripe);
    group.add(car);
    cars.push(car);
  }

  let dist = 0;
  const G = 22; // gamey gravity — speed swings with height
  const V_MIN = 7, V_MAX = 30;
  const maxY = Math.max(...points.map(p => p.y));

  const basis = new THREE.Matrix4();
  const tPos = new THREE.Vector3();

  function frameAt(u) {
    const f = u * SAMPLES;
    const i0 = Math.floor(f) % SAMPLES;
    const i1 = (i0 + 1) % SAMPLES;
    const fr = f - Math.floor(f);
    return {
      p: tPos.copy(points[i0]).lerp(points[i1], fr),
      t: new THREE.Vector3().copy(frames.tangents[i0]).lerp(frames.tangents[i1], fr).normalize(),
      n: new THREE.Vector3().copy(frames.normals[i0]).lerp(frames.normals[i1], fr).normalize(),
      b: new THREE.Vector3().copy(frames.binormals[i0]).lerp(frames.binormals[i1], fr).normalize(),
    };
  }

  function update(dt) {
    const headU = (dist % trackLen) / trackLen;
    const h = curve.getPointAt(headU).y;
    const v = THREE.MathUtils.clamp(Math.sqrt(Math.max(V_MIN * V_MIN, 2 * G * (maxY - h) + 40)), V_MIN, V_MAX);
    dist += v * dt;
    for (let i = 0; i < CARS; i++) {
      const d = dist - i * CAR_GAP;
      const u = ((d % trackLen) + trackLen) % trackLen / trackLen;
      const f = frameAt(u);
      basis.makeBasis(f.b, f.n, f.t);
      cars[i].quaternion.setFromRotationMatrix(basis);
      cars[i].position.copy(f.p).addScaledVector(f.n, 0.35);
    }
  }

  return {
    group, update, curve,
    frameAt, trackLenGetter: () => trackLen,
    attraction: new THREE.Vector3(150, 0, 42),
    // exposed so a rider camera can hitch to the head car later
    getHeadTransform: () => cars[0],
  };
}

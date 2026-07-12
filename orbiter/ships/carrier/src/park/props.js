import * as THREE from 'three';
import { makeRng } from '../rng.js';

// Park furniture: drop tower with a periodically-plummeting carriage, striped
// food stalls, lamp posts, instanced trees, and a balloon cart whose escaped
// balloons drift up toward the ceiling vents. Space physics? Never met her.

export function createProps(scene) {
  const rng = makeRng(777);
  const group = new THREE.Group();
  scene.add(group);

  const matSteel = new THREE.MeshStandardMaterial({ color: 0x9aa4b0, roughness: 0.5, metalness: 0.5 });
  const matGlow = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  const matHolo = new THREE.MeshBasicMaterial({ color: 0x7ee0ff });

  // --- drop tower (west end) ---
  const tower = new THREE.Group();
  tower.position.set(72, 0, -30);
  group.add(tower);
  const towerH = 62;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, towerH, 10), matSteel);
  column.position.y = towerH / 2;
  column.castShadow = true;
  tower.add(column);
  for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.12, 6, 20), matGlow);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 8 + i * 8;
    tower.add(ring);
  }
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 2.6, 3, 10), matSteel);
  crown.position.y = towerH + 1;
  tower.add(crown);
  const crownGlow = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), matHolo);
  crownGlow.position.y = towerH + 3.4;
  tower.add(crownGlow);

  const carriage = new THREE.Group();
  const carriageRing = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 1.6, 10), new THREE.MeshStandardMaterial({ color: 0xd94f30, roughness: 0.5 }));
  carriage.add(carriageRing);
  const seatGeo = new THREE.BoxGeometry(1.1, 1.3, 0.9);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x30353c, roughness: 0.8 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(Math.cos(a) * 3.6, 0.4, Math.sin(a) * 3.6);
    seat.rotation.y = -a;
    carriage.add(seat);
  }
  carriage.position.y = towerH - 4;
  carriage.castShadow = true;
  tower.add(carriage);

  // --- food stalls ---
  const stallSpots = [[120, 26, 0.4], [204, 30, -0.8], [96, -8, 2.2], [232, -34, 1.1], [130, -52, -2.0]];
  const awningColors = ['#e05b41', '#3e78b8', '#e8b64c', '#7bb069'];
  for (let s = 0; s < stallSpots.length; s++) {
    const [sx, sz, ry] = stallSpots[s];
    const stall = new THREE.Group();
    stall.position.set(sx, 0, sz);
    stall.rotation.y = ry;
    const body = new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, 3.4), new THREE.MeshStandardMaterial({ color: 0xf2ead9, roughness: 0.7 }));
    body.position.y = 1.3;
    body.castShadow = true;
    stall.add(body);
    // striped awning
    const cvA = document.createElement('canvas');
    cvA.width = 128; cvA.height = 32;
    const cA = cvA.getContext('2d');
    for (let i = 0; i < 8; i++) {
      cA.fillStyle = i % 2 ? awningColors[s % awningColors.length] : '#f6efe2';
      cA.fillRect(i * 16, 0, 16, 32);
    }
    const awningTex = new THREE.CanvasTexture(cvA);
    awningTex.colorSpace = THREE.SRGBColorSpace;
    const awning = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 2.4), new THREE.MeshStandardMaterial({ map: awningTex, roughness: 0.8 }));
    awning.position.set(0, 3.1, 1.2);
    awning.rotation.x = 0.28;
    stall.add(awning);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 0.1), matGlow);
    sign.position.set(0, 2.9, 1.76);
    stall.add(sign);
    group.add(stall);
  }

  // --- lamp posts along the promenade ---
  const lampPositions = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    lampPositions.push([170 + Math.cos(a) * 62, Math.sin(a) * 42]);
  }
  const lampPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 5.4, 6), matSteel, lampPositions.length);
  const lampBulb = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 8, 6), matGlow, lampPositions.length);
  const dummy = new THREE.Object3D();
  lampPositions.forEach(([lx, lz], i) => {
    dummy.position.set(lx, 2.7, lz);
    dummy.updateMatrix();
    lampPole.setMatrixAt(i, dummy.matrix);
    dummy.position.set(lx, 5.6, lz);
    dummy.updateMatrix();
    lampBulb.setMatrixAt(i, dummy.matrix);
  });
  lampPole.castShadow = true;
  group.add(lampPole, lampBulb);

  // --- trees: instanced trunk + canopy pair ---
  const TREES = 90;
  const trunkInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.22, 0.34, 1, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.9 }),
    TREES
  );
  const canopyInst = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0x5f9e54, roughness: 0.85, flatShading: true }),
    TREES
  );
  const canopyColor = new THREE.Color();
  for (let i = 0; i < TREES; i++) {
    // keep trees off the central plaza and ride pads
    let tx, tz, tries = 0;
    do {
      tx = rng.range(28, 312); tz = rng.range(-74, 74); tries++;
    } while (tries < 8 && ((Math.hypot(tx - 160, tz + 8) < 16) || (Math.hypot(tx - 268, tz + 10) < 18) || (Math.hypot(tx - 72, tz + 30) < 10)));
    const h = rng.range(3.4, 7);
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(tx, h * 0.3, tz);
    dummy.scale.set(1, h * 0.6, 1);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);
    const cr = rng.range(1.4, 2.8);
    dummy.position.set(tx, h * 0.62 + cr * 0.7, tz);
    dummy.scale.setScalar(cr);
    dummy.rotation.y = rng.next() * Math.PI;
    dummy.updateMatrix();
    canopyInst.setMatrixAt(i, dummy.matrix);
    canopyColor.setHSL(0.28 + rng.next() * 0.09, 0.45, 0.32 + rng.next() * 0.18);
    canopyInst.setColorAt(i, canopyColor);
  }
  trunkInst.castShadow = true;
  canopyInst.castShadow = true;
  group.add(trunkInst, canopyInst);

  // --- balloon cart + escaped balloons ---
  const cart = new THREE.Group();
  cart.position.set(178, 0, 22);
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1), new THREE.MeshStandardMaterial({ color: 0xe05b41, roughness: 0.6 }));
  cartBody.position.y = 0.9;
  cart.add(cartBody);
  const balloonMats = [0xff5a6e, 0x59c1ff, 0xffd24a, 0x8de08a, 0xd48aff].map(
    c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.05 })
  );
  const balloons = [];
  const balloonGeo = new THREE.SphereGeometry(0.5, 10, 8);
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(balloonGeo, balloonMats[i % balloonMats.length]);
    const escaped = i > 5;
    b.position.set(
      178 + rng.range(-1.2, 1.2),
      escaped ? rng.range(12, 70) : 2.6 + rng.range(0, 1.4),
      22 + rng.range(-1, 1)
    );
    b.userData = { escaped, vy: escaped ? rng.range(0.8, 1.8) : 0, phase: rng.next() * 6 };
    group.add(b);
    balloons.push(b);
  }
  group.add(cart);

  // drop tower cycle: creep up, hang, PLUMMET, rest
  let cyc = rng.next() * 20;
  function update(dt, elapsed) {
    cyc += dt;
    const T = 22; // full cycle seconds
    const t = cyc % T;
    let y;
    if (t < 10) y = 4 + (t / 10) * (towerH - 8);            // slow climb
    else if (t < 13) y = towerH - 4;                        // dangle at the top
    else if (t < 13.9) {                                    // the drop
      const f = (t - 13) / 0.9;
      y = (towerH - 4) - f * f * (towerH - 8);
    } else y = 4;                                           // load/unload
    carriage.position.y = y;
    carriage.rotation.y = elapsed * 0.4;

    for (const b of balloons) {
      if (b.userData.escaped) {
        b.position.y += b.userData.vy * dt;
        b.position.x += Math.sin(elapsed * 0.7 + b.userData.phase) * dt * 0.6;
        if (b.position.y > 126) b.position.y = 8; // recycled by unseen vents
      } else {
        b.position.y = 2.6 + Math.sin(elapsed * 1.1 + b.userData.phase) * 0.25;
      }
    }
  }

  return {
    group, update,
    attraction: new THREE.Vector3(72, 0, -18),
  };
}

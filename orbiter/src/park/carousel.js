import * as THREE from 'three';

// The golden carousel — the warm heart of the money shot. Striped canopy,
// glowing core, bobbing horses on brass poles.

export function createCarousel(scene, { position = new THREE.Vector3(160, 0, -8) } = {}) {
  const group = new THREE.Group();
  group.position.copy(position);
  scene.add(group);

  const R = 9;

  // striped canopy texture
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 128;
  const ctx = cv.getContext('2d');
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? '#e8b64c' : '#f6efe2';
    ctx.fillRect(i * 32, 0, 32, 128);
  }
  const stripeTex = new THREE.CanvasTexture(cv);
  stripeTex.colorSpace = THREE.SRGBColorSpace;

  const matBase = new THREE.MeshStandardMaterial({ color: 0xf0e6d4, roughness: 0.6 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xd9a13c, roughness: 0.3, metalness: 0.6 });
  const matCanopy = new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.7 });
  const matGlow = new THREE.MeshBasicMaterial({ color: 0xf0bd78 });

  // platform
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 1, R + 1.4, 0.8, 24), matBase);
  base.position.y = 0.4;
  base.receiveShadow = true;
  group.add(base);

  const spinner = new THREE.Group();
  spinner.position.y = 0.8;
  group.add(spinner);

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.3, 24), matGold);
  deck.position.y = 0.15;
  spinner.add(deck);

  // glowing center column
  const core = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 6.4, 12), matGlow);
  core.position.y = 3.4;
  spinner.add(core);
  const coreTrim = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.5, 12), matGold);
  coreTrim.position.y = 6.6;
  spinner.add(coreTrim);

  // canopy + finial
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(R + 1.6, 3.4, 24), matCanopy);
  canopy.position.y = 8.6;
  canopy.castShadow = true;
  spinner.add(canopy);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), matGlow);
  finial.position.y = 10.8;
  spinner.add(finial);

  // canopy edge bulbs
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 6, 5), matGlow, 20);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * (R + 1.2), 7.0, Math.sin(a) * (R + 1.2));
    dummy.updateMatrix();
    bulbs.setMatrixAt(i, dummy.matrix);
  }
  spinner.add(bulbs);

  // horses: stylized — capsule body, sphere head, brass pole
  const HORSES = 10;
  const horses = [];
  const horseColors = [0xdb5a44, 0x4a86c4, 0xd9a13c, 0x7bb069, 0xb46bb8];
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.4, 6);
  for (let i = 0; i < HORSES; i++) {
    const a = (i / HORSES) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.position.set(Math.cos(a) * (R - 1.6), 0, Math.sin(a) * (R - 1.6));
    holder.rotation.y = -a + Math.PI / 2;

    const pole = new THREE.Mesh(poleGeo, matGold);
    pole.position.y = 3.4;
    holder.add(pole);

    const horse = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: horseColors[i % horseColors.length], roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.2, 4, 8), mat);
    body.rotation.z = Math.PI / 2;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), mat);
    head.position.set(0.95, 0.42, 0);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.26), mat);
    snout.position.set(1.25, 0.32, 0);
    const legGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.9, 5);
    for (const [lx, lz] of [[-0.5, 0.2], [-0.5, -0.2], [0.5, 0.2], [0.5, -0.2]]) {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(lx, -0.75, lz);
      leg.rotation.x = lx > 0 ? 0.25 : -0.25;
      horse.add(leg);
    }
    horse.add(body, head, snout);
    horse.position.y = 2.2;
    horse.castShadow = true;
    holder.add(horse);
    holder.userData.horse = horse;
    holder.userData.phase = (i / HORSES) * Math.PI * 2;
    spinner.add(holder);
    horses.push(holder);
  }

  const SPEED = 0.42;
  function update(dt, elapsed) {
    spinner.rotation.y += SPEED * dt;
    for (const h of horses) {
      h.userData.horse.position.y = 2.2 + Math.sin(elapsed * 2.2 + h.userData.phase) * 0.55;
    }
  }

  return { group, update, attraction: new THREE.Vector3(position.x, 0, position.z + 14) };
}

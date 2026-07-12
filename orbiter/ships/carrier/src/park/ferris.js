import * as THREE from 'three';

// The big wheel, park's east anchor. Rim + spokes spin as one group; gondolas
// hang from rim pivots and counter-rotate every frame so they stay upright.

export function createFerris(scene, { position = new THREE.Vector3(268, 0, -10) } = {}) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = Math.PI / 2; // wheel plane faces the viewport
  scene.add(group);

  const R = 34;
  const hubY = R + 8;

  const matSteel = new THREE.MeshStandardMaterial({ color: 0x5a7a9c, roughness: 0.45, metalness: 0.6 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xd9a13c, roughness: 0.35, metalness: 0.55 });
  const matBulb = new THREE.MeshBasicMaterial({ color: 0xffd27a });

  // support A-frames
  for (const side of [-3.6, 3.6]) {
    for (const lean of [-0.42, 0.42]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, hubY / Math.cos(lean) + 2, 8), matSteel);
      leg.position.set(Math.tan(lean) * hubY * 0.5, hubY / 2, side);
      leg.rotation.z = lean;
      leg.castShadow = true;
      group.add(leg);
    }
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 10, 12), matGold);
  axle.rotation.x = Math.PI / 2;
  axle.position.y = hubY;
  group.add(axle);

  // spinning assembly
  const wheel = new THREE.Group();
  wheel.position.y = hubY;
  group.add(wheel);

  for (const z of [-2.6, 2.6]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.7, 8, 56), matSteel);
    rim.position.z = z;
    rim.castShadow = true;
    wheel.add(rim);
    const rimInner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.55, 0.45, 6, 40), matSteel);
    rimInner.position.z = z;
    wheel.add(rimInner);
  }

  const spokeGeo = new THREE.CylinderGeometry(0.28, 0.28, R * 2, 6);
  for (let i = 0; i < 8; i++) {
    for (const z of [-2.6, 2.6]) {
      const spoke = new THREE.Mesh(spokeGeo, matSteel);
      spoke.rotation.z = (i / 8) * Math.PI;
      spoke.position.z = z;
      wheel.add(spoke);
    }
  }

  // rim bulbs — warm dots the bloom loves
  const bulbCount = 36;
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.55, 6, 5), matBulb, bulbCount * 2);
  const dummy = new THREE.Object3D();
  let bi = 0;
  for (let i = 0; i < bulbCount; i++) {
    const a = (i / bulbCount) * Math.PI * 2;
    for (const z of [-2.6, 2.6]) {
      dummy.position.set(Math.cos(a) * R, Math.sin(a) * R, z);
      dummy.updateMatrix();
      bulbs.setMatrixAt(bi++, dummy.matrix);
    }
  }
  wheel.add(bulbs);

  // gondolas: pivot at rim, cabin hangs below pivot, counter-rotated upright
  const gondolas = [];
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xd94f30, roughness: 0.5, metalness: 0.2 });
  const cabinMat2 = new THREE.MeshStandardMaterial({ color: 0x3e78b8, roughness: 0.5, metalness: 0.2 });
  const cabinGeo = new THREE.BoxGeometry(3.4, 2.6, 3.4);
  const roofGeo = new THREE.ConeGeometry(2.7, 1.4, 8);
  const armGeo = new THREE.CylinderGeometry(0.16, 0.16, 2.2, 6);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    const cab = new THREE.Group();
    const arm = new THREE.Mesh(armGeo, matSteel);
    arm.position.y = -1.1;
    const cabin = new THREE.Mesh(cabinGeo, i % 2 ? cabinMat : cabinMat2);
    cabin.position.y = -3.4;
    cabin.castShadow = true;
    const roof = new THREE.Mesh(roofGeo, matGold);
    roof.position.y = -1.9;
    cab.add(arm, cabin, roof);
    pivot.add(cab);
    wheel.add(pivot);
    gondolas.push(pivot);
  }

  const SPEED = 0.14;
  function update(dt) {
    wheel.rotation.z += SPEED * dt;
    for (const g of gondolas) g.rotation.z = -wheel.rotation.z;
  }

  return { group, update, attraction: new THREE.Vector3(position.x - 12, 0, position.z) };
}

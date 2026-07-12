import * as THREE from 'three';

// Build mode: the first sliver of the Sim-Theme-Park loop. Ghost preview of a
// Gravity Whirl (teacups) tracks the deck under the cursor; click to place,
// pay hexbits, guests stampede toward it.

const COST = 6000;
const EXCLUSIONS = [
  { x: 160, z: -8, r: 15 },   // carousel
  { x: 268, z: -10, r: 20 },  // ferris
  { x: 72, z: -30, r: 12 },   // drop tower
];
const DECK = { x0: 34, x1: 308, z0: -70, z1: 70 };

function buildTeacups(holo = false) {
  const group = new THREE.Group();
  const mat = (color, extra = {}) => holo
    ? new THREE.MeshBasicMaterial({ color: 0x7ee0ff, transparent: true, opacity: 0.35, depthWrite: false })
    : new THREE.MeshStandardMaterial({ color, roughness: 0.45, ...extra });

  const platter = new THREE.Group();
  platter.position.y = 0.5;
  group.add(platter);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.6, 1, 20), mat(0x8ad2cf));
  base.position.y = -0.05;
  base.castShadow = !holo;
  platter.add(base);

  const cupColors = [0xff5a6e, 0x59c1ff, 0xffd24a, 0x8de08a, 0xd48aff, 0xf0f0ee];
  const cups = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const cup = new THREE.Group();
    cup.position.set(Math.cos(a) * 4.6, 0.5, Math.sin(a) * 4.6);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.05, 1.6, 14, 1, true), mat(cupColors[i], { side: THREE.DoubleSide }));
    wall.castShadow = !holo;
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 14), mat(cupColors[i]));
    floor.position.y = -0.75;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.14, 6, 12), mat(cupColors[i]));
    handle.position.set(1.7, 0, 0);
    cup.add(wall, floor, handle);
    platter.add(cup);
    cups.push(cup);
  }

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 4.4, 10), mat(0xd9a13c, { metalness: 0.6 }));
  pole.position.y = 2.2;
  platter.add(pole);
  const topper = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 10, 8),
    holo ? mat() : new THREE.MeshBasicMaterial({ color: 0xffd27a })
  );
  topper.position.y = 4.8;
  platter.add(topper);

  group.userData.spin = (dt) => {
    platter.rotation.y += dt * 0.9;
    for (const c of cups) c.rotation.y -= dt * 3.2;
  };
  return group;
}

export function createBuildMode(scene, camera, dom, { guests, getCredits, spendCredits, toast, onPlaced }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  const ghost = buildTeacups(true);
  ghost.visible = false;
  scene.add(ghost);

  const placed = [];
  let active = false;
  let validSpot = null; // null forces the first tint pass

  function isValid(p) {
    if (p.x < DECK.x0 || p.x > DECK.x1 || p.z < DECK.z0 || p.z > DECK.z1) return false;
    for (const e of EXCLUSIONS) if (Math.hypot(p.x - e.x, p.z - e.z) < e.r) return false;
    for (const r of placed) if (Math.hypot(p.x - r.position.x, p.z - r.position.z) < 17) return false;
    return true;
  }

  function setGhostTint(ok) {
    ghost.traverse((o) => {
      if (o.isMesh) o.material.color.setHex(ok ? 0x7ee0ff : 0xff4d5e);
    });
  }

  dom.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  });

  dom.addEventListener('pointerdown', (e) => {
    if (!active || e.button !== 0 || !ghost.visible) return;
    if (!validSpot) { toast('⚠ can’t build there, sugar'); return; }
    if (getCredits() < COST) { toast('⚠ insufficient hexbits'); return; }
    spendCredits(COST);
    const ride = buildTeacups(false);
    ride.position.copy(ghost.position);
    scene.add(ride);
    placed.push(ride);
    guests.addAttraction(ride.position, { announce: true });
    toast('GRAVITY WHIRL ONLINE — guests inbound');
    onPlaced(placed.length);
  });

  function update(dt) {
    for (const r of placed) r.userData.spin(dt);
    if (!active) { ghost.visible = false; return; }
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(floorPlane, hit)) {
      ghost.visible = true;
      ghost.position.set(hit.x, 0, hit.z);
      ghost.userData.spin(dt);
      const ok = isValid(hit);
      if (ok !== validSpot) { validSpot = ok; setGhostTint(ok); }
    } else {
      ghost.visible = false;
    }
  }

  return {
    update,
    setActive(v) { active = v; if (!v) ghost.visible = false; },
    isActive: () => active,
    placedCount: () => placed.length,
  };
}

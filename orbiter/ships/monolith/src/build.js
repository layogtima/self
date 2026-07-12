import * as THREE from 'three';
import { pointInPoly, hexPoints } from './regions.js';
import { buildArcadeDome, buildChurroDiner, buildObservationLounge, buildHoloTheater, blinkIn } from './rooms.js';

// Build mode with a palette: rides AND rooms, blinked onto any deck. Ghost
// preview tracks the deck floor; click places, pays hexbits, registers walk
// obstacles + (if guests exist) an attraction. Structures pop in with gsap.

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

  group.userData = {
    name: 'Gravity Whirl', radius: 9,
    obstacles: [{ dx: 0, dz: 0, r: 9 }],
    spin: (dt) => {
      platter.rotation.y += dt * 0.9;
      for (const c of cups) c.rotation.y -= dt * 3.2;
    },
  };
  return group;
}

export const CATALOG = [
  { key: 'whirl', name: 'Gravity Whirl', cost: 6000, icon: '☕', factory: buildTeacups },
  { key: 'arcade', name: 'Arcade Dome', cost: 9000, icon: '◒', factory: buildArcadeDome },
  { key: 'diner', name: 'Churro Diner', cost: 4500, icon: '⌂', factory: buildChurroDiner },
  { key: 'lounge', name: 'Observation Lounge', cost: 12000, icon: '◍', factory: buildObservationLounge },
  { key: 'theater', name: 'Holo-Theater', cost: 15000, icon: '▭', factory: buildHoloTheater },
];

export function createBuildMode(scene, camera, dom, { cells, guests, obstacles, getCredits, spendCredits, toast, onPlaced, groundY }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  const placed = [];
  let active = false;
  let item = CATALOG[0];
  let ghost = null;
  let validSpot = null;

  function makeGhost() {
    if (ghost) scene.remove(ghost);
    ghost = item.factory(true);
    ghost.visible = false;
    scene.add(ghost);
    validSpot = null;
  }
  makeGhost();

  function isValid(p) {
    const r = ghost.userData.radius;
    // structure must fit inside a cell: check a poly inset by its radius
    const inCell = cells.some((c) =>
      pointInPoly(hexPoints(c.def.x, c.def.z, c.def.R, r + 6), p.x, p.z));
    if (!inCell) return false;
    for (const s of placed) {
      if (Math.hypot(p.x - s.position.x, p.z - s.position.z) < r + s.userData.radius) return false;
    }
    return true;
  }

  function setGhostTint(ok) {
    ghost.traverse((o) => {
      if (o.isMesh) o.material.color?.setHex(ok ? 0x7ee0ff : 0xff4d5e);
    });
  }

  dom.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  });

  dom.addEventListener('pointerdown', (e) => {
    if (!active || e.button !== 0 || !ghost.visible) return;
    if (!validSpot) { toast('⚠ not there — the geometry disagrees'); return; }
    if (getCredits() < item.cost) { toast('⚠ insufficient hexbits'); return; }
    spendCredits(item.cost);
    const structure = item.factory(false);
    structure.position.copy(ghost.position);
    structure.position.y = groundY?.(ghost.position.x, ghost.position.z) ?? 0;
    scene.add(structure);
    blinkIn(structure);
    placed.push(structure);
    for (const o of structure.userData.obstacles) {
      obstacles.push({ x: structure.position.x + o.dx, z: structure.position.z + o.dz, r: o.r });
    }
    guests?.addAttraction(structure.position, { announce: true });
    toast(`${structure.userData.name.toUpperCase()} ONLINE`);
    onPlaced(placed.length, item);
  });

  function update(dt) {
    for (const s of placed) s.userData.spin?.(dt);
    if (!active) { if (ghost) ghost.visible = false; return; }
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(floorPlane, hit)) {
      ghost.visible = true;
      ghost.position.set(hit.x, groundY?.(hit.x, hit.z) ?? 0, hit.z);
      ghost.userData.spin?.(dt);
      const ok = isValid(hit);
      if (ok !== validSpot) { validSpot = ok; setGhostTint(ok); }
    } else {
      ghost.visible = false;
    }
  }

  // Nova's freebie: conjure a structure at a random valid spot, no hexbits
  function placeRandom(key) {
    const c = key ? CATALOG.find((x) => x.key === key) : CATALOG[Math.floor(Math.random() * CATALOG.length)];
    const probe = c.factory(true);
    const r = probe.userData.radius;
    for (let tries = 0; tries < 60; tries++) {
      const cell = cells[Math.floor(Math.random() * cells.length)];
      const p = new THREE.Vector3(
        cell.def.x + (Math.random() * 2 - 1) * (cell.def.R - r - 8),
        0,
        cell.def.z + (Math.random() * 2 - 1) * (cell.def.R - r - 8)
      );
      if (!pointInPoly(hexPoints(cell.def.x, cell.def.z, cell.def.R, r + 6), p.x, p.z)) continue;
      const clash = placed.some((s) => Math.hypot(p.x - s.position.x, p.z - s.position.z) < r + s.userData.radius);
      if (clash) continue;
      const structure = c.factory(false);
      structure.position.copy(p);
      structure.position.y = groundY?.(p.x, p.z) ?? 0;
      scene.add(structure);
      blinkIn(structure);
      placed.push(structure);
      for (const o of structure.userData.obstacles) {
        obstacles.push({ x: p.x + o.dx, z: p.z + o.dz, r: o.r });
      }
      guests?.addAttraction(p, { announce: true });
      onPlaced(placed.length, c);
      return { name: structure.userData.name, cell: cell.def.name };
    }
    return null;
  }

  return {
    update,
    setActive(v) { active = v; if (!v && ghost) ghost.visible = false; },
    isActive: () => active,
    setItem(key) {
      const next = CATALOG.find((c) => c.key === key);
      if (next) { item = next; makeGhost(); }
      return item;
    },
    getItem: () => item,
    placeRandom,
    placedCount: () => placed.length,
  };
}

// world.js — cavern builder. Boxes for walls/rocks (cheap AABB collision),
// region-based floors so we can carve chasms (no floor = you fall) and later
// switch bridge regions on. Decorative stalagmites add cave texture.
import * as THREE from 'three';

const rockMat = new THREE.MeshStandardMaterial({ color: '#333a4a', roughness: 1, metalness: 0 });
const rockMat2 = new THREE.MeshStandardMaterial({ color: '#39404f', roughness: 0.95, metalness: 0.02 });
const floorMat = new THREE.MeshStandardMaterial({ color: '#2b3240', roughness: 1, metalness: 0 });

export function makeWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const colliders = [];
  const floors = [];

  function floorAt(x, z) {
    let h = -60; // the void — falling below this = death/respawn
    for (const f of floors) {
      if (!f.active) continue;
      if (x >= f.minX && x <= f.maxX && z >= f.minZ && z <= f.maxZ) h = Math.max(h, f.y);
    }
    return h;
  }

  // a walkable floor rectangle (also its visible slab). Returns the region so
  // callers can toggle `.active`/visibility (used by light-bridges).
  function addFloor(cx, cz, w, d, y = 0, opts = {}) {
    const region = { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2, y, active: opts.active !== false };
    floors.push(region);
    let mesh = null;
    if (!opts.invisible) {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), opts.mat || floorMat);
      mesh.position.set(cx, y - 0.2, cz);
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    region.mesh = mesh;
    return region;
  }

  // solid box (wall / block) with matching collider
  function addBox(cx, cy, cz, w, h, d, mat = rockMat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    box._mesh = mesh;
    colliders.push(box);
    return { mesh, box };
  }

  // four perimeter walls around a rectangular room
  function addRoom(cx, cz, w, d, h = 6) {
    const th = 1;
    addBox(cx, h / 2, cz - d / 2 - th / 2, w + th * 2, h, th); // back
    addBox(cx, h / 2, cz + d / 2 + th / 2, w + th * 2, h, th); // front
    addBox(cx - w / 2 - th / 2, h / 2, cz, th, h, d);          // left
    addBox(cx + w / 2 + th / 2, h / 2, cz, th, h, d);          // right
    // low ceiling to feel enclosed (fog hides its far edges)
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(w + 2, 0.6, d + 2), rockMat2);
    ceil.position.set(cx, h, cz);
    group.add(ceil);
  }

  // decorative stalagmite (thin cone) — some get colliders so they matter
  function addRock(x, z, y = 0, scale = 1, solid = false) {
    const hgt = (1.2 + Math.random() * 1.6) * scale;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35 * scale, hgt, 6), rockMat);
    cone.position.set(x, y + hgt / 2, z);
    cone.castShadow = true; cone.rotation.y = Math.random() * Math.PI;
    group.add(cone);
    if (solid) {
      const box = new THREE.Box3().setFromObject(cone);
      colliders.push(box);
    }
    return cone;
  }

  // ---- glow-crystal cluster: a landmark + a soft ambient light so caverns
  // are navigable and beautiful (cave bioluminescence, not gamey lamps) ----
  function addCrystal(x, z, color = '#3a7bff', y = 0, scale = 1) {
    const col = new THREE.Color(color);
    const cl = new THREE.Group();
    cl.position.set(x, y, z);
    const mat = new THREE.MeshStandardMaterial({ color: '#0a0c12', emissive: col, emissiveIntensity: 2.1, roughness: 0.3, flatShading: true });
    const shards = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < shards; i++) {
      const h = (0.6 + Math.random() * 1.3) * scale;
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.13 * scale, h, 5), mat);
      const a = Math.random() * Math.PI * 2, rr = Math.random() * 0.3 * scale;
      m.position.set(Math.cos(a) * rr, h / 2, Math.sin(a) * rr);
      m.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * 6.28, (Math.random() - 0.5) * 0.6);
      cl.add(m);
    }
    const light = new THREE.PointLight(col, 3.6 * scale, 17 * scale, 1.5);
    light.position.y = 0.9 * scale;
    cl.add(light);
    group.add(cl);
    return cl;
  }

  // stalactite hanging from the ceiling (visual only — adds cave depth)
  function addStalactite(x, z, ceilY = 6, scale = 1) {
    const h = (0.8 + Math.random() * 1.6) * scale;
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.28 * scale, h, 6), rockMat2);
    c.position.set(x, ceilY - h / 2, z);
    c.rotation.set(Math.PI, Math.random() * Math.PI, 0);
    group.add(c);
    return c;
  }

  // sprinkle stalagmites (floor) + stalactites (ceiling) to dress a cavern
  function decorate(cx, cz, w, d, n = 8, ceilY = 6) {
    for (let i = 0; i < n; i++) {
      const x = cx + (Math.random() * 2 - 1) * w * 0.5;
      const z = cz + (Math.random() * 2 - 1) * d * 0.5;
      if (Math.random() < 0.55) addRock(x, z, 0, 0.7 + Math.random() * 0.9);
      else addStalactite(x, z, ceilY, 0.7 + Math.random() * 0.8);
    }
  }

  // glowing rim strip to telegraph a chasm edge (so falls are never a surprise)
  function addEdge(cx, cz, w, d, color = '#6fd6ff', y = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), new THREE.MeshStandardMaterial({ color: '#0a0c12', emissive: new THREE.Color(color), emissiveIntensity: 1.6, roughness: 0.4 }));
    m.position.set(cx, y + 0.02, cz);
    group.add(m);
    return m;
  }

  return { group, colliders, floors, floorAt, addFloor, addBox, addRoom, addRock, addStalactite, decorate, addCrystal, addEdge, rockMat, floorMat };
}

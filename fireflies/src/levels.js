// levels.js — three wordless caverns. You always begin already holding a small
// swarm (light around you). Progress is discovered by bringing the right colour
// of firefly close to the matching glowing node — no text, no keypress.
//   L1 Awakening   — gather Glimmers, bring them to the amber node, a gate opens.
//   L2 Broken Span — gather Wisps to reveal a light-bridge across a chasm.
//   L3 The Gloom   — Ember burns a barrier, Wisp bridges, Glimmer opens the way.
import * as THREE from 'three';
import { makeWorld } from './world.js';
import { makeSocket, makeGate, makeLightBridge, makeGloom, makeExit } from './puzzles.js';

function scatter(fireflies, species, cx, cz, n, rx, rz, y = 1.9) {
  for (let i = 0; i < n; i++) {
    fireflies.spawn(species, cx + (Math.random() * 2 - 1) * rx, y + (Math.random() * 2 - 1) * 0.7, cz + (Math.random() * 2 - 1) * rz);
  }
}
// the swarm you start each level already carrying
function startSwarm(fireflies, species, n, spawn) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    fireflies.spawn(species, spawn.x + Math.cos(a) * 1.4, spawn.y + 0.2, spawn.z + Math.sin(a) * 1.4, true);
  }
}

// ---------------------------------------------------------------- L1
function buildL1(root, fireflies) {
  const world = makeWorld(root);
  world.addFloor(0, -7, 14, 36);            // one contiguous hall x[-7,7] z[-25,11]
  world.addFloor(0, -27, 6, 6);             // exit alcove z[-30,-24]

  world.addBox(0, 3, 11.5, 16, 6, 1);       // south
  world.addBox(-7.5, 3, -7, 1, 6, 36);      // west
  world.addBox(7.5, 3, -7, 1, 6, 36);       // east
  world.addBox(-4.75, 3, -25, 5.5, 6, 1);   // north (doorway gap x[-2,2])
  world.addBox(4.75, 3, -25, 5.5, 6, 1);
  world.addBox(0, 3, -30.5, 7, 6, 1);       // far wall
  world.addBox(-3.5, 3, -27, 1, 6, 6);
  world.addBox(3.5, 3, -27, 1, 6, 6);
  world.decorate(0, -7, 13, 34, 12);

  // ambient landmarks so the hall is readable
  world.addCrystal(-6.4, 2, '#2ad0c0', 0, 1.1);
  world.addCrystal(6.4, -10, '#5a7bff', 0, 1.0);
  world.addCrystal(-6.4, -18, '#ffb648', 0, 0.9);

  const gate = makeGate(world, { x: 0, z: -25, w: 3, h: 5, d: 0.8 });
  const node = makeSocket(root, { species: 'glimmer', need: 5, x: 0, z: -8 });
  const exit = makeExit(root, { x: 0, z: -27 });
  node.onSolve(() => { gate.open(); exit.activate(); });

  const spawn = new THREE.Vector3(0, 1.62, 7);
  startSwarm(fireflies, 'glimmer', 5, spawn);
  scatter(fireflies, 'glimmer', 0, -6, 14, 5.5, 12);

  return {
    spawn, spawnYaw: 0, colliders: world.colliders, floorAt: world.floorAt,
    sockets: [node], props: [node, gate, exit], exit,
  };
}

// ---------------------------------------------------------------- L2
function buildL2(root, fireflies) {
  const world = makeWorld(root);
  world.addFloor(0, 11, 16, 10);   // near platform z[6,16]
  world.addFloor(0, -11, 16, 10);  // far platform z[-16,-6]   (chasm z[-6,6])

  world.addBox(-8.5, 3, 0, 1, 6, 34);
  world.addBox(8.5, 3, 0, 1, 6, 34);
  world.addBox(0, 3, 16.5, 18, 6, 1);
  world.addBox(0, 3, -16.5, 18, 6, 1);
  world.decorate(0, 11, 15, 9, 6);
  world.decorate(0, -11, 15, 9, 6);

  // glowing rims telegraph the chasm; crystals light both banks
  world.addEdge(0, 6.2, 15, 0.2, '#6fd6ff');
  world.addEdge(0, -6.2, 15, 0.2, '#6fd6ff');
  world.addCrystal(-7, 13, '#5a7bff', 0, 1.1);
  world.addCrystal(7, 13, '#2ad0c0', 0, 1.0);
  world.addCrystal(-7, -13, '#5a7bff', 0, 1.1);
  world.addCrystal(7, -13, '#ffb648', 0, 1.0);

  const bridge = makeLightBridge(root, world, { cx: 0, cz: 0, w: 4.5, d: 12 });
  const node = makeSocket(root, { species: 'wisp', need: 3, x: 0, z: 9 });
  const exit = makeExit(root, { x: 0, z: -12 });
  node.onSolve(() => { bridge.reveal(); exit.activate(); });

  const spawn = new THREE.Vector3(0, 1.62, 15);
  startSwarm(fireflies, 'glimmer', 5, spawn);
  scatter(fireflies, 'wisp', 0, 11, 10, 6, 3);
  scatter(fireflies, 'glimmer', -4, 11, 4, 3, 3);

  return {
    spawn, spawnYaw: 0, colliders: world.colliders, floorAt: world.floorAt,
    sockets: [node], props: [node, bridge, exit], exit,
  };
}

// ---------------------------------------------------------------- L3
function buildL3(root, fireflies) {
  const world = makeWorld(root);
  world.addFloor(0, 14, 14, 12);    // start hall z[8,20]
  world.addFloor(0, 3, 14, 10);     // mid z[-2,8]
  world.addFloor(0, -13, 14, 10);   // far z[-18,-8]  (chasm z[-8,-2])
  world.addFloor(0, -21, 6, 6);     // exit alcove z[-24,-18]

  world.addBox(-7.5, 3, -2, 1, 6, 44);
  world.addBox(7.5, 3, -2, 1, 6, 44);
  world.addBox(0, 3, 20.5, 16, 6, 1);
  world.addBox(-4.5, 3, -18, 5, 6, 1);   // far wall w/ exit doorway
  world.addBox(4.5, 3, -18, 5, 6, 1);
  world.addBox(0, 3, -24.5, 7, 6, 1);
  world.addBox(-3.5, 3, -21, 1, 6, 6);
  world.addBox(3.5, 3, -21, 1, 6, 6);
  world.decorate(0, 14, 13, 11, 7);
  world.decorate(0, -13, 13, 9, 6);

  world.addEdge(0, -2.2, 13, 0.2, '#6fd6ff');
  world.addEdge(0, -7.8, 13, 0.2, '#6fd6ff');
  world.addCrystal(-6.4, 15, '#ff6a8f', 0, 1.0);
  world.addCrystal(6.4, 4, '#5a7bff', 0, 1.0);
  world.addCrystal(-6.4, -13, '#ffb648', 0, 1.0);

  const gloom = makeGloom(root, world, { x: 0, z: 8, w: 5, h: 5, d: 1.2 });
  const bridge = makeLightBridge(root, world, { cx: 0, cz: -5, w: 4.5, d: 6 });
  const gate = makeGate(world, { x: 0, z: -18, w: 3, h: 5, d: 0.8 });
  const exit = makeExit(root, { x: 0, z: -21 });

  const emberNode = makeSocket(root, { species: 'ember', need: 3, x: 0, z: 13 });
  const wispNode = makeSocket(root, { species: 'wisp', need: 3, x: 0, z: 3 });
  const glimNode = makeSocket(root, { species: 'glimmer', need: 3, x: 0, z: -13 });
  emberNode.onSolve(() => gloom.burn());
  wispNode.onSolve(() => bridge.reveal());
  glimNode.onSolve(() => { gate.open(); exit.activate(); });

  const spawn = new THREE.Vector3(0, 1.62, 19);
  startSwarm(fireflies, 'glimmer', 5, spawn);
  scatter(fireflies, 'ember', 0, 13, 7, 5, 4);
  scatter(fireflies, 'wisp', 0, 3, 7, 5, 3);
  scatter(fireflies, 'glimmer', 0, -13, 6, 5, 3);

  return {
    spawn, spawnYaw: 0, colliders: world.colliders, floorAt: world.floorAt,
    sockets: [emberNode, wispNode, glimNode],
    props: [emberNode, wispNode, glimNode, gloom, bridge, gate, exit], exit,
  };
}

export const LEVELS = [buildL1, buildL2, buildL3];

import * as THREE from 'three';
import { A, FIELD, GROW, RING_DOOR, RING_DOOR_S, OCT_EDGE, HALL, CHAMBER } from './config.js';
import {
  DIRS, slotCenter, makeOctagonPiece, makeHallPiece, riseIn,
  ringDoorWall, solidWall,
} from './cells.js';
import { MATS } from './orokin.js';
import { vineOverDoor } from './flora.js';
import { makeRng } from './rng.js';

// The growth engine. A square grid of slots; the Atrium holds (0,0), the
// bays hold their marked slots. NOVA grows Chambers and Halls into empty
// slots adjacent to a CONNECTABLE face; ring doorways are cut automatically
// through every new shared boundary. Walk regions, build cells, teleports
// and discovery all reference the live registries this module mutates.

const key = (c, r) => `${c},${r}`;

export function createGrowth(scene, camera, dom, deps) {
  // deps: { walkRegions, buildCells, obstacles, toast, sfx, novaSay, nova,
  //         getCredits, spendCredits, isGrowAllowed() (mode check) }
  const grid = new Map();
  const rng = makeRng(808);
  const grownLore = [
    'A new chamber. It smells of possibility and fresh vacuum.',
    'Grown. The hull grumbled about it. I overruled the hull.',
    'There. Space we didn\'t have a minute ago. My favourite kind.',
    'It\'s empty. That\'s not a flaw, Director — that\'s an invitation.',
  ];
  const hallLore = [
    'A hallway. Somewhere to be between somewheres.',
    'Grown. Walk it slowly at least once.',
  ];

  function register(piece) {
    grid.set(key(piece.col, piece.row), piece);
  }

  function pieceAt(c, r) { return grid.get(key(c, r)); }

  function inBounds(c, r) {
    if (Math.abs(c) <= FIELD.cols && Math.abs(r) <= FIELD.rows) return true;
    return false;
  }

  // can `piece` connect through world-dir d?
  function connectable(piece, d) {
    if (!piece) return false;
    if (piece.kind === 'hall') {
      const [dx, dz] = DIRS[d];
      return (piece.orient === 'x' && dz === 0) || (piece.orient === 'z' && dx === 0);
    }
    return true; // octagons, atrium, bays connect on any cardinal
  }

  // ── door cutting ──
  function doorBetween(a, b, d) {
    // d: dir from a → b
    const small = a.kind === 'hall' || b.kind === 'hall';
    const door = small ? RING_DOOR_S : RING_DOOR;
    const doorMat = (a.kind === 'bay' || b.kind === 'bay') ? MATS.brutal : MATS.porcelain;
    // the wall lives on ONE side: prefer the non-hall piece (its edge is longer);
    // hall-hall: keep a's end wall
    const owner = (a.kind !== 'hall') ? a : (b.kind !== 'hall' ? b : a);
    const other = owner === a ? b : a;
    const ownerDir = owner === a ? d : (d + 2) % 4;
    const len = owner.kind === 'hall' ? HALL.halfW * 2
      : owner.kind === 'bay' ? A
      : OCT_EDGE;
    const H = Math.min(owner.spec.h ?? 60, other.spec.h ?? 60, 42);
    owner.replaceEdge(ownerDir, () => {
      const g = new THREE.Group();
      g.add(ringDoorWall(len, H, door, doorMat));
      // header above the doored band if the owner is taller
      const fullH = owner.kind === 'bay' ? owner.spec.h : (owner.spec.h ?? 60);
      if (fullH > H) {
        const header = solidWall(len, fullH - H, doorMat);
        header.position.y = H;
        g.add(header);
      }
      if (owner.kind !== 'bay') g.add(vineOverDoor(new THREE.Vector3(0, 0, 0), 0, door.r, owner.col * 3 + owner.row));
      return g;
    });
    other.replaceEdge(owner === a ? (d + 2) % 4 : d, null); // drop the other side's wall

    // walk portal across the boundary
    const bx = (slotCenter(a.col, a.row).x + slotCenter(b.col, b.row).x) / 2;
    const bz = (slotCenter(a.col, a.row).z + slotCenter(b.col, b.row).z) / 2;
    const [nx, nz] = DIRS[d];
    const tx = -nz, tz = nx;
    const hw = Math.sqrt(door.r ** 2 - door.cy ** 2) - 1;
    const hl = door.wallT / 2 + 12;
    deps.walkRegions.push({
      type: 'poly',
      points: [
        [bx + tx * hw + nx * hl, bz + tz * hw + nz * hl],
        [bx + tx * hw - nx * hl, bz + tz * hw - nz * hl],
        [bx - tx * hw - nx * hl, bz - tz * hw - nz * hl],
        [bx - tx * hw + nx * hl, bz - tz * hw + nz * hl],
      ],
    });

    // unsealing a bay is an event
    for (const p of [a, b]) {
      if (p.kind === 'bay' && p.sealed) {
        p.sealed = false;
        p.light.intensity = 420;
        deps.toast('NOVA: "You found a window. I made it years ago. I knew you\'d come."');
        deps.nova?.pulse(0.8);
      }
    }
  }

  // ── growing ──
  function canGrowAt(c, r) {
    if (!inBounds(c, r) || pieceAt(c, r)) return false;
    for (let d = 0; d < 4; d++) {
      const nb = pieceAt(c + DIRS[d][0], r + DIRS[d][1]);
      if (nb && connectable(nb, (d + 2) % 4)) return true;
    }
    return false;
  }

  function grow(kind, c, r, { free = false } = {}) {
    if (!canGrowAt(c, r)) return null;
    const cost = GROW[kind].cost;
    if (!free && deps.getCredits() < cost) { deps.toast('⚠ insufficient hexbits'); return null; }

    let piece;
    if (kind === 'chamber') {
      piece = makeOctagonPiece(scene, { col: c, row: r, spec: CHAMBER, floorSeed: c * 5 + r * 11 + 20 });
    } else {
      // orient toward the first connectable neighbour
      let orient = 'x';
      for (let d = 0; d < 4; d++) {
        const nb = pieceAt(c + DIRS[d][0], r + DIRS[d][1]);
        if (nb && connectable(nb, (d + 2) % 4)) { orient = DIRS[d][1] === 0 ? 'x' : 'z'; break; }
      }
      piece = makeHallPiece(scene, { col: c, row: r, orient, floorSeed: c * 5 + r * 11 + 60 });
    }
    register(piece);
    deps.walkRegions.push({ type: 'poly', points: piece.walkPoly });
    if (kind === 'chamber') deps.buildCells.push({ def: { ...piece.spec, x: piece.x, z: piece.z, id: key(c, r), name: 'Chamber ' + key(c, r) }, walkPoly: piece.walkPoly, center: new THREE.Vector3(piece.x, 0, piece.z) });

    // cut doors to every connectable neighbour
    for (let d = 0; d < 4; d++) {
      const nb = pieceAt(c + DIRS[d][0], r + DIRS[d][1]);
      if (nb && connectable(nb, (d + 2) % 4) && connectable(piece, d)) {
        doorBetween(piece, nb, d);
      }
    }

    if (!free) deps.spendCredits(cost);
    riseIn(piece);
    deps.sfx('build');
    deps.nova?.pulse(0.6);
    const lines = kind === 'chamber' ? grownLore : hallLore;
    deps.toast(`NOVA: "${lines[rng.int(0, lines.length - 1)]}"`);
    return piece;
  }

  // ── ghost placement UI ──
  let growKind = null; // 'chamber' | 'hall' | null
  let ghost = null;
  let ghostSlot = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  function makeGhost(kind) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x7ee0ff, transparent: true, opacity: 0.28, depthWrite: false });
    if (kind === 'chamber') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(CHAMBER.R, CHAMBER.R, CHAMBER.h * 0.6, 8, 1, false, Math.PI / 2 - Math.PI / 8), mat);
      m.position.y = CHAMBER.h * 0.3;
      g.add(m);
    } else {
      const m = new THREE.Mesh(new THREE.BoxGeometry(A, HALL.h, HALL.halfW * 2), mat);
      m.position.y = HALL.h / 2;
      g.add(m);
    }
    g.visible = false;
    scene.add(g);
    return g;
  }

  dom.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  });
  dom.addEventListener('pointerdown', (e) => {
    if (!growKind || e.button !== 0 || !ghost?.visible || !ghostSlot) return;
    const p = grow(growKind, ghostSlot[0], ghostSlot[1]);
    if (p) setGrowKind(null);
  });

  function setGrowKind(kind) {
    growKind = kind;
    if (ghost) { scene.remove(ghost); ghost = null; }
    if (kind) ghost = makeGhost(kind);
  }

  function update() {
    if (!growKind || !ghost) return;
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) { ghost.visible = false; return; }
    const c = Math.round(hit.x / A);
    const r = Math.round(hit.z / A);
    if (canGrowAt(c, r)) {
      const { x, z } = slotCenter(c, r);
      ghost.position.set(x, 0, z);
      ghost.visible = true;
      ghostSlot = [c, r];
    } else {
      ghost.visible = false;
      ghostSlot = null;
    }
  }

  return {
    register, grow, update, setGrowKind,
    isGrowing: () => !!growKind,
    pieces: grid,
  };
}

import * as THREE from 'three';
import { HABITAT } from './glass.js';

// Walkable ship interior. Beyond the park's fore/aft doorways run two empty
// concourses — deliberately bare (we'll fill them with shops, queues, and crew
// spaces later). For now: floor, walls, ceiling, guide-lit strips, ribs, and
// end caps. Exposes walkRegions + obstacles for the FPV walk controller.

const H = HABITAT;
const HALF_W = 22;          // concourse half-width in z
const CEIL_Y = 24;
const AFT_X0 = -760;        // stern end of the aft concourse
const FORE_X1 = 430;        // bow end of the fore concourse

export function createInterior(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // emissive floor lifts these bare halls out of pure black WITHOUT adding
  // lights (emissive is free per-fragment); two dim fills below give shading.
  const matWall = new THREE.MeshStandardMaterial({ color: 0x7a838f, roughness: 0.85, metalness: 0.1, emissive: 0x27303c, emissiveIntensity: 1 });
  const matFloor = new THREE.MeshStandardMaterial({ color: 0x545b64, roughness: 0.9, metalness: 0.1, emissive: 0x1a1f26, emissiveIntensity: 1 });
  const matTrim = new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.7, metalness: 0.4 });
  const guideMat = new THREE.MeshBasicMaterial({});
  guideMat.color.setRGB(0.6, 1.7, 2.3); // cool blue-white guide strips
  const barMat = new THREE.MeshBasicMaterial({});
  barMat.color.setRGB(1.5, 1.7, 2.0); // overhead light bars

  const box = (cx, cy, cz, sx, sy, sz, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(cx, cy, cz);
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  const walkRegions = [
    { x0: 26, x1: 314, z0: -76, z1: 76 },                 // the park deck
    { x0: 4, x1: 30, z0: -14, z1: 14 },                   // aft doorway bridge
    { x0: 310, x1: 336, z0: -14, z1: 14 },                // fore doorway bridge
  ];

  // one concourse segment [x0,x1]; capX caps the far (non-park) end
  function concourse(x0, x1, capX) {
    const cx = (x0 + x1) / 2;
    const len = x1 - x0;
    box(cx, -1, 0, len, 2, HALF_W * 2, matFloor);                    // floor (top at y=0)
    box(cx, CEIL_Y, 0, len, 2, HALF_W * 2, matWall);                 // ceiling
    box(cx, CEIL_Y / 2, -HALF_W, len, CEIL_Y, 2, matWall);           // -z wall
    box(cx, CEIL_Y / 2, HALF_W, len, CEIL_Y, 2, matWall);            // +z wall
    box(capX, CEIL_Y / 2, 0, 2, CEIL_Y, HALF_W * 2, matWall);        // end cap
    // guide strips
    for (const z of [-12, 12]) box(cx, 0.15, z, len, 0.3, 0.8, guideMat);
    box(cx, CEIL_Y - 0.4, 0, len, 0.5, 2.4, guideMat);
    // rib arches + overhead light bars every ~24m for depth and rhythm
    for (let x = Math.min(x0, x1) + 18; x < Math.max(x0, x1); x += 24) {
      box(x, CEIL_Y / 2, -HALF_W + 1.2, 2.5, CEIL_Y, 1.5, matTrim);
      box(x, CEIL_Y / 2, HALF_W - 1.2, 2.5, CEIL_Y, 1.5, matTrim);
      box(x, CEIL_Y - 1.0, 0, 3.4, 0.6, HALF_W * 1.6, barMat);
    }
    // two cool fills per concourse so surfaces actually shade
    for (const f of [0.32, 0.68]) {
      const fill = new THREE.PointLight(0xbcd4ec, 1500, len * 0.6, 1.5);
      fill.position.set(Math.min(x0, x1) + len * f, CEIL_Y - 6, 0);
      group.add(fill);
    }
    walkRegions.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: -HALF_W + 2, z1: HALF_W - 2 });
  }

  concourse(AFT_X0, H.min.x + 2, AFT_X0);       // aft, capped at the stern
  concourse(H.max.x - 2, FORE_X1, FORE_X1);     // fore, capped at the bow

  // obstacles the walker can't pass through (ride footprints in the park)
  const obstacles = [
    { x: 160, z: -8, r: 11 },   // carousel
    { x: 268, z: -10, r: 12 },  // ferris base
    { x: 72, z: -30, r: 5 },    // drop tower
  ];

  return {
    group,
    walkRegions,
    obstacles,
    spawn: new THREE.Vector3(200, 1.75, 40),   // just inside the park
    spawnLook: new THREE.Vector3(160, 1.75, -8),
  };
}

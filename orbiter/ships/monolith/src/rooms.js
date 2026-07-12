import * as THREE from 'three';
import gsap from 'gsap';

// Room modules — enterable pavilions you blink onto any deck. All procedural
// primitives + canvas textures + emissives (no extra lights, bloom does the
// glow). Every factory takes `holo` and returns a group with userData:
// { radius, obstacles: [{dx,dz,r}], spin?(dt) } — build.js handles the rest.

function M(holo, color, extra = {}) {
  return holo
    ? new THREE.MeshBasicMaterial({ color: 0x7ee0ff, transparent: true, opacity: 0.3, depthWrite: false })
    : new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
}
function GLOW(holo, r, g, b) {
  if (holo) return new THREE.MeshBasicMaterial({ color: 0x7ee0ff, transparent: true, opacity: 0.35, depthWrite: false });
  const m = new THREE.MeshBasicMaterial({});
  m.color.setRGB(r, g, b);
  return m;
}
function stripeTex(colorA, colorB, stripes = 12) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 64;
  const ctx = cv.getContext('2d');
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 ? colorA : colorB;
    ctx.fillRect(i * (512 / stripes), 0, 512 / stripes, 64);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Arcade Dome: neon half-sphere with a wide entrance ──────────────────────
export function buildArcadeDome(holo = false) {
  const g = new THREE.Group();
  const R = 10;

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(R, 24, 12, Math.PI * 0.22, Math.PI * 2 - Math.PI * 0.44, 0, Math.PI / 2),
    M(holo, 0x2b3140, { roughness: 0.35, metalness: 0.4, side: THREE.DoubleSide })
  );
  dome.castShadow = !holo;
  g.add(dome);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.22, 6, 40), GLOW(holo, 2.2, 0.6, 1.9)); // magenta neon
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.3;
  g.add(rim);

  const floorPad = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 0.6, 0.3, 32), M(holo, 0x1c2029, { roughness: 0.8 }));
  floorPad.position.y = 0.15;
  floorPad.receiveShadow = !holo;
  g.add(floorPad);

  // glowing arcade cabinets in a ring inside
  const cabGeo = new THREE.BoxGeometry(1.2, 2, 0.9);
  const screenGeo = new THREE.PlaneGeometry(0.9, 0.7);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * 0.7 + (i / 5) * Math.PI * 1.6;
    const cab = new THREE.Mesh(cabGeo, M(holo, 0x353b49));
    cab.position.set(Math.cos(a) * (R - 2.4), 1.3, Math.sin(a) * (R - 2.4));
    cab.lookAt(0, 1.3, 0);
    cab.castShadow = !holo;
    g.add(cab);
    const screen = new THREE.Mesh(screenGeo, GLOW(holo, [1.8, 0.5, 1.6][i % 3], [0.6, 1.8, 1.2][i % 3], [1.9, 1.2, 2.0][i % 3]));
    screen.position.copy(cab.position);
    screen.lookAt(0, 1.3, 0);
    screen.translateZ(0.48);
    screen.position.y = 1.6;
    g.add(screen);
  }

  // entrance sign arch
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3, 0.25, 6, 20, Math.PI), GLOW(holo, 0.6, 1.9, 2.2));
  arch.position.set(0, 0.4, R - 0.4);
  g.add(arch);

  g.userData = {
    name: 'Arcade Dome', radius: R + 1,
    obstacles: [{ dx: 0, dz: 0, r: 3.2 }], // central cabinet cluster; entrance stays walkable
  };
  return g;
}

// ── Churro Diner: striped-awning counter box ────────────────────────────────
export function buildChurroDiner(holo = false) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(8, 3.4, 5), M(holo, 0xf2ead9, { roughness: 0.7 }));
  body.position.y = 1.7;
  body.castShadow = !holo;
  g.add(body);

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.18, 3),
    holo ? M(holo) : new THREE.MeshStandardMaterial({ map: stripeTex('#e05b41', '#f6efe2'), roughness: 0.8 })
  );
  awning.position.set(0, 3.6, 3.2);
  awning.rotation.x = 0.3;
  g.add(awning);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 0.8), M(holo, 0xd9a13c, { metalness: 0.4, roughness: 0.4 }));
  counter.position.set(0, 0.55, 2.8);
  g.add(counter);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.8, 0.15), GLOW(holo, 2.2, 1.6, 0.7));
  sign.position.set(0, 4.3, 2.6);
  g.add(sign);

  // giant rotating churro on the roof, obviously
  const churro = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.9, 0.32, 48, 8, 2, 3),
    M(holo, 0xb5762e, { roughness: 0.85 })
  );
  churro.position.set(0, 5.8, 0);
  g.add(churro);

  g.userData = {
    name: 'Churro Diner', radius: 6,
    obstacles: [{ dx: 0, dz: 0, r: 4.6 }],
    spin: (dt) => { churro.rotation.y += dt * 0.8; churro.rotation.x += dt * 0.2; },
  };
  return g;
}

// ── Observation Lounge: glass cylinder with couches ────────────────────────
export function buildObservationLounge(holo = false) {
  const g = new THREE.Group();
  const R = 7;

  const floorPad = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 0.5, 0.4, 28), M(holo, 0x2a2f38, { roughness: 0.7 }));
  floorPad.position.y = 0.2;
  floorPad.receiveShadow = !holo;
  g.add(floorPad);

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, 4.6, 28, 1, true, Math.PI * 0.15, Math.PI * 1.7),
    holo ? M(holo) : new THREE.MeshBasicMaterial({ color: 0x9fd2f0, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })
  );
  glass.position.y = 2.7;
  g.add(glass);

  const ringTop = new THREE.Mesh(new THREE.TorusGeometry(R, 0.18, 6, 36), GLOW(holo, 0.7, 1.7, 2.1));
  ringTop.rotation.x = Math.PI / 2;
  ringTop.position.y = 5;
  g.add(ringTop);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(R + 0.6, 1.6, 28), M(holo, 0x3a414d, { metalness: 0.4, roughness: 0.5 }));
  roof.position.y = 5.9;
  roof.castShadow = !holo;
  g.add(roof);

  // couches facing outward
  const couchMat = M(holo, 0x7457b8, { roughness: 0.85 });
  for (let i = 0; i < 4; i++) {
    const a = Math.PI * 0.3 + (i / 4) * Math.PI * 1.5;
    const couch = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1), couchMat);
    seat.position.y = 0.65;
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 0.3), couchMat);
    back.position.set(0, 1.1, -0.45);
    couch.add(seat, back);
    couch.position.set(Math.cos(a) * (R - 1.8), 0.2, Math.sin(a) * (R - 1.8));
    couch.lookAt(couch.position.x * 2, 0.2, couch.position.z * 2);
    g.add(couch);
  }

  g.userData = {
    name: 'Observation Lounge', radius: R + 1,
    obstacles: [{ dx: 0, dz: 0, r: 2 }],
  };
  return g;
}

// ── Holo-Theater: dark box, huge glowing screen ─────────────────────────────
export function buildHoloTheater(holo = false) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 10), M(holo, 0x1a1e26, { roughness: 0.8 }));
  shell.position.y = 3.5;
  shell.castShadow = !holo;
  g.add(shell);

  // marquee trim
  const trim = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.3, 10.3), GLOW(holo, 1.8, 1.4, 0.6));
  trim.position.y = 7.1;
  g.add(trim);

  // screen bursts through the front wall — it's a HOLO theater, physics optional
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.4), GLOW(holo, 0.7, 1.6, 2.3));
  screen.position.set(0, 4.2, 5.06);
  g.add(screen);
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), GLOW(holo, 1.9, 1.5, 0.8));
  doorGlow.position.set(-5.2, 1.5, 5.06);
  g.add(doorGlow);

  let t = 0;
  g.userData = {
    name: 'Holo-Theater', radius: 9.5,
    obstacles: [{ dx: 0, dz: 0, r: 8 }],
    spin: (dt) => {
      if (holo) return;
      t += dt;
      // the screen "plays": hue drifts slowly
      screen.material.color.setHSL((t * 0.05) % 1, 0.7, 0.62).multiplyScalar(1.9);
    },
  };
  return g;
}

// gsap blink-in used by build.js on placement
export function blinkIn(group) {
  group.scale.setScalar(0.001);
  gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'elastic.out(1, 0.55)' });
}

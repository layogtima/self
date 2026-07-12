import * as THREE from 'three';
import gsap from 'gsap';
import { makeRng } from './rng.js';

// NOVA. Not a hologram, not a god — the third thing. A formless entity of
// ~3200 luminous particles that hovers inside the Wondergate, endlessly
// morphing between shapes she finds amusing. She condenses when she speaks
// and flares when reality bends.

const N = 3200;

function glowTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(200,255,250,0.6)');
  g.addColorStop(1, 'rgba(140,230,220,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

// attractor shapes NOVA likes to wear
function makeAttractors(rng) {
  const shapes = [];

  const sphere = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = rng.next() * 2 - 1;
    const th = rng.next() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 11 + rng.range(-0.6, 0.6);
    sphere[i * 3] = r * s * Math.cos(th);
    sphere[i * 3 + 1] = r * u;
    sphere[i * 3 + 2] = r * s * Math.sin(th);
  }
  shapes.push(sphere);

  const knotGeo = new THREE.TorusKnotGeometry(8.5, 2.4, 200, 24);
  const kp = knotGeo.attributes.position;
  const knot = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const vi = Math.floor(rng.next() * kp.count);
    knot[i * 3] = kp.getX(vi);
    knot[i * 3 + 1] = kp.getY(vi);
    knot[i * 3 + 2] = kp.getZ(vi);
  }
  knotGeo.dispose();
  shapes.push(knot);

  const ribbon = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 6;
    const rr = 9 + Math.sin(t * 1.7) * 2.5;
    ribbon[i * 3] = Math.cos(t) * rr + rng.range(-0.5, 0.5);
    ribbon[i * 3 + 1] = (i / N - 0.5) * 24 + rng.range(-0.5, 0.5);
    ribbon[i * 3 + 2] = Math.sin(t) * rr + rng.range(-0.5, 0.5);
  }
  shapes.push(ribbon);

  const cloud = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    // rough gaussian
    const g = () => (rng.next() + rng.next() + rng.next() - 1.5) * 10;
    cloud[i * 3] = g(); cloud[i * 3 + 1] = g() * 0.8; cloud[i * 3 + 2] = g();
  }
  shapes.push(cloud);

  return shapes;
}

export function createNovaEntity(scene, { home }) {
  const rng = makeRng(11011);
  const shapes = makeAttractors(rng);
  const tex = glowTexture();

  const group = new THREE.Group();
  group.position.copy(home);
  scene.add(group);

  const positions = new Float32Array(N * 3);
  positions.set(shapes[0]);
  const from = new Float32Array(shapes[0]);
  const to = new Float32Array(shapes[1]);
  const phase = new Float32Array(N);
  for (let i = 0; i < N; i++) phase[i] = rng.next() * Math.PI * 2;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.55, sizeAttenuation: true, map: tex,
    transparent: true, opacity: 0.85, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xbdf5ec,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  group.add(points);

  // her light — the room notices her
  const presence = new THREE.PointLight(0x9fe8e0, 300, 90, 1.8);
  group.add(presence);

  let shapeIdx = 1;
  let morphT = 1;       // 1 = settled on `to`
  let nextSwitch = 9;
  let swirl = 0.35;

  function beginMorph() {
    from.set(positions.subarray(0, N * 3));
    shapeIdx = (shapeIdx + 1) % shapes.length;
    to.set(shapes[shapeIdx]);
    morphT = 0;
  }

  function update(dt, elapsed, camera, walking) {
    nextSwitch -= dt;
    if (nextSwitch <= 0) { beginMorph(); nextSwitch = 8 + rng.next() * 6; }
    if (morphT < 1) morphT = Math.min(1, morphT + dt / 2.6);
    const e = morphT * morphT * (3 - 2 * morphT);
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const drift = Math.sin(elapsed * 1.3 + phase[i]) * 0.35;
      positions[j] = from[j] + (to[j] - from[j]) * e + drift;
      positions[j + 1] = from[j + 1] + (to[j + 1] - from[j + 1]) * e + Math.cos(elapsed * 1.1 + phase[i]) * 0.35;
      positions[j + 2] = from[j + 2] + (to[j + 2] - from[j + 2]) * e - drift;
    }
    geo.attributes.position.needsUpdate = true;
    group.rotation.y += dt * swirl;
    presence.intensity = 300 + Math.sin(elapsed * 2.2) * 80;

  }

  // she condenses when she speaks; flares when reality bends
  function pulse(strength = 1) {
    gsap.fromTo(mat, { size: 0.55 * (1 + 0.8 * strength) }, { size: 0.55, duration: 1.1, ease: 'elastic.out(1, 0.4)' });
    gsap.fromTo(group.scale, { x: 0.82, y: 0.82, z: 0.82 }, { x: 1, y: 1, z: 1, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
    const old = swirl;
    swirl = old + 1.6 * strength;
    gsap.to({ v: swirl }, { v: old, duration: 1.4, onUpdate() { swirl = this.targets()[0].v; } });
  }

  return { group, update, pulse };
}

// ── 2D portrait: the same being, miniaturised for UI cards ──────────────────
export function attachPortrait(el) {
  const cv = document.createElement('canvas');
  const size = 128;
  cv.width = cv.height = size;
  cv.style.width = '100%';
  cv.style.height = '100%';
  el.innerHTML = '';
  el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const dots = [];
  for (let i = 0; i < 42; i++) {
    dots.push({ a: Math.random() * Math.PI * 2, r: 12 + Math.random() * 40, s: 0.2 + Math.random() * 0.8, p: Math.random() * Math.PI * 2 });
  }
  let raf;
  function draw(t) {
    raf = requestAnimationFrame(draw);
    ctx.fillStyle = 'rgba(6,20,28,0.32)';
    ctx.fillRect(0, 0, size, size);
    for (const d of dots) {
      d.a += 0.004 * d.s;
      const wob = Math.sin(t * 0.001 + d.p) * 6;
      const x = size / 2 + Math.cos(d.a) * (d.r + wob) * 0.9;
      const y = size / 2 + Math.sin(d.a * 1.3 + d.p) * (d.r + wob) * 0.55;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 5);
      g.addColorStop(0, 'rgba(210,255,248,0.9)');
      g.addColorStop(1, 'rgba(140,230,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    }
  }
  draw(0);
  return () => cancelAnimationFrame(raf);
}

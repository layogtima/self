// diggg — a smooth-voxel (Surface Nets) landscape, first person. Science-accurate
// strata + karst caves + mineral veins under flowing, vibrant terrain. Fly around,
// dig into a hillside to open mineral-lined caverns. Bright + luminous, not dreary.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeWorld, W, D, H, T, hash2 } from './world.js';
import { makeFireflies } from './fireflies.js';

// ---- renderer -------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#bfe0f2', 0.006);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
camera.rotation.order = 'YXZ';
camera.position.set(W / 2, 26, D * 0.86);
let yaw = 0, pitch = -0.34;

// ---- gradient skydome (follows the camera) --------------------------------------
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(300, 24, 12),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#4a86d8') }, bot: { value: new THREE.Color('#dff0fb') }, off: { value: 0.02 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 bot; uniform float off; void main(){ float h = normalize(vP).y*0.5+0.5; gl_FragColor = vec4(mix(bot, top, smoothstep(off, 0.85, h)), 1.0); }',
  }),
);
sky.frustumCulled = false;
scene.add(sky);

// ---- lights (bright + luminous) -------------------------------------------------
const hemi = new THREE.HemisphereLight('#bfe0ff', '#6a5236', 1.05);
const sun = new THREE.DirectionalLight('#fff2d6', 2.9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.05;
sun.shadow.radius = 3;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 180 });
sun.shadow.camera.updateProjectionMatrix();
scene.add(hemi, sun, sun.target);

const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('#fff8e6'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
sunDisc.scale.setScalar(34);
scene.add(sunDisc);

// ---- world + dwellers -----------------------------------------------------------
const world = makeWorld(scene);
const fireflies = makeFireflies(scene, world);

const glow = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({
  map: radialTex('#eafaff'), color: '#8fe8ff', size: 0.8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
}));
glow.frustumCulled = false;
scene.add(glow);
function refreshGlow() { glow.geometry.setAttribute('position', new THREE.Float32BufferAttribute(world.minerals.slice(), 3)); glow.geometry.computeBoundingSphere(); }
refreshGlow();

if (new URLSearchParams(location.search).has('crater')) {
  world._debugCarve((x, y, z) => Math.hypot(x - W / 2, (y - 15) * 0.9, z - D / 2) < 8);
  refreshGlow();
}

// ---- trees + tufts (hashed onto flat columns) -----------------------------------
{
  const trunkM = new THREE.MeshStandardMaterial({ color: '#6e4f33', roughness: 1 });
  const leafM = new THREE.MeshStandardMaterial({ color: '#4f9e3c', roughness: 1 });
  const tuftM = new THREE.MeshStandardMaterial({ color: '#79bb4a', roughness: 1 });
  const flora = new THREE.Group();
  for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
    const h = world.heightAt(x + 0.5, z + 0.5);
    const flat = Math.abs(world.heightAt(x + 1.5, z + 0.5) - h) <= 1 && Math.abs(world.heightAt(x + 0.5, z + 1.5) - h) <= 1;
    const rnd = hash2(x * 3.7, z * 7.9);
    if (flat && rnd > 0.985) {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 1.6, 6), trunkM);
      trunk.position.y = 0.8; trunk.castShadow = true;
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + hash2(x, z) * 0.5, 0), leafM);
      crown.position.y = 2.0; crown.scale.y = 0.9; crown.castShadow = true;
      g.add(trunk, crown); g.position.set(x + 0.5, h, z + 0.5);
      flora.add(g);
    } else if (flat && rnd > 0.9) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 5), tuftM);
      tuft.position.set(x + 0.5 + (hash2(z, x) - 0.5) * 0.5, h + 0.18, z + 0.5 + (hash2(x * 2, z) - 0.5) * 0.5);
      tuft.castShadow = true; flora.add(tuft);
    }
  }
  scene.add(flora);
}

// ---- dig puffs ------------------------------------------------------------------
const puffs = (() => {
  const CAP = 256, pos = new Float32Array(CAP * 3), col = new Float32Array(CAP * 3), p = [];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setDrawRange(0, 0);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, depthWrite: false }));
  pts.frustumCulled = false; scene.add(pts);
  return {
    burst(x, y, z, color, n = 12) { for (let i = 0; i < n && p.length < CAP; i++) p.push({ x, y, z, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 0.7 + Math.random() * 0.4, r: color.r, g: color.g, b: color.b }); },
    update(dt) {
      for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; q.vy -= 12 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.life -= dt; if (q.life <= 0) { p.splice(i, 1); continue; } pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = q.z; const f = Math.min(1, q.life * 2); col[i * 3] = q.r * f; col[i * 3 + 1] = q.g * f; col[i * 3 + 2] = q.b * f; }
      geo.setDrawRange(0, p.length); geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
  };
})();

// ---- first-person controls (pointer lock) ---------------------------------------
const input = {};
addEventListener('keydown', e => { input[e.code] = true; if (e.code === 'KeyN') dayT = (dayT + 0.5) % 1; if (e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => { input[e.code] = false; });
const canvas = renderer.domElement;
canvas.addEventListener('click', () => { if (document.pointerLockElement !== canvas) canvas.requestPointerLock(); });
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= e.movementX * 0.0022;
  pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.0022, -1.5, 1.5);
});
addEventListener('contextmenu', e => e.preventDefault());
let digging = false, digT = 0;
addEventListener('pointerdown', e => { if (document.pointerLockElement !== canvas) return; if (e.button === 0) { digging = true; digT = 0; } else if (e.button === 2) tryPlace(); });
addEventListener('pointerup', e => { if (e.button === 0) digging = false; });

// ---- picking / dig / place (crosshair ray from screen centre) -------------------
const REACH = 9;
const ray = new THREE.Raycaster();
const centre = new THREE.Vector2(0, 0);
function pick() {
  if (!world.mesh.geometry.attributes.position) return null;
  ray.setFromCamera(centre, camera);
  const hit = ray.intersectObject(world.mesh)[0];
  if (!hit || hit.distance > REACH) return null;
  return hit;
}
function cellAt(hit, sign) {   // sign -1 = solid cell behind surface (dig), +1 = air cell in front (place)
  const p = hit.point, n = hit.face.normal;
  return [Math.floor(p.x + n.x * 0.5 * sign), Math.floor(p.y + n.y * 0.5 * sign), Math.floor(p.z + n.z * 0.5 * sign)];
}
function nearestSolid(x, y, z, px, py, pz) {   // snap to the closest solid cell to the hit point
  let best = null, bd = 1e9;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
    const cx = x + dx, cy = y + dy, cz = z + dz;
    if (world.typeAt(cx, cy, cz) === T.AIR || cy <= 0) continue;
    const d = (cx + 0.5 - px) ** 2 + (cy + 0.5 - py) ** 2 + (cz + 0.5 - pz) ** 2;
    if (d < bd) { bd = d; best = [cx, cy, cz]; }
  }
  return best;
}
function tryDig() {
  const hit = pick(); if (!hit) return;
  let [x, y, z] = cellAt(hit, -1);
  if (world.typeAt(x, y, z) === T.AIR) { const s = nearestSolid(x, y, z, hit.point.x, hit.point.y, hit.point.z); if (!s) return;[x, y, z] = s; }
  const t = world.dig(x, y, z);
  if (t) { puffs.burst(x + 0.5, y + 0.5, z + 0.5, world.typeColor(t), 12); refreshGlow(); }
}
function tryPlace() {
  const hit = pick(); if (!hit) return;
  const [x, y, z] = cellAt(hit, 1);
  if (world.place(x, y, z, T.SOIL)) refreshGlow();
}

// ---- day / night (bright default) -----------------------------------------------
let dayT = parseFloat(new URLSearchParams(location.search).get('t') ?? '0.5');   // default noon
const cZenN = new THREE.Color('#0c1330'), cZenD = new THREE.Color('#4a86d8'), cZenG = new THREE.Color('#7d84b6');
const cHorN = new THREE.Color('#172038'), cHorD = new THREE.Color('#dff0fb'), cHorG = new THREE.Color('#f2b46a');
const zen = new THREE.Color(), hor = new THREE.Color();
function updateDay(dt) {
  dayT = (dayT + dt / 160) % 1;
  const ang = dayT * Math.PI * 2 - Math.PI / 2;
  const up = Math.sin(ang);
  const day = THREE.MathUtils.clamp(up, 0, 1);
  const golden = THREE.MathUtils.clamp(1 - Math.abs(up) / 0.28, 0, 1);
  const night = THREE.MathUtils.clamp(0.5 - up * 1.6, 0, 1);
  zen.copy(cZenN).lerp(cZenD, THREE.MathUtils.smoothstep(up, -0.1, 0.45)).lerp(cZenG, golden * 0.5);
  hor.copy(cHorN).lerp(cHorD, THREE.MathUtils.smoothstep(up, -0.1, 0.45)).lerp(cHorG, golden);
  sky.material.uniforms.top.value.copy(zen);
  sky.material.uniforms.bot.value.copy(hor);
  scene.fog.color.copy(hor);
  scene.fog.density = 0.005 + night * 0.02;
  const cp = camera.position;
  sun.position.copy(cp).add(new THREE.Vector3(Math.cos(ang) * 60, Math.max(2, up * 75), 26));
  sun.target.position.copy(cp);
  sun.intensity = Math.max(0, up) * 3.2 + 0.05;
  sun.color.setHSL(0.1, 0.5, 0.66 + Math.max(0, up) * 0.2);
  hemi.intensity = 0.28 + Math.max(0, up) * 0.95;
  sunDisc.position.copy(sun.position);
  sunDisc.material.opacity = day * 0.9;
  sunDisc.material.color.copy(sun.color);
  return night;
}

// ---- post (balanced bloom) ------------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.5, 0.88);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---- loop -----------------------------------------------------------------------
const clock = new THREE.Clock();
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  camera.rotation.set(pitch, yaw, 0);
  fwd.set(0, 0, -1).applyEuler(camera.rotation);
  right.set(1, 0, 0).applyEuler(camera.rotation);
  const spd = (input.ShiftLeft || input.ShiftRight ? 26 : 12) * dt;
  const mv = new THREE.Vector3();
  if (input.KeyW) mv.add(fwd); if (input.KeyS) mv.sub(fwd);
  if (input.KeyD) mv.add(right); if (input.KeyA) mv.sub(right);
  if (input.Space) mv.add(up); if (input.KeyC || input.ControlLeft) mv.sub(up);
  if (mv.lengthSq() > 0) camera.position.addScaledVector(mv.normalize(), spd);
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -8, W + 8);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -8, D + 8);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1, 90);

  const night = updateDay(dt);
  fireflies.update(t, dt, night);
  puffs.update(dt);
  sky.position.copy(camera.position);

  digT -= dt;
  if (digging && digT <= 0) { tryDig(); digT = 0.16; }

  composer.render();
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); bloom.setSize(innerWidth, innerHeight);
});

function radialTex(color) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const c = cv.getContext('2d'); const g = c.createRadialGradient(32, 32, 1, 32, 32, 31);
  g.addColorStop(0, color); g.addColorStop(0.35, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}

window.__diggg = { scene, world, camera };
frame();

import * as THREE from 'three';
import gsap from 'gsap';
import { WORLD } from './config.js';
import { createSpace } from './space.js';
import { createHull } from './hull.js';
import { glassMat as coreGlassMat } from './cells.js';
import { createAtrium } from './atrium.js';
import { createGrowth } from './growth.js';
import { createNovaEntity } from './nova-entity.js';
import { createLights } from './lights.js';
import { createAtmosphere } from './atmosphere.js';
import { createPost } from './post.js';
import { createCinematic } from './cinematic.js';
import { createManageControls, createFlyControls, createWalkControls } from './controls.js';
import { createBuildMode, CATALOG } from './build.js';
import { createAdvisor } from './advisor.js';
import { createPowers } from './powers.js';
import { createNovaUI } from './nova-ui.js';
import { createQuality } from './quality.js';
import { loadEnvironment } from './assets.js';
import { initAudio, sfx, toggleMute } from './audio.js';

// ── renderer ────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  powerPreference: 'high-performance',
  antialias: false, stencil: false, depth: false,
});
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  const l = document.getElementById('loading');
  if (l) { l.style.opacity = '1'; l.textContent = 'graphics reset — reload the page (⌘R)'; document.body.appendChild(l); }
}, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020208);
window.__scene = scene;
window.__renderer = renderer;

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.5, 40000);
camera.position.set(-1500, 520, -1100);

// ── world ───────────────────────────────────────────────────────────────────
const space = createSpace(scene);
const hull = createHull(scene);
const atrium = createAtrium(scene);
const nova = createNovaEntity(scene, { home: atrium.gatePosition });

// flat station — groundY stays as a hook for whatever comes next
function groundY() { return 0; }
const lights = createLights(scene);
const discoAccents = [];
const atmosphere = createAtmosphere(scene, discoAccents);

const obstacles = [...atrium.obstacles];

// ── live registries the growth engine mutates ──
const walkRegions = [{ type: 'poly', points: atrium.piece.walkPoly }];
const buildCells = [{ def: { x: 0, z: 0, R: 80, id: 'atrium', name: 'The Atrium' }, walkPoly: atrium.piece.walkPoly, center: new THREE.Vector3(0, 0, 0) }];
for (const bay of hull.bays) walkRegions.push({ type: 'poly', points: bay.walkPoly });

let guests = null;
if (WORLD.guests) {
  const { createGuests } = await import('./park/guests.js');
  guests = createGuests(scene);
}

const post = createPost(renderer, scene, camera);
loadEnvironment(renderer, scene, '/assets/env/moonless_golf_1k.hdr', { intensity: 0.3 });

// ── game state ──────────────────────────────────────────────────────────────
let mode = 'cinematic';
let credits = 48200;
let ridesPlaced = 0;

const el = {
  credits: document.getElementById('credits'),
  guests: document.getElementById('guest-count'),
  toast: document.getElementById('toast'),
  title: document.getElementById('title'),
  buildBtn: document.getElementById('build-btn'),
  novaBtn: document.getElementById('nova-btn'),
  modeHint: document.getElementById('mode-hint'),
  loading: document.getElementById('loading'),
};

function setMode(m, opts = {}) {
  const prev = mode;
  mode = m;
  document.body.className = m;
  manage.enabled = m === 'manage';
  fly.setEnabled(m === 'fly');
  if (m === 'walk') walk.setEnabled(true, opts.spawn || atrium.spawn, opts.look || atrium.spawnLook);
  else if (prev === 'walk') walk.setEnabled(false);
  if (m !== 'manage' && build.isActive()) toggleBuild(false);
  el.modeHint.textContent =
    m === 'fly' ? 'drag look · WASD fly · shift boost · F back · G walk · M mute'
    : m === 'walk' ? 'WASD walk · space VOID JUMP · N nova · G / esc exit'
    : 'drag orbit · scroll zoom · B build · G walk · N nova · F fly · M mute';
}

function fmt(n) { return n.toLocaleString('en-US'); }
function refreshHud() {
  el.credits.textContent = fmt(Math.floor(credits));
  el.guests.textContent = fmt((guests?.count ?? 0) + ridesPlaced * 47);
}

let toastTimer;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 3200);
}

// ── controls ────────────────────────────────────────────────────────────────
const manage = createManageControls(camera, renderer.domElement);
manage.enabled = false;
const fly = createFlyControls(camera, renderer.domElement);
const walk = createWalkControls(camera, renderer.domElement, {
  regions: walkRegions,
  obstacles,
  onExit: () => { if (mode === 'walk') setMode('manage'); },
  onJump: () => sfx('jump'),
  onApex: () => {
    sfx('blink');
    gsap.to(space.starGroup.rotation, { y: space.starGroup.rotation.y + 0.35, duration: 0.5, ease: 'power3.out' });
    const ch = post.chroma.offset;
    gsap.fromTo(ch, { x: 0.005, y: 0.003 }, { x: 0, y: 0, duration: 0.5, ease: 'power2.out' });
    space.driftStars(0.05);
    space.hyperspaceSweep({ mini: true, duration: 0.9 });
    nova.pulse(0.3);
  },
  onLand: () => sfx('land'),
  groundY,
});

// ── advisor + nova + build ──────────────────────────────────────────────────
const advisor = createAdvisor({
  onDone: () => toast('N — the Nova Console · G — walk the collection'),
});

const cinematic = createCinematic(camera, coreGlassMat, {
  onTitle: (show) => el.title.classList.toggle('show', show),
  onDone: (endPos, endLook) => {
    manage.setLookAt(endPos.x, endPos.y, endPos.z, endLook.x, endLook.y, endLook.z, false);
    setMode('manage');
    nova.pulse(1);
    setTimeout(() => advisor.start(), 900);
  },
});

const build = createBuildMode(scene, camera, renderer.domElement, {
  cells: buildCells,
  guests,
  obstacles,
  getCredits: () => credits,
  spendCredits: (n) => { credits -= n; refreshHud(); },
  toast,
  groundY,
  onPlaced: (count) => {
    ridesPlaced = count;
    refreshHud();
    sfx('build');
  },
});

const growth = createGrowth(scene, camera, renderer.domElement, {
  walkRegions, buildCells, obstacles, toast, sfx,
  nova,
  getCredits: () => credits,
  spendCredits: (n) => { credits -= n; refreshHud(); },
});
growth.register(atrium.piece);
for (const bay of hull.bays) growth.register(bay);

const powers = createPowers({
  scene, camera, space, lights, atmosphere, post, walk, manage, build, growth,
  getMode: () => mode, setMode, toast,
});
const novaUI = createNovaUI(powers, { toast, onFire: () => nova.pulse(1) });
el.novaBtn.addEventListener('click', () => novaUI.toggle());

const quality = createQuality({
  renderer, post, sun: lights.sun, atmosphere, space, toast,
  trimLights: discoAccents,
  onResize: () => post.resize(innerWidth, innerHeight),
});

// ── build palette ───────────────────────────────────────────────────────────
const paletteEl = document.getElementById('build-palette');
for (const c of CATALOG) {
  const d = document.createElement('div');
  d.className = 'build-item' + (c.key === CATALOG[0].key ? ' sel' : '');
  d.dataset.key = c.key;
  d.innerHTML = `<div class="ic">${c.icon}</div><div class="nm">${c.name}</div><div class="pr">⬡ ${c.cost.toLocaleString()}</div>`;
  d.addEventListener('click', () => {
    build.setItem(c.key);
    sfx('ui');
    paletteEl.querySelectorAll('.build-item').forEach((x) => x.classList.toggle('sel', x.dataset.key === c.key));
    toast(`ghost: ${c.name} — click inside any cell`);
  });
  paletteEl.appendChild(d);
}

function toggleBuild(force) {
  const v = force !== undefined ? force : !build.isActive();
  build.setActive(v);
  el.buildBtn.classList.toggle('active', v);
  paletteEl.classList.toggle('show', v);
}
el.buildBtn.addEventListener('click', () => { if (mode === 'manage') toggleBuild(); });

// ── input ───────────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (mode === 'cinematic') { if (e.code === 'Space' || e.code === 'Escape') cinematic.skip(); return; }
  if (e.code === 'KeyN') novaUI.toggle();
  else if (e.code === 'KeyM') toast(toggleMute() ? 'muted' : 'sound on');
  else if (e.code === 'KeyG') setMode(mode === 'walk' ? 'manage' : 'walk');
  else if (e.code === 'KeyF' && mode !== 'walk') setMode(mode === 'fly' ? 'manage' : 'fly');
  else if (e.code === 'KeyB' && mode === 'manage') toggleBuild();
  else if (e.code === 'Escape') {
    if (growth.isGrowing()) growth.setGrowKind(null);
    else if (novaUI.isOpen()) novaUI.toggle(false);
    else if (build.isActive()) toggleBuild(false);
  }
});
renderer.domElement.addEventListener('pointerdown', () => {
  initAudio();
  if (mode === 'cinematic') cinematic.skip();
});
window.addEventListener('keydown', () => initAudio(), { once: true });

document.body.className = 'cinematic';
refreshHud();

// dev hooks for headless verification
window.__debug = {
  walk(sx, sz, lx, lz) {
    if (mode === 'cinematic') cinematic.skip();
    setMode('walk', {
      spawn: new THREE.Vector3(sx, 1.75, sz),
      look: new THREE.Vector3(lx ?? sx, 1.75, lz ?? sz - 10),
    });
  },
  cam(px, py, pz, lx, ly, lz) {
    if (mode === 'cinematic') cinematic.skip();
    setMode('fly');
    camera.position.set(px, py, pz);
    camera.lookAt(lx, ly, lz);
    fly.setEnabled(true);
  },
  firePower(key) {
    if (mode === 'cinematic') cinematic.skip();
    return powers.fire(key);
  },
  jump() { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); },
  openNova(v) { novaUI.toggle(v); },
  grow(kind, c, r) { if (mode === 'cinematic') cinematic.skip(); return !!growth.grow(kind, c, r, { free: true }); },
  audioReady: () => import('./audio.js').then((a) => a.isReady()),
  regions: walkRegions,
  camPos: () => [Math.round(camera.position.x), Math.round(camera.position.z)],
  camY: () => camera.position.y,
  groundY,
  quality,
};

// ── loop ────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let firstFrame = true;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  space.update(dt, elapsed);
  hull.update(dt, elapsed);
  atrium.update(dt, elapsed);
  growth.update(dt);
  nova.update(dt, elapsed, camera, mode === 'walk');
  guests?.update(dt, elapsed);
  atmosphere.update(dt, elapsed);
  build.update(dt);
  quality.update(dt);
  coreGlassMat.uniforms.uTime.value = elapsed;

  if (mode === 'cinematic') cinematic.update(dt);
  else if (mode === 'manage') manage.update(dt);
  else if (mode === 'fly') fly.update(dt);
  else if (mode === 'walk') walk.update(dt);

  if (ridesPlaced > 0) {
    credits += ridesPlaced * 9 * dt;
    if (Math.floor(elapsed * 2) % 2 === 0) refreshHud();
  }

  post.render();

  if (firstFrame) {
    firstFrame = false;
    el.loading.style.opacity = '0';
    setTimeout(() => el.loading.remove(), 1200);
  }
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  post.resize(innerWidth, innerHeight);
});

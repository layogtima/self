import * as THREE from 'three';
import { createSpace } from './space.js';
import { createShip } from './ship.js';
import { createHabitat } from './glass.js';
import { createDeck } from './park/deck.js';
import { createFerris } from './park/ferris.js';
import { createCoaster } from './park/coaster.js';
import { createCarousel } from './park/carousel.js';
import { createProps } from './park/props.js';
import { createGuests } from './park/guests.js';
import { createCharacters } from './park/characters.js';
import { createLights } from './lights.js';
import { createAtmosphere } from './atmosphere.js';
import { createInterior } from './interior.js';
import { createPost } from './post.js';
import { createCinematic } from './cinematic.js';
import { createManageControls, createFlyControls, createWalkControls } from './controls.js';
import { createBuildMode } from './build.js';
import { createAdvisor } from './advisor.js';
import { createDebugPanel } from './debug.js';

// ── renderer ────────────────────────────────────────────────────────────────
// Cap DPR hard: on a Retina panel devicePixelRatio is 2, which quadruples every
// postprocessing render target and was OOM-ing the GPU. 1.5 is plenty crisp.
const DPR = Math.min(devicePixelRatio, 1.5);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(DPR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; // cheaper than PCFSoft, negligible visual diff here
renderer.info.autoReset = false; // count all composer passes per frame; reset manually
document.getElementById('app').appendChild(renderer.domElement);

// survive a GPU context loss instead of hard-crashing the tab
renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  const l = document.getElementById('loading');
  if (l) { l.style.opacity = '1'; l.textContent = 'graphics reset — reload the page (⌘R)'; document.body.appendChild(l); }
}, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020208);
window.__scene = scene; // dev/debug hook
window.__renderer = renderer;

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.5, 40000);
camera.position.set(-1500, 130, 680);

// ── world ───────────────────────────────────────────────────────────────────
const space = createSpace(scene);
const ship = createShip(scene);
const habitat = createHabitat(scene);
const deck = createDeck(scene);
const ferris = createFerris(scene);
const coaster = createCoaster(scene);
const carousel = createCarousel(scene);
const props = createProps(scene);
const guests = createGuests(scene);
guests.mesh.visible = false; // replaced by the rigged crowd; toggle in the O panel
const characters = createCharacters(scene, { count: 80 }); // rigged, animated visitors
const interior = createInterior(scene);
interior.group.visible = false; // empty concourses — not used; toggle in the O panel
const lights = createLights(scene);
const atmosphere = createAtmosphere(scene, lights.accents);

guests.addAttraction(ferris.attraction);
guests.addAttraction(coaster.attraction);
guests.addAttraction(carousel.attraction);
guests.addAttraction(props.attraction);

const post = createPost(renderer, scene, camera);

// ── game state ──────────────────────────────────────────────────────────────
let mode = 'cinematic'; // cinematic | manage | fly | walk
let credits = 48200;
let ridesPlaced = 0;

const el = {
  credits: document.getElementById('credits'),
  guests: document.getElementById('guest-count'),
  toast: document.getElementById('toast'),
  title: document.getElementById('title'),
  buildBtn: document.getElementById('build-btn'),
  modeHint: document.getElementById('mode-hint'),
  loading: document.getElementById('loading'),
};

function setMode(m, opts = {}) {
  const prev = mode;
  mode = m;
  document.body.className = m;
  manage.enabled = m === 'manage';
  fly.setEnabled(m === 'fly');
  if (m === 'walk') walk.setEnabled(true, opts.spawn || interior.spawn, opts.look || interior.spawnLook);
  else if (prev === 'walk') walk.setEnabled(false);
  if (m !== 'manage' && build.isActive()) toggleBuild(false);
  el.modeHint.textContent =
    m === 'fly' ? 'drag look · WASD fly · shift boost · F park · G walk'
    : m === 'walk' ? 'WASD walk · mouse look · shift run · G / esc exit'
    : 'drag orbit · scroll zoom · B build · G walk inside · F free-fly';
}

function fmt(n) { return n.toLocaleString('en-US'); }
function refreshHud() {
  el.credits.textContent = fmt(Math.floor(credits));
  el.guests.textContent = fmt(guests.count + ridesPlaced * 47);
}

let toastTimer;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2600);
}

// ── controls / cinematic / build / advisor ──────────────────────────────────
const manage = createManageControls(camera, renderer.domElement);
manage.enabled = false;
const fly = createFlyControls(camera, renderer.domElement);
const walk = createWalkControls(camera, renderer.domElement, {
  regions: interior.walkRegions,
  obstacles: interior.obstacles,
  onExit: () => { if (mode === 'walk') setMode('manage'); },
});

const advisor = createAdvisor({
  onDone: () => {
    el.buildBtn.classList.add('active');
    setTimeout(() => el.buildBtn.classList.remove('active'), 2400);
    toast('B — build your first ride');
  },
});

const cinematic = createCinematic(camera, habitat.glassMat, {
  onTitle: (show) => el.title.classList.toggle('show', show),
  onDone: (endPos, endLook) => {
    manage.target.copy(endLook);
    manage.update();
    setMode('manage');
    setTimeout(() => advisor.start(), 900);
  },
});

const build = createBuildMode(scene, camera, renderer.domElement, {
  guests,
  getCredits: () => credits,
  spendCredits: (n) => { credits -= n; refreshHud(); },
  toast,
  onPlaced: (count) => {
    ridesPlaced = count;
    refreshHud();
    if (count === 1) setTimeout(() => toast('Auntie Nova: "Adequate. I\'m weeping with pride."'), 3200);
  },
});

function toggleBuild(force) {
  const v = force !== undefined ? force : !build.isActive();
  build.setActive(v);
  el.buildBtn.classList.toggle('active', v);
}

el.buildBtn.addEventListener('click', () => { if (mode === 'manage') toggleBuild(); });

window.addEventListener('keydown', (e) => {
  if (mode === 'cinematic') { if (e.code === 'Space' || e.code === 'Escape') cinematic.skip(); return; }
  if (e.code === 'KeyG') setMode(mode === 'walk' ? 'manage' : 'walk');
  else if (e.code === 'KeyF' && mode !== 'walk') setMode(mode === 'fly' ? 'manage' : 'fly');
  else if (e.code === 'KeyB' && mode === 'manage') toggleBuild();
  else if (e.code === 'Escape' && build.isActive()) toggleBuild(false);
});
renderer.domElement.addEventListener('pointerdown', () => {
  if (mode === 'cinematic') cinematic.skip();
}, { once: false });

document.body.className = 'cinematic';
refreshHud();

// ── dev / debug tools ────────────────────────────────────────────────────────
const dev = {
  root: document.getElementById('dev'),
  draws: document.getElementById('dev-draws'),
  mode: document.getElementById('dev-mode'),
  cam: document.getElementById('dev-cam'),
  tris: document.getElementById('dev-tris'),
  guests: document.getElementById('dev-guests'),
  fpsB: document.querySelector('#dev .fps b'),
  ms: document.getElementById('dev-ms'),
  wire: false,
};

window.__debug = {
  walk(sx, sz, lx, lz) {
    if (mode === 'cinematic') cinematic.skip();
    setMode('walk', {
      spawn: new THREE.Vector3(sx, 1.75, sz),
      look: new THREE.Vector3(lx ?? sx, 1.75, lz ?? sz - 10),
    });
  },
  // free camera placement for art shots: position + look-at, any angle
  fly(x, y, z, lx = 0, ly = 0, lz = 0) {
    if (mode === 'cinematic') cinematic.skip();
    setMode('fly');
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, lz);
    fly.setEnabled(true); // re-sync yaw/pitch from the aimed camera
  },
  pos: () => camera.position.toArray().map((n) => +n.toFixed(1)),
  characters,
  mode: () => mode,
  setMode,
  wireframe(on) {
    dev.wire = on ?? !dev.wire;
    scene.traverse((o) => { if (o.isMesh) {
      const m = Array.isArray(o.material) ? o.material : [o.material];
      m.forEach((mat) => { if (mat) mat.wireframe = dev.wire; });
    } });
  },
  scene, camera, renderer,
};

// keyboard: ` toggles the stat panel, P toggles wireframe
window.addEventListener('keydown', (e) => {
  if (e.code === 'Backquote') dev.root.classList.toggle('open');
  else if (e.code === 'KeyP' && mode !== 'cinematic') window.__debug.wireframe();
});

// perf bisection panel (O key) — toggle subsystems, watch the fps readout
const renderFlags = { usePost: true };
createDebugPanel({
  renderer, scene, post, flags: renderFlags,
  groups: { space, ship, habitat, deck, ferris, coaster, carousel, props, guests, characters, interior, atmosphere },
});

// ── loop ────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let firstFrame = true;
let fpsAccum = 0, fpsFrames = 0, renderMs = 0;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  space.update(dt, elapsed);
  ship.update(dt, elapsed);
  ferris.update(dt);
  coaster.update(dt);
  carousel.update(dt, elapsed);
  props.update(dt, elapsed);
  guests.update(dt, elapsed);
  characters.update(dt);
  atmosphere.update(dt, elapsed);
  build.update(dt);
  post.update(dt, elapsed);

  if (mode === 'cinematic') cinematic.update(dt);
  else if (mode === 'manage') manage.update();
  else if (mode === 'fly') fly.update(dt);
  else if (mode === 'walk') walk.update(dt);

  // passive income: every ride quietly prints hexbits
  if (ridesPlaced > 0) {
    credits += ridesPlaced * 9 * dt;
    if (Math.floor(elapsed * 2) % 2 === 0) refreshHud();
  }

  renderer.info.reset();
  const rt0 = performance.now();
  if (renderFlags.usePost) post.composer.render();
  else renderer.render(scene, camera); // bypass bloom/grade to isolate post cost
  renderMs += performance.now() - rt0;

  // dev overlay — fps (twice/sec), draws, cpu-side render time, stat panel.
  // If render ms is LOW but fps is stuck (e.g. 30), the cap is external
  // (display refresh / power throttle), not the scene.
  fpsAccum += dt; fpsFrames++;
  if (fpsAccum >= 0.5) {
    const fps = Math.round(fpsFrames / fpsAccum);
    dev.fpsB.textContent = fps;
    dev.draws.textContent = renderer.info.render.calls;
    dev.ms.textContent = (renderMs / fpsFrames).toFixed(1);
    renderMs = 0;
    dev.root.className = fps >= 50 ? '' : fps >= 30 ? 'warn' : 'bad';
    if (dev.root.classList.contains('open')) {
      dev.mode.textContent = mode;
      dev.cam.textContent = camera.position.toArray().map((n) => Math.round(n)).join(', ');
      dev.tris.textContent = renderer.info.render.triangles.toLocaleString();
      dev.guests.textContent = guests.count + ridesPlaced * 47;
    }
    fpsAccum = 0; fpsFrames = 0;
  }

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

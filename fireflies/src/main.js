// main.js — bootstrap, state machine, game loop. Wordless & seamless.
import * as THREE from 'three';
import { makeRenderer } from './renderer.js';
import { makeInput } from './input.js';
import { makePlayer } from './player.js';
import { makeFireflies } from './firefly.js';
import { makeAudio } from './audio.js';
import { makeUI } from './ui.js';
import { LEVELS } from './levels.js';
import { SPECIES_ORDER } from './util.js';

// ---- scene: dark, but navigable ----
const scene = new THREE.Scene();
scene.background = new THREE.Color('#04050a');
scene.fog = new THREE.FogExp2('#04050a', 0.02);
scene.add(new THREE.HemisphereLight('#22304c', '#070810', 0.34));

const camera = new THREE.PerspectiveCamera(74, innerWidth / innerHeight, 0.05, 300);
camera.rotation.order = 'YXZ';

const { composer } = makeRenderer(scene, camera);
const input = makeInput(document.querySelector('canvas'));
const player = makePlayer(scene, camera, input);
const fireflies = makeFireflies(scene);
const audio = makeAudio();
const ui = makeUI();

// ---- state ----
let state = 'start';       // start | playing | transition
let levelIndex = 0;
let level = null;
let levelRoot = null;

function loadLevel(i) {
  if (levelRoot) { scene.remove(levelRoot); levelRoot = null; }
  fireflies.clear();
  levelRoot = new THREE.Group();
  scene.add(levelRoot);
  level = LEVELS[i](levelRoot, fireflies);
  player.setLevel(level);
}

function startLevel(i) {
  levelIndex = i;
  loadLevel(i);
  state = 'playing';
  ui.hideStart();
  ui.showCrosshair();
  ui.liftFromBlack();
  try { document.querySelector('canvas').requestPointerLock(); } catch (e) { /* headless */ }
}

// exit reached -> seamless fade into the next cavern (wraps after the last)
function goNext() {
  state = 'transition';
  const next = (levelIndex + 1) % LEVELS.length;
  ui.transition(() => { levelIndex = next; loadLevel(next); }, () => { state = 'playing'; });
}

// ---- loop ----
const ctx = { fireflies, playerPos: player.pos, audio };
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  if (state === 'playing' || state === 'transition') {
    player.update(t, dt);
    fireflies.update(t, dt, { playerPos: player.pos, beam: player.beam });

    for (const k of SPECIES_ORDER) {
      const s = fireflies.sync[k];
      audio.setSync(k, s.blend);
      if (s.justSynced) audio.ping(k);
    }

    for (const p of level.props) p.update(t, dt, ctx);

    if (state === 'playing' && level.exit.reached(player.pos)) goNext();
  }

  composer.render();
}

// ---- boot / dev shortcuts ----
// ?dev  auto-start · ?level=N start level · ?dev&grab gather all · ?dev&solve fire nodes
const params = new URLSearchParams(location.search);
const devLevel = params.has('level') ? Math.max(0, Math.min(LEVELS.length - 1, +params.get('level'))) : 0;

if (params.has('dev')) {
  startLevel(devLevel);
  document.getElementById('start').style.display = 'none';
  document.getElementById('fade').style.display = 'none';
  if (params.has('grab') || params.has('solve') || params.has('near')) for (const ff of fireflies.list) ff.state = 'captured';
  if (params.has('solve')) for (const s of level.sockets) s.forceSolve(ctx);
  // ?near — stand the player on the first node so the REAL proximity charge fires
  if (params.has('near')) { const s = level.sockets[0]; player.pos.set(s.pos.x, 1.62, s.pos.z + 1.2); }
} else {
  ui.onStart(() => { audio.start(); startLevel(0); });
}
frame();

window.__ff = { scene, camera, player, fireflies, audio, get level() { return level; }, startLevel };

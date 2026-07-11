// Boot + scene manager. Fixed-timestep loop; scenes are objects with
// {enter, update(dt), render(time), leave?}. Switch via ctx.go(name).

import { VIEW_W, VIEW_H, setView } from './config.js';
import { attachInput, endFrame } from './core/input.js';
import { touch, attachTouch } from './core/touch.js';
import { text } from './render/text.js';
import { initAudio, setVolume, setMusicVolume, loadSamples } from './core/audio.js';
import { startMusic } from './core/music.js';
import { loadSave, DEFAULT_SETTINGS } from './core/save.js';
import { installLore } from './core/lore.js';
import { buildTileset } from './render/tileset.js';
import { loadFossilSprites, loadSprites } from './render/sprites.js';
import { makeTitleScene } from './scenes/title.js';
import { makeSettingsScene } from './scenes/settings.js';
import { makeGameScene } from './scenes/game.js';
import { makeAwakenScene } from './scenes/awaken.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// -- dynamic stage (v5.0 mobile) -----------------------------------------------
// Height is fixed (540); width follows the device aspect so phones play
// edge-to-edge in landscape. Fits are requested by resize events and APPLIED
// at frame start only (resizing canvas.width clears the canvas - never do it
// between update and render). Portrait pauses the game under a rotate card.
let portrait = false;
let fitPending = true;
function fitCanvas() {
  const vv = window.visualViewport;               // truthful under iOS toolbars
  const vw = vv ? vv.width : innerWidth, vh = vv ? vv.height : innerHeight;
  portrait = vh > vw;
  if (!portrait) setView(VIEW_H * (vw / vh));
  if (canvas.width !== VIEW_W) canvas.width = VIEW_W;
  if (canvas.height !== VIEW_H) canvas.height = VIEW_H;
  const s = Math.min(vw / VIEW_W, vh / VIEW_H);   // letterbox when aspect clamps
  canvas.style.width = `${Math.round(VIEW_W * s)}px`;
  canvas.style.height = `${Math.round(VIEW_H * s)}px`;
}
addEventListener('resize', () => { fitPending = true; });
window.visualViewport?.addEventListener('resize', () => { fitPending = true; });

// the "turn the record sideways" card (portrait pause)
function drawRotateCard(time) {
  ctx.fillStyle = 'rgba(8,8,14,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const cx = VIEW_W / 2, cy = VIEW_H / 2;
  ctx.save();
  ctx.translate(cx, cy - 30);
  ctx.rotate(Math.sin(time * 2) > 0 ? -Math.PI / 2 : 0);   // the phone tips over, patiently
  ctx.fillStyle = '#2B2733'; ctx.strokeStyle = '#E0A24A'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(-22, -38, 44, 76, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7FC4A8'; ctx.beginPath(); ctx.arc(0, 26, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  text(ctx, 'rotate your device', cx, cy + 64, { size: 20, bold: true, align: 'center', color: '#F6E8C8' });
  text(ctx, 'DG-3 records in landscape', cx, cy + 92, { size: 11, align: 'center', color: 'rgba(233,220,188,0.7)' });
}

// -- platform factories (real DOM here; tests inject stubs) -------------------
const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const makeImage = src => { const i = new Image(); i.src = src; return i; };

// -- shared services handed to every scene ------------------------------------
const loaded = loadSave();
const save = loaded?.settingsOnly ? null : loaded;   // v1 fallback carries settings, not a game
const settings = { ...DEFAULT_SETTINGS, ...(loaded?.settings || {}) };

const services = {
  canvas, ctx, makeCanvas, makeImage,
  tileset: buildTileset(makeCanvas, makeImage),
  settings,
  save,
  go(name, opts) { switchScene(name, opts); },
};

// all flavor text (codex blurbs, buildable lore) - accessors fall back
// gracefully until this lands, so nothing blocks on it
fetch('src/content/lore.json').then(r => r.ok ? r.json() : null)
  .then(d => d && installLore(d)).catch(() => {});

// sound credits (Freesound attribution) for the Credits panel
services.credits = [];
fetch('assets/sounds/credits.json').then(r => r.ok ? r.json() : {}).then(m => {
  services.credits = Object.entries(m).map(([k, v]) => ({ key: k, ...v }));
}).catch(() => {});

// build sprite auto-loads (drop-in PNGs; falls back to procedural)
loadFossilSprites(makeImage);
loadSprites(makeImage, 'scenery', [
  'tree-badlands', 'tree-conifer', 'tree-palm', 'tree-mangrove', 'tree-acacia', 'tree-deadsnag', 'tree-shardspire',
  'bush', 'boulder', 'flowers', 'reeds', 'shard',
]);
loadSprites(makeImage, 'stations', ['station-clean', 'station-analyze', 'station-prep', 'station-showcase']);
loadSprites(makeImage, 'ui', ['table-wood']);
loadSprites(makeImage, 'backdrops', ['tundra', 'wetland', 'badlands', 'savanna', 'ashflats', 'crystal', 'coast']);


// -- scenes -------------------------------------------------------------------
const scenes = {
  title: opts => makeTitleScene(services, opts),
  settings: opts => makeSettingsScene(services, opts),
  intro: opts => makeAwakenScene(services, opts),   // the awakening (v4) - name kept for callers
  game: opts => makeGameScene(services, opts),
};

let current = null;
function switchScene(name, opts) {
  // overlay scenes (pause) get a frozen snapshot of the outgoing frame as backdrop
  if (opts?.overlay) {
    const snap = makeCanvas(VIEW_W, VIEW_H);
    snap.getContext('2d').drawImage(canvas, 0, 0);
    opts.backdrop = snap;
  }
  if (current?.leave) current.leave();
  current = scenes[name](opts);
  if (current.enter) current.enter(opts);
}

// -- input --------------------------------------------------------------------
let audioReady = false;
function ensureAudio() {
  if (audioReady) { initAudio(); return; }   // initAudio also resumes a suspended ctx
  initAudio();
  setVolume(settings.volume);
  setMusicVolume(settings.music);
  startMusic();
  // load the real Freesound ambience (decodes in the background; synth covers the gap)
  loadSamples(['rain-loop', 'wind-loop', 'crickets-night', 'forest-day', 'cave-ambience', 'water-stream', 'lava-bubbling']);
  audioReady = true;
}
attachInput(canvas, ensureAudio);
attachTouch(canvas, ensureAudio);
// iOS suspends the AudioContext ('interrupted') on lock/backgrounding - wake it
document.addEventListener('visibilitychange', () => { if (!document.hidden && audioReady) initAudio(); });

// -- fixed-timestep loop ------------------------------------------------------
const DT = 1 / 60;
let last = performance.now();
let acc = 0;

function frame(now) {
  if (fitPending) { fitPending = false; fitCanvas(); }   // resize only at frame start
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  if (portrait) {
    // the record waits while the phone is upright
    acc = 0;
    endFrame();
    current.render(now / 1000);
    drawRotateCard(now / 1000);
    requestAnimationFrame(frame);
    return;
  }
  while (acc >= DT) {
    touch.frame(DT, current);      // virtual sticks/buttons write keys+mouse first
    current.update(DT);
    endFrame();
    acc -= DT;
  }
  current.render(now / 1000);
  touch.render(ctx, now / 1000);   // thumb controls float over every scene
  requestAnimationFrame(frame);
}

fitCanvas();
switchScene('title');
requestAnimationFrame(frame);

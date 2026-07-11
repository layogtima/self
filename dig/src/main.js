// Boot + scene manager. Fixed-timestep loop; scenes are objects with
// {enter, update(dt), render(time), leave?}. Switch via ctx.go(name).

import { VIEW_W, VIEW_H } from './config.js';
import { attachInput, endFrame } from './core/input.js';
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
attachInput(canvas, () => {
  if (!audioReady) {
    initAudio();
    setVolume(settings.volume);
    setMusicVolume(settings.music);
    startMusic();
    // load the real Freesound ambience (decodes in the background; synth covers the gap)
    loadSamples(['rain-loop', 'wind-loop', 'crickets-night', 'forest-day', 'cave-ambience', 'water-stream', 'lava-bubbling']);
    audioReady = true;
  }
});

// -- fixed-timestep loop ------------------------------------------------------
const DT = 1 / 60;
let last = performance.now();
let acc = 0;

function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= DT) {
    current.update(DT);
    endFrame();
    acc -= DT;
  }
  current.render(now / 1000);
  requestAnimationFrame(frame);
}

switchScene('title');
requestAnimationFrame(frame);

// Boot + scene manager. Fixed-timestep loop; scenes are objects with
// {enter, update(dt), render(time), leave?}. Switch via ctx.go(name).

import { VIEW_W, VIEW_H } from './config.js';
import { attachInput, endFrame } from './core/input.js';
import { initAudio, setVolume, setMusicVolume } from './core/audio.js';
import { startMusic } from './core/music.js';
import { loadSave, DEFAULT_SETTINGS } from './core/save.js';
import { buildTileset } from './render/tileset.js';
import { loadFossilSprites, loadSprites } from './render/sprites.js';
import { makePostFx } from './render/postfx.js';
import { makeTitleScene } from './scenes/title.js';
import { makeSettingsScene } from './scenes/settings.js';
import { makeGameScene } from './scenes/game.js';
import { makeIntroScene } from './scenes/intro.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// -- platform factories (real DOM here; tests inject stubs) -------------------
const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const makeImage = src => { const i = new Image(); i.src = src; return i; };

// -- shared services handed to every scene ------------------------------------
const save = loadSave();
const settings = { ...DEFAULT_SETTINGS, ...(save?.settings || {}) };

const services = {
  canvas, ctx, makeCanvas, makeImage,
  tileset: buildTileset(makeCanvas, makeImage),
  settings,
  save,
  go(name, opts) { switchScene(name, opts); },
};

// build sprite auto-loads (drop-in PNGs; falls back to procedural)
loadFossilSprites(makeImage);
loadSprites(makeImage, 'scenery', ['tree-badlands', 'tree-conifer', 'tree-palm', 'bush', 'boulder', 'flowers']);
loadSprites(makeImage, 'stations', ['station-clean', 'station-analyze', 'station-prep', 'station-showcase']);

// signature post-process (scanlines + vignette + grain + light-breathing)
const postfx = makePostFx(makeCanvas);

// -- scenes -------------------------------------------------------------------
const scenes = {
  title: opts => makeTitleScene(services, opts),
  settings: opts => makeSettingsScene(services, opts),
  intro: opts => makeIntroScene(services, opts),
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
  if (settings.filter !== false) postfx.apply(ctx, now / 1000);
  requestAnimationFrame(frame);
}

switchScene('title');
requestAnimationFrame(frame);

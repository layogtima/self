// Render smoke: build each scene against stubbed canvas/DOM and run update+render
// for many frames across all depth bands. Catches import errors, undefined refs,
// and draw-path crashes that the pure-logic tests don't exercise.

import { installStubs, makeAsserter } from './harness.js';
const { makeCanvas, makeCtx } = installStubs();

const { buildTileset } = await import('../src/render/tileset.js');
const { loadFossilSprites } = await import('../src/render/sprites.js');
const { makeTitleScene } = await import('../src/scenes/title.js');
const { makeSettingsScene } = await import('../src/scenes/settings.js');
const { makeGameScene } = await import('../src/scenes/game.js');
const { keys, mouse } = await import('../src/core/input.js');
const cfg = await import('../src/config.js');

const t = makeAsserter();

const services = {
  canvas: makeCanvas(960, 540),
  ctx: makeCtx(),
  makeCanvas,
  makeImage: () => null,
  tileset: buildTileset(makeCanvas),
  settings: { volume: 0.8, shake: true },
  save: null,
  go: () => {},
};
loadFossilSprites(null);

function runScene(name, make, frames = 120) {
  try {
    const scene = make(services);
    if (scene.enter) scene.enter({});
    for (let i = 0; i < frames; i++) { scene.update(1 / 60); scene.render(i / 60); }
    if (scene.leave) scene.leave();
    t.ok(true, `${name} ran ${frames} frames without throwing`);
    return scene;
  } catch (e) {
    t.ok(false, `${name} threw: ${e.stack || e}`);
    return null;
  }
}

console.log('\n[render] scenes boot & run');
runScene('title', s => makeTitleScene(s));
runScene('settings', s => makeSettingsScene(s, { overlay: true, back: 'game' }));
{
  const { makeAwakenScene } = await import('../src/scenes/awaken.js');
  runScene('awaken (boot log)', s => makeAwakenScene(s), 190);   // ~3.2s — just before hand-off to game
}

// minigame renders
console.log('\n[render] minigame overlays');
{
  const { makeMinigame } = await import('../src/game/minigames.js');
  const { FOSSILS } = await import('../src/content/fossils.js');
  for (const kind of ['prep', 'identify', 'stabilize', 'mount']) {
    try {
      const g = makeMinigame(kind, FOSSILS[6], makeCanvas, { fragment: { uid: 1 }, decoys: [FOSSILS[7], FOSSILS[8]], bones: FOSSILS[6].bones, boneIndex: 0, mountedSlots: new Set() });
      for (let i = 0; i < 60; i++) { g.update(1 / 60); g.render(services.ctx, i / 60); }
      t.ok(true, `${kind} minigame renders 60 frames`);
    } catch (e) {
      t.ok(false, `${kind} minigame threw: ${e.stack || e}`);
    }
  }
}

// the species dossier card in both modes
console.log('\n[render] species card renders in both modes');
{
  const { drawSpeciesCard } = await import('../src/render/cards.js');
  const { FOSSILS } = await import('../src/content/fossils.js');
  try {
    for (const f of FOSSILS) {
      drawSpeciesCard(services.ctx, 'unknown', f, 100, 60, 620, 380, makeCanvas, 1);
      drawSpeciesCard(services.ctx, 'full', f, 100, 60, 620, 380, makeCanvas, 1);
    }
    t.ok(true, `card rendered for all ${FOSSILS.length} species × 2 modes`);
  } catch (e) {
    t.ok(false, `species card threw: ${e.stack || e}`);
  }
}

// game scene across every depth band
console.log('\n[render] game scene across all strata');
{
  const { STRATA } = await import('../src/content/strata.js');
  const scene = makeGameScene(services, { boot: true });   // exercise the HUD boot overlay too
  scene.enter({});
  // reach into no internals — just drive it: dig downward for a while, render each frame
  try {
    keys.KeyS = true;
    for (let i = 0; i < 2400; i++) { scene.update(1 / 60); if (i % 4 === 0) scene.render(i / 60); }
    keys.KeyS = false;
    // toggle collection overlay + render
    const { pressed } = await import('../src/core/input.js');
    scene.render(1); scene.render(2);
    t.ok(true, 'game scene dug for 40s and rendered across bands without throwing');
  } catch (e) {
    t.ok(false, `game scene threw while digging: ${e.stack || e}`);
  }
  scene.leave();
}

// post-process
console.log('\n[render] post-process pass');
{
  const { makePostFx } = await import('../src/render/postfx.js');
  try {
    const fx = makePostFx(makeCanvas);
    for (let i = 0; i < 30; i++) fx.apply(services.ctx, i / 60);
    t.ok(true, 'postfx applies without throwing');
  } catch (e) { t.ok(false, 'postfx threw: ' + (e.stack || e)); }
}

// v5.0: the stage is dynamic on phones - every scene must survive every width
console.log('\n[render] dynamic stage widths (phone aspects)');
{
  const { setView } = cfg;
  for (const w of [720, 1170, 1280]) {
    setView(w);
    runScene(`title @ ${w}`, s => makeTitleScene(s), 60);
    runScene(`settings @ ${w}`, s => makeSettingsScene(s, {}), 30);
    runScene(`game @ ${w}`, s => makeGameScene(s, {}), 90);
  }
  setView(960);   // leave the stage as the other tests expect it
}

t.done();

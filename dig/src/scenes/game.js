// The dig. Year 102,025. v3.5: a living planet — day/night + weather engine,
// mouse-aimed wall-clipped lighting that matters on the surface after dark, a
// properly composed base (vitrine wing · work bay · lander · solar wing +
// incubator), cave features, creatures, and the genome path to resurrection.

import {
  VIEW_W, VIEW_H, TILE, WORLD_W, WORLD_H, PLAYER_H,
  T_AIR, T_PLACED, T_BEDROCK, T_WATER, T_LAVA, AUTOSAVE_SECONDS, CAMP_HALF_L, CAMP_HALF_R,
} from '../config.js';
import { keys, mouse, pressed } from '../core/input.js';
import { sfx, rumble, thunder, setRainLevel, setCricketLevel, setWindLevel, setSurfacePad, setCaveLevel, setWaterLevel, setLavaLevel } from '../core/audio.js';
import { setMusicDepth, updateMusic } from '../core/music.js';
import { writeSave } from '../core/save.js';
import { makeCamera } from '../core/camera.js';
import { makeParticles } from '../render/particles.js';
import { PALETTE, RARITY_COLORS } from '../render/palette.js';
import { text, chip, blueprintPanel, measure, roundRect } from '../render/text.js';
import { drawProbe, drawFossil, drawBoneNub, drawSprite, hasSprite, softCloud } from '../render/sprites.js';
import { drawSpeciesCard, drawMiniCard, drawCodexCard } from '../render/cards.js';
import { scanTargetAt } from '../game/scan.js';
import { CODEX, codexEntry } from '../content/codex.js';
import { makeLighting } from '../render/lighting.js';
import { makeWorld } from '../world/world.js';
import { makePlayer, updatePlayer } from '../game/player.js';
import { updateDigging } from '../game/digging.js';
import { makePulley } from '../game/pulley.js';
import { makeMinigame } from '../game/minigames.js';
import { makeAmbient } from '../game/ambient.js';
import { makeEnvironment } from '../game/environment.js';
import { makeSatchel, makeFragment, pickBoneDecoys } from '../game/fossils.js';
import { makeCollection } from '../game/collection.js';
import { makeLab } from '../game/stations.js';
import { makeTutorial } from '../game/tutorial.js';
import { STATIONS } from '../content/stations.js';
import { STRATA, realDepthAt, formatDepth, formatAge } from '../content/strata.js';
import { biomeAtX } from '../content/biomes.js';
import { FOSSILS, FOSSILS_BY_ID, fossilsForPeriod } from '../content/fossils.js';
import { SPECIMEN_STATES } from '../content/stations.js';

const MISSION_ID = 't-rex';

export function makeGameScene(services) {
  const { ctx, tileset, makeCanvas, settings, save } = services;

  const seed = save?.seed ?? ((Math.random() * 1e9) | 0);

  const world = makeWorld(seed);
  world.applyDeltas(save);
  const spawnCol = world.spawnCol;
  const player = makePlayer(
    spawnCol * TILE + (TILE - 12) / 2,
    (world.surface[spawnCol] - 2) * TILE - 22,
  );
  const cam = makeCamera();
  const particles = makeParticles();
  const satchel = makeSatchel();
  const collection = makeCollection(save?.collected || {}, save?.genome || {});
  const lab = makeLab(spawnCol, world.surface);
  const pulley = makePulley();
  const lighting = makeLighting(makeCanvas);
  const ambient = makeAmbient();
  const env = makeEnvironment();
  ambient.setEnvironment(env);
  env.onThunder = () => { thunder(); cam.addShake(2, settings.shake); };

  if (save?.session) {
    const s = save.session;
    if (typeof s.px === 'number') { player.x = s.px; player.y = s.py; player.vx = s.vx || 0; player.vy = s.vy || 0; player.facing = s.facing || 1; }
    for (const it of s.satchel || []) {
      const frag = makeFragment(it.fossilId, it.bone, it.boneIndex, it.stratumId);
      frag.state = it.state; frag.identified = it.identified;
      satchel.add(frag);
    }
  }

  let time = 0, autosaveT = AUTOSAVE_SECONDS;
  let collectionOpen = false, journalTab = 'fossils';
  let overlay = null;
  let scanning = null;                // {id, t} while holding a scan
  const codex = new Set(save?.codex || []);
  let birdT = 8 + Math.random() * 10;
  let minigame = null;
  let lastStratumIndex = world.stratumIndexAt(player.tx(), Math.floor(player.cy() / TILE));
  let banner = null, missionBanner = 0;
  let resultBanner = null;            // {done, next, t} — station "done" feedback
  let rumbleT = 14 + Math.random() * 10;
  let idleT = 0, findT = 0, escHold = 0;
  let lightPoly = null;
  let campRoofY = 0;                  // updated each frame by drawPlatform (rain shelter line)
  let frameLights = [];               // per-frame static lights (lamps, mushrooms, glowworms)
  const rainDrops = [];               // {x,y,vy,snow}
  const toasts = [];
  const miniCards = [];
  const hintedPockets = new Set();

  const fx = { shake: m => cam.addShake(m, settings.shake) };
  function toast(str, color = PALETTE.amber) { toasts.push({ text: str, life: 2.4, color }); }

  // onboarding: first run only (persisted via save.tutorialDone)
  const tutorial = makeTutorial({
    active: !save?.tutorialDone && !save?.session,
    lab,
    starterFragments: (speciesId) => {
      const spec = FOSSILS_BY_ID[speciesId];
      spec.bones.forEach((b, i) => satchel.add(makeFragment(speciesId, b, i, spec.period)));
    },
  });
  tutorial.onEnd(() => { save && (save.tutorialDone = true); persist(); });

  // camp platform geometry (world px)
  const deckY = world.surface[spawnCol] * TILE;
  const deckX0 = (spawnCol - CAMP_HALF_L) * TILE;
  const deckX1 = (spawnCol + CAMP_HALF_R + 1) * TILE;
  const VIT = { x: deckX0 + 8, w: 8 * TILE, h: 3.4 * TILE, cols: 4, rows: 2 };
  VIT.y = deckY - VIT.h - 12;
  const INCUBATOR = { x: deckX0 - 26, y: deckY - 30 };

  function persist() {
    const deltas = world.exportDeltas();
    const session = {
      px: player.x, py: player.y, vx: player.vx, vy: player.vy, facing: player.facing,
      satchel: satchel.items.map(s => ({ fossilId: s.fossilId, bone: s.bone, boneIndex: s.boneIndex, stratumId: s.stratumId, state: s.state, identified: s.identified })),
    };
    const data = { seed, dug: deltas.dug, placed: deltas.placed, collected: collection.export(), genome: collection.exportGenome(), codex: [...codex], settings: { ...settings }, session, tutorialDone: save?.tutorialDone || !tutorial.active };
    writeSave(data);
    services.save = data;
  }

  cam.follow(player.cx(), player.cy(), 0, true);

  // --------------------------------------------------------------- update
  function update(dt) {
    time += dt;
    env.update(dt);
    tutorial.update(dt);
    if (resultBanner) { resultBanner.t += dt; if (resultBanner.t > 2) resultBanner = null; }
    updateMusic(dt);
    decayToasts(dt);
    for (const mc of miniCards) mc.t += dt;
    while (miniCards.length && miniCards[0].t > 4.2) miniCards.shift();
    if (banner) banner.life -= dt;
    missionBanner = Math.max(0, missionBanner - dt);
    findT = Math.max(0, findT - dt);

    const depth = Math.max(0, world.depthOfRow(player.tx(), Math.floor(player.cy() / TILE)));

    // ambience audio levels follow the planet
    const above = depth < 4 ? 1 : Math.max(0, 1 - (depth - 4) / 10);
    setRainLevel(env.precip01() * above);
    setCricketLevel(env.night01() * above * (1 - env.precip01()));
    setWindLevel((env.wind01() - 0.2) * above);
    // a calm surface pad on clear/dry weather; sparse birdsong by day
    const clearDay = above > 0.5 && env.night01() < 0.4 && env.precip01() < 0.2;
    setSurfacePad(clearDay ? above : 0);
    birdT -= dt;
    if (birdT <= 0) { if (clearDay) sfx.birdsong(); birdT = 6 + Math.random() * 12; }
    // underground cave bed; fluid ambience by proximity
    setCaveLevel(Math.min(1, Math.max(0, (depth - 8) / 20)));
    let nearWater = 0, nearLava = 0;
    for (let ox = -3; ox <= 3; ox++) for (let oy = -2; oy <= 2; oy++) {
      const f = world.fluidAt(player.tx() + ox, Math.floor(player.cy() / TILE) + oy);
      if (f === T_WATER) nearWater = 1; else if (f === T_LAVA) nearLava = 1;
    }
    setWaterLevel(nearWater);
    setLavaLevel(nearLava);

    if (minigame) {
      minigame.game.update(dt);
      const st = minigame.game.status;
      if (st === 'success') finishStation(minigame);
      else if (st === 'failed') failStation(minigame);
      if (st !== 'active') minigame = null;
      return;
    }

    if (overlay) {
      overlay.t += dt;
      if (overlay.t > 0.35 && (pressed('Space') || pressed('KeyE') || pressed('Escape') || pressed('Enter') || pressed('MouseLeft') || pressed('Tab'))) { overlay = null; sfx.uiBack(); }
      return;
    }

    // during the tutorial, Esc is hold-to-skip; afterwards it pauses.
    if (tutorial.active) {
      if (keys.Escape) { escHold += dt; if (escHold > 0.8) { tutorial.skip(); escHold = 0; } } else escHold = 0;
    } else if (pressed('Escape')) { persist(); services.go('settings', { overlay: true, back: 'game' }); return; }
    if (pressed('Tab')) { collectionOpen = !collectionOpen; sfx.ui(); }
    if (collectionOpen) { updateCollectionInput(); return; }

    const anyInput = keys.KeyA || keys.KeyD || keys.KeyS || keys.KeyW || keys.Space || keys.KeyE || keys.KeyK || mouse.left;
    idleT = anyInput ? 0 : idleT + dt;

    // Ctrl toggles the active tool (laser ↔ scanner)
    if (pressed('ControlLeft') || pressed('ControlRight')) {
      player.tool = player.tool === 'scan' ? 'laser' : 'scan';
      scanning = null; sfx.ui();
    }

    if (pulley.active) {
      const ride = pulley.updateReel(player, world, dt);
      if (ride.popped) { particles.burst(player.cx(), player.y + player.h, '#AA9678', 14, 180); fx.shake(3); }
    } else {
      if (pressed('Space') || pressed('KeyW')) player.bufferJump();
      if (pressed('KeyK')) pulley.tryAttach(player, world);

      updatePlayer(player, world, dt);
      // lava: knock the rover back to the landing pad (no permadeath)
      if (player.inLava) respawnAtBase();
      else if (player.inWater && Math.random() < 0.3) particles.burst(player.cx(), player.y, 'rgba(160,200,220,0.6)', 1, 40);

      if (player.tool === 'scan') {
        updateScan(dt);
      } else {
        const digEv = updateDigging(player, world, cam, particles, fx, dt);
        if (digEv.brokeAt) ambient.onDig(digEv.brokeAt.x, digEv.brokeAt.y);
        if (digEv.bone) onBone(digEv.bone);
        if (digEv.nearBone && !hintedPockets.has(digEv.nearBone.id)) { hintedPockets.add(digEv.nearBone.id); sfx.hint(); }
      }

      if (pressed('KeyE')) {
        const slot = vitrineSlotNear();
        if (slot && collection.isComplete(slot.id)) { overlay = { type: 'dex', spec: FOSSILS_BY_ID[slot.id], t: 0 }; sfx.ui(); }
        else {
          const st = lab.nearest(player);
          if (st) openStation(st);
        }
      }
      if (pressed('MouseLeft')) {
        const slot = vitrineSlotAtMouse();
        if (slot && collection.isComplete(slot.id)) { overlay = { type: 'dex', spec: FOSSILS_BY_ID[slot.id], t: 0 }; sfx.ui(); }
      }
    }

    glintPockets();
    updatePrecip(dt);
    cam.follow(player.cx(), player.cy(), dt);
    cam.decay(dt);
    particles.update(dt);
    world.stepFluids(cam.bounds(), dt);
    ambient.update(dt, world, player, cam, depth, lightPoly, env);

    const si = world.stratumIndexAt(player.tx(), Math.floor(player.cy() / TILE));
    if (si !== lastStratumIndex && player.cy() > world.surface[player.tx()] * TILE) {
      banner = { stratum: STRATA[si], life: 3 };
      lastStratumIndex = si;
    }
    rumbleT -= dt * (1 + depth / 160);
    if (rumbleT <= 0 && depth > 12) { rumble(); fx.shake(1.2); rumbleT = 22 + Math.random() * 20; }
    setMusicDepth(depth);

    autosaveT -= dt;
    if (autosaveT <= 0) { persist(); autosaveT = AUTOSAVE_SECONDS; }
  }

  // precipitation particles (world-space, near the camera, above ground only)
  function updatePrecip(dt) {
    const p = env.precip01();
    const snow = biomeAtX(player.tx(), WORLD_W).id === 'tundra';
    if (p > 0.1 && rainDrops.length < p * 140) {
      for (let i = 0; i < 4; i++) {
        rainDrops.push({
          x: cam.x - 40 + Math.random() * (VIEW_W + 80),
          y: cam.y - 30 - Math.random() * 60,
          vy: snow ? 26 + Math.random() * 18 : 320 + Math.random() * 120,
          vx: snow ? (Math.random() - 0.5) * 20 : -30 * env.wind01(),
          snow,
        });
      }
    }
    const camped = tx => tx >= spawnCol - CAMP_HALF_L && tx <= spawnCol + CAMP_HALF_R;
    for (let i = rainDrops.length - 1; i >= 0; i--) {
      const d = rainDrops[i];
      d.y += d.vy * dt;
      d.x += d.vx * dt + (d.snow ? Math.sin(time * 2 + d.y * 0.05) * 14 * dt : 0);
      const tx = Math.floor(d.x / TILE);
      // the weatherproof canopy stops rain over the camp span (it patters on the roof)
      if (camped(tx) && d.y >= campRoofY) { rainDrops.splice(i, 1); continue; }
      const groundY = world.surface[Math.max(0, Math.min(WORLD_W - 1, tx))] * TILE;
      if (d.y >= groundY || rainDrops.length > 160) {
        if (!d.snow && Math.random() < 0.3) particles.burst(d.x, groundY, 'rgba(160,200,220,0.6)', 1, 30);
        rainDrops.splice(i, 1);
      }
    }
  }

  function roverMood() {
    if (pulley.active) return 'winch';
    if (player.beam) return 'laser';
    if (findT > 0) return 'find';
    if (idleT > 25) return 'sleepy';
    if (Math.abs(player.vx) > 10) return 'drive';
    return 'idle';
  }

  // hold the mouse over a scannable to catalogue it (mod 12)
  function updateScan(dt) {
    player.beam = null;
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    const targets = ambient.scanTargets(wx, wy);
    const id = scanTargetAt(wx, wy, world, targets);
    if (mouse.left && id) {
      if (!scanning || scanning.id !== id) scanning = { id, t: 0 };
      scanning.t += dt;
      if (scanning.t >= 1) {
        const isNew = !codex.has(id);
        codex.add(id);
        overlay = { type: 'codex', codexId: id, t: 0 };
        sfx[isNew ? 'reveal' : 'ui']();
        scanning = null;
        persist();
      }
    } else {
      scanning = null;
    }
  }

  function respawnAtBase() {
    fx.shake(4);
    sfx.crumble();
    particles.burst(player.cx(), player.cy(), '#F0A93B', 20, 260);
    player.x = spawnCol * TILE + (TILE - player.w) / 2;
    player.y = (world.surface[spawnCol] - 3) * TILE;
    player.vx = 0; player.vy = -180;   // popped up onto the pad
    player.inLava = false;
    toast('scorched — returned to base', PALETTE.danger);
  }

  function onBone(pocket) {
    const stratum = world.stratumAt(pocket.tx, pocket.ty);
    satchel.add(makeFragment(pocket.fossilId, pocket.bone, pocket.boneIndex, stratum.id));
    miniCards.push({ spec: FOSSILS_BY_ID[pocket.fossilId], bone: pocket.bone, boneIndex: pocket.boneIndex, t: 0 });
    sfx.discover();
    fx.shake(1.5);
    findT = 2;
  }

  function openStation(st) {
    const frag = satchel.firstAtState(st.spec.input);
    if (!frag) { sfx.uiBack(); return; }
    const spec = FOSSILS_BY_ID[frag.fossilId];

    // duplicate bone at the Mount → genome sample instead of a minigame
    if (st.spec.minigame === 'mount' && collection.hasBone(spec.id, frag.boneIndex)) {
      satchel.remove(frag.uid);
      const g = collection.addGenome(spec.id);
      toast(`genome ${Math.round(g * 100)}%`, '#7FC4A8');
      sfx.complete();
      persist();
      return;
    }

    const extra = { fragment: frag, boneName: frag.bone };
    if (st.spec.minigame === 'identify') extra.decoys = pickBoneDecoys(spec, frag.bone, frag.uid);
    if (st.spec.minigame === 'mount') {
      extra.bones = spec.bones;
      extra.boneIndex = frag.boneIndex;
      extra.mountedSlots = new Set(spec.bones.map((_, i) => i).filter(i => collection.hasBone(spec.id, i)));
    }
    minigame = { game: makeMinigame(st.spec.minigame, spec, makeCanvas, extra), station: st, fragment: frag };
    sfx.station();
  }

  function finishStation({ station, fragment }) {
    fragment.state = station.spec.output;
    // "done" feedback: a 2s banner naming what happened + the next station (mod 8)
    const next = STATIONS.find(s => s.input === station.spec.output);
    resultBanner = { done: station.spec.output, next: next ? next.name : null, t: 0 };
    tutorial.onStationDone(station.spec.id);
    if (station.spec.output === 'identified') { fragment.identified = true; sfx.complete(); }
    if (station.spec.output === 'mounted') {
      satchel.remove(fragment.uid);
      const complete = collection.mountBone(fragment.fossilId, fragment.boneIndex);
      const f = FOSSILS_BY_ID[fragment.fossilId];
      findT = 1.2;
      if (complete) {
        overlay = { type: 'dex', spec: f, t: 0 };
        resultBanner = null;      // the dossier reveal is enough
        tutorial.onSpeciesComplete(f.id);
        if (fragment.fossilId === MISSION_ID) { missionBanner = 6; sfx.mission(); fx.shake(4); }
        else sfx.reveal();
      }
      persist();
    }
  }

  function failStation({ fragment }) {
    satchel.remove(fragment.uid);
    toast('fragment lost', PALETTE.danger);
    sfx.crumble();
  }

  function glintPockets() {
    if (Math.random() > 0.05) return;
    const b = cam.bounds();
    const vis = world.pockets.filter(p => world.pocketAt(p.tx, p.ty) && p.tx >= b.x0 && p.tx <= b.x1 && p.ty >= b.y0 && p.ty <= b.y1);
    if (!vis.length) return;
    const p = vis[(Math.random() * vis.length) | 0];
    particles.burst((p.tx + 0.5) * TILE, (p.ty + 0.5) * TILE, PALETTE.bone, 1, 24);
  }

  function decayToasts(dt) { for (let i = toasts.length - 1; i >= 0; i--) { toasts[i].life -= dt; if (toasts[i].life <= 0) toasts.splice(i, 1); } }

  function updateCollectionInput() {
    if (pressed('Escape')) { collectionOpen = false; sfx.uiBack(); return; }
    if (pressed('KeyA')) { journalTab = journalTab === 'codex' ? 'fossils' : 'codex'; sfx.ui(); }
    if (pressed('KeyD')) { journalTab = journalTab === 'fossils' ? 'codex' : 'fossils'; sfx.ui(); }
    if (pressed('MouseLeft')) {
      const tab = journalTabAt(mouse.x, mouse.y);
      if (tab) { journalTab = tab; sfx.ui(); return; }
      if (journalTab === 'codex') {
        const e = codexCellAt(mouse.x, mouse.y);
        if (e && codex.has(e.id)) { overlay = { type: 'codex', codexId: e.id, t: 0 }; collectionOpen = false; sfx.ui(); }
      } else {
        const cell = collectionCellAt(mouse.x, mouse.y);
        if (cell && collection.isComplete(cell.id)) { overlay = { type: 'dex', spec: FOSSILS_BY_ID[cell.id], t: 0 }; collectionOpen = false; sfx.ui(); }
      }
    }
  }

  // ---- vitrine helpers ----
  function vitrineSlots() {
    const started = FOSSILS.filter(f => collection.started(f.id));
    const out = [];
    started.slice(0, VIT.cols * VIT.rows).forEach((f, i) => {
      const c = i % VIT.cols, r = Math.floor(i / VIT.cols);
      out.push({
        id: f.id, spec: f,
        x: VIT.x + 6 + c * ((VIT.w - 12) / VIT.cols),
        y: VIT.y + 8 + r * ((VIT.h - 16) / VIT.rows),
        w: (VIT.w - 12) / VIT.cols - 4,
        h: (VIT.h - 16) / VIT.rows - 4,
      });
    });
    return out;
  }
  function vitrineSlotNear() {
    if (Math.abs(player.cy() - deckY) > TILE * 4) return null;
    for (const s of vitrineSlots()) if (player.cx() > s.x - 8 && player.cx() < s.x + s.w + 8) return s;
    return null;
  }
  function vitrineSlotAtMouse() {
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    for (const s of vitrineSlots()) if (wx >= s.x && wx <= s.x + s.w && wy >= s.y && wy <= s.y + s.h) return s;
    return null;
  }

  // --------------------------------------------------------------- render
  function render(rtime) {
    frameLights = [];
    drawSky(rtime);

    ctx.save();
    cam.apply(ctx);
    const b = cam.bounds();

    drawScenery(rtime, b);
    drawTiles(b, rtime);
    drawCaveProps(b, rtime);
    drawPockets(b);
    drawPlatform(rtime);
    pulley.draw(ctx, player, rtime);
    ambient.draw(ctx, rtime);
    particles.draw(ctx);
    drawPrecip();
    drawBeam(rtime);
    if (player.tool === 'scan' && !pulley.active) drawReticle(rtime);
    if (player.chute && !pulley.active) drawChute(player.cx(), player.y, rtime);
    drawProbe(ctx, player.x + player.w / 2, player.y, player.facing, rtime,
      player.swingT, player.swingAim, player.vx, player.walkT,
      pulley.active ? { dangle: pulley.dangleAngle(), mood: 'winch' } : { mood: roverMood(), blinkSeed: seed % 7 });
    ctx.restore();

    // darkness: depth OR night OR storm-gloom; cone aims at the mouse
    const depth = world.depthOfRow(player.tx(), Math.floor(player.cy() / TILE));
    const depthDark = Math.min(0.82, Math.max(0, (depth - 4) / 60) * 0.82);
    const nightDark = env.night01() * 0.72;
    const stormDark = env.precip01() * 0.3;
    const ambientDark = Math.max(depthDark, nightDark, stormDark);
    const emitter = { x: player.cx() + player.facing * 7, y: player.y + PLAYER_H - 7 };
    const aim = Math.atan2((mouse.y + cam.y) - emitter.y, (mouse.x + cam.x) - emitter.x);
    lightPoly = lighting.apply(ctx, world, cam, emitter, aim, ambientDark,
      frameLights.concat(ambient.glowLights()));

    // lightning flash over everything
    if (env.lightning > 0) {
      ctx.fillStyle = `rgba(240,244,255,${(env.lightning * 0.55).toFixed(2)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    drawHUD();
    if (banner && banner.life > 0) drawBanner();
    if (missionBanner > 0) drawMissionBanner();
    if (resultBanner) drawResultBanner();
    tutorial.draw(ctx, cam, rtime);
    drawToasts();
    drawMiniCards(rtime);
    if (collectionOpen) drawCollection();
    if (overlay) drawOverlay(rtime);
    if (minigame) minigame.game.render(ctx, rtime);
  }

  // ---- sky: day/night gradient + sun/moon + stars + weather clouds ----
  function drawSky(rtime) {
    const { top, bot } = env.skyColors();
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const sm = env.sunMoon();
    if (sm.stars > 0.05) {
      ctx.fillStyle = `rgba(240,240,255,${(sm.stars * 0.9).toFixed(2)})`;
      for (let i = 0; i < 60; i++) {
        const sx2 = (i * 173.3 + 40) % VIEW_W;
        const sy2 = (i * 97.7) % (VIEW_H * 0.55);
        const tw = Math.sin(rtime * 2 + i) > 0.6 ? 1.8 : 1.1;
        ctx.fillRect(sx2, sy2, tw, tw);
      }
    }
    if (sm.sun && sm.sun.a > 0.05) {
      const grad = ctx.createRadialGradient(sm.sun.x, sm.sun.y, 2, sm.sun.x, sm.sun.y, 40);
      grad.addColorStop(0, `rgba(255,240,190,${sm.sun.a})`);
      grad.addColorStop(0.4, `rgba(255,220,140,${sm.sun.a * 0.8})`);
      grad.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sm.sun.x, sm.sun.y, 40, 0, Math.PI * 2); ctx.fill();
    }
    if (sm.moon && sm.moon.a > 0.05) {
      ctx.fillStyle = `rgba(230,232,240,${sm.moon.a})`;
      ctx.beginPath(); ctx.arc(sm.moon.x, sm.moon.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = env.skyColors().top;
      ctx.beginPath(); ctx.arc(sm.moon.x + 5, sm.moon.y - 3, 10, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawScenery(rtime, b) {
    const cloudiness = 1 + env.precip01() * 2;
    for (let c = 0; c < Math.round(5 * cloudiness); c++) {
      const cw = WORLD_W * TILE;
      const cx = ((c * 811 + rtime * (5 + c * 2) * (1 + env.wind01())) % (cw + 300)) - 150;
      cloud(cx, 26 + (c * 47 % 130), env.precip01());
    }
    for (let tx = Math.max(0, b.x0); tx <= Math.min(WORLD_W - 1, b.x1); tx++) {
      if (tx >= spawnCol - CAMP_HALF_L - 1 && tx <= spawnCol + CAMP_HALF_R + 1) continue;
      const baseY = world.surface[tx] * TILE;
      const biome = biomeAtX(tx, WORLD_W);
      if (hashCol(tx, 55) > 0.93) drawTree(tx * TILE + TILE / 2, baseY, biome, tx, rtime);
      else if (hashCol(tx, 40) > 0.9) drawDressing(tx * TILE + TILE / 2, baseY, tx);
      if (hashCol(tx, 88) > 0.3) tuft(tx * TILE + TILE / 2, baseY, tx, biome, rtime);
    }
  }

  function drawTiles(b, rt) {
    const y0 = Math.max(0, b.y0), y1 = Math.min(WORLD_H - 1, b.y1);
    const x0 = Math.max(0, b.x0), x1 = Math.min(WORLD_W - 1, b.x1);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = world.tiles[ty * WORLD_W + tx];
        const dx = tx * TILE, dy = ty * TILE;
        const depth = world.depthOfRow(tx, ty);
        if (t === T_AIR) {
          if (depth >= 0 && ty < WORLD_H - 3) tileset.drawBack(ctx, world.stratumIndexAt(tx, ty), tx, ty, dx, dy);
          continue;
        }
        if (t === T_WATER || t === T_LAVA) {
          // fluids sit over the darkened back wall
          if (depth >= 0) tileset.drawBack(ctx, world.stratumIndexAt(tx, ty), tx, ty, dx, dy);
          const surface = world.tileAt(tx, ty - 1) !== t;   // top row of the body
          if (t === T_WATER) {
            ctx.fillStyle = 'rgba(70,130,170,0.55)';
            ctx.fillRect(dx, dy, TILE, TILE);
            if (surface) { ctx.fillStyle = 'rgba(180,220,240,0.5)'; ctx.fillRect(dx, dy + (Math.sin(rt * 2 + tx) * 1.2 | 0), TILE, 2); }
          } else {
            const glow = 0.7 + Math.sin(rt * 3 + tx * 1.5) * 0.3;
            ctx.fillStyle = `rgba(${210 + glow * 40 | 0},${90 + glow * 40 | 0},30,0.9)`;
            ctx.fillRect(dx, dy, TILE, TILE);
            if (surface) { ctx.fillStyle = `rgba(255,${200 + glow * 40 | 0},120,0.8)`; ctx.fillRect(dx, dy, TILE, 3); }
            if ((tx + ty) % 3 === 0) frameLights.push({ x: dx + 8, y: dy + 8, r: 46, warmth: 1 });
          }
          continue;
        }
        if (t === T_BEDROCK) { ctx.fillStyle = '#4A4038'; ctx.fillRect(dx, dy, TILE, TILE); continue; }

        const inPad = ty === world.surface[tx] && tx >= spawnCol - CAMP_HALF_L && tx <= spawnCol + CAMP_HALF_R;
        if (t === T_PLACED) tileset.drawPlaced(ctx, (tx ^ ty) & 7, dx, dy);
        else if (inPad) tileset.drawPad(ctx, tx, ty, dx, dy);
        else {
          let si = world.stratumIndexAt(tx, ty);
          const band = STRATA[si];
          const from = band.depth[0], to = Number.isFinite(band.depth[1]) ? band.depth[1] : from + 50;
          const within = (depth - from) / Math.max(1, to - from);
          if (depth - from < 2 && si > 0 && hashCol(tx * 7 + ty, 13) > 0.55) si -= 1;
          else if (to - depth < 2 && si < STRATA.length - 1 && hashCol(tx * 5 + ty, 17) > 0.55) si += 1;
          tileset.drawTile(ctx, si, tx, ty, dx, dy, Math.max(0, Math.min(1, within)));
          if (hashCol(tx * 3 + 1, ty * 5 + 2) < 0.07) tileset.drawAccent(ctx, STRATA[si].id, tx, ty, dx, dy);
        }

        if (ty === world.surface[tx] && !inPad) {
          const biome = biomeAtX(tx, WORLD_W);
          ctx.fillStyle = biome.id === 'tundra' ? '#9DB8AE' : biome.id === 'coast' ? PALETTE.grassDeep : PALETTE.grass;
          ctx.fillRect(dx, dy, TILE, 4);
          ctx.fillStyle = PALETTE.grassDeep;
          ctx.fillRect(dx, dy + 3, TILE, 1);
        }

        ctx.fillStyle = 'rgba(30,22,18,0.38)';
        if (world.tileAt(tx, ty - 1) === T_AIR && ty !== world.surface[tx]) ctx.fillRect(dx, dy, TILE, 2);
        if (world.tileAt(tx, ty + 1) === T_AIR) ctx.fillRect(dx, dy + TILE - 2, TILE, 2);
        if (world.tileAt(tx - 1, ty) === T_AIR) ctx.fillRect(dx, dy, 2, TILE);
        if (world.tileAt(tx + 1, ty) === T_AIR) ctx.fillRect(dx + TILE - 2, dy, 2, TILE);
      }
    }
  }

  // ---- cave features: stalactites, roots, glow mushrooms, crystals ----
  function drawCaveProps(b, rtime) {
    const y0 = Math.max(1, b.y0), y1 = Math.min(WORLD_H - 4, b.y1);
    const x0 = Math.max(0, b.x0), x1 = Math.min(WORLD_W - 1, b.x1);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (world.tileAt(tx, ty) !== T_AIR) continue;
        const depth = world.depthOfRow(tx, ty);
        if (depth < 3) continue;
        const dx = tx * TILE, dy = ty * TILE;
        const si = world.stratumIndexAt(tx, ty);
        const h = hashCol(tx * 13 + 5, ty * 7 + 3);

        // ceiling features
        if (world.solidAt(tx, ty - 1)) {
          if (depth < 42 && h > 0.82) {
            // hanging roots (topsoil bands) — sway
            const sway = Math.sin(rtime * 1.8 + tx) * 2;
            ctx.strokeStyle = '#6E5237';
            ctx.lineWidth = 1.3;
            const len = 6 + h * 12;
            ctx.beginPath();
            ctx.moveTo(dx + 5, dy);
            ctx.quadraticCurveTo(dx + 5 + sway, dy + len * 0.6, dx + 5 + sway, dy + len);
            ctx.moveTo(dx + 11, dy);
            ctx.quadraticCurveTo(dx + 11 - sway, dy + (len - 3) * 0.6, dx + 11 - sway, dy + len - 3);
            ctx.stroke();
          } else if (h > 0.9) {
            // stalactite
            const stal = STRATA[si].colors.band;
            ctx.fillStyle = stal;
            ctx.beginPath();
            ctx.moveTo(dx + 3, dy); ctx.lineTo(dx + 8, dy + 9 + h * 5); ctx.lineTo(dx + 13, dy);
            ctx.closePath(); ctx.fill();
          }
        }
        // floor features
        if (world.solidAt(tx, ty + 1)) {
          if (h > 0.9 && h < 0.94) {
            // stalagmite
            ctx.fillStyle = STRATA[si].colors.band;
            ctx.beginPath();
            ctx.moveTo(dx + 4, dy + TILE); ctx.lineTo(dx + 8, dy + TILE - 8 - h * 4); ctx.lineTo(dx + 12, dy + TILE);
            ctx.closePath(); ctx.fill();
          } else if (depth > 14 && h > 0.965) {
            // glow mushrooms — they light their corner
            const pulse = 0.7 + Math.sin(rtime * 2 + tx) * 0.3;
            for (let m = 0; m < 3; m++) {
              const mx = dx + 3 + m * 5, stem = 3 + ((tx + m) % 3);
              ctx.fillStyle = '#C8B890';
              ctx.fillRect(mx, dy + TILE - stem, 1.6, stem);
              ctx.fillStyle = `rgba(150,220,170,${0.85 * pulse})`;
              ctx.beginPath(); ctx.arc(mx + 0.8, dy + TILE - stem, 2.6, Math.PI, 0); ctx.fill();
            }
            frameLights.push({ x: dx + 8, y: dy + TILE - 4, r: 42, warmth: 0.4 });
          } else if (si >= STRATA.length - 2 && h > 0.93 && h <= 0.965) {
            // deep crystal cluster
            const tw = 0.6 + Math.sin(rtime * 3 + tx * 2) * 0.4;
            ctx.fillStyle = `rgba(200,180,230,${0.5 + tw * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(dx + 4, dy + TILE); ctx.lineTo(dx + 6, dy + TILE - 8); ctx.lineTo(dx + 8, dy + TILE);
            ctx.moveTo(dx + 8, dy + TILE); ctx.lineTo(dx + 11, dy + TILE - 11); ctx.lineTo(dx + 14, dy + TILE);
            ctx.closePath(); ctx.fill();
            if (tw > 0.8) frameLights.push({ x: dx + 9, y: dy + TILE - 5, r: 30, warmth: 0 });
          }
        }
      }
    }
  }

  function drawPockets(b) {
    for (const p of world.pockets) {
      if (p.tx < b.x0 || p.tx > b.x1 || p.ty < b.y0 || p.ty > b.y1) continue;
      if (!world.pocketAt(p.tx, p.ty)) continue;
      const exposed = world.tileAt(p.tx - 1, p.ty) === T_AIR || world.tileAt(p.tx + 1, p.ty) === T_AIR ||
        world.tileAt(p.tx, p.ty - 1) === T_AIR || world.tileAt(p.tx, p.ty + 1) === T_AIR;
      drawBoneNub(ctx, p, p.tx * TILE, p.ty * TILE, exposed);
    }
  }

  // ---- THE BASE: vitrine wing · work bay · lander · solar wing + incubator ----
  function drawPlatform(rtime) {
    const dy = deckY - 8;

    // under-truss + legs with feet
    ctx.strokeStyle = '#4E4956';
    ctx.lineWidth = 3;
    for (let lx = deckX0 + 16; lx < deckX1; lx += 60) {
      ctx.beginPath();
      ctx.moveTo(lx, dy + 9); ctx.lineTo(lx - 6, deckY + 12);
      ctx.moveTo(lx, dy + 9); ctx.lineTo(lx + 6, deckY + 12);
      ctx.stroke();
      ctx.fillStyle = '#3A363F';
      ctx.fillRect(lx - 9, deckY + 11, 18, 3);
    }
    // deck: thick riveted plates
    ctx.fillStyle = '#3A363F';
    ctx.fillRect(deckX0, dy, deckX1 - deckX0, 10);
    ctx.fillStyle = '#4E4956';
    ctx.fillRect(deckX0, dy, deckX1 - deckX0, 2);
    for (let x = deckX0; x < deckX1; x += 24) {
      ctx.fillStyle = '#2B2733'; ctx.fillRect(x, dy, 1.5, 10);
      ctx.fillStyle = '#5C5766'; ctx.fillRect(x + 11, dy + 4, 2, 2);
    }
    // hazard stripes at both ends
    for (const ex of [deckX0, deckX1 - 16]) {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#1E1B22' : PALETTE.amberSoft;
        ctx.fillRect(ex + i * 4, dy, 3.4, 3);
      }
    }
    // cable run along the front face
    ctx.strokeStyle = '#26222E';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = deckX0 + 6; x < deckX1 - 12; x += 26) {
      ctx.moveTo(x, dy + 8);
      ctx.quadraticCurveTo(x + 13, dy + 12, x + 26, dy + 8);
    }
    ctx.stroke();

    // ---- weatherproof canopy: glass roof + walls, always-lit interior (mod 11) ----
    const roofY = dy - 84;
    // warm interior wash (reads as lit even in daylight)
    ctx.fillStyle = 'rgba(255,236,190,0.10)';
    ctx.fillRect(deckX0, roofY, deckX1 - deckX0, dy - roofY);
    // glass side walls
    ctx.fillStyle = 'rgba(180,210,225,0.12)';
    ctx.fillRect(deckX0 - 4, roofY, 6, dy - roofY);
    ctx.fillRect(deckX1 - 2, roofY, 6, dy - roofY);
    // roof beams + translucent panels
    ctx.fillStyle = '#2B2733';
    ctx.fillRect(deckX0 - 6, roofY - 8, deckX1 - deckX0 + 12, 8);
    ctx.fillStyle = 'rgba(150,190,210,0.16)';
    ctx.fillRect(deckX0, roofY, deckX1 - deckX0, 6);
    ctx.fillStyle = '#4E4956';
    for (let bx = deckX0; bx <= deckX1; bx += TILE * 2) ctx.fillRect(bx, roofY - 8, 2, 8 + (dy - roofY) * 0.12);
    // interior ceiling lights — on regardless of day/night
    for (let lx = deckX0 + 3 * TILE; lx < deckX1 - TILE; lx += 6 * TILE) {
      ctx.fillStyle = '#FFE9B8';
      ctx.fillRect(lx - 3, roofY + 5, 6, 2);
      frameLights.push({ x: lx, y: roofY + 8, r: 90, warmth: 0.9 });
    }
    campRoofY = roofY;

    // deck lamps
    for (let lx = deckX0 + 30; lx < deckX1 - 20; lx += 6 * TILE) {
      ctx.fillStyle = '#4E4956';
      ctx.fillRect(lx - 1, dy - 18, 2.5, 18);
      ctx.fillStyle = '#FFE9B8';
      ctx.beginPath(); ctx.arc(lx, dy - 19, 2.6, 0, Math.PI * 2); ctx.fill();
      frameLights.push({ x: lx, y: dy - 16, r: 64, warmth: 0.8 });
    }

    // ---- work bay canopy over the stations ----
    const bayX0 = lab.instances[0].x - 24, bayX1 = lab.instances[lab.instances.length - 1].x + 24;
    ctx.strokeStyle = '#4E4956';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bayX0, dy); ctx.lineTo(bayX0, dy - 52);
    ctx.moveTo(bayX1, dy); ctx.lineTo(bayX1, dy - 56);
    ctx.stroke();
    // slanted roof
    ctx.fillStyle = '#2B2733';
    ctx.beginPath();
    ctx.moveTo(bayX0 - 8, dy - 50); ctx.lineTo(bayX1 + 8, dy - 56);
    ctx.lineTo(bayX1 + 8, dy - 50); ctx.lineTo(bayX0 - 8, dy - 44);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = PALETTE.amberSoft;
    ctx.fillRect(bayX0 - 8, dy - 45, bayX1 - bayX0 + 16, 1.5);
    // work strip marking
    ctx.fillStyle = 'rgba(224,162,74,0.25)';
    ctx.fillRect(bayX0, dy - 1, bayX1 - bayX0, 2);

    // ---- lander core (the hero) ----
    const lx = (spawnCol + CAMP_HALF_R - 5) * TILE;
    // engine bell below deck
    ctx.fillStyle = '#2B2733';
    ctx.beginPath();
    ctx.moveTo(lx + 14, dy + 10); ctx.lineTo(lx + 10, deckY + 12); ctx.lineTo(lx + 34, deckY + 12); ctx.lineTo(lx + 30, dy + 10);
    ctx.closePath(); ctx.fill();
    // pod body
    ctx.fillStyle = '#332F3A';
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(lx + 6, dy - 58, 32, 58, 8); ctx.fill(); } else ctx.fillRect(lx + 6, dy - 58, 32, 58);
    ctx.fillStyle = '#4E4956';
    ctx.fillRect(lx + 10, dy - 50, 24, 3);
    ctx.fillRect(lx + 10, dy - 42, 24, 3);
    // round window (glows warm)
    ctx.fillStyle = '#1A2430';
    ctx.beginPath(); ctx.arc(lx + 22, dy - 28, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,233,184,0.5)';
    ctx.beginPath(); ctx.arc(lx + 22, dy - 28, 4, 0, Math.PI * 2); ctx.fill();
    frameLights.push({ x: lx + 22, y: dy - 28, r: 46, warmth: 0.6 });
    // ladder
    ctx.strokeStyle = '#5C5766';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lx + 2, dy); ctx.lineTo(lx + 2, dy - 34);
    ctx.moveTo(lx + 7, dy); ctx.lineTo(lx + 7, dy - 34);
    for (let r = 1; r < 6; r++) { ctx.moveTo(lx + 2, dy - r * 6); ctx.lineTo(lx + 7, dy - r * 6); }
    ctx.stroke();
    // dish on top
    ctx.strokeStyle = '#8E96A4';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(lx + 16, dy - 66, 9, Math.PI * 0.85, Math.PI * 1.95); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx + 16, dy - 66); ctx.lineTo(lx + 18, dy - 58); ctx.stroke();
    // beacon
    const blink = Math.sin(rtime * 3) > 0.6;
    ctx.fillStyle = blink ? '#E85B4A' : '#5A2A24';
    ctx.beginPath(); ctx.arc(lx + 34, dy - 62, 2.4, 0, Math.PI * 2); ctx.fill();
    if (blink) frameLights.push({ x: lx + 34, y: dy - 62, r: 30, warmth: 0.3 });

    // ---- solar wing ----
    const sx0 = lx + 46;
    ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx0 + 14, dy); ctx.lineTo(sx0 + 14, dy - 16); ctx.stroke();
    ctx.save();
    ctx.translate(sx0 + 14, dy - 16);
    ctx.rotate(-0.12);
    ctx.fillStyle = '#27405C';
    ctx.fillRect(-16, -12, 32, 12);
    ctx.strokeStyle = '#4E6E96'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-16 + i * 8, -12); ctx.lineTo(-16 + i * 8, 0); ctx.stroke(); }
    ctx.strokeRect(-16, -12, 32, 12);
    ctx.restore();

    // ---- crates + barrel props ----
    ctx.fillStyle = '#6E4F33';
    ctx.fillRect(bayX1 + 14, dy - 12, 12, 12);
    ctx.strokeStyle = '#4A3421'; ctx.lineWidth = 1;
    ctx.strokeRect(bayX1 + 14, dy - 12, 12, 12);
    ctx.beginPath(); ctx.moveTo(bayX1 + 14, dy - 12); ctx.lineTo(bayX1 + 26, dy); ctx.stroke();
    ctx.fillStyle = '#5C5766';
    ctx.beginPath(); ctx.ellipse(bayX1 + 36, dy - 7, 5, 7, 0, 0, Math.PI * 2); ctx.fill();

    // ---- incubator pod (far left — the future) ----
    const viable = collection.anyViable();
    ctx.fillStyle = '#3A363F';
    ctx.fillRect(INCUBATOR.x - 4, deckY - 4, 34, 6);
    ctx.fillStyle = viable ? 'rgba(150,220,190,0.35)' : 'rgba(140,160,170,0.2)';
    ctx.beginPath();
    ctx.ellipse(INCUBATOR.x + 13, INCUBATOR.y + 12, 13, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5C5766';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(INCUBATOR.x + 13, INCUBATOR.y + 12, 13, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    // cables to the deck
    ctx.strokeStyle = '#26222E'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(INCUBATOR.x + 24, INCUBATOR.y + 24);
    ctx.quadraticCurveTo(INCUBATOR.x + 36, deckY - 2, deckX0 + 4, dy + 6);
    ctx.stroke();
    if (viable) {
      const pulse = 0.5 + Math.sin(rtime * 2) * 0.4;
      ctx.fillStyle = `rgba(150,220,190,${(pulse * 0.5).toFixed(2)})`;
      ctx.beginPath(); ctx.ellipse(INCUBATOR.x + 13, INCUBATOR.y + 12, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
      frameLights.push({ x: INCUBATOR.x + 13, y: INCUBATOR.y + 12, r: 50, warmth: 0.2 });
    }

    // ---- vitrine (museum piece) ----
    // base cabinet
    ctx.fillStyle = '#4A3421';
    ctx.fillRect(VIT.x - 6, deckY - 12, VIT.w + 12, 6);
    ctx.fillStyle = '#6E4F33';
    ctx.fillRect(VIT.x - 6, deckY - 10, VIT.w + 12, 2);
    // steel frame
    ctx.fillStyle = '#3A363F';
    ctx.fillRect(VIT.x - 5, VIT.y - 5, VIT.w + 10, VIT.h + 10);
    // interior glow
    ctx.fillStyle = 'rgba(255,244,214,0.12)';
    ctx.fillRect(VIT.x, VIT.y, VIT.w, VIT.h);
    // glass
    ctx.fillStyle = 'rgba(170,205,220,0.18)';
    ctx.fillRect(VIT.x, VIT.y, VIT.w, VIT.h);
    // mullions
    ctx.fillStyle = '#4E4956';
    ctx.fillRect(VIT.x, VIT.y + VIT.h / 2 - 1, VIT.w, 2.5);
    for (let c = 1; c < VIT.cols; c++) ctx.fillRect(VIT.x + c * (VIT.w / VIT.cols) - 1, VIT.y, 2, VIT.h);
    frameLights.push({ x: VIT.x + VIT.w / 2, y: VIT.y + VIT.h / 2, r: 80, warmth: 0.5 });

    const near = vitrineSlotNear();
    for (const s of vitrineSlots()) {
      const frac = collection.fraction(s.id);
      const isNear = near && near.id === s.id;
      if (isNear && collection.isComplete(s.id)) {
        ctx.fillStyle = 'rgba(224,162,74,0.18)';
        ctx.fillRect(s.x - 2, s.y - 2, s.w + 4, s.h + 4);
      }
      ctx.save();
      ctx.globalAlpha = collection.isComplete(s.id) ? 1 : 0.25 + frac * 0.35;
      const sc = Math.min(s.w / (s.spec.footprint[0] * TILE), (s.h - 10) / (s.spec.footprint[1] * TILE));
      drawFossil(ctx, s.spec, s.x + s.w / 2 - s.spec.footprint[0] * TILE * sc / 2, s.y + 2, makeCanvas, sc);
      ctx.restore();
      if (!collection.isComplete(s.id)) {
        const n = collection.bonesNeeded(s.id);
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = collection.hasBone(s.id, i) ? PALETTE.amber : 'rgba(0,0,0,0.25)';
          ctx.fillRect(s.x + 2 + i * 5, s.y + s.h - 4, 3.5, 2.5);
        }
      }
      // DNA pip (genome progress)
      const gn = collection.genomeOf(s.id);
      if (gn > 0) drawDnaPip(s.x + s.w - 9, s.y + 3, gn, rtime);
      if (isNear && collection.isComplete(s.id)) drawKeycap(ctx, s.x + s.w / 2, s.y - 14);
    }
    // sheen
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.moveTo(VIT.x + 6, VIT.y + VIT.h); ctx.lineTo(VIT.x + VIT.w * 0.3, VIT.y);
    ctx.lineTo(VIT.x + VIT.w * 0.42, VIT.y); ctx.lineTo(VIT.x + VIT.w * 0.18, VIT.y + VIT.h);
    ctx.closePath(); ctx.fill();

    drawStations(dy);
  }

  // tiny double-helix progress pip
  function drawDnaPip(x, y, frac, rtime) {
    ctx.save();
    ctx.strokeStyle = frac >= 1 ? '#7FE8B8' : '#7FC4A8';
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.5 + frac * 0.5;
    for (let i = 0; i < 4; i++) {
      const ph = rtime * 2 + i * 1.2;
      const lit = i / 4 < frac;
      ctx.globalAlpha = lit ? 0.9 : 0.25;
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(ph) * 2.5, y + i * 3);
      ctx.lineTo(x - Math.sin(ph) * 2.5, y + i * 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStations(deckTopY) {
    const near = lab.nearest(player);
    for (const st of lab.instances) {
      const x = st.x, y = deckTopY;   // ON the deck surface
      const isNear = near === st;
      const hasInput = !!satchel.firstAtState(st.spec.input);
      // soft glow when the rover is at this station (no hard box — mod 9 cleanup)
      if (isNear) {
        const glow = ctx.createRadialGradient(x, y - 12, 4, x, y - 12, 30);
        glow.addColorStop(0, `rgba(224,162,74,${hasInput ? 0.24 : 0.12})`);
        glow.addColorStop(1, 'rgba(224,162,74,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y - 12, 30, 0, Math.PI * 2); ctx.fill();
      }
      // pedestal
      ctx.fillStyle = '#4E4956';
      ctx.fillRect(x - 14, y - 4, 28, 4);
      if (hasSprite('stations', st.spec.sprite)) drawSprite(ctx, 'stations', st.spec.sprite, x, y - 3, 38, 38);
      else { chip(ctx, x - 15, y - 25, 30, 21, { fill: st.spec.tint, r: 5 }); }
      // near: floating E cap + a compact name chip sized to the name (mods 9,10)
      if (isNear) {
        drawKeycap(ctx, x, y - 56, hasInput);
        const label = st.spec.name;
        const tw = measure(ctx, label, 9, true);
        chip(ctx, x - tw / 2 - 7, y - 44, tw + 14, 14, { r: 7, fill: PALETTE.frameDark, border: null });
        text(ctx, label, x, y - 41, { size: 9, bold: true, align: 'center', color: PALETTE.parchment });
        if (!hasInput) text(ctx, `needs ${st.spec.input}`, x, y - 30, { size: 8, align: 'center', color: PALETTE.creamDim });
      }
    }
  }

  function drawKeycap(ctx2, x, y, active = true) {
    const bobY = y + Math.sin(time * 4) * 2;
    ctx2.globalAlpha = active ? 1 : 0.5;
    ctx2.fillStyle = active ? PALETTE.parchment : '#9A9088';
    if (ctx2.roundRect) { ctx2.beginPath(); ctx2.roundRect(x - 8, bobY - 8, 16, 16, 4); ctx2.fill(); } else ctx2.fillRect(x - 8, bobY - 8, 16, 16);
    ctx2.strokeStyle = PALETTE.frameDark;
    ctx2.lineWidth = 2;
    if (ctx2.roundRect) { ctx2.beginPath(); ctx2.roundRect(x - 8, bobY - 8, 16, 16, 4); ctx2.stroke(); }
    text(ctx2, 'E', x, bobY - 6, { size: 12, bold: true, align: 'center' });
    ctx2.globalAlpha = 1;
  }

  // "done" feedback after a station: check + produced state + next station (mod 8)
  function drawResultBanner() {
    const a = Math.min(1, resultBanner.t * 3) * Math.min(1, (2 - resultBanner.t) * 2);
    ctx.globalAlpha = a;
    const label = resultBanner.next ? `${resultBanner.done.toUpperCase()} ✓  →  ${resultBanner.next}` : `${resultBanner.done.toUpperCase()} ✓`;
    const tw = measure(ctx, label, 15, true);
    chip(ctx, VIEW_W / 2 - tw / 2 - 20, 120, tw + 40, 34, { r: 12, fill: PALETTE.frameDark });
    ctx.fillStyle = PALETTE.good;
    ctx.beginPath(); ctx.arc(VIEW_W / 2 - tw / 2 - 4, 137, 4, 0, Math.PI * 2); ctx.fill();
    text(ctx, label, VIEW_W / 2 + 8, 130, { size: 15, bold: true, align: 'center', color: PALETTE.parchment });
    ctx.globalAlpha = 1;
  }

  function drawPrecip() {
    if (!rainDrops.length) return;
    for (const d of rainDrops) {
      if (d.snow) {
        ctx.fillStyle = 'rgba(240,246,250,0.85)';
        ctx.fillRect(d.x, d.y, 2.2, 2.2);
      } else {
        ctx.strokeStyle = 'rgba(170,200,225,0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.vx * 0.02, d.y + 9);
        ctx.stroke();
      }
    }
  }

  // scanner reticle at the mouse; brackets close + progress ring while scanning
  function drawReticle(rtime) {
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    const targets = ambient.scanTargets(wx, wy);
    const id = scanTargetAt(wx, wy, world, targets);
    const has = !!id;
    ctx.strokeStyle = has ? '#4BE3E8' : 'rgba(75,227,232,0.4)';
    ctx.lineWidth = 1.6;
    const r = 12 - (scanning ? scanning.t * 4 : 0);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath();
      ctx.moveTo(wx + sx * r, wy + sy * r - sy * 5);
      ctx.lineTo(wx + sx * r, wy + sy * r);
      ctx.lineTo(wx + sx * r - sx * 5, wy + sy * r);
      ctx.stroke();
    }
    if (scanning) {
      ctx.strokeStyle = '#4BE3E8';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(wx, wy, 16, -Math.PI / 2, -Math.PI / 2 + scanning.t * Math.PI * 2); ctx.stroke();
    } else if (has) {
      ctx.fillStyle = 'rgba(75,227,232,0.9)';
      ctx.beginPath(); ctx.arc(wx, wy, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  // parachute canopy above the rover (world space); sway + shroud lines
  function drawChute(cx, topY, rtime) {
    const sway = Math.sin(rtime * 2.2) * 3;
    const ay = topY - 30, aw = 26;
    // shroud lines
    ctx.strokeStyle = 'rgba(60,45,35,0.8)';
    ctx.lineWidth = 1;
    for (const sx of [-1, -0.4, 0.4, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + 3, topY + 4); ctx.lineTo(cx + sx * aw * 0.9 + sway, ay + 4); ctx.stroke();
    }
    // canopy (three-lobed dome)
    ctx.fillStyle = '#E0A24A';
    ctx.beginPath();
    ctx.moveTo(cx - aw + sway, ay + 5);
    ctx.quadraticCurveTo(cx - aw * 0.5 + sway, ay - 12, cx + sway, ay - 2);
    ctx.quadraticCurveTo(cx + aw * 0.5 + sway, ay - 12, cx + aw + sway, ay + 5);
    ctx.quadraticCurveTo(cx + sway, ay + 12, cx - aw + sway, ay + 5);
    ctx.closePath(); ctx.fill();
    // gores
    ctx.strokeStyle = 'rgba(120,80,30,0.5)'; ctx.lineWidth = 1;
    for (const sx of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(cx + sx * aw + sway, ay - 6); ctx.lineTo(cx + sx * aw * 0.7 + sway, ay + 7); ctx.stroke(); }
  }

  function drawBeam(rtime) {
    if (!player.beam) return;
    const lx = player.cx() + player.facing * 7, ly = player.y + PLAYER_H - 7;
    const { x, y } = player.beam;
    ctx.strokeStyle = 'rgba(224,162,74,0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
    ctx.strokeStyle = '#FFF3D0';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.7)';
    ctx.beginPath(); ctx.arc(x, y, 3 + Math.sin(rtime * 40) * 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // ---- scenery primitives (wind-driven sway) ----
  function cloud(px, py, gloom) { softCloud(ctx, px, py, gloom); }
  function tuft(px, baseY, sx, biome, rtime) {
    ctx.strokeStyle = biome.id === 'tundra' ? PALETTE.tundraGrass : biome.id === 'coast' ? PALETTE.grassDeep : PALETTE.grass;
    ctx.lineWidth = 1.5;
    const sway = Math.sin(rtime * (1.6 + env.wind01() * 3) + sx * 0.7) * (1.2 + env.wind01() * 5);
    const blades = 2 + Math.floor(hashCol(sx, 9) * 2);
    ctx.beginPath();
    for (let bl = 0; bl < blades; bl++) {
      const ox = (bl - blades / 2) * 3 + hashCol(sx + bl, 1) * 2;
      const bh = 4 + hashCol(sx + bl, 5) * 4;
      const bend = (hashCol(sx + bl, 7) - 0.5) * 5 + sway;
      ctx.moveTo(px + ox, baseY); ctx.quadraticCurveTo(px + ox + bend, baseY - bh * 0.6, px + ox + bend, baseY - bh);
    }
    ctx.stroke();
  }
  function drawTree(px, baseY, biome, sx, rtime) {
    const id = biome.id === 'tundra' ? 'tree-conifer' : biome.id === 'coast' ? 'tree-palm' : 'tree-badlands';
    const sway = Math.sin(rtime * (1.1 + env.wind01() * 2) + sx) * (0.008 + env.wind01() * 0.03);
    ctx.save();
    ctx.translate(px, baseY + 2);
    ctx.rotate(sway);
    if (hasSprite('scenery', id)) drawSprite(ctx, 'scenery', id, 0, 0, 56, 72);
    else {
      ctx.fillStyle = PALETTE.wood;
      const h = 3 + Math.floor(hashCol(px, 3) * 3);
      ctx.fillRect(-2, -h * TILE - 2, 4, h * TILE);
      ctx.fillStyle = biome.id === 'tundra' ? '#8FB0A2' : PALETTE.grassDeep;
      for (const [ox, oy, r] of [[0, -6, 13], [-9, 0, 10], [9, -1, 10], [0, 6, 9]]) { ctx.beginPath(); ctx.arc(ox, -h * TILE - 2 + oy, r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }
  function drawDressing(px, baseY, sx) {
    const r = hashCol(sx, 71);
    const id = r > 0.66 ? 'bush' : r > 0.33 ? 'boulder' : 'flowers';
    if (hasSprite('scenery', id)) { drawSprite(ctx, 'scenery', id, px, baseY + 2, 24, 20); return; }
    if (id === 'boulder') { ctx.fillStyle = '#9A93A0'; ctx.beginPath(); ctx.ellipse(px, baseY - 5, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = id === 'flowers' ? '#C98BA8' : PALETTE.grassDeep; ctx.beginPath(); ctx.arc(px, baseY - 5, 6, 0, Math.PI * 2); ctx.fill(); }
  }

  // --------------------------------------------------------------- HUD
  function drawHUD() {
    const depth = Math.max(0, world.depthOfRow(player.tx(), Math.floor((player.y + player.h) / TILE)));
    const stratum = world.stratumAt(player.tx(), Math.floor(player.cy() / TILE));

    // active-tool chip, bottom-centre-left (Ctrl to switch)
    const scan = player.tool === 'scan';
    chip(ctx, 108, VIEW_H - 40, 118, 28, { r: 8 });
    ctx.fillStyle = scan ? '#4BE3E8' : PALETTE.amber;
    if (scan) { ctx.strokeStyle = '#4BE3E8'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(124, VIEW_H - 26, 5, 0, Math.PI * 2); ctx.stroke(); ctx.fillRect(123, VIEW_H - 27, 2, 2); }
    else { ctx.fillRect(118, VIEW_H - 27, 12, 2); }
    text(ctx, scan ? 'SCAN' : 'LASER', 136, VIEW_H - 33, { size: 12, bold: true, color: scan ? '#4BE3E8' : PALETTE.amber });
    text(ctx, 'CTRL', 200, VIEW_H - 32, { size: 9, color: PALETTE.creamDim });

    chip(ctx, 12, 12, 186, 48, { r: 10 });
    text(ctx, formatDepth(realDepthAt(depth)), 26, 19, { size: 19, bold: true, color: PALETTE.amber });
    text(ctx, depth > 0 ? formatAge(stratum) : 'surface', 26, 42, { size: 10, color: PALETTE.creamDim });
    ctx.fillStyle = stratum.colors.base;
    ctx.fillRect(176, 22, 12, 28);

    if (!collection.isComplete(MISSION_ID)) {
      const rex = FOSSILS_BY_ID[MISSION_ID];
      const need = collection.bonesNeeded(MISSION_ID);
      const w = 44 + need * 9;
      chip(ctx, VIEW_W / 2 - w / 2, 12, w, 26, { r: 8, fill: PALETTE.frameDark });
      ctx.save(); ctx.globalAlpha = 0.9;
      drawFossil(ctx, rex, VIEW_W / 2 - w / 2 + 5, 15, makeCanvas, 0.26);
      ctx.restore();
      for (let i = 0; i < need; i++) {
        ctx.fillStyle = collection.hasBone(MISSION_ID, i) ? PALETTE.amber : 'rgba(255,255,255,0.15)';
        ctx.fillRect(VIEW_W / 2 - w / 2 + 32 + i * 9, 22, 6, 6);
      }
    }

    const frags = satchel.items;
    const shown = Math.min(frags.length, 6);
    const sw = 26 + shown * 15 + (frags.length > 6 ? 26 : 0);
    chip(ctx, VIEW_W - sw - 12, 12, sw, 28, { r: 8 });
    for (let i = 0; i < shown; i++) {
      const f = frags[i];
      const lvl = SPECIMEN_STATES.indexOf(f.state);
      const col = ['#8A7355', '#CFC5A9', '#E0A24A', '#6C9A54'][Math.min(3, lvl)] || '#8A7355';
      const bx = VIEW_W - sw - 12 + 14 + i * 15, by = 26;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-0.5);
      ctx.fillStyle = col;
      ctx.fillRect(-5, -1.5, 10, 3);
      ctx.beginPath(); ctx.arc(-5, 0, 2.2, 0, 7); ctx.arc(5, 0, 2.2, 0, 7); ctx.fill();
      ctx.restore();
    }
    if (frags.length > 6) text(ctx, `+${frags.length - 6}`, VIEW_W - 24, 19, { size: 11, bold: true, align: 'right', color: PALETTE.cream });

    chip(ctx, 12, VIEW_H - 40, 86, 28, { r: 8 });
    ctx.fillStyle = PALETTE.parchment;
    ctx.beginPath(); ctx.arc(30, VIEW_H - 27, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(26, VIEW_H - 25, 8, 5);
    ctx.fillStyle = PALETTE.frameDark;
    ctx.fillRect(27.5, VIEW_H - 29, 2, 2); ctx.fillRect(31.5, VIEW_H - 29, 2, 2);
    text(ctx, `${collection.completedCount()}/${collection.total()}`, 44, VIEW_H - 33, { size: 13, bold: true, color: PALETTE.cream });
  }

  function drawBanner() {
    const a = Math.min(1, banner.life) * Math.min(1, (3 - banner.life) * 3);
    ctx.globalAlpha = a;
    const str = formatAge(banner.stratum).toUpperCase();
    const tw = measure(ctx, str, 17, true);
    blueprintPanel(ctx, VIEW_W / 2 - tw / 2 - 26, 74, tw + 52, 44, { frameW: 6, r: 12, deep: true, grid: false });
    text(ctx, str, VIEW_W / 2, 96, { size: 17, bold: true, align: 'center', baseline: 'middle', color: PALETTE.cream });
    ctx.globalAlpha = 1;
  }
  function drawMissionBanner() {
    const a = Math.min(1, missionBanner) * Math.min(1, (6 - missionBanner) * 2);
    ctx.globalAlpha = a;
    blueprintPanel(ctx, VIEW_W / 2 - 240, VIEW_H / 2 - 60, 480, 96, { frameW: 8, r: 16, deep: true });
    text(ctx, 'MISSION COMPLETE', VIEW_W / 2, VIEW_H / 2 - 34, { size: 30, bold: true, align: 'center', color: PALETTE.amber });
    text(ctx, 'transmission sent', VIEW_W / 2, VIEW_H / 2 + 8, { size: 12, align: 'center', color: PALETTE.creamDim });
    ctx.globalAlpha = 1;
  }
  function drawToasts() {
    toasts.forEach((t, i) => {
      ctx.globalAlpha = Math.min(1, t.life * 1.5);
      const tw = measure(ctx, t.text, 12, true);
      const y = 132 + i * 28;
      chip(ctx, VIEW_W / 2 - tw / 2 - 14, y, tw + 28, 22, { r: 11 });
      ctx.fillStyle = t.color; ctx.fillRect(VIEW_W / 2 - tw / 2 - 7, y + 6, 4, 10);
      text(ctx, t.text, VIEW_W / 2 + 2, y + 5, { size: 12, bold: true, align: 'center' });
      ctx.globalAlpha = 1;
    });
  }
  function drawMiniCards(rtime) {
    const W = 290, H = 92;
    miniCards.forEach((mc, i) => {
      const inT = Math.min(1, mc.t / 0.3), outT = Math.max(0, (mc.t - 3.7) / 0.5);
      const ease = 1 - Math.pow(1 - inT, 3);
      const x = VIEW_W - (W + 14) * ease + (W + 14) * outT * outT;
      const y = VIEW_H - 120 - i * (H + 8);
      drawMiniCard(ctx, mc.spec, x + 6, y, W, H, makeCanvas, rtime, mc.bone, mc.boneIndex);
    });
  }

  function drawOverlay(rtime) {
    ctx.fillStyle = 'rgba(20,16,12,0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const p = Math.min(1, overlay.t / 0.22), ease = 1 - Math.pow(1 - p, 3);
    if (overlay.type === 'codex') {
      const cw = 460, chh = 300, cx = VIEW_W / 2 - cw / 2, cy = VIEW_H / 2 - chh / 2 + (1 - ease) * 40;
      ctx.globalAlpha = ease;
      drawCodexCard(ctx, codexEntry(overlay.codexId), cx, cy, cw, chh);
      if (overlay.t > 0.6) text(ctx, 'press any key', VIEW_W / 2, cy + chh + 14, { size: 11, align: 'center', color: PALETTE.creamDim });
      ctx.globalAlpha = 1;
      return;
    }
    const cw = 620, chh = 380, cx = VIEW_W / 2 - cw / 2;
    const cy = VIEW_H / 2 - chh / 2 + (1 - ease) * 40;
    ctx.globalAlpha = ease;
    drawSpeciesCard(ctx, 'full', overlay.spec, cx, cy, cw, chh, makeCanvas, rtime);
    // genome line on the dossier
    const gn = collection.genomeOf(overlay.spec.id);
    if (gn > 0) {
      drawDnaPip(cx + cw - 44, cy + 22, gn, rtime);
      text(ctx, `${Math.round(gn * 100)}%`, cx + cw - 58, cy + 24, { size: 11, bold: true, align: 'right', color: '#5A8A6E' });
    }
    ctx.globalAlpha = 1;
  }

  // --------------------------------------------------------------- journal
  const DEX = { px: 60, py: 40, cols: 7, cellH: 68 };
  function collectionCellAt(mx, my) {
    const pw = VIEW_W - 120, cellW = (pw - 48) / DEX.cols;
    for (let i = 0; i < FOSSILS.length; i++) {
      const cx = DEX.px + 24 + (i % DEX.cols) * cellW, cy = DEX.py + 74 + Math.floor(i / DEX.cols) * DEX.cellH;
      if (mx >= cx && mx <= cx + cellW - 8 && my >= cy && my <= cy + DEX.cellH - 8) return FOSSILS[i];
    }
    return null;
  }
  // clickable tab headers
  function journalTabAt(mx, my) {
    if (my < DEX.py + 12 || my > DEX.py + 34) return null;
    if (mx >= DEX.px + 150 && mx < DEX.px + 250) return 'fossils';
    if (mx >= DEX.px + 254 && mx < DEX.px + 340) return 'codex';
    return null;
  }
  function drawCollection() {
    ctx.fillStyle = 'rgba(20,16,12,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const pw = VIEW_W - 120, ph = VIEW_H - 80;
    blueprintPanel(ctx, DEX.px, DEX.py, pw, ph, { frameW: 10, r: 16 });
    text(ctx, 'FIELD JOURNAL', DEX.px + 28, DEX.py + 22, { size: 20, bold: true });
    // tabs
    for (const [id, label, tx] of [['fossils', `Fossils ${collection.completedCount()}/${collection.total()}`, DEX.px + 150], ['codex', `Codex ${codex.size}/${CODEX.length}`, DEX.px + 254]]) {
      const on = journalTab === id;
      chip(ctx, tx, DEX.py + 12, id === 'fossils' ? 100 : 130, 22, { r: 7, fill: on ? PALETTE.amber : PALETTE.frameDark, border: null });
      text(ctx, label, tx + (id === 'fossils' ? 50 : 65), DEX.py + 17, { size: 10, bold: true, align: 'center', color: on ? '#2A1F10' : PALETTE.creamDim });
    }
    if (journalTab === 'codex') { drawCodexGrid(pw, ph); return; }
    const cellW = (pw - 48) / DEX.cols;
    FOSSILS.forEach((f, i) => {
      const cx = DEX.px + 24 + (i % DEX.cols) * cellW, cy = DEX.py + 74 + Math.floor(i / DEX.cols) * DEX.cellH;
      if (cy > DEX.py + ph - 20) return;
      const frac = collection.fraction(f.id), started = collection.started(f.id), done = frac >= 1;
      roundRect(ctx, cx, cy, cellW - 8, DEX.cellH - 8, 8);
      ctx.fillStyle = done ? 'rgba(108,154,84,0.18)' : started ? 'rgba(200,121,30,0.12)' : 'rgba(0,0,0,0.10)';
      ctx.fill();
      if (started) { ctx.lineWidth = 2; ctx.strokeStyle = done ? PALETTE.good : PALETTE.amber; ctx.stroke(); }
      ctx.save(); ctx.beginPath(); ctx.rect(cx, cy, cellW - 8, DEX.cellH - 20); ctx.clip();
      ctx.globalAlpha = done ? 1 : started ? 0.35 : 0.12;
      drawFossil(ctx, f, cx + (cellW - 8) / 2 - f.footprint[0] * 6, cy + 4, makeCanvas, 0.55);
      ctx.globalAlpha = 1; ctx.restore();
      if (done) text(ctx, f.name, cx + (cellW - 8) / 2, cy + DEX.cellH - 20, { size: 9, bold: true, align: 'center' });
      else {
        const n = collection.bonesNeeded(f.id);
        const px0 = cx + (cellW - 8) / 2 - (n * 6) / 2;
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = collection.hasBone(f.id, k) ? PALETTE.amber : 'rgba(0,0,0,0.2)';
          ctx.fillRect(px0 + k * 6, cy + DEX.cellH - 17, 4, 3);
        }
      }
      const gn = collection.genomeOf(f.id);
      if (gn > 0) drawDnaPip(cx + cellW - 20, cy + 4, gn, time);
    });
  }

  function drawCodexGrid(pw, ph) {
    const cols = 4, cellW = (pw - 48) / cols, cellH = 58;
    CODEX.forEach((e, i) => {
      const cx = DEX.px + 24 + (i % cols) * cellW, cy = DEX.py + 74 + Math.floor(i / cols) * cellH;
      if (cy > DEX.py + ph - 20) return;
      const known = codex.has(e.id);
      roundRect(ctx, cx, cy, cellW - 8, cellH - 8, 8);
      ctx.fillStyle = known ? 'rgba(75,180,190,0.12)' : 'rgba(0,0,0,0.10)';
      ctx.fill();
      if (known) { ctx.lineWidth = 2; ctx.strokeStyle = '#4BE3E8'; ctx.stroke(); }
      text(ctx, e.category, cx + 12, cy + 10, { size: 8, color: PALETTE.creamDim });
      text(ctx, known ? e.name : '????????', cx + 12, cy + 24, { size: 12, bold: known, color: known ? PALETTE.cream : PALETTE.creamDim });
    });
  }
  function codexCellAt(mx, my) {
    const pw = VIEW_W - 120, cols = 4, cellW = (pw - 48) / cols, cellH = 58;
    for (let i = 0; i < CODEX.length; i++) {
      const cx = DEX.px + 24 + (i % cols) * cellW, cy = DEX.py + 74 + Math.floor(i / cols) * cellH;
      if (mx >= cx && mx <= cx + cellW - 8 && my >= cy && my <= cy + cellH - 8) return CODEX[i];
    }
    return null;
  }

  function hashCol(x, salt) {
    let n = Math.imul(x | 0, 374761393) + Math.imul(salt | 0, 668265263) + 987;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  return { enter() {}, update, render, leave() { persist(); } };
}

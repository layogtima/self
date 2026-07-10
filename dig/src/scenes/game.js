// The dig. Year 102,026. v4 "Awaken": you boot up on a bare planet beside the
// pod you crashed in. Rain rusts you - build cover. The sun feeds your battery -
// spend it wisely. Quests guide themselves; everything else you build. Still a
// living planet: day/night + weather, wall-clipped lighting, cave features,
// creatures, and the genome path to resurrection.

import {
  VIEW_W, VIEW_H, TILE, WORLD_W, WORLD_H, PLAYER_H, BEAM_Y, DIG_REACH, DIG_COOLDOWN,
  T_AIR, T_PLACED, T_BEDROCK, T_WATER, T_LAVA, T_ROOF, AUTOSAVE_SECONDS, CAMP_HALF_L, CAMP_HALF_R,
  POWER_DIG, POWER_SCAN,
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
import { resolveScan } from '../game/scan.js';
import { caveFeaturesAt, sceneryAt } from '../game/features.js';
import { makeInventory } from '../game/inventory.js';
import { hashCol } from '../core/rng.js';
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
import { makePower } from '../game/power.js';
import { makeStatus } from '../game/status.js';
import { makeEntities } from '../game/entities.js';
import { makeBuild } from '../game/build.js';
import { makeQuests } from '../game/quests.js';
import { MATERIALS_BY_ID } from '../content/materials.js';
import { BUILDABLES_BY_ID } from '../content/buildables.js';
import { STATIONS } from '../content/stations.js';
import { STRATA, realDepthAt, formatDepth, formatAge } from '../content/strata.js';
import { biomeAtX } from '../content/biomes.js';
import { FOSSILS, FOSSILS_BY_ID } from '../content/fossils.js';
import { SPECIMEN_STATES } from '../content/stations.js';

export function makeGameScene(services, opts) {
  const { ctx, tileset, makeCanvas, settings, save } = services;

  const seed = save?.seed ?? ((Math.random() * 1e9) | 0);

  const world = makeWorld(seed);
  world.applyDeltas(save);
  const spawnCol = world.spawnCol;
  const player = makePlayer(
    spawnCol * TILE + (TILE - 12) / 2,
    (world.surface[spawnCol] - 2) * TILE - PLAYER_H,
  );
  const cam = makeCamera();
  const particles = makeParticles();
  const satchel = makeSatchel();
  const collection = makeCollection(save?.collected || {}, save?.genome || {});
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
  let scanTarget = null;              // resolveScan() result this frame (reticle + harvest)
  const codex = new Set(save?.codex || []);
  const inventory = makeInventory(save?.materials);
  let birdT = 8 + Math.random() * 10;
  let minigame = null;
  let lastStratumIndex = world.stratumIndexAt(player.tx(), Math.floor(player.cy() / TILE));
  let banner = null;
  let resultBanner = null;            // {done, next, t} - station "done" feedback
  let rumbleT = 14 + Math.random() * 10;
  let idleT = 0, findT = 0, escHold = 0;
  let lightPoly = null;
  let frameLights = [];               // per-frame static lights (lamps, mushrooms, glowworms)
  const rainDrops = [];               // {x,y,vy,snow}
  const toasts = [];
  const miniCards = [];
  const hintedPockets = new Set();
  let bootT = opts?.boot ? 0 : Infinity;   // HUD power-on timeline (new game only)
  let sparkT = 0;                          // wet-chassis spark cadence
  let regolithCounter = 0;                 // every 3rd broken tile pays out spoil

  const fx = { shake: m => cam.addShake(m, settings.shake) };
  function toast(str, color = PALETTE.amber) { toasts.push({ text: str, life: 2.4, color }); }

  // -- v4 systems --------------------------------------------------------------
  const power = makePower(save?.power);
  const status = makeStatus(save?.status);
  const podTy = world.surface[spawnCol];   // ground row the pod stands on
  const entities = makeEntities(save, { podTx: spawnCol - 1, podTy });
  const quests = makeQuests(save?.quests);
  const build = makeBuild({
    world, player, inventory, entities,
    isQuestDone: id => quests.isDone(id),
    onBuilt: id => { quests.emit(`built:${id}`); persist(); },
    toast,
  });
  let home = save?.home ?? { x: spawnCol * TILE + TILE / 2, y: podTy * TILE };
  env.rainAllowed = quests.isDone('boot');   // grace: no rain until calibrated (+90s, see update)

  // pod geometry (world px) - the one structure you didn't build
  const pod = { tx: spawnCol - 1, ty: podTy, x: (spawnCol - 1) * TILE, groundY: podTy * TILE };

  // brand-new game: bolt a tiny 4-tile awning beside the pod (real T_ROOF tiles:
  // they stop rain, count as cover, persist, and can be dug away later)
  if (!save) {
    const awnY = podTy - 4;
    for (let ox = 2; ox <= 5; ox++) world.place(spawnCol + ox, awnY, T_ROOF);
  }

  function persist() {
    const deltas = world.exportDeltas();
    const session = {
      px: player.x, py: player.y, vx: player.vx, vy: player.vy, facing: player.facing,
      satchel: satchel.items.map(s => ({ fossilId: s.fossilId, bone: s.bone, boneIndex: s.boneIndex, stratumId: s.stratumId, state: s.state, identified: s.identified })),
    };
    const data = {
      v: 2, seed,
      dug: deltas.dug, placedTiles: deltas.placedTiles, harvested: deltas.harvested,
      collected: collection.export(), genome: collection.exportGenome(), codex: [...codex],
      materials: inventory.export(),
      ...entities.export(),                 // entities + nextUid
      quests: quests.export(),
      power: power.export(), status: status.export(),
      home: { ...home },
      settings: { ...settings }, session,
    };
    writeSave(data);
    services.save = data;
  }

  cam.follow(player.cx(), player.cy(), 0, true);

  // is anything solid anywhere above this tile? (cheap column scan - caves,
  // overhangs and built roofs all count as rain cover for free)
  function coveredAt(tx, headTy) {
    for (let ty = headTy - 1; ty >= 0; ty--) if (world.solidAt(tx, ty)) return true;
    return false;
  }
  function builtCount(type) {
    const spec = BUILDABLES_BY_ID[type];
    if (spec?.kind === 'tile') {
      let n = 0;
      for (const [, t] of world.exportDeltas().placedTiles) if (t === spec.tile) n++;
      return n;
    }
    return entities.list.filter(e => e.type === type).length;
  }

  // --------------------------------------------------------------- update
  function update(dt) {
    time += dt;
    if (bootT < 3.5) { bootT += dt; if (bootT < 1.2) { env.update(dt); return; } }   // controls unlock at 1.2s
    env.update(dt);
    if (resultBanner) { resultBanner.t += dt; if (resultBanner.t > 2) resultBanner = null; }
    updateMusic(dt);
    decayToasts(dt);
    for (const mc of miniCards) mc.t += dt;
    while (miniCards.length && miniCards[0].t > 4.2) miniCards.shift();
    if (banner) banner.life -= dt;
    findT = Math.max(0, findT - dt);

    const depth = Math.max(0, world.depthOfRow(player.tx(), Math.floor(player.cy() / TILE)));
    const onSurface = depth < 2;

    // -- v4 systems: power, wetness, quests, weather events ---------------------
    const sun01 = onSurface ? (1 - env.night01()) * (1 - 0.8 * env.precip01()) : 0;
    power.update(dt, { sun01, boost: onSurface ? entities.solarBoostAt(player) * (1 - env.night01()) : 0 },
      () => quests.emit('power-low'));

    const headTy = Math.floor(player.y / TILE);
    const exposedNow = onSurface && env.precip01() > 0.15 && !coveredAt(player.tx(), headTy);
    status.update(dt, {
      exposed01: exposedNow ? env.precip01() : 0,
      dry01: (!exposedNow && onSurface && env.precip01() < 0.1 && env.night01() < 0.5) ? 1 : 0,
      onSoaked: () => { quests.emit('soaked'); toast('SOAKED - systems sluggish', PALETTE.danger); },
    });
    player.speedMul = status.speedMul() * (power.state() === 'reserve' ? 0.7 : 1);
    if (status.tier() !== 'dry') {
      sparkT -= dt;
      if (sparkT <= 0) {
        sparkT = status.tier() === 'soaked' ? 0.25 : 0.55;
        particles.burst(player.cx() + (Math.random() - 0.5) * 8, player.y + 4, '#FFE9B8', 2, 70);
      }
    }

    // rain grace + weather telegraphs
    if (!env.rainAllowed && quests.isDone('boot') && time > 90) env.rainAllowed = true;
    if ((env.incoming === 'rain' || env.incoming === 'storm') && env.weather !== env.incoming) quests.emit('rain-soon');
    if (env.precip01() > 0.3) quests.emit('rain-start');

    quests.update(dt, {
      player, pulley, codex, env, power, inventory,
      builtCount, exposedNow,
    }, toast);
    entities.update(dt);

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

    // during calibration, Esc is hold-to-skip; afterwards it pauses.
    if (quests.isActive('boot')) {
      if (keys.Escape) { escHold += dt; if (escHold > 0.8) { quests.skipBoot(); escHold = 0; } } else escHold = 0;
    } else if (pressed('Escape')) {
      if (build.active) { build.exit(); }
      else { persist(); services.go('settings', { overlay: true, back: 'game' }); return; }
    }
    if (pressed('Tab')) { collectionOpen = !collectionOpen; sfx.ui(); }
    if (collectionOpen) { updateCollectionInput(); return; }

    // B toggles build mode; H marks home
    if (pressed('KeyB')) build.toggle();
    if (pressed('KeyH')) {
      home = { x: player.cx(), y: player.y + player.h };
      particles.burst(home.x, home.y, PALETTE.amber, 10, 120);
      toast('home marked');
      sfx.ui();
      persist();
    }

    const anyInput = keys.KeyA || keys.KeyD || keys.KeyS || keys.KeyW || keys.Space || keys.KeyE || keys.KeyK || mouse.left;
    idleT = anyInput ? 0 : idleT + dt;

    // Ctrl toggles the active tool (laser ↔ scanner)
    if (pressed('ControlLeft') || pressed('ControlRight')) {
      player.tool = player.tool === 'scan' ? 'laser' : 'scan';
      scanning = null; scanTarget = null; sfx.ui();
    }

    if (pulley.active) {
      const ride = pulley.updateReel(player, world, dt);
      if (ride.popped) { particles.burst(player.cx(), player.y + player.h, '#AA9678', 14, 180); fx.shake(3); }
    } else {
      if (pressed('Space') || pressed('KeyW')) player.bufferJump();
      if (pressed('KeyK')) pulley.tryAttach(player, world);

      updatePlayer(player, world, dt);
      // lava: knock the rover back to the pod (no permadeath)
      if (player.inLava) respawnAtBase();
      else if (player.inWater && Math.random() < 0.3) particles.burst(player.cx(), player.y, 'rgba(160,200,220,0.6)', 1, 40);

      if (build.active) {
        player.beam = null;
        build.update(dt, cam);
      } else if (player.tool === 'scan') {
        updateScan(dt);
      } else if (power.state() === 'reserve') {
        player.beam = null;   // tools offline - crawl to the sun
      } else {
        const digEv = updateDigging(player, world, cam, particles, fx, dt);
        if (digEv.brokeAt) {
          ambient.onDig(digEv.brokeAt.x, digEv.brokeAt.y);
          power.spend(POWER_DIG);
          // every 3rd broken tile yields regolith - shelter never waits on machines
          if ((regolithCounter = (regolithCounter + 1) % 3) === 0) inventory.add('regolith');
          if (power.state() === 'low') player.digCd = Math.max(player.digCd, DIG_COOLDOWN * 2);
        }
        if (digEv.bone) onBone(digEv.bone);
        if (digEv.nearBone && !hintedPockets.has(digEv.nearBone.id)) { hintedPockets.add(digEv.nearBone.id); sfx.hint(); }
      }

      if (pressed('KeyE') && !build.active) {
        if (player.tool !== 'scan' || !tryHarvest()) {
          const podNear = entities.nearest(player, e => e.type === 'pod', 2.6 * TILE);
          if (podNear) openPodLab();
        }
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
    for (let i = rainDrops.length - 1; i >= 0; i--) {
      const d = rainDrops[i];
      d.y += d.vy * dt;
      d.x += d.vx * dt + (d.snow ? Math.sin(time * 2 + d.y * 0.05) * 14 * dt : 0);
      const tx = Math.floor(d.x / TILE);
      // any solid stops a drop - built roofs shelter with zero special-casing
      if (d.y >= cam.y - 20 && world.solidAt(tx, Math.floor(d.y / TILE))) {
        if (!d.snow && Math.random() < 0.3) particles.burst(d.x, Math.floor(d.y / TILE) * TILE, 'rgba(160,200,220,0.6)', 1, 30);
        rainDrops.splice(i, 1);
        continue;
      }
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
    scanTarget = resolveScan(wx, wy, world, targets);
    const id = scanTarget?.id ?? null;
    if (mouse.left && id) {
      if (!scanning || scanning.id !== id) scanning = { id, t: 0 };
      if (!power.spend(POWER_SCAN * dt)) { scanning = null; return; }   // scanner browns out
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

  /** E with the scanner on a known mushroom/crystal in reach picks it */
  function tryHarvest() {
    if (!scanTarget?.harvest || !codex.has(scanTarget.id)) return false;
    const tx = Math.floor((scanTarget.x + scanTarget.w / 2) / TILE);
    const ty = Math.floor((scanTarget.y + scanTarget.h / 2) / TILE);
    const d = Math.hypot(scanTarget.x + scanTarget.w / 2 - player.cx(), scanTarget.y + scanTarget.h / 2 - player.cy());
    if (d > DIG_REACH) return false;
    if (!world.harvest(tx, ty)) return false;
    inventory.add(scanTarget.harvest);
    toast(`+1 ${codexEntry(scanTarget.id).name.toLowerCase()}`);
    particles.burst(tx * TILE + TILE / 2, ty * TILE + TILE - 4,
      scanTarget.harvest === 'crystal' ? 'rgba(200,180,230,0.9)' : 'rgba(150,220,170,0.9)', 8, 90);
    (sfx.pickup || sfx.ui)();
    scanTarget = null;
    persist();
    return true;
  }

  function respawnAtBase() {
    fx.shake(4);
    sfx.crumble();
    particles.burst(player.cx(), player.cy(), '#F0A93B', 20, 260);
    player.x = spawnCol * TILE + (TILE - player.w) / 2;
    player.y = (world.surface[spawnCol] - 3) * TILE;
    player.vx = 0; player.vy = -180;   // popped up onto the pad
    player.inLava = false;
    toast('scorched - returned to base', PALETTE.danger);
  }

  function onBone(pocket) {
    const stratum = world.stratumAt(pocket.tx, pocket.ty);
    satchel.add(makeFragment(pocket.fossilId, pocket.bone, pocket.boneIndex, stratum.id));
    miniCards.push({ spec: FOSSILS_BY_ID[pocket.fossilId], bone: pocket.bone, boneIndex: pocket.boneIndex, t: 0 });
    quests.emit('bone-first');
    sfx.discover();
    fx.shake(1.5);
    findT = 2;
  }

  /** E at the pod: fold-out field lab - runs whichever station the first
   *  eligible satchel fragment needs next (dedicated stations arrive in M3) */
  function openPodLab() {
    for (const spec of STATIONS) {
      if (satchel.firstAtState(spec.input)) { openStation({ spec }); return; }
    }
    sfx.uiBack();
    toast('nothing to process - go dig', PALETTE.creamDim);
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
    if (station.spec.output === 'identified') { fragment.identified = true; sfx.complete(); }
    if (station.spec.output === 'mounted') {
      satchel.remove(fragment.uid);
      const complete = collection.mountBone(fragment.fossilId, fragment.boneIndex);
      const f = FOSSILS_BY_ID[fragment.fossilId];
      findT = 1.2;
      if (complete) {
        overlay = { type: 'dex', spec: f, t: 0 };
        resultBanner = null;      // the dossier reveal is enough
        quests.emit('species-complete');
        sfx.reveal();
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
    drawPod(rtime);
    pulley.draw(ctx, player, rtime);
    ambient.draw(ctx, rtime);
    particles.draw(ctx);
    drawPrecip();
    drawBeam(rtime);
    if (build.active) drawBuildGhost(rtime);
    else if (player.tool === 'scan' && !pulley.active) drawReticle(rtime);
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
    const emitter = { x: player.cx() + player.facing * 7, y: player.y + BEAM_Y };
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
    if (resultBanner) drawResultBanner();
    quests.draw(ctx, rtime);
    if (build.active) drawBuildBar();
    drawToasts();
    drawMiniCards(rtime);
    if (collectionOpen) drawCollection();
    if (overlay) drawOverlay(rtime);
    if (minigame) minigame.game.render(ctx, rtime);
    if (bootT < 3.5) drawBootOverlay(rtime);
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
      const s = sceneryAt(tx);   // shared ground truth with the scanner
      if (s === 'tree') drawTree(tx * TILE + TILE / 2, baseY, biome, tx, rtime);
      else if (s === 'dressing') drawDressing(tx * TILE + TILE / 2, baseY, tx);
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
        if (t === T_ROOF) { tileset.drawRoof(ctx, tx, ty, dx, dy); continue; }   // thin panel, no grass/shadow pass
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
  // Placement decided by game/features.js (shared with the scanner) - this
  // function only owns the geometry.
  function drawCaveProps(b, rtime) {
    const y0 = Math.max(1, b.y0), y1 = Math.min(WORLD_H - 4, b.y1);
    const x0 = Math.max(0, b.x0), x1 = Math.min(WORLD_W - 1, b.x1);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const f = caveFeaturesAt(world, tx, ty);
        if (!f) continue;
        const { h, si } = f;
        const dx = tx * TILE, dy = ty * TILE;

        if (f.ceiling === 'roots') {
          // hanging roots (topsoil bands) - sway
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
        } else if (f.ceiling === 'stalactite') {
          ctx.fillStyle = STRATA[si].colors.band;
          ctx.beginPath();
          ctx.moveTo(dx + 3, dy); ctx.lineTo(dx + 8, dy + 9 + h * 5); ctx.lineTo(dx + 13, dy);
          ctx.closePath(); ctx.fill();
        }

        if (f.floor === 'stalagmite') {
          ctx.fillStyle = STRATA[si].colors.band;
          ctx.beginPath();
          ctx.moveTo(dx + 4, dy + TILE); ctx.lineTo(dx + 8, dy + TILE - 8 - h * 4); ctx.lineTo(dx + 12, dy + TILE);
          ctx.closePath(); ctx.fill();
        } else if (f.floor === 'mushroom') {
          // glow mushrooms - they light their corner
          const pulse = 0.7 + Math.sin(rtime * 2 + tx) * 0.3;
          for (let m = 0; m < 3; m++) {
            const mx = dx + 3 + m * 5, stem = 3 + ((tx + m) % 3);
            ctx.fillStyle = '#C8B890';
            ctx.fillRect(mx, dy + TILE - stem, 1.6, stem);
            ctx.fillStyle = `rgba(150,220,170,${0.85 * pulse})`;
            ctx.beginPath(); ctx.arc(mx + 0.8, dy + TILE - stem, 2.6, Math.PI, 0); ctx.fill();
          }
          frameLights.push({ x: dx + 8, y: dy + TILE - 4, r: 42, warmth: 0.4 });
        } else if (f.floor === 'crystal') {
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

  function drawPockets(b) {
    for (const p of world.pockets) {
      if (p.tx < b.x0 || p.tx > b.x1 || p.ty < b.y0 || p.ty > b.y1) continue;
      if (!world.pocketAt(p.tx, p.ty)) continue;
      const exposed = world.tileAt(p.tx - 1, p.ty) === T_AIR || world.tileAt(p.tx + 1, p.ty) === T_AIR ||
        world.tileAt(p.tx, p.ty - 1) === T_AIR || world.tileAt(p.tx, p.ty + 1) === T_AIR;
      drawBoneNub(ctx, p, p.tx * TILE, p.ty * TILE, exposed);
    }
  }

  // ---- THE POD: the one structure you didn't build ---------------------------
  // A tipped survey pod resting where it came down. Home by default, a small
  // always-on light, and (until you build stations, M3) a fold-out field lab.
  function drawPod(rtime) {
    const gy = pod.groundY;          // ground line the pod rests on
    const lx = pod.x;                // left edge (3 tiles wide)

    // scorch mark + settled dust where it hit
    ctx.fillStyle = 'rgba(30,22,18,0.25)';
    ctx.beginPath(); ctx.ellipse(lx + 24, gy + 2, 34, 5, 0, 0, Math.PI * 2); ctx.fill();

    // pod body, tipped a few degrees - it LANDED, it wasn't parked
    ctx.save();
    ctx.translate(lx + 22, gy);
    ctx.rotate(-0.06);
    // engine bell, half buried
    ctx.fillStyle = '#2B2733';
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(-14, 6); ctx.lineTo(10, 6); ctx.lineTo(6, 0);
    ctx.closePath(); ctx.fill();
    // body
    ctx.fillStyle = '#332F3A';
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-16, -56, 32, 56, 8); ctx.fill(); } else ctx.fillRect(-16, -56, 32, 56);
    ctx.fillStyle = '#4E4956';
    ctx.fillRect(-12, -48, 24, 3);
    ctx.fillRect(-12, -40, 24, 3);
    // round window (glows warm - somebody is home: you)
    ctx.fillStyle = '#1A2430';
    ctx.beginPath(); ctx.arc(0, -26, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,233,184,0.5)';
    ctx.beginPath(); ctx.arc(0, -26, 4, 0, Math.PI * 2); ctx.fill();
    // dented dish on top
    ctx.strokeStyle = '#8E96A4';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-6, -64, 9, Math.PI * 0.85, Math.PI * 1.95); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -64); ctx.lineTo(-4, -56); ctx.stroke();
    ctx.restore();
    frameLights.push({ x: lx + 22, y: gy - 26, r: 46, warmth: 0.6 });

    // beacon (blinks - the HUD home arrow points here by default)
    const blink = Math.sin(rtime * 3) > 0.6;
    ctx.fillStyle = blink ? '#E85B4A' : '#5A2A24';
    ctx.beginPath(); ctx.arc(lx + 36, gy - 60, 2.4, 0, Math.PI * 2); ctx.fill();
    if (blink) frameLights.push({ x: lx + 36, y: gy - 60, r: 30, warmth: 0.3 });

    // awning strut: the 4 T_ROOF tiles beside the pod are real tiles (drawTiles
    // renders them); this is just the support leaning back to the hull
    const awnX = (spawnCol + 2) * TILE, awnY = (podTy - 4) * TILE + 6;
    ctx.strokeStyle = '#4A3421';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(awnX + 2, awnY); ctx.lineTo(lx + 38, gy - 30);
    ctx.moveTo((spawnCol + 5) * TILE + 12, awnY); ctx.lineTo((spawnCol + 5) * TILE + 12, gy);
    ctx.stroke();

    // E keycap + label when the rover is at the pod with lab work to do
    const near = entities.nearest(player, e => e.type === 'pod', 2.6 * TILE);
    if (near && !build.active) {
      const hasWork = STATIONS.some(s => satchel.firstAtState(s.input));
      drawKeycap(ctx, lx + 22, gy - 78, hasWork);
      const label = hasWork ? 'FIELD LAB' : 'POD';
      const tw = measure(ctx, label, 9, true);
      chip(ctx, lx + 22 - tw / 2 - 7, gy - 66, tw + 14, 14, { r: 7, fill: PALETTE.frameDark, border: null });
      text(ctx, label, lx + 22, gy - 63, { size: 9, bold: true, align: 'center', color: PALETTE.parchment });
    }
  }

  // tiny double-helix progress pip (journal genome indicator)
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

  // scanner reticle at the mouse; the resolved target gets its OWN bracket +
  // name chip so you always see exactly what will be catalogued.
  function drawReticle(rtime) {
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    const tgt = scanTarget;
    const has = !!tgt;
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
    if (!tgt) return;

    // target brackets: pulse gently, tighten while the scan charges
    const pad = 3 - (scanning ? scanning.t * 2 : 0);
    const bx = tgt.x - pad, by = tgt.y - pad, bw = tgt.w + pad * 2, bh = tgt.h + pad * 2;
    const arm = Math.min(5, bw * 0.3);
    ctx.strokeStyle = `rgba(75,227,232,${(0.6 + Math.sin(rtime * 6) * 0.25).toFixed(2)})`;
    ctx.lineWidth = 1.4;
    for (const [cxs, cys] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
      const px = bx + cxs * bw, py = by + cys * bh;
      const dx = cxs ? -1 : 1, dy = cys ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(px, py + dy * arm);
      ctx.lineTo(px, py);
      ctx.lineTo(px + dx * arm, py);
      ctx.stroke();
    }
    // name chip under the target
    const entry = codexEntry(tgt.id);
    if (entry) {
      const isNew = !codex.has(tgt.id);
      const canPick = tgt.harvest && codex.has(tgt.id)
        && Math.hypot(tgt.x + tgt.w / 2 - player.cx(), tgt.y + tgt.h / 2 - player.cy()) <= DIG_REACH;
      const label = canPick ? `${entry.name} · E - HARVEST` : isNew ? `${entry.name} · NEW` : entry.name;
      const lw = measure(ctx, label, 9, true) + 10;
      const lx = tgt.x + tgt.w / 2 - lw / 2, lyy = by + bh + 5;
      ctx.fillStyle = 'rgba(14,26,30,0.82)';
      roundRect(ctx, lx, lyy, lw, 13, 4);
      ctx.fill();
      text(ctx, label, lx + 5, lyy + 3, { size: 9, bold: true, color: isNew || canPick ? '#4BE3E8' : 'rgba(140,200,205,0.9)' });
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
    const lx = player.cx() + player.facing * 7, ly = player.y + BEAM_Y;
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
  // The probe's FPV: power · depth · satchel · materials · status · home arrow.
  // Elements flicker on in sequence during the boot (bootOn gates each).
  function hudOn(at) { return bootT >= at; }

  function drawHUD() {
    const depth = Math.max(0, world.depthOfRow(player.tx(), Math.floor((player.y + player.h) / TILE)));
    const stratum = world.stratumAt(player.tx(), Math.floor(player.cy() / TILE));

    // -- power bar (top-left, first thing to come online) -----------------------
    if (hudOn(0.4)) {
      const frac = power.frac();
      const state = power.state();
      const blink = state !== 'ok' && Math.sin(time * (state === 'reserve' ? 10 : 6)) > 0;
      chip(ctx, 12, 12, 186, 24, { r: 8 });
      // lightning glyph
      ctx.fillStyle = blink ? PALETTE.danger : PALETTE.amber;
      ctx.beginPath();
      ctx.moveTo(26, 17); ctx.lineTo(21, 25); ctx.lineTo(25, 25); ctx.lineTo(22, 31); ctx.lineTo(29, 23); ctx.lineTo(25, 23); ctx.lineTo(28, 17);
      ctx.closePath(); ctx.fill();
      // bar
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(36, 18, 130, 12);
      ctx.fillStyle = state === 'reserve' ? PALETTE.danger : state === 'low' ? '#E0A24A' : '#7FC46E';
      ctx.fillRect(36, 18, 130 * frac, 12);
      ctx.strokeStyle = PALETTE.frameDark; ctx.lineWidth = 1.4;
      ctx.strokeRect(36, 18, 130, 12);
      text(ctx, `${Math.round(frac * 100)}`, 172, 18, { size: 11, bold: true, color: blink ? PALETTE.danger : PALETTE.cream });
      if (state === 'reserve') text(ctx, 'RESERVE - tools offline, find sun', 12, 40, { size: 9, bold: true, color: PALETTE.danger });
    }

    // -- depth chip --------------------------------------------------------------
    if (hudOn(0.9)) {
      chip(ctx, 12, 44, 186, 44, { r: 10 });
      text(ctx, formatDepth(realDepthAt(depth)), 26, 50, { size: 18, bold: true, color: PALETTE.amber });
      text(ctx, depth > 0 ? formatAge(stratum) : 'surface', 26, 71, { size: 10, color: PALETTE.creamDim });
      ctx.fillStyle = stratum.colors.base;
      ctx.fillRect(176, 52, 12, 26);
    }

    // -- status icon row (wet = blinking droplet) --------------------------------
    if (hudOn(1.8) && status.tier() !== 'dry') {
      const soaked = status.tier() === 'soaked';
      const show = !soaked || Math.sin(time * 8) > -0.2;   // soaked blinks red
      if (show) {
        chip(ctx, 204, 12, 64, 24, { r: 8, fill: PALETTE.frameDark });
        ctx.fillStyle = soaked ? PALETTE.danger : '#7FB2DE';
        ctx.beginPath();
        ctx.moveTo(216, 16); ctx.quadraticCurveTo(222, 26, 216, 30); ctx.quadraticCurveTo(210, 26, 216, 16);
        ctx.fill();
        text(ctx, soaked ? 'SOAKED' : 'WET', 226, 17, { size: 9, bold: true, color: soaked ? PALETTE.danger : '#7FB2DE' });
      }
    }

    // -- home marker: edge arrow + distance when home is off-screen --------------
    if (hudOn(0.9)) drawHomeArrow();

    if (!hudOn(1.4)) return;
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

    // materials chip (glow caps, crystals, ...) under the satchel
    const mats = inventory.entries();
    if (mats.length) {
      const MAT_COLORS = { mushroom: '#96DCAA', crystal: '#C8B4E6' };
      const mw = 14 + mats.length * 34;
      chip(ctx, VIEW_W - mw - 12, 46, mw, 24, { r: 8 });
      mats.forEach(([id, n], i) => {
        const mx = VIEW_W - mw - 12 + 10 + i * 34;
        ctx.fillStyle = MAT_COLORS[id] || PALETTE.amberSoft;
        if (id === 'crystal') {
          ctx.beginPath(); ctx.moveTo(mx + 4, 64); ctx.lineTo(mx + 7, 52); ctx.lineTo(mx + 10, 64); ctx.closePath(); ctx.fill();
        } else {
          ctx.fillRect(mx + 6, 58, 2, 6);
          ctx.beginPath(); ctx.arc(mx + 7, 58, 4, Math.PI, 0); ctx.fill();
        }
        text(ctx, `${n}`, mx + 14, 53, { size: 11, bold: true, color: PALETTE.cream });
      });
    }

    chip(ctx, 12, VIEW_H - 40, 86, 28, { r: 8 });
    ctx.fillStyle = PALETTE.parchment;
    ctx.beginPath(); ctx.arc(30, VIEW_H - 27, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(26, VIEW_H - 25, 8, 5);
    ctx.fillStyle = PALETTE.frameDark;
    ctx.fillRect(27.5, VIEW_H - 29, 2, 2); ctx.fillRect(31.5, VIEW_H - 29, 2, 2);
    text(ctx, `${collection.completedCount()}/${collection.total()}`, 44, VIEW_H - 33, { size: 13, bold: true, color: PALETTE.cream });

    // -- active-tool chip, bottom-centre-left (Ctrl to switch; B to build) -------
    if (hudOn(2.9)) {
      const scan = player.tool === 'scan';
      chip(ctx, 108, VIEW_H - 40, 118, 28, { r: 8 });
      ctx.fillStyle = scan ? '#4BE3E8' : PALETTE.amber;
      if (scan) { ctx.strokeStyle = '#4BE3E8'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(124, VIEW_H - 26, 5, 0, Math.PI * 2); ctx.stroke(); ctx.fillRect(123, VIEW_H - 27, 2, 2); }
      else { ctx.fillRect(118, VIEW_H - 27, 12, 2); }
      text(ctx, build.active ? 'BUILD' : scan ? 'SCAN' : 'LASER', 136, VIEW_H - 33, { size: 12, bold: true, color: build.active ? '#9FBE9A' : scan ? '#4BE3E8' : PALETTE.amber });
      text(ctx, build.active ? 'B' : 'CTRL', 200, VIEW_H - 32, { size: 9, color: PALETTE.creamDim });
    }
  }

  // amber edge arrow + distance pointing home when it's off-screen
  function drawHomeArrow() {
    const dx = home.x - (cam.x + VIEW_W / 2), dy = home.y - (cam.y + VIEW_H / 2);
    const sx = home.x - cam.x, sy = home.y - cam.y;
    const onScreen = sx > 20 && sx < VIEW_W - 20 && sy > 20 && sy < VIEW_H - 20;
    if (onScreen) {
      // subtle marker over the spot
      const bob = Math.sin(time * 3) * 2;
      ctx.fillStyle = 'rgba(224,162,74,0.85)';
      ctx.beginPath();
      ctx.moveTo(sx, sy - 26 + bob); ctx.lineTo(sx - 4, sy - 33 + bob); ctx.lineTo(sx + 4, sy - 33 + bob);
      ctx.closePath(); ctx.fill();
      return;
    }
    // clamp to the screen border along the home direction
    const ang = Math.atan2(dy, dx);
    const px = Math.max(26, Math.min(VIEW_W - 26, VIEW_W / 2 + Math.cos(ang) * VIEW_W));
    const py = Math.max(56, Math.min(VIEW_H - 56, VIEW_H / 2 + Math.sin(ang) * VIEW_H));
    const dist = Math.round(Math.hypot(home.x - player.cx(), home.y - player.cy()) / TILE);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-2, -6); ctx.lineTo(-2, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
    // house glyph + metres
    ctx.fillStyle = 'rgba(20,16,22,0.6)';
    roundRect(ctx, px - 20, py + 8, 40, 13, 4); ctx.fill();
    text(ctx, `⌂ ${dist}m`, px, py + 10, { size: 9, bold: true, align: 'center', color: PALETTE.amberSoft });
  }

  // -- build mode: world-space ghost + screen-space palette bar ------------------
  function drawBuildGhost(rtime) {
    const g = build.ghost(cam);
    if (!g) return;
    const px = g.tx * TILE, py = (g.ty - (g.spec.kind === 'machine' ? g.h - 1 : 0)) * TILE;
    ctx.globalAlpha = 0.45 + Math.sin(rtime * 5) * 0.1;
    ctx.fillStyle = g.ok ? 'rgba(120,200,120,0.5)' : 'rgba(220,90,70,0.5)';
    ctx.fillRect(px, py, g.w * TILE, g.h * TILE);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = g.ok ? '#7FC46E' : '#E85B4A';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(px + 0.5, py + 0.5, g.w * TILE - 1, g.h * TILE - 1);
  }

  function drawBuildBar() {
    const items = build.unlocked();
    const cur = build.current();
    const bw = items.length * 92 + 16;
    chip(ctx, VIEW_W / 2 - bw / 2, VIEW_H - 64, bw, 52, { r: 10, fill: PALETTE.frameDark });
    items.forEach((b2, i) => {
      const x = VIEW_W / 2 - bw / 2 + 8 + i * 92;
      const isSel = b2 === cur;
      const afford = inventory.canAfford(b2.cost);
      if (isSel) { ctx.fillStyle = 'rgba(224,162,74,0.18)'; roundRect(ctx, x, VIEW_H - 60, 88, 44, 6); ctx.fill(); }
      text(ctx, b2.name, x + 44, VIEW_H - 56, { size: 10, bold: isSel, align: 'center', color: afford ? (isSel ? PALETTE.amber : PALETTE.parchment) : 'rgba(150,140,130,0.6)' });
      const cost = Object.entries(b2.cost).map(([id, n]) => `${n} ${MATERIALS_BY_ID[id]?.name.toLowerCase() ?? id}`).join(' · ');
      text(ctx, cost, x + 44, VIEW_H - 42, { size: 8, align: 'center', color: afford ? PALETTE.creamDim : 'rgba(200,90,70,0.8)' });
      if (isSel) text(ctx, 'click to place · right-click reclaims', x + 44, VIEW_H - 30, { size: 7, align: 'center', color: PALETTE.creamDim });
    });
    text(ctx, 'Q / wheel to cycle · B to exit', VIEW_W / 2, VIEW_H - 76, { size: 9, align: 'center', color: PALETTE.creamDim });
  }

  // -- boot: scanline iris + elements flickering on -----------------------------
  function drawBootOverlay(rtime) {
    const p = Math.min(1, bootT / 3.5);
    // dark iris pulling back
    ctx.fillStyle = `rgba(5,7,12,${(0.85 * (1 - p)).toFixed(2)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // rolling scanlines
    ctx.fillStyle = `rgba(75,227,232,${(0.05 * (1 - p)).toFixed(3)})`;
    for (let y = (rtime * 60 | 0) % 3; y < VIEW_H; y += 3) ctx.fillRect(0, y, VIEW_W, 1);
    if (bootT < 1.2) {
      text(ctx, 'OPTICS ONLINE', VIEW_W / 2, VIEW_H / 2 - 8, { size: 13, bold: true, align: 'center', color: '#4BE3E8' });
    }
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

  return { enter() {}, update, render, leave() { persist(); } };
}

// The dig. Year 102,026. v4 "Awaken": you boot up on a bare planet beside the
// pod you crashed in. Rain rusts you - build cover. The sun feeds your battery -
// spend it wisely. Quests guide themselves; everything else you build. Still a
// living planet: day/night + weather, wall-clipped lighting, cave features,
// creatures, and the genome path to resurrection.

import {
  VIEW_W, VIEW_H, WIN_W, VIEW_ZOOM, setZoom, TILE, WORLD_W, WORLD_H, PLAYER_H, BEAM_Y, DIG_REACH, DIG_COOLDOWN,
  T_AIR, T_PLACED, T_BEDROCK, T_WATER, T_LAVA, T_ROOF, T_BRINE, T_TAR, T_RUBBLE, T_OBSIDIAN, FLUID_SPECS, AUTOSAVE_SECONDS, CAMP_HALF_L, CAMP_HALF_R,
  POWER_DIG, POWER_SCAN,
} from '../config.js';
import { keys, mouse, pressed, releaseAll } from '../core/input.js';
import { touch } from '../core/touch.js';
import { sfx, rumble, thunder, setRainLevel, setCricketLevel, setWindLevel, setSurfacePad, setCaveLevel, setWaterLevel, setLavaLevel } from '../core/audio.js';
import { setMusicDepth, updateMusic } from '../core/music.js';
import { writeSave } from '../core/save.js';
import { makeCamera } from '../core/camera.js';
import { makeParticles } from '../render/particles.js';
import { PALETTE, RARITY_COLORS } from '../render/palette.js';
import { text, chip, blueprintPanel, measure, roundRect } from '../render/text.js';
import { drawProbe, drawFossil, drawBoneNub, drawSprite, hasSprite, softCloud } from '../render/sprites.js';
import { drawSpeciesCard, drawMiniCard, drawCodexCard } from '../render/cards.js';
import { drawCodexArt } from '../render/codexart.js';
import { makeHud } from '../render/hud.js';
import { resolveScanCandidates } from '../game/scan.js';
import { caveFeaturesAt, sceneryAt } from '../game/features.js';
import { makeInventory } from '../game/inventory.js';
import { hashCol } from '../core/rng.js';
import { CODEX, codexEntry } from '../content/codex.js';
import { rerollLore } from '../core/lore.js';
import { makeLighting } from '../render/lighting.js';
import { makeBackdrop } from '../render/backdrop.js';
import { makeWorld } from '../world/world.js';
import { makePlayer, updatePlayer } from '../game/player.js';
import { updateDigging, peekTarget } from '../game/digging.js';
import { makePulley } from '../game/pulley.js';
import { makeMinigame } from '../game/minigames.js';
import { makeAmbient, snapshotLive } from '../game/ambient.js';
import { makeEnvironment } from '../game/environment.js';
import { makeSatchel, makeFragment, pickBoneDecoys } from '../game/fossils.js';
import { makeCollection } from '../game/collection.js';
import { makePower } from '../game/power.js';
import { makeStatus } from '../game/status.js';
import { makeEntities, RECLAIM_STAGES, MACHINE_BATT_CAP } from '../game/entities.js';
import { makeBuild } from '../game/build.js';
import { makeQuests } from '../game/quests.js';
import { makeHazards } from '../game/hazards.js';
import { MATERIALS_BY_ID, GARBAGE_BY_ID } from '../content/materials.js';
import { BUILDABLES, BUILDABLES_BY_ID } from '../content/buildables.js';
import { STATIONS, STATIONS_BY_ID } from '../content/stations.js';
import { STRATA, formatAge } from '../content/strata.js';
import { biomeAtX } from '../content/biomes.js';
import { FOSSILS, FOSSILS_BY_ID } from '../content/fossils.js';

export function makeGameScene(services, opts) {
  const { ctx, tileset, makeCanvas, settings } = services;
  // DEMO MODE (the title's memory reel): a fresh deterministic world, no save
  // read, and - critically - persist() no-ops so the reel can NEVER touch the
  // player's real save.
  const demoMode = !!opts?.demo;
  const save = demoMode ? null : services.save;
  if (!demoMode) releaseAll();   // never inherit the attract autopilot's held keys

  const seed = demoMode ? 777 : (save?.seed ?? ((Math.random() * 1e9) | 0));

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
  const backdrop = makeBackdrop(makeCanvas);
  const ambient = makeAmbient();
  if (!demoMode && save?.ambient) ambient.restore(save.ambient);   // the residents you left behind
  const env = makeEnvironment();
  ambient.setEnvironment(env);
  env.onThunder = () => { thunder(); cam.addShake(2, settings.shake); };

  if (save?.laserMk) player.laserMk = save.laserMk;
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
  let collectionOpen = false, journalTab = 'codex';   // scans first
  let journalScroll = 0;              // wheel scroll offset in the journal grid
  let inventoryOpen = false;          // I - the hold manifest
  let overlay = null;
  let scanning = null;                // {cands, idx, t, ax, ay} - a LOCKED target auto-charging
  let scanTarget = null;              // what the reticle brackets: the locked target, else the hover candidate
  let deconTarget = null;             // deconstructor hover: {kind, tx, ty, e?, spec}
  let umbilical = null;               // machine uid the rover is feeding power (G)
  let codexTally = { size: -1, creatures: 0, junk: 0 };   // cached codex category counts
  let lastSkyEvent = null;            // rare-event toast edge detector
  const codex = new Set(save?.codex || []);
  const revived = new Set(save?.revived || []);   // fossil ids already resurrected
  const inventory = makeInventory(save?.materials, save?.garbage);
  let birdT = 8 + Math.random() * 10;
  let minigame = null;
  let lastStratumIndex = world.stratumIndexAt(player.tx(), Math.floor(player.cy() / TILE));
  let banner = null;
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
  let stunT = 0;                           // gas stun: input lock, green wobble
  let garbageDug = save?.quests?.stats?.garbageDug ?? 0;       // scavenge-quest counter
  let matsExtracted = save?.quests?.stats?.matsExtracted ?? 0; // machine-quest counter
  let netsDug = save?.quests?.stats?.netsDug ?? 0;             // ghost-net recoveries
  let entoRewarded = save?.quests?.stats?.entoRewarded ?? false;
  const droppedItems = [];                 // {frag, x, y, vy} soaked-dropped bones (walk over to recover)

  const fx = { shake: m => cam.addShake(m, settings.shake) };
  function toast(str, color = PALETTE.amber) { toasts.push({ text: str, life: 2.4, color }); }

  // -- v4 systems --------------------------------------------------------------
  const power = makePower(save?.power);
  const status = makeStatus(save?.status);
  const podTy = world.surface[spawnCol];   // ground row the pod stands on
  const entities = makeEntities(save, { podTx: spawnCol - 1, podTy });
  const quests = makeQuests(save?.quests);
  const hazards = makeHazards(world);
  const build = makeBuild({
    world, player, inventory, entities,
    isQuestUnlocked: id => quests.isDone(id) || quests.isActive(id),
    hasScanned: id => codex.has(id),
    onBuilt: id => {
      quests.emit(`built:${id}`);
      if (id === 'beacon') {   // planting a beacon re-homes you
        const b2 = entities.list[entities.list.length - 1];
        home = { x: entities.centerX(b2), y: b2.ty * TILE };
        toast('home beacon online');
      }
      persist();
    },
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
    if (demoMode) return;   // the memory reel never writes the real save
    const deltas = world.exportDeltas();
    const session = {
      px: player.x, py: player.y, vx: player.vx, vy: player.vy, facing: player.facing,
      satchel: satchel.items.map(s => ({ fossilId: s.fossilId, bone: s.bone, boneIndex: s.boneIndex, stratumId: s.stratumId, state: s.state, identified: s.identified })),
    };
    const data = {
      v: 2, seed,
      dug: deltas.dug, placedTiles: deltas.placedTiles, harvested: deltas.harvested,
      collected: collection.export(), genome: collection.exportGenome(), codex: [...codex],
      revived: [...revived],
      materials: inventory.export(), garbage: inventory.exportGarbage(),
      ...entities.export(),                 // entities + nextUid
      quests: { ...quests.export(), stats: { garbageDug, matsExtracted, netsDug, entoRewarded } },
      power: power.export(), status: status.export(),
      home: { ...home }, laserMk: player.laserMk,
      ambient: ambient.serialize(),         // the resident creature roster + glow patches
      settings: { ...settings }, session,
    };
    writeSave(data);
    services.save = data;
  }

  cam.follow(player.cx(), player.cy(), 0, true);

  function mouseOverUi() {
    const rects = hud.uiHotRects().concat(touch.hotRects());   // never dig under a thumb button
    return rects.some(r => mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h);
  }

  /** the four visor toggles: laser | scan | build | deconstruct - always exits clean */
  function switchMode(mode) {
    if (mode === 'build') {
      player.tool = 'laser';
      if (!build.active) build.toggle();
    } else {
      if (build.active) build.exit();
      player.tool = mode;
      scanning = null; scanTarget = null;
    }
    if (mode !== 'deconstruct') deconTarget = null;
    sfx.ui();
  }

  // is anything solid anywhere above this tile? (cheap column scan - caves,
  // overhangs and built roofs all count as rain cover for free)
  function coveredAt(tx, headTy) {
    for (let ty = headTy - 1; ty >= 0; ty--) if (world.solidAt(tx, ty)) return true;
    return false;
  }
  function builtCount(type) {
    const spec = BUILDABLES_BY_ID[type];
    if (spec?.kind === 'tile') return world.placedTileCount(spec.tile);
    let n = 0;
    for (const e of entities.list) if (e.type === type) n++;
    return n;
  }

  // --------------------------------------------------------------- update
  function update(dt) {
    time += dt;
    if (bootT < 3.5) { bootT += dt; if (bootT < 1.2) { env.update(dt); return; } }   // controls unlock at 1.2s
    env.update(dt);
    updateClouds(dt);
    updateMusic(dt);
    decayToasts(dt);
    for (const mc of miniCards) mc.t += dt;
    while (miniCards.length && miniCards[0].t > 4.2) miniCards.shift();
    if (banner) banner.life -= dt;
    findT = Math.max(0, findT - dt);

    const depth = Math.max(0, world.depthOfRow(player.tx(), Math.floor(player.cy() / TILE)));
    const onSurface = depth < 2;
    backdrop.update(dt, player.tx());

    // -- v4 systems: power, wetness, quests, weather events ---------------------
    const sun01 = onSurface ? (1 - env.night01()) * (1 - 0.8 * env.precip01()) : 0;
    power.update(dt, { sun01, boost: onSurface ? entities.solarBoostAt(player) * (1 - env.night01()) : 0 },
      () => quests.emit('power-low'));

    const headTy = Math.floor(player.y / TILE);
    const rainExposed = onSurface && env.precip01() > 0.15 && !coveredAt(player.tx(), headTy);
    const submerged = player.inWater || player.inBrine;   // wading soaks you fast
    const exposedNow = rainExposed || submerged;
    status.update(dt, {
      exposed01: submerged ? 1 : rainExposed ? env.precip01() : 0,
      dry01: (!exposedNow && onSurface && env.precip01() < 0.1 && env.night01() < 0.5) ? 1 : 0,
      onSoaked: () => {
        quests.emit('soaked');
        toast('SOAKED - systems sluggish', PALETTE.danger);
        // a random satchel bone slips out - recoverable where it fell, never deleted
        if (satchel.items.length) {
          const frag = satchel.items[(Math.random() * satchel.items.length) | 0];
          satchel.remove(frag.uid);
          droppedItems.push({ frag, x: player.cx() + (Math.random() - 0.5) * 20, y: player.y, vy: -60 });
          toast(`${frag.bone} slipped from the satchel!`, PALETTE.danger);
        }
      },
    });
    player.speedMul = status.speedMul() * (power.state() === 'reserve' ? 0.7 : 1);
    if (status.tier() !== 'dry') {
      sparkT -= dt;
      if (sparkT <= 0) {
        sparkT = status.tier() === 'soaked' ? 0.25 : 0.55;
        particles.burst(player.cx() + (Math.random() - 0.5) * 8, player.y + 4, '#FFE9B8', 2, 70);
      }
    }

    // rare sky events announce themselves once
    if (env.event?.name !== lastSkyEvent) {
      lastSkyEvent = env.event?.name || null;
      if (lastSkyEvent) {
        toast({
          eclipse: 'ECLIPSE - the sun is going out',
          aurora: 'aurora overhead',
          meteors: 'meteor shower - look up',
        }[lastSkyEvent], lastSkyEvent === 'eclipse' ? PALETTE.danger : '#7FC4A8');
        quests.emit(lastSkyEvent);
        if (lastSkyEvent === 'eclipse') (sfx.hint || sfx.ui)();
      }
    }

    // rain grace + weather telegraphs
    if (!env.rainAllowed && quests.isDone('boot') && time > 90) env.rainAllowed = true;
    if ((env.incoming === 'rain' || env.incoming === 'storm') && env.weather !== env.incoming) quests.emit('rain-soon');
    if (env.precip01() > 0.3) quests.emit('rain-start');

    // codex tallies only move when the codex does - don't refilter every frame
    if (codex.size !== codexTally.size) {
      codexTally = { size: codex.size, creatures: 0, junk: 0 };
      for (const id of codex) {
        const cat = codexEntry(id)?.category;
        if (cat === 'creature') codexTally.creatures++;
        else if (cat === 'salvage') codexTally.junk++;
      }
    }
    const creaturesScanned = codexTally.creatures, junkTypesScanned = codexTally.junk;
    if (creaturesScanned >= 5) quests.emit('creatures-5');
    if (junkTypesScanned >= 4) quests.emit('junk-4-scanned');
    let lampsBuilt = 0;
    for (const e of entities.list) if (e.type.startsWith('lamp-')) lampsBuilt++;
    quests.update(dt, {
      player, pulley, codex, env, power, inventory,
      builtCount, exposedNow,
      lampsBuilt,
      stats: { garbageDug, matsExtracted, netsDug, creaturesScanned, junkTypesScanned },
      procQueued: entities.list.reduce((s, e) => s + (e.queue?.length || 0), 0),
    }, toast);
    // field notes reward: living anatomy informs the dead kind
    if (!entoRewarded && quests.isDone('entomologist')) {
      entoRewarded = true;
      const started = FOSSILS.filter(f => collection.started(f.id) && !collection.isComplete(f.id));
      const pick = started[(Math.random() * started.length) | 0] || FOSSILS[(Math.random() * FOSSILS.length) | 0];
      const g2 = collection.addGenome(pick.id, 0.15);
      toast(`field notes → ${pick.name} genome ${Math.round(g2 * 100)}%`, '#7FC4A8');
    }
    entities.update(dt, { sun01, wind01: env.wind01(), speed: quests.isDone('anthropocene-codex') ? 1.2 : 1 });
    // the umbilical: the rover as power plant - it only flows while you stand there
    if (umbilical !== null) {
      const m = entities.list.find(e2 => e2.uid === umbilical);
      const near = m && Math.abs(player.cx() - entities.centerX(m)) < 2.6 * TILE
        && Math.abs(player.cy() - m.ty * TILE) < TILE * 4;
      if (!near) { if (m) toast('umbilical detached'); umbilical = null; }
      else if (m.enabled !== false && power.frac() > 0.10 && (m.battery || 0) < MACHINE_BATT_CAP) {
        const amt = Math.min(4 * dt, MACHINE_BATT_CAP - m.battery);
        if (power.spend(amt)) m.battery = Math.min(MACHINE_BATT_CAP, m.battery + amt);
      }
    }
    stunT = Math.max(0, stunT - dt);
    const hz = hazards.update(dt, player);
    if (hz.stun) {
      stunT = 1.5;
      player.vx = hz.shoveX;
      toast('GAS - stumbling clear', PALETTE.danger);
      fx.shake(2.5);
    }

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
      if (f === T_WATER || f === T_BRINE) nearWater = 1;
      else if (f === T_TAR) nearWater = Math.max(nearWater, 0.35);   // sluggish gloop, low bed
      else if (f === T_LAVA) nearLava = 1;
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
      if (build.active || player.tool !== 'laser') switchMode('laser');   // modes always exit to the mining laser
      else { persist(); services.go('settings', { overlay: true, back: 'game' }); return; }
    }
    if (pressed('Tab')) { collectionOpen = !collectionOpen; inventoryOpen = false; sfx.ui(); }
    if (collectionOpen) { updateCollectionInput(); return; }
    if (pressed('KeyI')) { inventoryOpen = !inventoryOpen; sfx.ui(); }
    if (inventoryOpen) {
      // MouseLeft too: on touch there is no I key - a tap must not be a trap
      if (pressed('Escape') || pressed('MouseLeft')) { inventoryOpen = false; sfx.uiBack(); }
      return;
    }

    // B toggles build mode; H marks home; U at the pod upgrades the laser;
    // Q flicks a soil block under the cursor (support pillars, quick stairs)
    if (pressed('KeyB')) { if (build.active) switchMode('laser'); else switchMode('build'); }
    if (pressed('KeyX')) switchMode(player.tool === 'deconstruct' ? 'laser' : 'deconstruct');
    if (pressed('KeyQ') && !build.active && player.tool === 'laser' && stunT <= 0) tryQuickSoil();
    if (pressed('KeyU') && entities.nearest(player, e => e.type === 'pod', 2.6 * TILE)) tryUpgradeLaser();
    // mouse-wheel zoom (desktop): scroll up = closer. Build mode keeps the
    // wheel for cycling the bar, so only zoom when we're not building.
    if (!build.active && mouse.wheel) setZoom(VIEW_ZOOM - mouse.wheel * 0.15);
    if (pressed('KeyH')) {
      home = { x: player.cx(), y: player.y + player.h };
      particles.burst(home.x, home.y, PALETTE.amber, 10, 120);
      toast('home marked');
      sfx.ui();
      persist();
    }

    const anyInput = keys.KeyA || keys.KeyD || keys.KeyS || keys.KeyW || keys.Space || keys.KeyE || keys.KeyK || mouse.left;
    idleT = anyInput ? 0 : idleT + dt;

    // Ctrl toggles the active tool (laser ↔ scanner); clicking a visor toggle
    // switches modes directly
    if (pressed('ControlLeft') || pressed('ControlRight')) {
      switchMode(player.tool === 'scan' ? 'laser' : 'scan');
    }
    if (pressed('MouseLeft')) {
      const m = hud.modeToggleAt(mouse.x, mouse.y);
      if (m) switchMode(m);
    }
    const overUi = mouseOverUi();

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

      if (stunT > 0) {
        player.beam = null;   // reeling - no tools
      } else if (build.active) {
        player.beam = null;
        build.update(dt, cam, hud.buildBarRect());
      } else if (player.tool === 'scan') {
        updateScan(dt, overUi);
      } else if (player.tool === 'deconstruct') {
        updateDeconstruct(overUi);
      } else if (power.state() === 'reserve') {
        player.beam = null;   // tools offline - crawl to the sun
      } else {
        const digEv = stunT > 0 ? {} : updateDigging(player, world, cam, particles, fx, dt, overUi);
        if (digEv.brokeAt) {
          ambient.onDig(digEv.brokeAt.x, digEv.brokeAt.y);
          power.spend(POWER_DIG);
          // every 3rd broken tile yields regolith - shelter never waits on machines
          if ((regolithCounter = (regolithCounter + 1) % 3) === 0) inventory.add('regolith');
          if (digEv.obsidian) {   // volcanic glass: a little crystal + silicon
            inventory.add('crystal'); if (Math.random() < 0.5) inventory.add('silicon');
            toast('+obsidian shards', '#B39BC0');
          }
          if (power.state() === 'low') player.digCd = Math.max(player.digCd, DIG_COOLDOWN * 2);
          if (digEv.gas) {
            hazards.releaseGas(digEv.gas.tx, digEv.gas.ty);
            toast('GAS POCKET - it seeps upward', '#8CB45A');
            (sfx.hiss || sfx.uiBack)();
          }
          const cave = hazards.onDig(digEv.brokeTile.tx, digEv.brokeTile.ty);
          if (cave.creak) { rumble(); fx.shake(1.2); toast('the ceiling creaks…', PALETTE.creamDim); }
          if (cave.collapsed.length) {
            fx.shake(4);
            (sfx.crumble || sfx.laserBreak)();
            toast('CAVE-IN!', PALETTE.danger);
            inventory.add('regolith', cave.payout);
            for (const cpos of cave.collapsed) particles.burst((cpos.tx + 0.5) * TILE, cpos.ty * TILE, '#AA9678', 8, 160);
            // rubble landing on the probe stuns it
            if (cave.collapsed.some(cpos => Math.abs(cpos.tx - player.tx()) <= 1)) stunT = 1.2;
          }
        }
        if (digEv.bone) onBone(digEv.bone);
        if (digEv.garbage) onGarbage(digEv.garbage);
        if (digEv.nearBone && !hintedPockets.has(digEv.nearBone.id)) { hintedPockets.add(digEv.nearBone.id); sfx.hint(); }
      }

      if (pressed('KeyE') && !build.active) {
        if (player.tool !== 'scan' || !tryHarvest()) {
          const proc = entities.nearest(player, e => !!BUILDABLES_BY_ID[e.type]?.accepts, 2.4 * TILE);
          const stEnt = entities.nearest(player, e => !!BUILDABLES_BY_ID[e.type]?.station, 2.2 * TILE);
          const incu = entities.nearest(player, e => e.type === 'incubator', 2.4 * TILE);
          if (incu) tryResurrect(incu);
          else if (proc) interactMachine(proc);
          else if (stEnt) openStation({ spec: STATIONS_BY_ID[BUILDABLES_BY_ID[stEnt.type].station] });
          else {
            const podNear = entities.nearest(player, e => e.type === 'pod', 2.6 * TILE);
            if (podNear) openPodLab();
          }
        }
      }

      // per-machine power controls: P is the machine's own switch, G plugs the
      // rover in as an umbilical power plant (you stand there; your bar drains)
      if (pressed('KeyP') || pressed('KeyG')) {
        const m = entities.nearest(player, e => !!BUILDABLES_BY_ID[e.type]?.accepts, 2.4 * TILE);
        if (m && pressed('KeyP')) {
          m.enabled = m.enabled === false;
          toast(`${BUILDABLES_BY_ID[m.type].name} switched ${m.enabled ? 'ON' : 'OFF'}`);
          sfx.ui();
          persist();
        } else if (m) {
          umbilical = umbilical === m.uid ? null : m.uid;
          toast(umbilical ? 'umbilical connected - hold position' : 'umbilical unplugged');
          (sfx.place || sfx.ui)();
        }
      }
    }

    // soaked-dropped bones lie where they fell; roll over one to recover it
    for (let i = droppedItems.length - 1; i >= 0; i--) {
      const d = droppedItems[i];
      d.vy = (d.vy || 0) + 900 * dt;
      d.y += d.vy * dt;
      const gy = world.surface[Math.max(0, Math.min(WORLD_W - 1, Math.floor(d.x / TILE)))] * TILE;
      if (d.y > gy - 2) { d.y = gy - 2; d.vy = 0; }
      if (Math.abs(d.x - player.cx()) < 14 && Math.abs(d.y - player.cy()) < 18) {
        satchel.add(d.frag);
        toast(`${d.frag.bone} recovered`);
        (sfx.pickup || sfx.ui)();
        droppedItems.splice(i, 1);
      }
    }

    glintPockets();
    updatePrecip(dt);
    cam.follow(player.cx(), player.cy(), dt);
    cam.decay(dt);
    particles.update(dt);
    world.stepFluids(cam.bounds(), dt);
    // drain fluid reactions for FX: lava quenched to obsidian hisses + steams
    if (world.reactions.length) {
      for (const r of world.reactions) {
        particles.burst((r.tx + 0.5) * TILE, (r.ty + 0.5) * TILE, 'rgba(230,235,240,0.8)', 8, 90);
        fx.shake(1);
      }
      (sfx.hiss || sfx.uiBack)?.();
      world.reactions.length = 0;
    }
    // EMITTERS: anything glowing in the dark that moths orbit and fireflies
    // read - built lamps, the pod beacon, powered machines, and the grounded
    // rover itself at night. Each carries a stable `key` so a moth can tell
    // when its light is gone (deconstructed / moved / powered down) and disperse.
    const dark = env.night01() > 0.2 || depth > 4;
    const emitters = [];
    if (dark) {
      for (const e2 of entities.list) {
        if (e2.type.startsWith('lamp-')) emitters.push({ key: `L${e2.uid}`, x: entities.centerX(e2), y: (e2.ty + 1) * TILE - 30, amber: e2.type === 'lamp-amber' });
        else if (e2.type === 'pod') emitters.push({ key: 'pod', x: entities.centerX(e2), y: (e2.ty + 1) * TILE - 20, amber: false });
        else if (BUILDABLES_BY_ID[e2.type]?.accepts && e2.enabled !== false && (e2.battery || 0) > 0) emitters.push({ key: `M${e2.uid}`, x: entities.centerX(e2), y: (e2.ty + 1) * TILE - 16, amber: false });
      }
      // the rover on the ground is a warm little emitter at night
      if (player.onGround && env.night01() > 0.4) emitters.push({ key: 'rover', x: player.cx(), y: player.y, amber: false });
    }
    ambient.setLures(entities.list.filter(e2 => e2.type === 'lure').map(e2 => entities.centerX(e2)));
    ambient.update(dt, world, player, cam, depth, lightPoly, env, emitters);

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
    const snow = biomeAtX(player.tx(), WORLD_W).snow;
    if (p > 0.1 && rainDrops.length < p * 140) {
      for (let i = 0; i < 4; i++) {
        rainDrops.push({
          x: cam.x - 40 + Math.random() * (WIN_W + 80),
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

  // TAP TO LOCK, then it charges itself (no cramped hold). Tapping the same
  // spot again cycles through overlapping/stacked targets; MouseRight cycles
  // without moving. Works identically for a desktop click and a phone tap.
  const SCAN_T = 0.8;                 // seconds a locked target takes to catalogue
  function updateScan(dt, overUi = false) {
    player.beam = null;
    const wx = cam.wx(mouse.x), wy = cam.wy(mouse.y);
    const cands = overUi ? [] : resolveScanCandidates(wx, wy, world, ambient.scanTargets(wx, wy));

    // press: lock the nearest here - or, pressing the same spot again, cycle
    if (pressed('MouseLeft') && cands.length) {
      const sameSpot = scanning && Math.abs(wx - scanning.ax) < TILE && Math.abs(wy - scanning.ay) < TILE;
      if (sameSpot && scanning.cands.length > 1) { scanning.idx = (scanning.idx + 1) % scanning.cands.length; scanning.t = 0; }
      else scanning = { cands, idx: 0, t: 0, ax: wx, ay: wy };
      sfx.ui();
    } else if (pressed('MouseRight') && scanning && scanning.cands.length > 1) {
      scanning.idx = (scanning.idx + 1) % scanning.cands.length; scanning.t = 0;   // desktop: cycle in place
      sfx.ui();
    }

    if (scanning) {
      const locked = scanning.cands[scanning.idx];
      scanTarget = locked;
      if (!power.spend(POWER_SCAN * dt)) { scanning = null; return; }   // scanner browns out
      scanning.t += dt;
      if (scanning.t >= SCAN_T) {
        const id = locked.id;
        const isNew = !codex.has(id);
        codex.add(id);
        quests.emit(`scanned:${id}`);
        rerollLore();   // fresh flavor variant per scan
        overlay = { type: 'codex', codexId: id, t: 0, live: snapshotLive(locked.ref) };
        sfx[isNew ? 'reveal' : 'ui']();
        scanning = null;
        persist();
      }
    } else {
      scanTarget = cands[0] || null;   // hover preview for the reticle + E-harvest
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

  // genome gained per excavated specimen, by rarity - a common species needs
  // ~3 finds, a legendary ~7, so digging IS the analysis (no bone-mount grind)
  const GENOME_CHUNK = { common: 0.34, uncommon: 0.26, rare: 0.2, legendary: 0.15 };
  function onBone(pocket) {
    const spec = FOSSILS_BY_ID[pocket.fossilId];
    const stratum = world.stratumAt(pocket.tx, pocket.ty);
    satchel.add(makeFragment(pocket.fossilId, pocket.bone, pocket.boneIndex, stratum.id));
    miniCards.push({ spec, bone: pocket.bone, boneIndex: pocket.boneIndex, t: 0 });
    quests.emit('bone-first');
    // excavating a specimen reconstructs genome directly - the path to revival
    const wasViable = collection.isViable(pocket.fossilId);
    const g = collection.addGenome(pocket.fossilId, GENOME_CHUNK[spec?.rarity] || 0.25);
    if (!wasViable && g >= 1) {
      toast(`${spec.name} GENOME COMPLETE - revive it at an Incubator`, '#7FC4A8');
      quests.emit('genome-complete');
    } else {
      toast(`${spec.name} genome ${Math.round(g * 100)}%`, '#7FC4A8');
    }
    sfx.discover();
    fx.shake(1.5);
    findT = 2;
    persist();
  }

  // a resurrected fossil becomes a living creature: a synthetic fauna spec built
  // from the specimen, released into the ambient world where it ages + breeds
  function resurrectedSpec(fossil) {
    const marine = fossil.environment === 'marine' || fossil.environment === 'freshwater';
    const big = Math.max(fossil.footprint[0], fossil.footprint[1]);
    return {
      id: `revived:${fossil.id}`, fossilId: fossil.id, zone: marine ? 'water' : 'surface',
      size: [Math.min(28, 8 + big * 3), Math.min(20, 6 + big * 2)],
      speed: { walk: 16, flee: 48 }, palette: '#8FBE9A', draw: 'revenant',
      lifespan: 260, revived: true,
    };
  }
  function tryResurrect(incu) {
    const revivable = collection.viableIds().filter(id => !revived.has(id));
    if (!revivable.length) {
      toast(collection.anyViable() ? 'all viable species already revived' : 'no complete genome yet - dig more fossils', PALETTE.creamDim);
      sfx.uiBack();
      return;
    }
    const id = revivable[0];
    const fossil = FOSSILS_BY_ID[id];
    revived.add(id);
    const spec = resurrectedSpec(fossil);
    const gx = entities.centerX(incu), gy = (incu.ty + 1) * TILE;
    ambient.release(spec, gx, spec.zone === 'water' ? gy : (world.surface[Math.floor(gx / TILE)] * TILE));
    toast(`${fossil.name} REVIVED - it walks again`, PALETTE.amber);
    quests.emit('resurrect');
    particles.burst(gx, gy - 10, '#96DCAA', 24, 220);
    (sfx.complete || sfx.reveal)?.();
    persist();
  }

  // hand-salvage: crude direct yields so the first machine is always reachable
  // (the Reclaimer extracts 2-3x more from the same junk - that's its pitch)
  const HAND_SALVAGE = { 'scrap-metal': 'metal', 'aluminium-can': 'metal', 'bottle-cluster': 'plastic', 'lego-brick': 'plastic' };
  function onGarbage(deposit) {
    inventory.addGarbage(deposit.type);
    garbageDug += 1;
    quests.emit('garbage-first');
    if (deposit.type === 'fishing-net') { netsDug += 1; quests.emit('ghost-net-first'); }
    const crude = HAND_SALVAGE[deposit.type];
    if (crude) {
      inventory.add(crude, 1);
      toast(`+1 ${MATERIALS_BY_ID[crude].name.toLowerCase()} - hand-salvaged (+1 raw junk)`, MATERIALS_BY_ID[crude].color);
    } else {
      toast(`+1 ${codexEntry(deposit.type)?.name ?? 'junk'} (raw)`, '#8FA3B8');
    }
    (sfx.pickup || sfx.ui)();
  }

  /** Q: flick one soil block into an adjacent air tile (1 regolith) - support
   *  pillars under wide ceilings, a quick step, a dam plug */
  function tryQuickSoil() {
    const wx = cam.wx(mouse.x), wy = cam.wy(mouse.y);
    let tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    if (Math.hypot(wx - player.cx(), wy - player.cy()) > DIG_REACH) {   // fall back to the tile underfoot-ahead
      tx = player.tx() + player.facing; ty = Math.floor((player.y + player.h - 1) / TILE);
    }
    if (world.tileAt(tx, ty) !== T_AIR) return;
    const px2 = tx * TILE, py2 = ty * TILE;
    if (px2 < player.x + player.w && px2 + TILE > player.x && py2 < player.y + player.h && py2 + TILE > player.y) return;
    if (!inventory.spend('regolith', 1)) { toast('need regolith (dig dirt)', PALETTE.creamDim); sfx.uiBack(); return; }
    world.place(tx, ty, T_PLACED);
    particles.burst(px2 + TILE / 2, py2 + TILE / 2, '#AA9678', 6, 90);
    (sfx.place || sfx.ui)();
  }

  /** what the deconstructor would reclaim under the cursor (built tile or machine) */
  function resolveDecon(overUi) {
    if (overUi) return null;
    const wx = cam.wx(mouse.x), wy = cam.wy(mouse.y);
    if (Math.hypot(wx - player.cx(), wy - player.cy()) > DIG_REACH) return null;
    const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    const e = entities.at(tx, ty);
    if (e && e.type !== 'pod') return { kind: 'machine', tx: e.tx, ty: e.ty, e, spec: BUILDABLES_BY_ID[e.type] };
    const t = world.tileAt(tx, ty);
    if (t === T_PLACED || t === T_ROOF) {
      return { kind: 'tile', tx, ty, tile: t, spec: BUILDABLES.find(b => b.kind === 'tile' && b.tile === t) };
    }
    return null;
  }

  /** deconstruct mode: click a built thing, get its full cost back */
  function updateDeconstruct(overUi) {
    player.beam = null;
    deconTarget = resolveDecon(overUi);
    if (!deconTarget || !pressed('MouseLeft')) return;
    const { kind, spec } = deconTarget;
    if (kind === 'machine') {
      if (spec?.accepts && (deconTarget.e.queue?.length || Object.values(deconTarget.e.outBuffer || {}).some(n => n > 0))) {
        toast('empty the machine first (E collects)', PALETTE.creamDim);
        sfx.uiBack();
        return;
      }
      entities.remove(deconTarget.e.uid);
    } else {
      world.removePlaced(deconTarget.tx, deconTarget.ty);
    }
    for (const [id, n] of Object.entries(spec?.cost || {})) inventory.add(id, n);
    toast(`${spec?.name || 'structure'} reclaimed`);
    particles.burst((deconTarget.tx + 0.5) * TILE, (deconTarget.ty + 0.5) * TILE, '#E8A06A', 10, 140);
    sfx.uiBack();
    deconTarget = null;
    persist();
  }

  // laser tiers: deep rock is chewy until you upgrade (minerals only - biology
  // is never an ingredient)
  const LASER_COSTS = { 2: { crystal: 6, regolith: 6 }, 3: { crystal: 14, regolith: 6 } };
  function laserUpgradeCost() { return LASER_COSTS[player.laserMk + 1] || null; }

  function tryUpgradeLaser() {
    const cost = laserUpgradeCost();
    if (!cost) { toast('laser at maximum tier'); sfx.uiBack(); return; }
    if (!inventory.pay(cost)) {
      toast(`mk${player.laserMk + 1} needs ${Object.entries(cost).map(([id, n]) => `${n} ${id}`).join(' + ')}`, PALETTE.creamDim);
      sfx.uiBack();
      return;
    }
    player.laserMk += 1;
    toast(`LASER MK${player.laserMk} - cuts ${[1, 2, 4][player.laserMk - 1]}x`, PALETTE.amber);
    particles.burst(player.cx(), player.y + BEAM_Y, '#FFF3D0', 16, 200);
    sfx.complete();
    persist();
  }

  /** E at a processing machine: load the junk IT accepts, or collect the tray */
  function interactMachine(e) {
    const spec = BUILDABLES_BY_ID[e.type];
    const matching = inventory.takeGarbageMatching(spec.accepts);
    if (matching.length) {
      e.queue.push(...matching);
      toast(`${matching.length} junk loaded into the ${spec.name}`);
      sfx.station();
      persist();
      return;
    }
    const out = Object.entries(e.outBuffer || {}).filter(([, n]) => n > 0);
    if (out.length) {
      let total = 0;
      for (const [id, n] of out) { inventory.add(id, n); matsExtracted += n; total += n; e.outBuffer[id] = 0; }
      toast(`+${total} materials from the ${spec.name}`, '#7FC46E');
      particles.burst(entities.centerX(e), (e.ty + 1) * TILE - 14, '#9FBE9A', 10, 130);
      (sfx.pickup || sfx.complete)();
      persist();
      return;
    }
    if (inventory.garbageCount() > 0) toast(`the ${spec.name} doesn't take that junk`, PALETTE.creamDim);
    else toast(e.queue.length ? 'processing…' : `feed me ${spec.accepts.map(a => GARBAGE_BY_ID[a]?.name.toLowerCase()).slice(0, 2).join(', ')}…`, PALETTE.creamDim);
    sfx.uiBack();
  }

  /** E at the pod: fold-out field lab - runs whichever station the first
   *  eligible satchel fragment needs next (dedicated stations arrive in M3) */
  function openPodLab() {
    for (const spec of STATIONS) {
      if (!satchel.firstAtState(spec.input)) continue;
      // a dedicated built station owns this step now - the pod points you there
      const built = entities.list.some(e2 => BUILDABLES_BY_ID[e2.type]?.station === spec.id);
      if (built) { toast(`use your ${spec.name}`, PALETTE.creamDim); sfx.uiBack(); return; }
      openStation({ spec });
      return;
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
    // "done" feedback rides the toast stack (visor discipline: no centre pop)
    const next = STATIONS.find(s => s.input === station.spec.output);
    toast(next ? `${station.spec.output} ✓ → ${next.name}` : `${station.spec.output} ✓`, PALETTE.good);
    if (station.spec.output === 'identified') { fragment.identified = true; sfx.complete(); }
    if (station.spec.output === 'mounted') {
      satchel.remove(fragment.uid);
      const complete = collection.mountBone(fragment.fossilId, fragment.boneIndex);
      const f = FOSSILS_BY_ID[fragment.fossilId];
      findT = 1.2;
      if (complete) {
        overlay = { type: 'dex', spec: f, t: 0 };
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
    if (pressed('KeyA')) { journalTab = journalTab === 'codex' ? 'fossils' : 'codex'; journalScroll = 0; sfx.ui(); }
    if (pressed('KeyD')) { journalTab = journalTab === 'fossils' ? 'codex' : 'fossils'; journalScroll = 0; sfx.ui(); }
    if (mouse.wheel) { journalScroll = Math.max(0, Math.min(journalMaxScroll, journalScroll + mouse.wheel * 28)); }
    if (pressed('MouseLeft')) {
      const tab = journalTabAt(mouse.x, mouse.y);
      if (tab) { if (tab !== journalTab) journalScroll = 0; journalTab = tab; sfx.ui(); return; }
      if (journalTab === 'codex') {
        const e = codexCellAt(mouse.x, mouse.y);
        if (e && codex.has(e.id)) { rerollLore(); overlay = { type: 'codex', codexId: e.id, t: 0 }; collectionOpen = false; sfx.ui(); }
      } else {
        const cell = collectionCellAt(mouse.x, mouse.y);
        if (cell && collection.isComplete(cell.id)) { overlay = { type: 'dex', spec: FOSSILS_BY_ID[cell.id], t: 0 }; collectionOpen = false; sfx.ui(); }
      }
    }
  }

  // --------------------------------------------------------------- render
  function render(rtime) {
    frameLights = [];
    drawSkyGradient(rtime);          // deep sky: gradient + stars (screen space - infinitely far)
    ctx.save();
    ctx.scale(VIEW_ZOOM, VIEW_ZOOM); // hills live in the zoomed world window so they meet the terrain
    backdrop.draw(ctx, cam, env);
    ctx.restore();
    drawSunMoon(rtime);              // sun/moon/events ride OVER the hills (screen space)

    ctx.save();
    cam.apply(ctx);
    const b = cam.bounds();

    drawScenery(rtime, b);
    drawTiles(b, rtime);
    drawCaveProps(b, rtime);
    drawPockets(b);
    drawPod(rtime);
    drawEntities(rtime);
    pulley.draw(ctx, player, rtime);
    ambient.draw(ctx, rtime);
    particles.draw(ctx);
    hazards.draw(ctx, rtime);
    drawPrecip();
    drawBeam(rtime);
    drawDigTarget(rtime);
    if (build.active) drawBuildGhost(rtime);
    else if (player.tool === 'scan' && !pulley.active) drawReticle(rtime);
    else if (player.tool === 'deconstruct' && !pulley.active) drawDeconTarget(rtime);
    if (player.chute && !pulley.active) drawChute(player.cx(), player.y, rtime);
    drawProbe(ctx, player.x + player.w / 2, player.y, player.facing, rtime,
      player.swingT, player.swingAim, player.vx, player.walkT,
      pulley.active ? { dangle: pulley.dangleAngle(), mood: 'winch' } : { mood: roverMood(), blinkSeed: seed % 7 });
    ctx.restore();

    // darkness: depth OR night OR storm-gloom; cone aims at the mouse.
    // Depth keeps climbing past the old shelf: shallow ramp to 0.8 by ~54,
    // then a slow slide to 0.96 by ~244 - the basement is a basement.
    const depth = world.depthOfRow(player.tx(), Math.floor(player.cy() / TILE));
    const depthDark = Math.min(1, Math.max(0, (depth - 4) / 50)) * 0.8
      + Math.min(1, Math.max(0, (depth - 54) / 190)) * 0.16;
    const nightDark = env.night01() * 0.72;
    const stormDark = env.precip01() * 0.3;
    const ambientDark = Math.max(depthDark, nightDark, stormDark);
    const emitter = { x: player.cx() + player.facing * 7, y: player.y + BEAM_Y };
    const aim = Math.atan2(cam.wy(mouse.y) - emitter.y, cam.wx(mouse.x) - emitter.x);
    // god-ray shear follows the sun's arc - morning light leans right, noon
    // straight, evening left
    const dayArc = Math.max(0, Math.min(1, (env.t01 + 0.05) / 0.7));
    const sunlight = {
      strength: (1 - env.night01()) * (1 - 0.5 * env.precip01()),
      warm: env.night01() > 0.3 ? 0 : Math.max(0, 0.5 - Math.abs(env.t01 - 0.35)),
      shear: (1 - dayArc * 2) * 0.85,
    };
    ctx.save();
    ctx.scale(VIEW_ZOOM, VIEW_ZOOM);   // the darkness mask is composed in window space
    lightPoly = lighting.apply(ctx, world, cam, emitter, aim, ambientDark,
      frameLights.concat(ambient.glowLights()), sunlight);
    ctx.restore();

    // lightning flash over everything
    if (env.lightning > 0) {
      ctx.fillStyle = `rgba(240,244,255,${(env.lightning * 0.55).toFixed(2)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    // gas exposure: green closing vignette; stun: brief wobble tint
    if (hazards.exposure01 > 0 || stunT > 0) {
      const a = Math.max(hazards.exposure01 * 0.35, stunT > 0 ? 0.25 : 0);
      const g2 = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.3, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75);
      g2.addColorStop(0, 'rgba(110,160,70,0)');
      g2.addColorStop(1, `rgba(110,160,70,${a.toFixed(2)})`);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    hud.draw(rtime);
    if (banner && banner.life > 0) drawBanner();
    drawMiniCards(rtime);
    if (collectionOpen) drawCollection();
    if (inventoryOpen) hud.drawInventoryOverlay(rtime);
    if (overlay) drawOverlay(rtime);
    if (minigame) minigame.game.render(ctx, rtime);
    if (bootT < 3.5) hud.drawBootOverlay(rtime);
  }


  // ---- sky, in two passes so the backdrop hills sit BETWEEN them ----
  // 1) gradient + stars (deep sky, behind the hills)
  function drawSkyGradient(rtime) {
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
  }

  // 2) sun/moon + rare events (ride OVER the backdrop hills)
  function drawSunMoon(rtime) {
    const sm = env.sunMoon();
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

    // ---- rare sky events -------------------------------------------------
    const ec = env.eclipse01();
    if (ec > 0.02 && sm.sun) {
      // the dark disc slides across the sun; at totality, a thin corona
      const slide = (1 - ec) * 46 * (env.event && env.event.t / env.event.dur < 0.5 ? -1 : 1);
      if (ec > 0.85) {
        ctx.strokeStyle = `rgba(255,244,214,${((ec - 0.85) / 0.15 * 0.9).toFixed(2)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(sm.sun.x, sm.sun.y, 15, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = `rgba(18,16,26,${Math.min(1, ec * 1.6).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(sm.sun.x + slide, sm.sun.y, 14, 0, Math.PI * 2); ctx.fill();
    }
    const au = env.aurora01();
    if (au > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let bnd = 0; bnd < 3; bnd++) {
        const col = ['120,235,190', '110,200,220', '160,150,230'][bnd];
        ctx.strokeStyle = `rgba(${col},${(au * 0.10).toFixed(3)})`;
        ctx.lineWidth = 14 - bnd * 3;
        ctx.beginPath();
        for (let x = -10; x <= VIEW_W + 10; x += 16) {
          const y = 54 + bnd * 26 + Math.sin(x * 0.008 + rtime * 0.35 + bnd * 1.9) * 20
            + Math.sin(x * 0.021 - rtime * 0.2 + bnd) * 8;
          x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    const mt = env.meteors01();
    if (mt > 0.02) {
      for (let i = 0; i < 3; i++) {
        const ph = (rtime * 0.31 + i * 0.47) % 1;
        if (ph > 0.14) continue;   // each streak lives ~1.4s of its cycle
        const p2 = ph / 0.14;
        const sx2 = ((i * 373 + Math.floor(rtime / 3.2) * 191) % (VIEW_W - 100)) + 50 + p2 * 130;
        const sy2 = 24 + i * 52 + p2 * 90;
        const a = mt * (1 - p2) * 0.9;
        const g2 = ctx.createLinearGradient(sx2 - 46, sy2 - 32, sx2, sy2);
        g2.addColorStop(0, 'rgba(240,244,255,0)');
        g2.addColorStop(1, `rgba(240,244,255,${a.toFixed(2)})`);
        ctx.strokeStyle = g2; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(sx2 - 46, sy2 - 32); ctx.lineTo(sx2, sy2); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
        ctx.fillRect(sx2 - 1, sy2 - 1, 2.4, 2.4);
      }
    }
  }

  // persistent cloud field (v4.6): world-anchored puffs that DRIFT on the wind
  // instead of zooming on a formula. Density eases with weather; far layer
  // rides a 0.5 parallax so the sky has depth.
  const clouds = Array.from({ length: 14 }, (_, i) => ({
    x: (seed * 131 + i * 977 + i * i * 389) % (WORLD_W * TILE),
    y: 24 + (i * 47) % 130,
    scale: 0.75 + ((i * 37) % 10) / 10 * 0.85,
    layer: i % 2,                        // 0 = far (smaller, slower, parallax)
    drift: 2 + ((i * 53) % 10) / 10 * 5, // px/s at full wind
    a: 1,
  }));
  function updateClouds(dt) {
    const want = Math.round(5 + env.precip01() * 8);
    clouds.forEach((c, i) => {
      c.x += c.drift * (0.25 + env.wind01()) * (c.layer ? 1 : 0.55) * dt;
      if (c.x > WORLD_W * TILE + 200) c.x -= WORLD_W * TILE + 400;
      c.a += ((i < want ? 1 : 0) - c.a) * Math.min(1, dt * 0.4);   // fade, never pop
    });
  }
  function drawClouds() {
    const gloom = env.precip01();
    for (const c of clouds) {
      if (c.a < 0.03) continue;
      const px = c.layer ? c.x : c.x + cam.x * 0.5;   // far layer: half parallax
      const s = c.scale * (c.layer ? 1 : 0.68);
      ctx.save();
      ctx.globalAlpha = c.a * (c.layer ? 0.95 : 0.7);
      ctx.translate(px, c.y);
      ctx.scale(s, s);
      softCloud(ctx, 0, 0, gloom);
      if (c.scale > 1.15) softCloud(ctx, 36, 4, gloom);   // the big ones billow
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawScenery(rtime, b) {
    drawClouds();
    for (let tx = Math.max(0, b.x0); tx <= Math.min(WORLD_W - 1, b.x1); tx++) {
      if (tx >= spawnCol - CAMP_HALF_L - 1 && tx <= spawnCol + CAMP_HALF_R + 1) continue;
      const baseY = world.surface[tx] * TILE;
      const biome = biomeAtX(tx, WORLD_W);
      const s = sceneryAt(tx, world);   // shared ground truth with the scanner
      if (s === 'tree') drawTree(tx * TILE + TILE / 2, baseY, biome, tx, rtime);
      else if (s === 'dressing') drawDressing(tx * TILE + TILE / 2, baseY, tx, biome);
      if (hashCol(tx, 88) < biome.scenery.tuftP) tuft(tx * TILE + TILE / 2, baseY, tx, biome, rtime);
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
        if (FLUID_SPECS[t] !== undefined) {
          // fluids sit over the darkened back wall
          if (depth >= 0) tileset.drawBack(ctx, world.stratumIndexAt(tx, ty), tx, ty, dx, dy);
          const surface = world.tileAt(tx, ty - 1) !== t;   // top row of the body
          if (t === T_WATER) {
            ctx.fillStyle = 'rgba(70,130,170,0.55)';
            ctx.fillRect(dx, dy, TILE, TILE);
            if (surface) { ctx.fillStyle = 'rgba(180,220,240,0.5)'; ctx.fillRect(dx, dy + (Math.sin(rt * 2 + tx) * 1.2 | 0), TILE, 2); }
          } else if (t === T_BRINE) {
            // hypersaline: denser teal-green, slow swell, salt-crust top line
            ctx.fillStyle = 'rgba(90,150,140,0.62)';
            ctx.fillRect(dx, dy, TILE, TILE);
            if (surface) {
              ctx.fillStyle = 'rgba(210,225,210,0.7)';
              ctx.fillRect(dx, dy + (Math.sin(rt * 1.1 + tx) * 0.8 | 0), TILE, 1.6);
            }
          } else if (t === T_TAR) {
            // natural asphalt: near-black with a slow travelling sheen
            ctx.fillStyle = 'rgba(24,20,24,0.92)';
            ctx.fillRect(dx, dy, TILE, TILE);
            if (surface) {
              ctx.fillStyle = 'rgba(90,80,100,0.35)';
              const sx2 = ((rt * 4 + tx * 3) % 24) - 4;
              ctx.fillRect(dx + Math.max(0, Math.min(TILE - 5, sx2)), dy + 1, 5, 1.6);
              // an occasional fat bubble
              if (Math.sin(rt * 0.7 + tx * 2.3) > 0.96) { ctx.fillStyle = 'rgba(60,54,64,0.8)'; ctx.beginPath(); ctx.arc(dx + 8, dy + 3, 2, 0, Math.PI * 2); ctx.fill(); }
            }
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
        if (t === T_RUBBLE) tileset.drawRubble(ctx, (tx ^ ty) & 7, dx, dy);
        else if (t === T_OBSIDIAN) tileset.drawObsidian(ctx, (tx ^ ty) & 7, dx, dy);
        else if (t === T_PLACED) tileset.drawPlaced(ctx, (tx ^ ty) & 7, dx, dy);
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
          // mineral vein seam threading the stratum (de-monotonizes deep rock)
          if (depth > 6) {
            const vein = tileset.veinAt(si, tx, ty);
            if (vein) {
              ctx.fillStyle = vein;
              ctx.globalAlpha = 0.6;
              ctx.fillRect(dx + 4, dy, 4, TILE);
              ctx.globalAlpha = 0.28;
              ctx.fillRect(dx + 2, dy, 2, TILE); ctx.fillRect(dx + 8, dy, 2, TILE);
              ctx.globalAlpha = 1;
            }
          }
          if (world.gasAt(tx, ty)) {   // trapped gas: olive speckle + occasional wisp
            ctx.fillStyle = 'rgba(140,170,80,0.5)';
            ctx.fillRect(dx + 3, dy + 4, 2, 2); ctx.fillRect(dx + 9, dy + 9, 2, 2); ctx.fillRect(dx + 6, dy + 12, 2, 2);
            if (Math.random() < 0.002) particles.burst(dx + 8, dy + 2, 'rgba(140,180,90,0.5)', 1, 20);
          }
        }

        if (ty === world.surface[tx] && !inPad) {
          const biome = biomeAtX(tx, WORLD_W);
          ctx.fillStyle = biome.grass.cap;
          ctx.fillRect(dx, dy, TILE, 4);
          ctx.fillStyle = PALETTE.grassDeep;
          ctx.fillRect(dx, dy + 3, TILE, 1);
        }

        ctx.fillStyle = 'rgba(30,22,18,0.38)';
        if (world.tileAt(tx, ty - 1) === T_AIR && ty !== world.surface[tx]) ctx.fillRect(dx, dy, TILE, 2);
        if (world.tileAt(tx, ty + 1) === T_AIR) ctx.fillRect(dx, dy + TILE - 2, TILE, 2);
        if (world.tileAt(tx - 1, ty) === T_AIR) ctx.fillRect(dx, dy, 2, TILE);
        if (world.tileAt(tx + 1, ty) === T_AIR) ctx.fillRect(dx + TILE - 2, dy, 2, TILE);

        // multi-hit rock shows its damage as spreading cracks
        const dmg = world.damageAt(tx, ty);
        if (dmg > 0) {
          ctx.strokeStyle = 'rgba(20,14,10,0.55)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(dx + 4, dy + 3); ctx.lineTo(dx + 8, dy + 8); ctx.lineTo(dx + 6, dy + 13);
          ctx.moveTo(dx + 8, dy + 8); ctx.lineTo(dx + 12, dy + 10);
          if (dmg >= 3) {
            ctx.moveTo(dx + 11, dy + 2); ctx.lineTo(dx + 9, dy + 6);
            ctx.moveTo(dx + 3, dy + 10); ctx.lineTo(dx + 6, dy + 8);
          }
          ctx.stroke();
        }
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
        } else if (f.ceiling === 'vines') {
          // feral pothos: swaying strands with heart-leaf pairs
          const sway = Math.sin(rtime * 1.5 + tx * 0.8) * 2.4;
          const len = 8 + h * 16;
          for (let v = 0; v < 2; v++) {
            const vx = dx + 4 + v * 7;
            ctx.strokeStyle = '#4E7A44'; ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(vx, dy);
            ctx.quadraticCurveTo(vx + sway * (v ? -1 : 1), dy + len * 0.55, vx + sway * (v ? -1 : 1), dy + len);
            ctx.stroke();
            ctx.fillStyle = '#5F9A54';
            for (let lf = 1; lf <= 2; lf++) {
              const ly = dy + len * (lf / 3);
              const lxp = vx + sway * (v ? -1 : 1) * (lf / 3);
              ctx.beginPath(); ctx.ellipse(lxp - 2, ly, 2.2, 1.5, -0.5, 0, Math.PI * 2); ctx.fill();
            }
          }
        } else if (f.ceiling === 'stalactite' || f.ceiling === 'crystal-tip') {
          if (f.ceiling === 'crystal-tip') {
            const tw = 0.6 + Math.sin(rtime * 3 + tx * 2) * 0.4;
            ctx.fillStyle = `rgba(200,180,230,${0.5 + tw * 0.4})`;
          } else ctx.fillStyle = STRATA[si].colors.band;
          ctx.beginPath();
          ctx.moveTo(dx + 3, dy); ctx.lineTo(dx + 8, dy + 9 + h * 5); ctx.lineTo(dx + 13, dy);
          ctx.closePath(); ctx.fill();
          if (f.geode) frameLights.push({ x: dx + 8, y: dy + 6, r: 26, warmth: 0 });
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

  // per-type junk glints: tell scrap from bottles from toys at a glance
  function drawDepositGlint(type, dx, dy) {
    switch (type) {
      case 'scrap-metal':      // metallic strips + rust fleck
        ctx.fillStyle = 'rgba(170,180,195,0.9)';
        ctx.fillRect(dx + 3, dy + 8, 8, 2); ctx.fillRect(dx + 7, dy + 4, 2, 8);
        ctx.fillStyle = 'rgba(150,90,60,0.8)'; ctx.fillRect(dx + 10, dy + 9, 2, 2);
        break;
      case 'aluminium-can':    // silver cylinder
        ctx.fillStyle = 'rgba(200,208,218,0.9)';
        ctx.fillRect(dx + 5, dy + 6, 5, 8);
        ctx.fillStyle = 'rgba(240,245,250,0.9)'; ctx.fillRect(dx + 5, dy + 6, 1.4, 8);
        ctx.fillStyle = 'rgba(120,60,60,0.8)'; ctx.fillRect(dx + 6.4, dy + 8, 2.4, 2);
        break;
      case 'stainless-cutlery': // crossed fork+spoon shine
        ctx.strokeStyle = 'rgba(215,222,230,0.95)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(dx + 4, dy + 12); ctx.lineTo(dx + 12, dy + 5); ctx.moveTo(dx + 4, dy + 5); ctx.lineTo(dx + 12, dy + 12); ctx.stroke();
        ctx.fillStyle = 'rgba(215,222,230,0.95)';
        ctx.beginPath(); ctx.ellipse(dx + 12, dy + 5, 2, 2.8, 0.8, 0, 7); ctx.fill();
        break;
      case 'rebar-chunk':      // ribbed bar
        ctx.fillStyle = 'rgba(130,110,100,0.95)';
        ctx.fillRect(dx + 3, dy + 8, 10, 2.4);
        ctx.fillStyle = 'rgba(90,70,60,0.9)';
        for (let i = 0; i < 4; i++) ctx.fillRect(dx + 4 + i * 2.6, dy + 7.4, 1, 3.6);
        break;
      case 'bottle-cluster':   // pale blue translucent glint
        ctx.fillStyle = 'rgba(150,200,230,0.75)';
        ctx.fillRect(dx + 5, dy + 6, 3, 7); ctx.fillRect(dx + 9, dy + 8, 3, 5);
        ctx.fillStyle = 'rgba(230,245,255,0.9)'; ctx.fillRect(dx + 5, dy + 6, 1.2, 4);
        break;
      case 'lego-brick': {     // impossible cheerful primaries
        ctx.fillStyle = '#C4432E'; ctx.fillRect(dx + 4, dy + 9, 5, 4);
        ctx.fillStyle = '#4E6E96'; ctx.fillRect(dx + 9, dy + 7, 4, 3);
        ctx.fillStyle = '#E8B23A'; ctx.fillRect(dx + 5, dy + 8, 1.6, 1.4); ctx.fillRect(dx + 10, dy + 6, 1.6, 1.4);
        break;
      }
      case 'tyre-chunk':       // dark arc
        ctx.strokeStyle = 'rgba(40,38,44,0.95)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(dx + 8, dy + 12, 5, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        break;
      case 'fishing-net':      // teal mesh
        ctx.strokeStyle = 'rgba(110,170,170,0.8)'; ctx.lineWidth = 0.9;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(dx + 3 + i * 4, dy + 5); ctx.lineTo(dx + 6 + i * 4, dy + 13); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(dx + 12 - i * 4, dy + 5); ctx.lineTo(dx + 9 - i * 4, dy + 13); ctx.stroke();
        }
        break;
      case 'glass-bottle':     // green glass shine
        ctx.fillStyle = 'rgba(120,180,140,0.8)';
        ctx.fillRect(dx + 6, dy + 6, 4, 8);
        ctx.fillRect(dx + 7, dy + 4, 2, 3);
        ctx.fillStyle = 'rgba(220,255,230,0.9)'; ctx.fillRect(dx + 6, dy + 6, 1.2, 6);
        break;
      case 'ceramic-shards':   // white curved shards
        ctx.fillStyle = 'rgba(235,232,225,0.92)';
        ctx.beginPath(); ctx.moveTo(dx + 4, dy + 12); ctx.quadraticCurveTo(dx + 8, dy + 6, dx + 12, dy + 11); ctx.lineTo(dx + 10, dy + 13); ctx.quadraticCurveTo(dx + 8, dy + 9, dx + 6, dy + 13); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(90,120,160,0.7)'; ctx.fillRect(dx + 7, dy + 9, 2, 1);   // a blue glaze line
        break;
      case 'smartphone':       // black slab + gold vein
        ctx.fillStyle = 'rgba(20,20,26,0.95)';
        ctx.fillRect(dx + 5, dy + 6, 6, 9);
        ctx.fillStyle = 'rgba(220,180,80,0.9)'; ctx.fillRect(dx + 7.4, dy + 8, 1.2, 5);
        break;
      default:                 // e-waste: green board + gold pins
        ctx.fillStyle = 'rgba(70,130,80,0.9)';
        ctx.fillRect(dx + 4, dy + 7, 8, 5);
        ctx.fillStyle = 'rgba(220,180,80,0.9)';
        ctx.fillRect(dx + 6, dy + 8, 1.4, 3); ctx.fillRect(dx + 9, dy + 8, 1.4, 3);
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
    // garbage deposits: per-type glints so scrap reads different from bottles
    for (const g of world.garbage || []) {
      if (g.tx < b.x0 || g.tx > b.x1 || g.ty < b.y0 || g.ty > b.y1) continue;
      if (!world.garbageAt(g.tx, g.ty)) continue;
      const dx = g.tx * TILE, dy = g.ty * TILE;
      drawDepositGlint(g.type, dx, dy);
    }
    // soaked-dropped bones waiting to be recovered
    for (const d of droppedItems) {
      drawBoneNub(ctx, { bone: d.frag.bone }, d.x - TILE / 2, d.y - TILE + 4, true);
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

    // proximity glow when the pod has something for you (the visor's context
    // line does the talking - no floating text)
    const near = entities.nearest(player, e => e.type === 'pod', 2.6 * TILE);
    if (near && !build.active) {
      const hasWork = STATIONS.some(s => satchel.firstAtState(s.input));
      const glow2 = ctx.createRadialGradient(lx + 22, gy - 28, 6, lx + 22, gy - 28, 44);
      glow2.addColorStop(0, `rgba(224,162,74,${hasWork ? 0.18 : 0.08})`);
      glow2.addColorStop(1, 'rgba(224,162,74,0)');
      ctx.fillStyle = glow2;
      ctx.beginPath(); ctx.arc(lx + 22, gy - 28, 44, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---- built machines: solar, wind vane, Reclaimer, storage, beacon ----------
  // power cables: a sagging line from each generator to every machine it feeds,
  // with a travelling spark while the machine is actually powered
  function drawPowerCables(rtime) {
    const gens = entities.list.filter(e => e.type === 'solar' || e.type === 'wind-vane');
    const sinks = entities.list.filter(e => !!BUILDABLES_BY_ID[e.type]?.accepts);
    ctx.lineWidth = 1.4;
    for (const g of gens) {
      const gx = entities.centerX(g), gy2 = (g.ty + 1) * TILE - (g.type === 'solar' ? 12 : 26);
      for (const m of sinks) {
        const mx = entities.centerX(m);
        if (Math.abs(mx - entities.centerX(g)) >= TILE * 6) continue;   // out of feed range
        const my = (m.ty + 1) * TILE - 24;
        const midX = (gx + mx) / 2, sag = 8 + Math.abs(mx - gx) * 0.08;
        const midY = Math.max(gy2, my) + sag;
        ctx.strokeStyle = 'rgba(38,34,46,0.9)';
        ctx.beginPath(); ctx.moveTo(gx, gy2); ctx.quadraticCurveTo(midX, midY, mx, my); ctx.stroke();
        if (m.powered && m.enabled !== false) {
          // spark rides the wire while the source is feeding the battery
          const t2 = (rtime * 0.8 + (g.uid * 7 + m.uid) * 0.13) % 1;
          const it = 1 - t2;
          const px2 = it * it * gx + 2 * it * t2 * midX + t2 * t2 * mx;
          const py2 = it * it * gy2 + 2 * it * t2 * midY + t2 * t2 * my;
          ctx.fillStyle = 'rgba(255,233,150,0.95)';
          ctx.fillRect(px2 - 1.2, py2 - 1.2, 2.4, 2.4);
        }
      }
    }

    // the rover umbilical: a live cable from your hull to the plugged machine
    if (umbilical !== null) {
      const m = entities.list.find(e2 => e2.uid === umbilical);
      if (m) {
        const px0 = player.cx(), py0 = player.y + 9;
        const mx = entities.centerX(m), my = (m.ty + 1) * TILE - 20;
        const midX = (px0 + mx) / 2, midY = Math.max(py0, my) + 10 + Math.abs(mx - px0) * 0.06;
        ctx.strokeStyle = 'rgba(224,162,74,0.9)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(px0, py0); ctx.quadraticCurveTo(midX, midY, mx, my); ctx.stroke();
        for (let k = 0; k < 2; k++) {   // charge pulses flowing rover → machine
          const t2 = (rtime * 1.6 + k * 0.5) % 1, it = 1 - t2;
          const qx = it * it * px0 + 2 * it * t2 * midX + t2 * t2 * mx;
          const qy = it * it * py0 + 2 * it * t2 * midY + t2 * t2 * my;
          ctx.fillStyle = 'rgba(255,233,150,0.95)';
          ctx.fillRect(qx - 1.4, qy - 1.4, 2.8, 2.8);
        }
      }
    }
  }

  function drawEntities(rtime) {
    drawPowerCables(rtime);
    for (const e of entities.list) {
      if (e.type === 'pod') continue;   // drawPod owns it
      const [w] = entities.sizeOf(e);
      // e.ty = bottom-most occupied AIR row; feet rest on the row below it
      const cx = entities.centerX(e), gy = (e.ty + 1) * TILE;

      if (e.type === 'solar') {
        ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx, gy - 12); ctx.stroke();
        ctx.save();
        ctx.translate(cx, gy - 12);
        ctx.rotate(-0.14);
        ctx.fillStyle = '#27405C';
        ctx.fillRect(-15, -10, 30, 10);
        ctx.strokeStyle = '#4E6E96'; ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-15 + i * 7.5, -10); ctx.lineTo(-15 + i * 7.5, 0); ctx.stroke(); }
        ctx.strokeRect(-15, -10, 30, 10);
        // glint by day
        if (env.night01() < 0.4) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-13, -9, 8, 2); }
        ctx.restore();

      } else if (e.type === 'wind-vane') {
        const spin = rtime * (1 + env.wind01() * 14);
        ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx, gy - 26); ctx.stroke();
        ctx.fillStyle = '#5C5766';
        ctx.beginPath(); ctx.arc(cx, gy - 26, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8E96A4'; ctx.lineWidth = 1.8;
        for (let bIdx = 0; bIdx < 3; bIdx++) {
          const a = spin + bIdx * (Math.PI * 2 / 3);
          ctx.beginPath(); ctx.moveTo(cx, gy - 26);
          ctx.lineTo(cx + Math.cos(a) * 10, gy - 26 + Math.sin(a) * 10);
          ctx.stroke();
        }

      } else if (BUILDABLES_BY_ID[e.type]?.accepts) {
        const x0 = e.tx * TILE, bw = w * TILE;   // 2x2 footprint
        const dim = e.enabled === false ? 0.4 : (e.battery || 0) <= 0 ? 0.6 : 1;
        const working = e.queue?.length > 0 && e.enabled !== false && (e.battery || 0) > 0;
        ctx.save();
        ctx.globalAlpha = dim;
        // ---- bespoke bodies: each machine echoes its build-menu icon ----------
        if (e.type === 'smelter') {
          // rammed-earth induction furnace: brick courses, chimney, ember mouth
          ctx.fillStyle = '#4A3A34'; ctx.fillRect(x0, gy - 26, bw, 26);
          ctx.fillStyle = '#3A2C28';
          for (let r = 0; r < 3; r++) for (let b2 = 0; b2 < 4; b2++)
            ctx.fillRect(x0 + 1 + b2 * 8 + (r % 2) * 4, gy - 24 + r * 8, 6, 1.4);
          ctx.fillStyle = '#574840'; ctx.fillRect(x0 - 1, gy - 28, bw - 8, 3);       // lip
          ctx.fillStyle = '#4E4956'; ctx.fillRect(x0 + bw - 10, gy - 40, 7, 15);     // chimney
          ctx.fillStyle = '#2B2733'; ctx.fillRect(x0 + bw - 11, gy - 42, 9, 3);
          const mg = working ? 0.7 + Math.sin(rtime * 6) * 0.3 : 0.15;               // breathing mouth
          ctx.fillStyle = `rgba(224,105,42,${mg.toFixed(2)})`;
          ctx.fillRect(x0 + 9, gy - 6, bw - 18, 4);
          if (working) {                                                             // heat shimmer
            ctx.fillStyle = 'rgba(255,200,140,0.14)';
            for (let hh = 0; hh < 3; hh++) {
              const sx2 = x0 + bw - 7 + Math.sin(rtime * 5 + hh * 2.1) * 1.6;
              ctx.fillRect(sx2, gy - 46 - hh * 4 - ((rtime * 20) % 4), 2, 3);
            }
          }
        } else if (e.type === 'pyrolysis') {
          // sealed vat on legs: rounded tank, top pipe, bubbling sight-glass
          ctx.fillStyle = '#2B2733';
          ctx.fillRect(x0 + 3, gy - 5, 3, 5); ctx.fillRect(x0 + bw - 6, gy - 5, 3, 5);
          ctx.fillStyle = '#39423B';
          roundRect(ctx, x0 + 1, gy - 27, bw - 2, 23, 8); ctx.fill();
          ctx.strokeStyle = '#2E362F'; ctx.lineWidth = 1;                            // weld seams
          ctx.beginPath(); ctx.moveTo(x0 + 4, gy - 21); ctx.lineTo(x0 + bw - 4, gy - 21);
          ctx.moveTo(x0 + 4, gy - 9); ctx.lineTo(x0 + bw - 4, gy - 9); ctx.stroke();
          ctx.fillStyle = '#4E4956'; ctx.fillRect(x0 + bw / 2 - 3, gy - 35, 6, 9);   // top pipe
          ctx.fillRect(x0 + bw / 2 - 3, gy - 36, 10, 3);                             // elbow
          if (working && Math.sin(rtime * 2.4) > 0.4) {                              // condensate drip
            ctx.fillStyle = 'rgba(150,220,170,0.7)';
            ctx.fillRect(x0 + bw / 2 + 6, gy - 33 + ((rtime * 30) % 26), 1.4, 3);
          }
          const sgx = x0 + bw - 9, sgy = gy - 15;                                    // sight-glass
          ctx.fillStyle = '#16201A';
          ctx.beginPath(); ctx.arc(sgx, sgy, 4.6, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#9FBE9A'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(sgx, sgy, 4.6, 0, Math.PI * 2); ctx.stroke();
          if (working) {
            ctx.fillStyle = 'rgba(150,220,170,0.85)';
            for (let bb = 0; bb < 3; bb++) {
              const bt = (rtime * 0.9 + bb * 0.37) % 1;
              ctx.fillRect(sgx - 2 + bb * 2, sgy + 3 - bt * 6, 1.2, 1.2);
            }
          }
        } else {
          // ash kiln: layered brick dome, top vent puffing, silica slot glow
          ctx.fillStyle = '#5A4A42';
          ctx.beginPath();
          ctx.moveTo(x0, gy);
          ctx.quadraticCurveTo(x0 + 2, gy - 26, x0 + bw / 2, gy - 30);
          ctx.quadraticCurveTo(x0 + bw - 2, gy - 26, x0 + bw, gy);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#4A3A34'; ctx.lineWidth = 1;                            // brick courses
          for (let r = 1; r <= 3; r++) {
            ctx.beginPath();
            ctx.moveTo(x0 + r * 2.4, gy);
            ctx.quadraticCurveTo(x0 + bw / 2, gy - 30 + r * 7, x0 + bw - r * 2.4, gy);
            ctx.stroke();
          }
          ctx.fillStyle = '#3A322E'; ctx.fillRect(x0 + bw / 2 - 3, gy - 34, 6, 6);   // vent stub
          const kg = working ? 0.55 + Math.sin(rtime * 5) * 0.35 : 0.12;             // silica slot
          ctx.fillStyle = `rgba(179,155,192,${kg.toFixed(2)})`;
          ctx.fillRect(x0 + bw / 2 - 2.5, gy - 9, 5, 8);
          if (working) {                                                             // pale ash puffs
            for (let a2 = 0; a2 < 2; a2++) {
              const at = (rtime * 0.5 + a2 * 0.5) % 1;
              ctx.fillStyle = `rgba(200,195,185,${(0.4 * (1 - at)).toFixed(2)})`;
              ctx.beginPath();
              ctx.arc(x0 + bw / 2 + Math.sin(at * 5 + a2) * 3, gy - 36 - at * 14, 1.6 + at * 2.6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        // hopper (top-left) with visible junk lumps
        ctx.fillStyle = '#4E4956';
        ctx.beginPath();
        ctx.moveTo(x0 - 2, gy - 36); ctx.lineTo(x0 + 12, gy - 36); ctx.lineTo(x0 + 9, gy - 26); ctx.lineTo(x0 + 1, gy - 26);
        ctx.closePath(); ctx.fill();
        for (let q = 0; q < Math.min(3, e.queue?.length || 0); q++) {
          ctx.fillStyle = ['#8FA3B8', '#7FB2DE', '#9FBE9A'][q];
          ctx.fillRect(x0 + 2 + q * 3, gy - 35 + (q % 2), 2.6, 2.6);
        }
        // three stage bays with live tells
        for (let s = 0; s < 3; s++) {
          const bx = x0 + 3 + s * 9;
          const active = working && e.stage === s;
          ctx.fillStyle = active ? '#20303A' : '#26222E';
          ctx.fillRect(bx, gy - 22, 7, 12);
          if (active) {
            if (s === 0) {          // wash: falling droplets
              ctx.fillStyle = 'rgba(140,200,230,0.9)';
              for (let d = 0; d < 3; d++) ctx.fillRect(bx + 1.5 + d * 2, gy - 20 + ((rtime * 26 + d * 4) % 9), 1.2, 2.4);
            } else if (s === 1) {   // shred: rattling teeth
              const j = Math.sin(rtime * 40) * 1.2;
              ctx.fillStyle = '#9A9088';
              ctx.fillRect(bx + 1, gy - 18 + j, 5, 1.6);
              ctx.fillRect(bx + 1, gy - 14 - j, 5, 1.6);
            } else {                // extract: spectrometer glow sweep
              const g = 0.5 + Math.sin(rtime * 8) * 0.5;
              ctx.fillStyle = `rgba(150,220,170,${(0.3 + g * 0.6).toFixed(2)})`;
              ctx.fillRect(bx + 1, gy - 21, 5, 10);
            }
          }
        }
        // output tray (right) piling material cubes
        ctx.fillStyle = '#4E4956';
        ctx.fillRect(x0 + bw - 2, gy - 12, 8, 12);
        const outs = Object.entries(e.outBuffer || {}).filter(([, n]) => n > 0);
        outs.slice(0, 4).forEach(([id], i2) => {
          ctx.fillStyle = MATERIALS_BY_ID[id]?.color || '#9AA4B2';
          ctx.fillRect(x0 + bw - 1 + (i2 % 2) * 3.4, gy - 10 - Math.floor(i2 / 2) * 4, 3, 3);
        });
        // status lamp: green = charged, red = flat battery, dark = switched off
        ctx.fillStyle = e.enabled === false ? '#33302E'
          : (e.battery || 0) <= 0 ? '#B0402E'
          : (Math.sin(rtime * 3) > 0 ? '#7FC46E' : '#4A7A44');
        ctx.beginPath(); ctx.arc(x0 + bw - 4, gy - 23, 1.8, 0, Math.PI * 2); ctx.fill();
        // battery pips: three cells on the chassis edge
        const b01 = Math.max(0, Math.min(1, (e.battery || 0) / MACHINE_BATT_CAP));
        for (let p = 0; p < 3; p++) {
          ctx.fillStyle = b01 > (p + 0.34) / 3 ? '#E0C86A' : 'rgba(0,0,0,0.45)';
          ctx.fillRect(x0 + bw - 12, gy - 20 + p * 4, 6, 2.6);
        }
        // progress strip built into the chassis: the machine IS its own display
        if (e.queue?.length) {
          const frac2 = Math.min(1, e.t / RECLAIM_STAGES[e.stage]);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x0 + 3, gy - 8, bw - 12, 2.4);
          ctx.fillStyle = '#7FC4A8';
          ctx.fillRect(x0 + 3, gy - 8, (bw - 12) * ((e.stage + frac2) / 3), 2.4);
        }
        ctx.restore();
        if (working) {
          const tint = { pyrolysis: '150,220,170', kiln: '190,160,210' }[e.type];   // smelter stays ember-amber
          frameLights.push({ x: cx, y: gy - 16, r: 34, warmth: 0.5, ...(tint ? { tint } : {}) });
        }

      } else if (BUILDABLES_BY_ID[e.type]?.station) {
        const spec = STATIONS_BY_ID[BUILDABLES_BY_ID[e.type].station];
        const isNear = !build.active && entities.nearest(player, x2 => x2 === e, 2.2 * TILE) === e;
        const hasInput = !!satchel.firstAtState(spec.input);
        if (isNear) {
          const glow = ctx.createRadialGradient(cx, gy - 12, 4, cx, gy - 12, 30);
          glow.addColorStop(0, `rgba(224,162,74,${hasInput ? 0.24 : 0.12})`);
          glow.addColorStop(1, 'rgba(224,162,74,0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(cx, gy - 12, 30, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#4E4956';
        ctx.fillRect(cx - 14, gy - 4, 28, 4);
        if (hasSprite('stations', spec.sprite)) drawSprite(ctx, 'stations', spec.sprite, cx, gy - 3, 38, 38);
        else chip(ctx, cx - 15, gy - 25, 30, 21, { fill: spec.tint, r: 5 });

      } else if (e.type.startsWith('lamp-')) {
        const L = {
          'lamp-green': { orb: '#96DCAA', tint: '150,220,170' },
          'lamp-blue': { orb: '#7FB8E8', tint: '120,180,235' },
          'lamp-teal': { orb: '#7FE8D8', tint: '120,230,215' },
          'lamp-amber': { orb: '#FFD27A', tint: '255,210,120' },
        }[e.type];
        const lit = env.night01() > 0.2 || world.depthOfRow(e.tx, e.ty) > 4;
        // OVERHEAD TUBE: a horizontal bar mounted up high on a slim bracket,
        // throwing a downward cone of tinted light (v4.8)
        const topY = gy - 30;                       // tube height above the floor
        ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 7, topY - 3); ctx.lineTo(cx - 7, gy); ctx.stroke();   // bracket stand
        ctx.fillStyle = '#3A363F'; ctx.fillRect(cx - 9, topY - 5, 18, 4);                       // housing
        ctx.fillStyle = lit ? L.orb : '#2E2A34';                                                // the tube
        ctx.fillRect(cx - 8, topY - 2, 16, 2.4);
        if (lit) {
          // painted downward cone (world space) - the directional read
          const pulse = 0.85 + Math.sin(rtime * 2 + e.uid) * 0.15;
          const g = ctx.createLinearGradient(cx, topY, cx, gy + 8);
          g.addColorStop(0, `rgba(${L.tint},${(0.24 * pulse).toFixed(2)})`);
          g.addColorStop(1, `rgba(${L.tint},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(cx - 9, topY); ctx.lineTo(cx + 9, topY);
          ctx.lineTo(cx + 20, gy + 8); ctx.lineTo(cx - 20, gy + 8); ctx.closePath(); ctx.fill();
          // darkness-mask hole biased BELOW the tube (light pools on the floor)
          frameLights.push({ x: cx, y: gy - 8, r: 96, warmth: 1, tint: L.tint });
        }

      } else if (e.type === 'storage') {
        ctx.fillStyle = '#6E4F33';
        ctx.fillRect(cx - 12, gy - 14, 24, 14);
        ctx.strokeStyle = '#4A3421'; ctx.lineWidth = 1;
        ctx.strokeRect(cx - 12, gy - 14, 24, 14);
        ctx.beginPath(); ctx.moveTo(cx - 12, gy - 14); ctx.lineTo(cx + 12, gy); ctx.stroke();

      } else if (e.type === 'beacon') {
        const blink = Math.sin(rtime * 4) > 0.4;
        ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx, gy - 24); ctx.stroke();
        ctx.fillStyle = blink ? PALETTE.amber : '#7A5220';
        ctx.beginPath(); ctx.arc(cx, gy - 26, 3, 0, Math.PI * 2); ctx.fill();
        if (blink) frameLights.push({ x: cx, y: gy - 26, r: 40, warmth: 0.7 });

      } else if (e.type === 'incubator') {
        // a womb of glass and code: a lit tank on a plinth
        const bw = 2 * TILE;
        ctx.fillStyle = '#2E2A34'; ctx.fillRect(cx - bw / 2, gy - 6, bw, 6);           // plinth
        ctx.fillStyle = '#3A3E4A'; ctx.fillRect(cx - 12, gy - 30, 24, 24);             // frame
        const pulse = 0.6 + Math.sin(rtime * 2) * 0.4;
        const g = ctx.createLinearGradient(cx, gy - 30, cx, gy - 6);
        g.addColorStop(0, `rgba(150,220,170,${(0.5 * pulse).toFixed(2)})`);
        g.addColorStop(1, 'rgba(150,220,170,0.1)');
        ctx.fillStyle = g; ctx.fillRect(cx - 9, gy - 27, 18, 20);                       // glowing tank
        ctx.strokeStyle = '#6EA07A'; ctx.lineWidth = 1; ctx.strokeRect(cx - 9, gy - 27, 18, 20);
        // a curled embryo silhouette
        ctx.fillStyle = `rgba(230,255,238,${(0.4 + pulse * 0.3).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(cx, gy - 16, 4, 0, Math.PI * 2); ctx.fill();
        frameLights.push({ x: cx, y: gy - 16, r: 44, warmth: 0.6, tint: '150,220,170' });

      } else if (e.type === 'lure') {
        ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx, gy - 22); ctx.stroke();
        ctx.fillStyle = '#7FC4A8'; ctx.beginPath(); ctx.arc(cx, gy - 25, 3, 0, Math.PI * 2); ctx.fill();
        // pulsing call rings
        const ph = (rtime * 0.8) % 1;
        ctx.strokeStyle = `rgba(127,196,168,${(0.5 * (1 - ph)).toFixed(2)})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, gy - 25, 4 + ph * 14, 0, Math.PI * 2); ctx.stroke();

      } else if (e.type === 'planter') {
        const bw = 2 * TILE;
        ctx.fillStyle = '#6E4F33'; ctx.fillRect(cx - bw / 2 + 2, gy - 8, bw - 4, 8);
        ctx.strokeStyle = '#4A3421'; ctx.lineWidth = 1; ctx.strokeRect(cx - bw / 2 + 2, gy - 8, bw - 4, 8);
        // sprouting flora, swaying (a little garden)
        ctx.strokeStyle = '#5F9A54'; ctx.lineWidth = 1.4;
        for (let s = 0; s < 6; s++) {
          const sxp = cx - bw / 2 + 6 + s * 4, hh = 6 + ((s * 7) % 6), sway = Math.sin(rtime * 1.6 + s) * 2;
          ctx.beginPath(); ctx.moveTo(sxp, gy - 8); ctx.quadraticCurveTo(sxp + sway, gy - 8 - hh * 0.6, sxp + sway, gy - 8 - hh); ctx.stroke();
        }
        ctx.fillStyle = '#C98BA8'; ctx.fillRect(cx - 4, gy - 16, 2, 2); ctx.fillRect(cx + 5, gy - 15, 2, 2);

      } else if (e.type === 'terrarium') {
        const bw = 2 * TILE;
        ctx.fillStyle = 'rgba(150,220,170,0.14)'; ctx.fillRect(cx - bw / 2, gy - 30, bw, 30);
        ctx.strokeStyle = '#6EA07A'; ctx.lineWidth = 1.4; ctx.strokeRect(cx - bw / 2, gy - 30, bw, 30);
        ctx.fillStyle = '#4A3A2C'; ctx.fillRect(cx - bw / 2 + 2, gy - 8, bw - 4, 8);   // soil
        ctx.strokeStyle = '#5F9A54'; ctx.lineWidth = 1.2;                              // little plants
        for (const ox of [-8, 0, 9]) { ctx.beginPath(); ctx.moveTo(cx + ox, gy - 8); ctx.lineTo(cx + ox + Math.sin(rtime + ox) * 1.5, gy - 16); ctx.stroke(); }
        // a faint sheen on the glass
        ctx.strokeStyle = 'rgba(230,255,238,0.3)'; ctx.beginPath(); ctx.moveTo(cx - bw / 2 + 3, gy - 27); ctx.lineTo(cx - bw / 2 + 8, gy - 27); ctx.stroke();
      }
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
    // while a lock is charging the reticle rides the LOCKED anchor, not the
    // drifting cursor (you tapped it, you can look away); else it tracks the cursor
    const wx = scanning ? scanning.ax : cam.wx(mouse.x);
    const wy = scanning ? scanning.ay : cam.wy(mouse.y);
    const chg = scanning ? Math.min(1, scanning.t / SCAN_T) : 0;   // 0..1 charge
    const tgt = scanTarget;
    const has = !!tgt;
    ctx.strokeStyle = has ? '#4BE3E8' : 'rgba(75,227,232,0.4)';
    ctx.lineWidth = 1.6;
    const r = 12 - chg * 4;
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
      ctx.beginPath(); ctx.arc(wx, wy, 16, -Math.PI / 2, -Math.PI / 2 + chg * Math.PI * 2); ctx.stroke();
    } else if (has) {
      ctx.fillStyle = 'rgba(75,227,232,0.9)';
      ctx.beginPath(); ctx.arc(wx, wy, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    if (!tgt) return;

    // target brackets: pulse gently, tighten while the scan charges
    const pad = 3 - chg * 2;
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
      // "▸ 2/3" when more than one thing is stacked here - tap again to cycle
      const stack = scanning && scanning.cands.length > 1 ? `▸ ${scanning.idx + 1}/${scanning.cands.length}  ` : '';
      const label = stack + (canPick ? `${entry.name} · E - HARVEST` : isNew ? `${entry.name} · NEW` : entry.name);
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

  // thin amber outline on the exact tile the next laser pulse will cut - the
  // precision cue that makes hand-sculpted stairs possible
  function drawDigTarget(rtime) {
    if (build.active || pulley.active || stunT > 0 || player.tool !== 'laser') return;
    const aim = peekTarget(player, world, cam);
    if (!aim) return;
    ctx.strokeStyle = `rgba(224,162,74,${(0.55 + Math.sin(rtime * 8) * 0.2).toFixed(2)})`;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(aim.tx * TILE + 1, aim.ty * TILE + 1, TILE - 2, TILE - 2);
  }

  function drawBeam(rtime) {
    if (!player.beam) return;
    const lx = player.cx() + player.facing * 7, ly = player.y + BEAM_Y;
    const { x, y } = player.beam;
    const mkW = 1 + (player.laserMk - 1) * 0.5;           // beefier beam per tier
    const flicker = power.state() === 'low' && Math.sin(rtime * 30) > 0.3 ? 0.4 : 1;
    ctx.globalAlpha = flicker;
    ctx.strokeStyle = 'rgba(224,162,74,0.35)';
    ctx.lineWidth = 5 * mkW;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
    ctx.strokeStyle = '#FFF3D0';
    ctx.lineWidth = 1.6 * mkW;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.7)';
    ctx.beginPath(); ctx.arc(x, y, (3 + Math.sin(rtime * 40) * 1.5) * mkW, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---- scenery primitives (wind-driven sway) ----
  function tuft(px, baseY, sx, biome, rtime) {
    ctx.strokeStyle = biome.grass.tuft;
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
    const id = biome.scenery.tree;
    const sway = Math.sin(rtime * (1.1 + env.wind01() * 2) + sx) * (0.008 + env.wind01() * 0.03);
    // per-instance scale so a stand of trees has saplings AND giants, not a hedge
    const sc = 0.7 + hashCol(sx, 23) * 0.75;
    ctx.save();
    ctx.translate(px, baseY + 2);
    ctx.rotate(sway);
    ctx.scale(sc, sc);
    if (hasSprite('scenery', id)) drawSprite(ctx, 'scenery', id, 0, 0, 56, 72);
    else {
      ctx.fillStyle = PALETTE.wood;
      const h = 3 + Math.floor(hashCol(px, 3) * 3);
      ctx.fillRect(-2, -h * TILE - 2, 4, h * TILE);
      ctx.fillStyle = biome.grass.tuft;
      for (const [ox, oy, r] of [[0, -6, 13], [-9, 0, 10], [9, -1, 10], [0, 6, 9]]) { ctx.beginPath(); ctx.arc(ox, -h * TILE - 2 + oy, r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }
  function drawDressing(px, baseY, sx, biome) {
    const pool = biome?.scenery.dressings || ['bush', 'boulder', 'flowers'];
    const id = pool[Math.floor(hashCol(sx, 71) * pool.length) % pool.length];
    const sc = 0.6 + hashCol(sx, 29) * 0.7;   // varied dressing scale
    if (hasSprite('scenery', id)) { drawSprite(ctx, 'scenery', id, px, baseY + 2, 24 * sc, 20 * sc); return; }
    ctx.save(); ctx.translate(px, baseY); ctx.scale(sc, sc); ctx.translate(-px, -baseY);
    if (id === 'boulder') { ctx.fillStyle = '#9A93A0'; ctx.beginPath(); ctx.ellipse(px, baseY - 5, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (id === 'reeds') {   // wetland reeds: tall thin strokes with a cattail
      ctx.strokeStyle = biome.grass.deep; ctx.lineWidth = 1.4;
      for (let r2 = -1; r2 <= 1; r2++) { ctx.beginPath(); ctx.moveTo(px + r2 * 3, baseY); ctx.lineTo(px + r2 * 4, baseY - 12); ctx.stroke(); }
      ctx.fillStyle = '#8A6A45'; ctx.fillRect(px - 1, baseY - 13, 2.4, 4);
    } else if (id === 'shard') { // crystal barrens: a ground shard
      ctx.fillStyle = 'rgba(200,180,230,0.85)';
      ctx.beginPath(); ctx.moveTo(px - 4, baseY); ctx.lineTo(px, baseY - 11); ctx.lineTo(px + 4, baseY); ctx.closePath(); ctx.fill();
    } else { ctx.fillStyle = id === 'flowers' ? '#C98BA8' : (biome?.grass.deep ?? PALETTE.grassDeep); ctx.beginPath(); ctx.arc(px, baseY - 5, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  // --------------------------------------------------------------- HUD v3
  // All screen furniture lives in render/hud.js (four fixed regions, no
  // collisions). Only the world-space build ghost stays here.
  const hud = makeHud({
    ctx, player, world, power, status, inventory, satchel, collection,
    build, hazards, cam, toasts,
    state: () => ({
      time, bootT, stunT, home, findT,
      quest: quests.activeStep(),
      biome: biomeAtX(player.tx(), WORLD_W).name,
      context: interactContext(),
    }),
  });

  // the ONE line the visor's bottom bar speaks when something is in reach
  function interactContext() {
    if (build.active || collectionOpen || inventoryOpen || minigame || overlay) return null;
    if (player.tool === 'deconstruct') {
      if (!deconTarget) return 'DECONSTRUCTOR · click a built thing to reclaim its materials';
      const refund = Object.entries(deconTarget.spec?.cost || {}).map(([id, n]) => `${n} ${id}`).join(' + ');
      return `DECONSTRUCTOR · ${(deconTarget.spec?.name || 'structure').toUpperCase()} · click to reclaim ${refund}`;
    }
    const proc = entities.nearest(player, e2 => !!BUILDABLES_BY_ID[e2.type]?.accepts, 2.4 * TILE);
    if (proc) {
      const spec = BUILDABLES_BY_ID[proc.type];
      const NAME = spec.name.toUpperCase();
      const qn = proc.queue?.length || 0;
      const outs = Object.entries(proc.outBuffer || {}).filter(([, n]) => n > 0);
      const tray = outs.length ? outs.map(([id, n]) => `${n} ${id}`).join(' ') : 'empty';
      const stage = qn ? ['WASH', 'SHRED', 'EXTRACT'][proc.stage] : null;
      const feedN = inventory.garbage.filter(t2 => spec.accepts.includes(t2)).length;
      const batt = `pwr ${Math.round(((proc.battery || 0) / MACHINE_BATT_CAP) * 100)}%`;
      const plug = umbilical === proc.uid ? 'G unplug' : 'G plug rover in';
      if (proc.enabled === false) return `${NAME} · SWITCHED OFF · P on`;
      if ((proc.battery || 0) <= 0.01 && !proc.powered) return `${NAME} · ${batt} · dead - no sun/wind · ${plug}`;
      if (umbilical === proc.uid) return `${NAME} · ${batt} · feeding from rover · ${plug}`;
      if (feedN > 0) return `${NAME} · ${batt} · E load ${feedN} junk · tray ${tray}`;
      if (outs.length) return `${NAME} · ${batt} · ${stage ? stage + ' · ' : ''}E collect tray (${tray})`;
      return qn ? `${NAME} · ${batt} · ${stage} · queue ${qn}` : `${NAME} · ${batt} · feed me ${spec.accepts.map(a => GARBAGE_BY_ID[a]?.name.toLowerCase())[0]}s`;
    }
    const stEnt = entities.nearest(player, e2 => !!BUILDABLES_BY_ID[e2.type]?.station, 2.2 * TILE);
    if (stEnt) {
      const spec = STATIONS_BY_ID[BUILDABLES_BY_ID[stEnt.type].station];
      const frag = satchel.firstAtState(spec.input);
      return frag ? `${spec.name.toUpperCase()} · E ${spec.verb.toLowerCase()} ${frag.bone}` : `${spec.name.toUpperCase()} · needs a ${spec.input} bone`;
    }
    const podNear = entities.nearest(player, e2 => e2.type === 'pod', 2.6 * TILE);
    if (podNear) {
      const cost = laserUpgradeCost();
      if (cost && inventory.canAfford(cost)) return `POD · U upgrade laser mk${player.laserMk + 1} · E field lab`;
      const spec = STATIONS.find(s2 => satchel.firstAtState(s2.input));
      const owned = spec && entities.list.some(e2 => BUILDABLES_BY_ID[e2.type]?.station === spec.id);
      if (spec && !owned) return `FIELD LAB · E ${spec.verb.toLowerCase()} ${satchel.firstAtState(spec.input).bone}`;
      return 'POD · home sweet pod';
    }
    return null;
  }

  // which secondary key matters RIGHT NOW - the touch layer's contextual pill
  // borrows the context line's judgement (P power, G umbilical, U upgrade)
  function touchContext() {
    const proc = entities.nearest(player, e2 => !!BUILDABLES_BY_ID[e2.type]?.accepts, 2.4 * TILE);
    if (proc) {
      if (proc.enabled === false) return { code: 'KeyP', label: 'PWR' };
      if (umbilical === proc.uid) return { code: 'KeyG', label: 'UNPLUG' };
      if ((proc.battery || 0) <= 0.01 && !proc.powered) return { code: 'KeyG', label: 'PLUG' };
    }
    const podNear = entities.nearest(player, e2 => e2.type === 'pod', 2.6 * TILE);
    if (podNear) {
      const cost = laserUpgradeCost();
      if (cost && inventory.canAfford(cost)) return { code: 'KeyU', label: 'UPGRADE' };
    }
    return null;
  }

  // -- deconstruct mode: red brackets on the built thing under the cursor --------
  function drawDeconTarget(rtime) {
    if (!deconTarget) return;
    const [w, h] = deconTarget.kind === 'machine' ? entities.sizeOf(deconTarget.e) : [1, 1];
    const px = deconTarget.tx * TILE, py = (deconTarget.ty - (deconTarget.kind === 'machine' ? h - 1 : 0)) * TILE;
    const pulse = 0.55 + Math.sin(rtime * 6) * 0.25;
    ctx.strokeStyle = `rgba(232,91,74,${pulse.toFixed(2)})`;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(px + 0.5, py + 0.5, w * TILE - 1, h * TILE - 1);
    // corner pry-marks
    ctx.beginPath();
    for (const [cx2, cy2, sx2, sy2] of [[px, py, 1, 1], [px + w * TILE, py, -1, 1], [px, py + h * TILE, 1, -1], [px + w * TILE, py + h * TILE, -1, -1]]) {
      ctx.moveTo(cx2 + sx2 * 5, cy2); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2, cy2 + sy2 * 5);
    }
    ctx.stroke();
  }

  // -- build mode: world-space ghost --------------------------------------------
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

  function drawBanner() {
    const a = Math.min(1, banner.life) * Math.min(1, (3 - banner.life) * 3);
    ctx.globalAlpha = a;
    const str = formatAge(banner.stratum).toUpperCase();
    const tw = measure(ctx, str, 15, true);
    const by = VIEW_H - 22 - 56;   // flush above the visor's bottom bar
    blueprintPanel(ctx, VIEW_W / 2 - tw / 2 - 24, by, tw + 48, 38, { frameW: 5, r: 10, deep: true, grid: false });
    text(ctx, str, VIEW_W / 2, by + 19, { size: 15, bold: true, align: 'center', baseline: 'middle', color: PALETTE.cream });
    ctx.globalAlpha = 1;
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
      // size the plate to its content - no dead middle on short entries
      const entry = codexEntry(overlay.codexId);
      const statN = Math.min((entry.stats || []).length, overlay.live ? 4 : 6);
      const contentBottom = Math.max(60 + (overlay.live ? 58 : 0) + statN * 17, 124);   // vs the art inset
      const quoteLines = Math.max(1, Math.min(4, Math.ceil((entry.blurb?.length || 40) / 58)));
      const cw = 500, chh = Math.max(230, Math.min(410, contentBottom + 6 + quoteLines * 16 + 50));
      const cx = VIEW_W / 2 - cw / 2, cy = VIEW_H / 2 - chh / 2 + (1 - ease) * 40;
      ctx.globalAlpha = ease;
      drawCodexCard(ctx, entry, cx, cy, cw, chh, drawCodexArt, rtime,
        { live: overlay.live || null, openT: overlay.t });
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
  // THE FIELD JOURNAL - themed as the scanner's own readout (dark chrome + cyan,
  // matching the DG-3 cards). Scans first, fossils second, both scrollable.
  const DEX = { px: 60, py: 40, cols: 7, cellH: 68 };
  const JV = { chrome: '#241C16', deep: '#171210', cyan: '#4BE3E8', text: '#EFE6CE', dim: 'rgba(233,220,188,0.62)' };
  const GRID_TOP = DEX.py + 60;                       // first cell row
  let journalMaxScroll = 0;                           // set by draw, read by input
  function journalGridBottom() { return DEX.py + (VIEW_H - 80) - 18; }

  function collectionCellAt(mx, my) {
    const pw = VIEW_W - 120, cellW = (pw - 48) / DEX.cols;
    for (let i = 0; i < FOSSILS.length; i++) {
      const cx = DEX.px + 24 + (i % DEX.cols) * cellW, cy = GRID_TOP + Math.floor(i / DEX.cols) * DEX.cellH - journalScroll;
      if (cy < GRID_TOP - DEX.cellH || cy > journalGridBottom()) continue;
      if (mx >= cx && mx <= cx + cellW - 8 && my >= cy && my <= cy + DEX.cellH - 8) return FOSSILS[i];
    }
    return null;
  }
  // clickable tab headers (SCANS left, FOSSILS right)
  function journalTabAt(mx, my) {
    if (my < DEX.py + 12 || my > DEX.py + 34) return null;
    if (mx >= DEX.px + 150 && mx < DEX.px + 260) return 'codex';
    if (mx >= DEX.px + 266 && mx < DEX.px + 360) return 'fossils';
    return null;
  }
  function drawCollection() {
    ctx.fillStyle = 'rgba(8,10,14,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const pw = VIEW_W - 120, ph = VIEW_H - 80;
    // visor plate
    ctx.fillStyle = JV.chrome; roundRect(ctx, DEX.px, DEX.py, pw, ph, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(75,227,232,0.5)'; ctx.lineWidth = 2; roundRect(ctx, DEX.px, DEX.py, pw, ph, 12); ctx.stroke();
    ctx.fillStyle = JV.deep; roundRect(ctx, DEX.px, DEX.py, pw, 44, 12); ctx.fill();
    ctx.fillStyle = JV.cyan; ctx.fillRect(DEX.px + 8, DEX.py + 43, pw - 16, 1);
    text(ctx, 'DG-3 · FIELD JOURNAL', DEX.px + 24, DEX.py + 16, { size: 15, bold: true, color: JV.cyan });
    // tabs: SCANS then FOSSILS
    for (const [id, label, tx, tw] of [
      ['codex', `SCANS ${codex.size}/${CODEX.length}`, DEX.px + 150, 108],
      ['fossils', `FOSSILS ${collection.completedCount()}/${collection.total()}`, DEX.px + 266, 92],
    ]) {
      const on = journalTab === id;
      const accent = id === 'codex' ? JV.cyan : PALETTE.amber;
      ctx.fillStyle = on ? '#2E241C' : JV.deep;
      roundRect(ctx, tx, DEX.py + 12, tw, 22, 6); ctx.fill();
      if (on) { ctx.strokeStyle = accent; ctx.lineWidth = 1.4; roundRect(ctx, tx, DEX.py + 12, tw, 22, 6); ctx.stroke(); }
      text(ctx, label, tx + tw / 2, DEX.py + 17, { size: 10, bold: true, align: 'center', color: on ? accent : JV.dim });
    }
    // clip the scrolling grid to the plate body
    ctx.save();
    ctx.beginPath(); ctx.rect(DEX.px + 6, GRID_TOP - 4, pw - 12, ph - (GRID_TOP - DEX.py) - 6); ctx.clip();
    const bottom = journalGridBottom();
    if (journalTab === 'codex') journalMaxScroll = drawCodexGrid(pw, bottom);
    else journalMaxScroll = drawFossilGrid(pw, bottom);
    ctx.restore();
    // scrollbar
    if (journalMaxScroll > 0) {
      const trackY = GRID_TOP, trackH = bottom - GRID_TOP;
      const thumbH = Math.max(24, trackH * trackH / (trackH + journalMaxScroll));
      const thumbY = trackY + (trackH - thumbH) * (journalScroll / journalMaxScroll);
      ctx.fillStyle = 'rgba(233,220,188,0.10)'; roundRect(ctx, DEX.px + pw - 12, trackY, 4, trackH, 2); ctx.fill();
      ctx.fillStyle = 'rgba(75,227,232,0.6)'; roundRect(ctx, DEX.px + pw - 12, thumbY, 4, thumbH, 2); ctx.fill();
    }
    journalScroll = Math.min(journalScroll, journalMaxScroll);
  }

  /** @returns {number} max scroll offset */
  function drawFossilGrid(pw, bottom) {
    const cellW = (pw - 48) / DEX.cols;
    let maxRow = 0;
    FOSSILS.forEach((f, i) => {
      const row = Math.floor(i / DEX.cols); maxRow = row;
      const cx = DEX.px + 24 + (i % DEX.cols) * cellW, cy = GRID_TOP + row * DEX.cellH - journalScroll;
      if (cy < GRID_TOP - DEX.cellH || cy > bottom) return;
      const frac = collection.fraction(f.id), started = collection.started(f.id), done = frac >= 1;
      ctx.fillStyle = done ? 'rgba(108,154,84,0.16)' : started ? 'rgba(224,162,74,0.12)' : 'rgba(255,255,255,0.03)';
      roundRect(ctx, cx, cy, cellW - 8, DEX.cellH - 8, 8); ctx.fill();
      if (started) { ctx.lineWidth = 1.6; ctx.strokeStyle = done ? PALETTE.good : PALETTE.amber; roundRect(ctx, cx, cy, cellW - 8, DEX.cellH - 8, 8); ctx.stroke(); }
      ctx.save(); ctx.beginPath(); ctx.rect(cx, cy, cellW - 8, DEX.cellH - 20); ctx.clip();
      ctx.globalAlpha = done ? 1 : started ? 0.35 : 0.12;
      drawFossil(ctx, f, cx + (cellW - 8) / 2 - f.footprint[0] * 6, cy + 4, makeCanvas, 0.55);
      ctx.globalAlpha = 1; ctx.restore();
      if (done) text(ctx, f.name, cx + (cellW - 8) / 2, cy + DEX.cellH - 20, { size: 9, bold: true, align: 'center', color: JV.text });
      else {
        const n = collection.bonesNeeded(f.id);
        const px0 = cx + (cellW - 8) / 2 - (n * 6) / 2;
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = collection.hasBone(f.id, k) ? PALETTE.amber : 'rgba(255,255,255,0.14)';
          ctx.fillRect(px0 + k * 6, cy + DEX.cellH - 17, 4, 3);
        }
      }
      const gn = collection.genomeOf(f.id);
      if (gn > 0) drawDnaPip(cx + cellW - 20, cy + 4, gn, time);
    });
    const contentH = (maxRow + 1) * DEX.cellH;
    return Math.max(0, contentH - (bottom - GRID_TOP));
  }

  function drawCodexGrid(pw, bottom) {
    const cols = 4, cellW = (pw - 48) / cols, cellH = 58;
    let maxRow = 0;
    CODEX.forEach((e, i) => {
      const row = Math.floor(i / cols); maxRow = row;
      const cx = DEX.px + 24 + (i % cols) * cellW, cy = GRID_TOP + row * cellH - journalScroll;
      if (cy < GRID_TOP - cellH || cy > bottom) return;
      const known = codex.has(e.id);
      ctx.fillStyle = known ? 'rgba(75,227,232,0.10)' : 'rgba(255,255,255,0.03)';
      roundRect(ctx, cx, cy, cellW - 8, cellH - 8, 8); ctx.fill();
      if (known) { ctx.lineWidth = 1.6; ctx.strokeStyle = JV.cyan; roundRect(ctx, cx, cy, cellW - 8, cellH - 8, 8); ctx.stroke(); }
      if (known) drawCodexArt(ctx, e, cx + 8, cy + 10, 30, time);
      text(ctx, e.category, cx + 44, cy + 10, { size: 8, color: JV.dim });
      text(ctx, known ? e.name : '????????', cx + 44, cy + 22, { size: 11, bold: known, color: known ? JV.text : JV.dim });
    });
    const contentH = (maxRow + 1) * cellH;
    return Math.max(0, contentH - (bottom - GRID_TOP));
  }
  function codexCellAt(mx, my) {
    const pw = VIEW_W - 120, cols = 4, cellW = (pw - 48) / cols, cellH = 58;
    for (let i = 0; i < CODEX.length; i++) {
      const cx = DEX.px + 24 + (i % cols) * cellW, cy = GRID_TOP + Math.floor(i / cols) * cellH - journalScroll;
      if (cy < GRID_TOP - cellH || cy > journalGridBottom()) continue;
      if (mx >= cx && mx <= cx + cellW - 8 && my >= cy && my <= cy + cellH - 8) return CODEX[i];
    }
    return null;
  }

  const scene = { enter() {}, update, render, leave() { persist(); } };
  // the touch layer's per-frame contract (v5.0): which dialect to speak, where
  // the rover sits on screen (relative aim origin), and what the pill offers
  scene.touchMode = () => {
    if (minigame || overlay || collectionOpen || inventoryOpen) {
      return { mode: 'direct', chips: true, scroll: !!collectionOpen };
    }
    const ax = cam.sx(player.cx()), ay = cam.sy(player.cy());
    return {
      mode: 'game', chips: true,
      anchor: { x: ax, y: ay },
      idle: { x: cam.sx(player.cx() + player.facing * 28), y: ay - 16 },
      cursor: (build.active || player.tool === 'deconstruct') ? 'absolute' : 'relative',
      context: touchContext(),
    };
  };
  if (demoMode) {
    // the attract reel's puppet strings - demo only, never present in real play
    scene._rig = {
      player, cam, env, world, entities, ambient, inventory, collection, quests, codex,
      switchMode, spawnCol, tryResurrect, revived,
      skipBoot() { bootT = Infinity; },
      scanState() { return scanning ? { idx: scanning.idx, n: scanning.cands.length, id: scanning.cands[scanning.idx].id } : null; },
    };
  }
  return scene;
}

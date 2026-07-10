// Behavior + content-validation tests. `node tests/run.js`.
// Doubles as the contributor lint: a bad fossil/stratum/station fails here.

import { installStubs, makeAsserter } from './harness.js';

const { makeCanvas } = installStubs();

const { FOSSILS, FOSSILS_BY_ID, boneCount } = await import('../src/content/fossils.js');
const { STRATA, STRATA_BY_ID, stratumAtDepth, strataIndexAtDepth } = await import('../src/content/strata.js');
const { BIOMES, biomeAtX, envWeightAt } = await import('../src/content/biomes.js');
const { STATIONS, SPECIMEN_STATES } = await import('../src/content/stations.js');
const { makeWorld } = await import('../src/world/world.js');
const { makePlayer, updatePlayer } = await import('../src/game/player.js');
const { updateDigging } = await import('../src/game/digging.js');
const { makeSatchel, makeFragment } = await import('../src/game/fossils.js');
const { makeCollection } = await import('../src/game/collection.js');
const { makeEntities } = await import('../src/game/entities.js');
const { makePulley } = await import('../src/game/pulley.js');
const { makeMinigame } = await import('../src/game/minigames.js');
const { makeParticles } = await import('../src/render/particles.js');
const { keys, mouse, pointer, endFrame, attachInput } = await import('../src/core/input.js');
const { loadSave, writeSave } = await import('../src/core/save.js');
const cfg = await import('../src/config.js');

const t = makeAsserter();

// wire real input handlers to the stubbed event bus so pressed() works
const eventHandlers = {};
globalThis.addEventListener = (ev, fn) => { eventHandlers[ev] = fn; };
attachInput({ addEventListener: (ev, fn) => { eventHandlers['canvas:' + ev] = fn; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }) }, null);
const press = code => eventHandlers.keydown({ code, preventDefault: () => {}, repeat: false });
const release = code => eventHandlers.keyup({ code });
const clearKeys = () => { for (const k of Object.keys(keys)) delete keys[k]; endFrame(); };

// ===================================================================== content lint
console.log('\n[content] schema validation');
{
  const ids = new Set();
  let ok = { dup: true, period: true, env: true, rarity: true, foot: true, len: true, bones: true };
  const env = new Set(['marine', 'terrestrial', 'freshwater', 'any']);
  const rar = new Set(['common', 'uncommon', 'rare', 'legendary']);
  for (const f of FOSSILS) {
    if (ids.has(f.id)) ok.dup = false; ids.add(f.id);
    if (!STRATA_BY_ID[f.period]) ok.period = false;
    if (!env.has(f.environment)) ok.env = false;
    if (!rar.has(f.rarity)) ok.rarity = false;
    const [w, h] = f.footprint; if (!(w >= 1 && w <= 5 && h >= 1 && h <= 5)) ok.foot = false;
    if (!(typeof f.lengthM === 'number' && f.lengthM > 0)) ok.len = false;
    if (!(Array.isArray(f.bones) && f.bones.length >= 1 && f.bones.length <= 6 && f.bones.every(b => typeof b === 'string'))) ok.bones = false;
  }
  t.ok(ok.dup, 'fossil ids unique');
  t.ok(ok.period, 'every fossil.period exists in strata');
  t.ok(ok.env && ok.rarity && ok.foot, 'env/rarity/footprint valid');
  t.ok(ok.len, 'every fossil has positive lengthM');
  t.ok(ok.bones, 'every fossil has a 1..6 bones list of strings');
  t.ok(STRATA.every(s => Number.isInteger(s.hp) && s.hp >= 1), 'every stratum hp is an integer ≥ 1');
  t.ok(STRATA.every((s, i) => i === 0 || s.hp >= STRATA[i - 1].hp), 'hp never decreases with depth (deep rock is chewier)');
  t.ok(FOSSILS.length >= 30, `registry has ${FOSSILS.length} species`);
  t.ok(STRATA.every(s => FOSSILS.some(f => f.period === s.id)), 'every stratum has a fossil');
  // stations: 4 known minigames, contiguous pipeline
  const kinds = new Set(['prep', 'identify', 'stabilize', 'mount']);
  t.ok(STATIONS.every(s => kinds.has(s.minigame)), 'every station has a known minigame kind');
  let chain = true;
  STATIONS.forEach((s, i) => {
    if (SPECIMEN_STATES.indexOf(s.output) !== SPECIMEN_STATES.indexOf(s.input) + 1) chain = false;
    if (i > 0 && STATIONS[i - 1].output !== s.input) chain = false;
  });
  t.ok(chain, 'station pipeline walks SPECIMEN_STATES in order');
}

// ===================================================================== strata / biomes
console.log('\n[strata/biomes] lookups');
{
  t.eq(stratumAtDepth(5).id, 'anthropocene', 'depth 5 is anthropocene');
  t.eq(stratumAtDepth(20).id, 'quaternary', 'depth 20 is quaternary');
  t.eq(stratumAtDepth(100).id, 'cretaceous', 'depth 100 is cretaceous');
  let contig = true;
  for (let i = 1; i < STRATA.length; i++) if (STRATA[i].depth[0] !== STRATA[i - 1].depth[1]) contig = false;
  t.ok(contig, 'strata depths contiguous');
  t.eq(biomeAtX(1, cfg.WORLD_W).id, 'tundra', 'left edge tundra');
  t.eq(biomeAtX(cfg.WORLD_W - 1, cfg.WORLD_W).id, 'coast', 'right edge coast');
}

// ===================================================================== worldgen: pockets
console.log('\n[worldgen] bone pockets — legal, complete, camp-free');
{
  const w = makeWorld(12345);
  t.ok(w.pockets.length > 60, `world scattered ${w.pockets.length} bone pockets`);
  // legality: each pocket in the stratum matching its species
  let legal = true, camp = true;
  const spawn = w.spawnCol;
  for (const p of w.pockets) {
    const spec = FOSSILS_BY_ID[p.fossilId];
    if (spec.period !== stratumAtDepth(p.ty - w.surface[p.tx]).id) legal = false;
    if (p.tx >= spawn - cfg.CAMP_HALF_L && p.tx <= spawn + cfg.CAMP_HALF_R && (p.ty - w.surface[p.tx]) < cfg.CAMP_DEPTH) camp = false;
  }
  t.ok(legal, 'every pocket sits in its species stratum');
  t.ok(camp, 'no pocket spawns under the camp');
  // completability: every species has at least one full set of bone indices present
  const sets = {};
  for (const p of w.pockets) { (sets[p.fossilId] ||= new Set()).add(p.boneIndex); }
  const completable = FOSSILS.every(f => sets[f.id] && sets[f.id].size === f.bones.length);
  t.ok(completable, 'every species has at least a full bone set in the world');
  t.eq(makeWorld(12345).pockets.length, w.pockets.length, 'deterministic pocket count');
}

// ===================================================================== camp guard
console.log('\n[camp] no digging under homebase');
{
  const w = makeWorld(5);
  const spawn = w.spawnCol;
  t.ok(!w.diggable(spawn, w.surface[spawn] + 3), 'a rock tile under camp is not diggable');
  t.ok(w.inCampZone(spawn, w.surface[spawn] + 3), 'inCampZone true under camp');
  t.ok(!w.inCampZone(spawn + 40, w.surface[spawn + 40] + 3), 'inCampZone false far away');
}

// ===================================================================== dig → bone
console.log('\n[dig] laser digs a pocket → bone fragment (uncapped satchel)');
{
  const w = makeWorld(777);
  const pocket = w.pockets[0];
  const res = w.dig(pocket.tx, pocket.ty);
  t.ok(res && res.bone && res.bone.fossilId === pocket.fossilId, 'digging a pocket yields its bone');
  t.ok(!w.dig(pocket.tx, pocket.ty)?.bone, 'excavated pocket does not re-yield');
  // uncapped satchel
  const satchel = makeSatchel();
  for (let i = 0; i < 20; i++) satchel.add(makeFragment('trilobite', 'carapace', 0, 'cambrian'));
  t.eq(satchel.count(), 20, 'satchel is uncapped (held 20 fragments)');
}

// ===================================================================== minigames
console.log('\n[minigames] lore-accurate outcomes');
{
  const spec = FOSSILS_BY_ID['t-rex'];

  // prep: careful slow raster over the whole box succeeds (≤2px/frame = safe)
  clearKeys();
  const careful = makeMinigame('prep', spec, makeCanvas, { fragment: { uid: 1 } });
  mouse.left = true;
  const bx0 = 350, bx1 = 610, by0 = 165, by1 = 375, stepX = 2, stepY = 8;
  const wcols = Math.ceil((bx1 - bx0) / stepX);
  mouse.x = bx0; mouse.y = by0;
  for (let i = 0; i < 10000 && careful.status === 'active'; i++) {
    const row = Math.floor(i / wcols), col = i % wcols;
    mouse.x = row % 2 ? bx1 - col * stepX : bx0 + col * stepX;   // boustrophedon
    mouse.y = by0 + row * stepY;
    if (mouse.y > by1) mouse.y = by1;
    careful.update(1 / 60); endFrame();
  }
  mouse.left = false;
  t.eq(careful.status, 'success', 'prep succeeds with slow strokes');

  // prep: violent fast scrubbing over the bone fails (integrity → 0)
  clearKeys();
  const rough = makeMinigame('prep', spec, makeCanvas, { fragment: { uid: 2 } });
  mouse.left = true;
  for (let i = 0; i < 8000 && rough.status === 'active'; i++) {
    // whip back and forth THROUGH the fragile centre (huge speed), sweeping y
    mouse.x = (i % 2) ? 430 : 540;          // both inside the box, crossing centre 480
    mouse.y = 190 + (i % 150);              // roam the bone body
    rough.update(1 / 60); endFrame();
  }
  mouse.left = false;
  t.eq(rough.status, 'failed', 'prep FAILS when scrubbing the bone too fast');

  // identify: choosing the correct species (it's always an option) via clicks
  clearKeys();
  const decoys = FOSSILS.filter(f => f.period === spec.period && f.id !== spec.id).slice(0, 2);
  const idg = makeMinigame('identify', spec, makeCanvas, { fragment: { uid: 3 }, decoys });
  // cycle + confirm each option (correct → win; else 2 strikes → auto), then let `done` mature
  for (let i = 0; i < 12 && idg.status === 'active'; i++) { press('KeyD'); idg.update(1 / 60); endFrame(); release('KeyD'); press('KeyE'); idg.update(1 / 60); endFrame(); release('KeyE'); }
  for (let i = 0; i < 80 && idg.status === 'active'; i++) { idg.update(1 / 60); endFrame(); }
  t.eq(idg.status, 'success', 'identify resolves to success');

  // stabilize: hold to reach the zone then release
  clearKeys();
  const stab = makeMinigame('stabilize', spec, makeCanvas, {});
  // gauge rises 0.4/s while held; hold ~114 frames → ~0.76 (mid of [0.66,0.86]), then release
  for (let i = 0; i < 3000 && stab.status === 'active'; i++) {
    keys.KeyE = i < 114;
    stab.update(1 / 60); endFrame();
  }
  t.eq(stab.status, 'success', 'stabilize succeeds releasing inside the zone');

  // mount: cycle to the correct slot and confirm
  clearKeys();
  const mnt = makeMinigame('mount', spec, makeCanvas, { bones: spec.bones, boneIndex: 3, mountedSlots: new Set() });
  for (let i = 0; i < 20 && mnt.status === 'active'; i++) {
    // move selection toward index 3
    press('KeyD'); mnt.update(1 / 60); endFrame(); release('KeyD');
    press('KeyE'); mnt.update(1 / 60); endFrame(); release('KeyE');
  }
  t.eq(mnt.status, 'success', 'mount succeeds when the right slot is confirmed');

  // cancel is safe
  clearKeys();
  const c = makeMinigame('stabilize', spec, makeCanvas, {});
  press('Escape'); c.update(1 / 60); endFrame(); release('Escape');
  t.eq(c.status, 'cancelled', 'Esc cancels a minigame');
}

// ===================================================================== collection
console.log('\n[collection] per-species bone progress');
{
  const col = makeCollection();
  const bones = FOSSILS_BY_ID['t-rex'].bones;
  for (let i = 0; i < bones.length - 1; i++) t.ok(!col.mountBone('t-rex', i), `bone ${i} mounted, not complete yet`.slice(0, 40) === `bone ${i} mounted, not complete yet`.slice(0, 40));
  t.ok(!col.isComplete('t-rex'), 'not complete with a bone missing');
  const done = col.mountBone('t-rex', bones.length - 1);
  t.ok(done && col.isComplete('t-rex'), 'final bone completes the skeleton');
  t.eq(col.completedCount(), 1, 'one skeleton completed');
  // round-trip
  const round = makeCollection(col.export());
  t.ok(round.isComplete('t-rex'), 'collection survives export/import');
}

// ===================================================================== pulley (unchanged v2 contract)
console.log('\n[pulley] still extracts + pops');
{
  clearKeys();
  const w = makeWorld(64);
  const col = w.spawnCol + 30;   // outside camp so we can dig
  const p = makePlayer(col * cfg.TILE + 2, (w.surface[col] - 3) * cfg.TILE);
  const pulley = makePulley(); const particles = makeParticles(); const cam = { x: 0, y: 0 };
  const fx = { shake: () => {} };
  for (let i = 0; i < 60; i++) updatePlayer(p, w, 1 / 60);
  keys.KeyS = true;
  for (let i = 0; i < 700; i++) { updatePlayer(p, w, 1 / 60); updateDigging(p, w, cam, particles, fx, 1 / 60); }
  keys.KeyS = false;
  t.ok(pulley.tryAttach(p, w), 'winch deploys underground');
  let popped = false;
  for (let i = 0; i < 60 * 40 && !popped; i++) { if (pulley.updateReel(p, w, 1 / 60).popped) popped = true; }
  t.ok(popped, 'reeling pops the player out');
  t.ok(p.y < w.surface[col] * cfg.TILE, 'player ends above the surface');
}

// ===================================================================== save round-trip
console.log('\n[save] deltas + bone collection round-trip (v2 placedTiles)');
{
  const w = makeWorld(999);
  const spawn = w.spawnCol, col = spawn + 40;
  const surf = w.surface[col];
  w.dig(col, surf + 3);
  w.place(col + 2, surf - 2, cfg.T_ROOF);              // a built roof panel
  const deltas = w.exportDeltas();
  writeSave({ v: 2, seed: 999, dug: deltas.dug, placedTiles: deltas.placedTiles, collected: { 't-rex': [0, 1] }, settings: { volume: 0.5 } });
  const loaded = loadSave();
  t.ok(loaded && loaded.seed === 999, 'save reloads');
  const col2 = makeCollection(loaded.collected);
  t.eq(col2.bonesMounted('t-rex'), 2, 'mounted bones persisted');
  const w2 = makeWorld(999);
  w2.applyDeltas(loaded);
  t.eq(w2.tileAt(col, surf + 3), cfg.T_AIR, 'dug tile restored as AIR');
  t.eq(w2.tileAt(col + 2, surf - 2), cfg.T_ROOF, 'placed roof restored with its tile id');
}

console.log('\n[save] v1 saves reset but carry settings forward');
{
  const { clearSave } = await import('../src/core/save.js');
  clearSave();
  localStorage.setItem(cfg.SAVE_KEY_V1, JSON.stringify({ seed: 1, settings: { volume: 0.15, music: 0.9 } }));
  const migrated = loadSave();
  t.ok(migrated?.settingsOnly === true, 'v1 fallback is settings-only (no game state)');
  t.eq(migrated.settings.volume, 0.15, 'v1 settings carried over');
  localStorage.removeItem(cfg.SAVE_KEY_V1);
}

// ===================================================================== physics
console.log('\n[physics] fall, land, jump');
{
  clearKeys();
  const w = makeWorld(42);
  const col = (w.spawnCol + 40);
  const p = makePlayer(col * cfg.TILE, (w.surface[col] - 6) * cfg.TILE);
  for (let i = 0; i < 120; i++) updatePlayer(p, w, 1 / 60);
  t.ok(p.onGround, 'player settles on the ground');
  const groundY = p.y;
  keys.Space = true; p.bufferJump();
  for (let i = 0; i < 14; i++) updatePlayer(p, w, 1 / 60);
  keys.Space = false;
  t.ok(p.y < groundY - 30, 'jump clears two tiles');
}

// ===================================================================== v4: 1-tile-tall probe
console.log('\n[hitbox] probe is one tile tall: 1-tall tunnels + single-step hops');
{
  clearKeys();
  t.ok(cfg.PLAYER_H < cfg.TILE, 'PLAYER_H fits inside one tile row');
  const w = makeWorld(77);
  const col = w.spawnCol + 40;
  const row = w.surface[col] + 8;
  // hand-carve a 1-tall tunnel: floor at `row`, ceiling directly above the gap
  const isDiggable = (tx, ty) => w.diggable(tx, ty);
  for (let tx = col; tx < col + 8; tx++) {
    if (isDiggable(tx, row)) { while (w.dig(tx, row)?.broke === false) {} }
  }
  const p = makePlayer(col * cfg.TILE + 2, (row + 1) * cfg.TILE - cfg.PLAYER_H);
  keys.KeyD = true;
  let maxX = p.x;
  for (let i = 0; i < 60 * 4; i++) { updatePlayer(p, w, 1 / 60); maxX = Math.max(maxX, p.x); }
  keys.KeyD = false;
  t.ok(maxX > (col + 5) * cfg.TILE, `probe drives through a 1-tall tunnel (reached ${Math.round(maxX / cfg.TILE - col)} tiles in)`);

  // single-step hop: build a flat runway with a 1-tile step up halfway along
  clearKeys();
  const w2 = makeWorld(78);
  const c2 = w2.spawnCol + 40;
  const surf = w2.surface[c2];                       // first solid row at the start column
  for (let o = 0; o <= 6; o++) if (w2.tileAt(c2 + o, surf) === cfg.T_AIR) w2.place(c2 + o, surf);   // flat floor
  for (let o = 2; o <= 6; o++) w2.place(c2 + o, surf - 1);                                          // 1-tile step
  const p2 = makePlayer(c2 * cfg.TILE + 2, surf * cfg.TILE - cfg.PLAYER_H);
  for (let i = 0; i < 30; i++) updatePlayer(p2, w2, 1 / 60);
  keys.KeyD = true; keys.Space = true; p2.bufferJump();
  const stepTopY = (surf - 1) * cfg.TILE - cfg.PLAYER_H;
  let hopped = false;
  for (let i = 0; i < 60; i++) {
    updatePlayer(p2, w2, 1 / 60);
    if (p2.onGround && p2.x > (c2 + 2) * cfg.TILE - 4 && p2.y <= stepTopY + 0.01) hopped = true;
  }
  clearKeys();
  t.ok(hopped, 'one buffered jump hops a single-tile step');
}

// ===================================================================== v3.4: real depth scale
console.log('\n[depth] real-Earth scale mapping');
{
  const { realDepthAt, formatDepth, formatAge } = await import('../src/content/strata.js');
  t.ok(STRATA.every(x => Array.isArray(x.realDepth) && x.realDepth[1] > x.realDepth[0]), 'every stratum has a realDepth range');
  let mono = true;
  for (let i = 1; i < STRATA.length; i++) if (STRATA[i].realDepth[0] !== STRATA[i - 1].realDepth[1]) mono = false;
  t.ok(mono, 'realDepth ranges are contiguous (monotonic column)');
  t.ok(realDepthAt(1) < 5, 'shallow tiles read as a few metres');
  t.ok(realDepthAt(440) > 5000, 'precambrian tiles read in kilometres');
  t.eq(formatDepth(214), '214 m', 'metres format');
  t.eq(formatDepth(5750), '5.8 km', 'km format');
  t.ok(formatAge(STRATA[4]).includes('million years'), 'age phrased as million years');
}

// ===================================================================== v3.4: discovery gating
console.log('\n[gating] species revealed only on completion');
{
  const col = makeCollection();
  const spec = FOSSILS_BY_ID['pigeon'];   // 3 bones
  // mounting all but one bone: not complete (identify alone NEVER completes)
  for (let i = 0; i < spec.bones.length - 1; i++) col.mountBone('pigeon', i);
  t.ok(!col.isComplete('pigeon'), 'pigeon stays undiscovered with a bone missing');
  const nowComplete = col.mountBone('pigeon', spec.bones.length - 1);
  t.ok(nowComplete, 'final mounted bone completes (triggers the one reveal)');
}

// ===================================================================== v3.4: lighting occlusion
console.log('\n[lighting] cone rays stop at walls');
{
  const { makeLighting } = await import('../src/render/lighting.js');
  const lighting = makeLighting(makeCanvas);
  // a fake world: solid wall at tx >= 10
  const wallWorld = { solidAt: (tx, ty) => tx >= 10 };
  const ox = 5 * cfg.TILE, oy = 5 * cfg.TILE;
  const poly = lighting.castCone(wallWorld, ox, oy, 1);
  t.ok(poly.length > 20, 'cone polygon has ray points');
  const maxX = Math.max(...poly.map(p => p.x));
  t.ok(maxX < 11 * cfg.TILE, `rays stop at the wall (max x ${Math.round(maxX / cfg.TILE)} tiles)`);
  // open world: rays reach full range
  const openWorld = { solidAt: () => false };
  const poly2 = lighting.castCone(openWorld, ox, oy, 1);
  const maxX2 = Math.max(...poly2.map(p => p.x));
  t.ok(maxX2 > maxX + cfg.TILE * 2, 'rays reach further with no wall');
}

// ===================================================================== v3.4: ambient bounded
console.log('\n[ambient] life system stays bounded');
{
  const { makeAmbient } = await import('../src/game/ambient.js');
  const w = makeWorld(11);
  const col2 = w.spawnCol + 40;
  const p = makePlayer(col2 * cfg.TILE, (w.surface[col2] + 30) * cfg.TILE);
  const camStub = { bounds: () => ({ x0: col2 - 20, x1: col2 + 20, y0: w.surface[col2], y1: w.surface[col2] + 40 }), x: 0, y: 0 };
  const amb = makeAmbient();
  const fakePoly = [{ x: p.cx(), y: p.cy() }, { x: p.cx() + 100, y: p.cy() }, { x: p.cx() + 100, y: p.cy() + 50 }];
  for (let i = 0; i < 2000; i++) {
    amb.update(1 / 60, w, p, camStub, 30, fakePoly);
    if (i % 60 === 0) amb.onDig(p.cx(), p.cy() + 40);
  }
  const c = amb.counts();
  const total = Object.values(c).reduce((a, b2) => a + b2, 0);
  t.ok(total < 150, `ambient population bounded (${total} entities after 2k frames)`);
}

// ===================================================================== v3.5: environment
console.log('\n[environment] day cycle + weather');
{
  const { makeEnvironment, DAY_LENGTH } = await import('../src/game/environment.js');
  const env = makeEnvironment(0);
  env._setClock(DAY_LENGTH * 0.35);
  t.eq(env.night01(), 0, 'noon is full day');
  env._setClock(DAY_LENGTH * 0.8);
  t.eq(env.night01(), 1, 'deep night is full dark');
  env._setClock(DAY_LENGTH * 0.675);
  t.ok(env.night01() > 0 && env.night01() < 1, 'dusk is a smooth ramp');
  // weather forcing + intensity bounds over simulated time
  const env2 = makeEnvironment(0);
  let ok = true;
  for (let i = 0; i < 60 * 600; i++) {   // 10 sim-minutes
    env2.update(1 / 60);
    const p2 = env2.precip01();
    if (p2 < 0 || p2 > 1 || env2.wind01() < 0 || env2.wind01() > 1) { ok = false; break; }
  }
  t.ok(ok, 'precip + wind stay in 0..1 across 10 minutes of weather');
  env2._force('storm');
  t.ok(env2.precip01() === 1, 'forced storm has full intensity');
  // sky colours must be FINITE rgb across the whole day × every weather (NaN-gradient guard)
  const parse = str => { const m = /^rgb\((-?\d+),(-?\d+),(-?\d+)\)$/.exec(str); return m && [+m[1], +m[2], +m[3]].every(Number.isFinite) && +m[1] >= 0 && +m[1] <= 255; };
  let skyOk = true;
  for (const wx of ['clear', 'overcast', 'rain', 'storm']) {
    const e3 = makeEnvironment(0); e3._force(wx);
    for (let k = 0; k <= 40; k++) {
      e3._setClock(DAY_LENGTH * (k / 40));
      const sc = e3.skyColors();
      if (!parse(sc.top) || !parse(sc.bot)) { skyOk = false; break; }
    }
  }
  t.ok(skyOk, 'skyColors are finite rgb(0-255) across the whole day x all weathers');
}

// ===================================================================== v3.5: genome
console.log('\n[genome] duplicates build toward resurrection');
{
  const col = makeCollection();
  FOSSILS_BY_ID['ammonite'].bones.forEach((_, i) => col.mountBone('ammonite', i));
  t.ok(col.isComplete('ammonite'), 'ammonite completed');
  t.ok(!col.isViable('ammonite'), 'not viable at 0% genome');
  let g = 0;
  for (let i = 0; i < 6; i++) g = col.addGenome('ammonite');
  t.ok(g >= 1, 'six duplicate samples reach 100% genome');
  t.ok(col.isViable('ammonite'), 'complete + 100% genome = viable');
  // round-trip
  const col2 = makeCollection(col.export(), col.exportGenome());
  t.ok(col2.isViable('ammonite'), 'genome survives save round-trip');
}

// ===================================================================== v3.5: lighting aim
console.log('\n[lighting] cone follows an arbitrary aim angle');
{
  const { makeLighting } = await import('../src/render/lighting.js');
  const lighting = makeLighting(makeCanvas);
  const open = { solidAt: () => false };
  const up = lighting.castCone(open, 100, 100, -Math.PI / 2);
  const minY = Math.min(...up.map(p => p.y));
  t.ok(minY < 100 - cfg.TILE * 6, 'aiming up sends rays upward');
  const down = lighting.castCone(open, 100, 100, Math.PI / 2);
  const maxY = Math.max(...down.map(p => p.y));
  t.ok(maxY > 100 + cfg.TILE * 6, 'aiming down sends rays downward');
}

// ===================================================================== v3.5: creature bounds
console.log('\n[fauna] population stays bounded');
{
  const { makeAmbient } = await import('../src/game/ambient.js');
  const w = makeWorld(11);
  const col3 = w.spawnCol + 40;
  const p = makePlayer(col3 * cfg.TILE, (w.surface[col3] - 3) * cfg.TILE);
  const camStub = { bounds: () => ({ x0: col3 - 20, x1: col3 + 20, y0: w.surface[col3] - 10, y1: w.surface[col3] + 30 }), x: col3 * cfg.TILE - 400, y: 0 };
  const amb = makeAmbient();
  for (let i = 0; i < 3000; i++) amb.update(1 / 60, w, p, camStub, 1, null);
  const c = amb.counts();
  t.ok(c.fauna <= 5, `surface fauna bounded (${c.fauna})`);
  const total = Object.values(c).reduce((a, b2) => a + b2, 0);
  t.ok(total < 160, `total ambient population bounded (${total})`);
}

// ===================================================================== v3.5: decoy similarity
console.log('\n[decoys] compare candidates are size-plausible');
{
  const { pickDecoys } = await import('../src/game/fossils.js');
  let allPlausible = true, worst = 0;
  for (const f of FOSSILS) {
    for (const d of pickDecoys(f, 7)) {
      const ratio = Math.abs(Math.log((d.lengthM + 0.01) / (f.lengthM + 0.01)));
      worst = Math.max(worst, ratio);
      if (ratio > 3.6) allPlausible = false;   // < ~36x size difference max
    }
  }
  t.ok(allPlausible, `every decoy within plausible size range (worst log-ratio ${worst.toFixed(2)})`);
}

// ===================================================================== v3.6: bones-as-bones
console.log('\n[bones] every bone maps to a real glyph + decoys share category');
{
  const { boneCategory, boneFootprint } = await import('../src/render/bones.js');
  const { pickBoneDecoys } = await import('../src/game/fossils.js');
  let allMapped = true;
  for (const f of FOSSILS) for (const b of f.bones) {
    const fp = boneFootprint(b);
    if (!Array.isArray(fp) || fp[0] <= 0) allMapped = false;
  }
  t.ok(allMapped, 'every bone name resolves to a drawable footprint');
  // same-category decoys: for a spined species, decoys should also have that category (when available)
  const spined = FOSSILS_BY_ID['t-rex'];
  const decoys = pickBoneDecoys(spined, 'spine', 3);
  t.ok(decoys.length === 2 && decoys.every(d => d.id !== 't-rex'), 'two distinct decoys returned');
  const cat = boneCategory('spine');
  const sameCat = decoys.filter(d => d.bones.some(b => boneCategory(b) === cat)).length;
  t.ok(sameCat >= 1, 'decoys tend to share the bone category');
}

// ===================================================================== v3.6: codex + scan
console.log('\n[codex] entries cover creatures + strata; scan resolves tiles');
{
  const { CODEX, CODEX_BY_ID } = await import('../src/content/codex.js');
  for (const kind of ['grazer', 'hopper', 'lizard', 'salamander', 'spider', 'glowworm', 'firefly', 'butterfly', 'bird', 'bat']) {
    t.ok(!!CODEX_BY_ID[kind], `codex has creature: ${kind}`);
  }
  t.ok(STRATA.every(x => CODEX_BY_ID[`rock-${x.id}`]), 'codex has a rock sample per stratum');
  t.ok(CODEX_BY_ID.water && CODEX_BY_ID.lava, 'codex has water + lava');
  const { scanTargetAt } = await import('../src/game/scan.js');
  const w = makeWorld(3);
  // a solid rock tile deep under an off-camp column resolves to its stratum rock
  const col = w.spawnCol + 50, ty = w.surface[col] + 100;
  // ensure it's rock
  if (w.tileAt(col, ty) === cfg.T_ROCK) {
    t.eq(scanTargetAt((col + 0.5) * cfg.TILE, (ty + 0.5) * cfg.TILE, w, []), `rock-${w.stratumAt(col, ty).id}`, 'scanning rock yields its stratum sample');
  } else { t.ok(true, 'scan rock case skipped (tile was a cave)'); }
}

// ===================================================================== v4: scan ground truth
console.log('\n[features] scan names ONLY what the render draws (shared ground truth)');
{
  const { caveFeaturesAt } = await import('../src/game/features.js');
  const { resolveScan, scanTargetAt } = await import('../src/game/scan.js');
  const w = makeWorld(5);
  const featureIds = new Set(['roots', 'stalactite', 'stalagmite', 'mushroom', 'crystal']);
  let checked = 0, mismatches = 0, phantomCrystal = 0, found = { mushroom: 0, stalactite: 0 };
  for (let ty = 0; ty < w.WORLD_H - 4 && checked < 40000; ty++) {
    for (let tx = 0; tx < w.WORLD_W; tx++) {
      if (w.tileAt(tx, ty) !== cfg.T_AIR || w.depthOfRow(tx, ty) < 3) continue;
      checked++;
      const f = caveFeaturesAt(w, tx, ty);
      // scan the tile centre-bottom (floor half) and centre-top (ceiling half)
      for (const [frac, side] of [[0.85, 'floor'], [0.15, 'ceiling']]) {
        const r = resolveScan((tx + 0.5) * cfg.TILE, (ty + frac) * cfg.TILE, w, []);
        if (r?.kind !== 'feature') {
          if (f && f[side] && !f[side === 'floor' ? 'ceiling' : 'floor']) mismatches++;   // render draws, scan missed
          continue;
        }
        if (!f || (r.id !== f.floor && r.id !== f.ceiling)) mismatches++;                 // scan names, render doesn't draw
        if (!featureIds.has(r.id)) mismatches++;
        if (r.id === 'crystal' && f?.si === 7 && biomeAtX(tx, w.WORLD_W).id !== 'crystal') phantomCrystal++;   // crystal-barrens crystals grow shallow by design
        if (found[r.id] !== undefined) found[r.id]++;
      }
    }
  }
  t.ok(checked > 500, `checked ${checked} cave air tiles`);
  t.eq(mismatches, 0, 'scan and render agree on every feature tile');
  t.eq(phantomCrystal, 0, 'no phantom crystals in the devonian (si 7)');
  t.ok(found.mushroom > 0 && found.stalactite > 0, `features exist to scan (${found.mushroom} mushrooms, ${found.stalactite} stalactites)`);
}

console.log('\n[fauna] registry is well-formed and covers the codex');
{
  const { FAUNA, FAUNA_BY_ID, eligibleFauna } = await import('../src/content/fauna.js');
  const { FAUNA_ART } = await import('../src/render/fauna.js');
  const { CODEX_BY_ID } = await import('../src/content/codex.js');
  t.eq(new Set(FAUNA.map(f => f.id)).size, FAUNA.length, 'fauna ids are unique');
  t.ok(FAUNA.every(f => CODEX_BY_ID[f.id]), 'every fauna id has a codex entry');
  t.ok(FAUNA.every(f => f.zone === 'surface' || f.zone === 'cave'), 'zones valid');
  t.ok(FAUNA.every(f => f.speed.walk > 0 && f.speed.flee > 0), 'speeds positive');
  t.ok(FAUNA.every(f => Array.isArray(f.size) && f.size[0] > 0), 'sizes present');
  t.ok(FAUNA.filter(f => f.capturable).every(f => Array.isArray(f.diet) && f.diet.length), 'capturables declare a diet');
  t.ok(!!FAUNA_ART.generic, 'generic art fallback exists');
  // behavior parity with the old hardcoded gates (in the tundra, where the
  // seven-biome newcomers are all weighted out)
  const ids = ctx => eligibleFauna('surface', { biomeId: 'tundra', ...ctx }).map(o => o.item.id).sort().join(',');
  t.eq(ids({ isDay: true, weather: 'clear', depth: 0 }), 'grazer,lizard', 'clear day: grazer + lizard');
  t.eq(ids({ isDay: true, weather: 'rain', depth: 0 }), 'grazer,hopper', 'rainy day: grazer + hopper');
  t.eq(ids({ isDay: false, weather: 'rain', depth: 0 }), 'hopper', 'rainy night: hopper only');
  t.eq(ids({ isDay: false, weather: 'clear', depth: 0 }), '', 'clear night: nobody out');
  const cave = eligibleFauna('cave', { isDay: true, weather: 'clear', depth: 50, biomeId: 'tundra' }).map(o => o.item.id).sort().join(',');
  t.eq(cave, 'salamander,spider', 'shallow-deep cave: salamander + spider');
  // biome gating works: the wetland fields waders, the ash flats only crabs move
  const wet = eligibleFauna('surface', { isDay: true, weather: 'clear', depth: 0, biomeId: 'wetland' }).map(o => o.item.id);
  t.ok(wet.includes('wader'), 'wetland fields the stilt wader');
  const ash = eligibleFauna('surface', { isDay: true, weather: 'clear', depth: 0, biomeId: 'ashflats' }).map(o => o.item.id);
  t.ok(ash.includes('cindercrab') && !ash.includes('wader'), 'ash flats: cinder crabs, no waders');
  t.ok(FAUNA_BY_ID.hopper.rarity === 2, 'hopper keeps its double rain weight');
}

console.log('\n[harvest] picking a mushroom updates inventory, save, and the feature is gone');
{
  const { caveFeaturesAt } = await import('../src/game/features.js');
  const { makeInventory } = await import('../src/game/inventory.js');
  const w = makeWorld(5);
  // find a mushroom tile
  let spot = null;
  for (let ty = 0; ty < w.WORLD_H - 4 && !spot; ty++)
    for (let tx = 0; tx < w.WORLD_W && !spot; tx++) {
      const f = caveFeaturesAt(w, tx, ty);
      if (f?.floor === 'mushroom') spot = { tx, ty };
    }
  t.ok(!!spot, 'found a glow mushroom in the seeded world');
  const inv = makeInventory();
  t.ok(w.harvest(spot.tx, spot.ty), 'harvest marks the tile');
  inv.add('mushroom');
  t.eq(inv.count('mushroom'), 1, 'inventory counts the pick');
  t.eq(caveFeaturesAt(w, spot.tx, spot.ty)?.floor ?? null, null, 'harvested feature no longer reported (render + scan agree it is gone)');
  t.ok(!w.harvest(spot.tx, spot.ty), 'double-harvest refused');
  // round-trip through deltas
  const w2 = makeWorld(5);
  w2.applyDeltas(w.exportDeltas());
  t.eq(caveFeaturesAt(w2, spot.tx, spot.ty)?.floor ?? null, null, 'harvest persists through save deltas');
  // inventory export/import
  const inv2 = makeInventory(inv.export());
  t.eq(inv2.count('mushroom'), 1, 'materials persist');
  t.ok(inv2.pay({ mushroom: 1 }) && inv2.count('mushroom') === 0 && !inv2.pay({ mushroom: 1 }), 'pay() spends and refuses overdraft');
}

// ===================================================================== v3.6: fluids
console.log('\n[fluids] world seeds pools + flow conserves volume');
{
  const w = makeWorld(999);
  let water = 0, lava = 0;
  for (const tt of w.tiles) { if (tt === cfg.T_WATER) water++; if (tt === cfg.T_LAVA) lava++; }
  t.ok(water > 0, `world seeded water (${water} tiles)`);
  // flow conservation: dig air below a water column, step, count stays equal
  let idx = -1; for (let i = 0; i < w.tiles.length; i++) if (w.tiles[i] === cfg.T_WATER) { idx = i; break; }
  const W = cfg.WORLD_W, tx = idx % W, ty = (idx / W) | 0;
  const before = w.tiles.reduce((n, tt) => n + (tt === cfg.T_WATER ? 1 : 0), 0);
  // clear a big air column below by digging rock (if any)
  for (let k = 0; k < 6; k++) w.dig(tx, ty + 2 + k);
  const bounds = { x0: tx - 40, x1: tx + 40, y0: ty - 40, y1: ty + 40 };
  for (let k = 0; k < 300; k++) w.stepFluids(bounds, 1 / 60);
  const after = w.tiles.reduce((n, tt) => n + (tt === cfg.T_WATER ? 1 : 0), 0);
  t.ok(after === before, `water volume conserved through flow (${before} → ${after})`);
  // fluids are non-solid
  t.ok(!w.solidAt(tx, ty), 'fluid tiles are not solid (rover falls in)');
}

// ===================================================================== sound credits
console.log('\n[sound] Freesound assets are attributed');
{
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.join(process.cwd(), 'assets/sounds');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'credits.json'), 'utf8'));
  const needs = ['rain-loop', 'wind-loop', 'crickets-night', 'forest-day', 'cave-ambience', 'water-stream', 'lava-bubbling'];  // ambient beds only; SFX stay synth
  t.ok(needs.every(n => manifest[n]), 'every ambient sound has a manifest entry');
  let ok = true;
  for (const n of needs) {
    const m = manifest[n];
    if (!(m && m.author && m.title && /CC0|CC-BY/.test(m.licence) && m.url)) ok = false;
    if (!fs.existsSync(path.join(dir, n + '.mp3'))) ok = false;
  }
  t.ok(ok, 'each sound file exists with author + title + CC licence + url');
  t.ok(fs.existsSync(path.join(process.cwd(), 'CREDITS.md')), 'CREDITS.md was generated');
  // audio module exports the new sample-driven setters
  const audio = await import('../src/core/audio.js');
  t.ok(['loadSamples', 'setCaveLevel', 'setWaterLevel', 'setLavaLevel'].every(k => typeof audio[k] === 'function'), 'audio exports sample loaders + fluid loops');
}

// ===================================================================== v4: quests
console.log('\n[quests] boot calibration verifies every control, then completes');
{
  const { makeQuests } = await import('../src/game/quests.js');
  const q = makeQuests(null);
  const ctx = { player: { beam: null, tool: 'laser' }, pulley: { active: false }, codex: new Set(), env: { precip01: () => 0 }, power: { frac: () => 1 }, builtCount: () => 0, exposedNow: false };
  clearKeys(); pointer.moved = true;   // a device with a mouse
  t.ok(q.isActive('boot'), 'boot quest auto-activates on a fresh game');
  keys.KeyA = true; q.update(1 / 60, ctx);
  keys.KeyD = true; q.update(1 / 60, ctx); clearKeys();          // drive
  keys.Space = true; q.update(1 / 60, ctx); clearKeys();         // hop
  ctx.player.beam = { x: 0, y: 0 }; q.update(1 / 60, ctx); ctx.player.beam = null;   // dig
  ctx.player.tool = 'scan'; q.update(1 / 60, ctx);               // switch
  t.ok(q.isActive('boot'), 'still active with scan + winch outstanding');
  ctx.codex.add('rock-jurassic'); q.update(1 / 60, ctx);         // scan
  ctx.pulley.active = true; q.update(1 / 60, ctx);               // winch
  t.ok(q.isDone('boot'), 'boot completes after all six controls are performed');
}

console.log('\n[quests] triggers: events activate quests; steps poll to done');
{
  const { makeQuests } = await import('../src/game/quests.js');
  const q = makeQuests(null);
  let built = 0, precip = 0, exposed = true;
  const ctx = { player: { beam: null, tool: 'laser' }, pulley: { active: false }, codex: new Set(), env: { precip01: () => precip }, power: { frac: () => 0.1 }, builtCount: () => built, exposedNow: exposed };
  clearKeys(); pointer.moved = false;
  t.ok(!q.isActive('shelter'), 'shelter quest locked before the rain telegraph');
  q.emit('rain-soon');
  q.update(1 / 60, ctx);
  t.ok(q.isActive('shelter'), 'rain-soon activates the shelter quest');
  built = 4; q.update(1 / 60, ctx);                       // step 1: 4 roof panels
  precip = 0.6; exposed = false; ctx.exposedNow = false;
  q.update(1 / 60, ctx);                                  // step 2: stay dry through rain
  t.ok(q.isDone('shelter'), 'shelter completes: roofed up + stayed dry through rain');
  // power-nap via event
  q.emit('power-low');
  q.update(1 / 60, ctx);
  t.ok(q.isActive('power-nap'), 'power-low event activates the recharge quest');
  ctx.power = { frac: () => 0.7 };
  q.update(1 / 60, ctx);
  t.ok(q.isDone('power-nap'), 'recharging past 60% completes it');
  // save round-trip
  const q2 = makeQuests(q.export());
  t.ok(q2.isDone('shelter') && q2.isDone('power-nap'), 'quest states survive save round-trip');
}

console.log('\n[power] spend, solar recharge, low event, reserve floor');
{
  const { makePower } = await import('../src/game/power.js');
  const p = makePower(null);
  t.ok(Math.abs(p.frac() - 0.6) < 0.001, 'awakens at 60% charge');
  t.ok(p.spend(10), 'spend works when charged');
  let lowFired = 0;
  p._set(cfg.POWER_CAP * 0.25);
  for (let i = 0; i < 60; i++) { p.spend(0.2); p.update(1 / 60, { sun01: 0 }, () => lowFired++); }
  t.eq(lowFired, 1, 'low-power event fires exactly once on entering the band');
  p._set(cfg.POWER_CAP * 0.03);
  t.ok(!p.spend(1), 'reserve refuses to spend (tools offline)');
  t.ok(p.charge >= cfg.POWER_CAP * 0.02 - 0.001, 'charge floors at 2% - never a hard death');
  for (let i = 0; i < 60 * 30; i++) p.update(1 / 60, { sun01: 1 });
  t.ok(p.frac() > 0.5, 'sunbathing recharges the battery');
}

console.log('\n[status] rain soaks, shelter dries, speed slows, soak fires once');
{
  const { makeStatus } = await import('../src/game/status.js');
  const s = makeStatus(null);
  let soaks = 0;
  t.eq(s.tier(), 'dry', 'starts dry');
  for (let i = 0; i < 60 * 14; i++) s.update(1 / 60, { exposed01: 1, dry01: 0, onSoaked: () => soaks++ });
  t.eq(s.tier(), 'soaked', 'a storm soaks the chassis in ~12s');
  t.eq(soaks, 1, 'onSoaked fires exactly once');
  t.ok(s.speedMul() < 0.7, `soaked probe is slow (x${s.speedMul().toFixed(2)})`);
  for (let i = 0; i < 60 * 20; i++) s.update(1 / 60, { exposed01: 0, dry01: 1, onSoaked: () => soaks++ });
  t.eq(s.tier(), 'dry', 'sun dries it back out');
  t.eq(s.speedMul(), 1, 'dry probe at full speed');
}

console.log('\n[entities+build] pod exists; roof placement pays, shelters, refunds');
{
  const { makeInventory } = await import('../src/game/inventory.js');
  const { BUILDABLES_BY_ID } = await import('../src/content/buildables.js');
  const w = makeWorld(31);
  const ents = makeEntities(null, { podTx: w.spawnCol - 1, podTy: w.surface[w.spawnCol] });
  t.ok(ents.pod && ents.pod.uid === 1, 'crash pod is entity #1');
  t.ok(!ents.remove(1), 'the pod cannot be deconstructed');
  const inv = makeInventory({ regolith: 5 });
  const roof = BUILDABLES_BY_ID.roof;
  t.ok(inv.pay(roof.cost), 'roof costs regolith');
  const col = w.spawnCol + 40, surf = w.surface[col];
  t.ok(w.place(col, surf - 3, cfg.T_ROOF), 'roof panel placed in air');
  t.ok(w.solidAt(col, surf - 3), 'roof is solid (stops rain, counts as cover)');
  t.eq(inv.count('regolith'), 3, 'materials were spent');
  // machines round-trip through entities save
  const e = ents.add('solar', col + 3, surf);
  const ents2 = makeEntities(ents.export(), { podTx: 0, podTy: 0 });
  t.ok(ents2.list.some(x => x.uid === e.uid && x.type === 'solar'), 'built machines persist');
}

// ===================================================================== v4 M2: garbage economy
console.log('\n[garbage] the anthropocene is full of junk; digging it fills the hold');
{
  const w = makeWorld(12);
  t.ok(w.garbage.length >= 40, `garbage deposits seeded (${w.garbage.length})`);
  t.ok(w.garbage.every(g => {
    const d = g.ty - w.surface[g.tx];
    return d >= 0 && d <= 12;
  }), 'all garbage lies in the anthropocene band (depth 0-12)');
  // dig one out
  const g = w.garbage[0];
  let res = w.dig(g.tx, g.ty);
  while (res && !res.broke) res = w.dig(g.tx, g.ty);
  t.eq(res?.garbage?.type, g.type, 'digging a deposit returns its garbage');
  t.ok(!w.garbageAt(g.tx, g.ty), 'deposit is gone after scavenging');
  // dug-tile restore marks it scavenged
  const w2 = makeWorld(12);
  w2.applyDeltas(w.exportDeltas());
  t.ok(!w2.garbageAt(g.tx, g.ty), 'scavenged state survives save deltas');
}

console.log('\n[reclaimer] powered wash→shred→extract cycle fills the tray');
{
  const { RECLAIM_STAGES } = await import('../src/game/entities.js');
  const ents = makeEntities(null, { podTx: 10, podTy: 20 });
  const e = ents.add('processor', 30, 20);
  e.queue.push('bottle-cluster', 'scrap-metal');
  // unpowered night, no wind: frozen
  for (let i = 0; i < 60 * 3; i++) ents.update(1 / 60, { sun01: 0, wind01: 0 });
  t.eq(e.queue.length, 2, 'no power (night, still air) = no progress');
  t.ok(e.powered === false, 'machine reports unpowered');
  // storm wind powers it
  const total = RECLAIM_STAGES.reduce((a, b) => a + b, 0);
  for (let i = 0; i < Math.ceil((total * 2 + 1) * 60); i++) ents.update(1 / 60, { sun01: 0, wind01: 0.8 });
  t.eq(e.queue.length, 0, 'storm wind ran both items through the cycle');
  t.ok((e.outBuffer.plastic || 0) >= 2 && (e.outBuffer.metal || 0) >= 2, `tray holds yields (${JSON.stringify(e.outBuffer)})`);
  // an adjacent wind vane powers it under a light breeze
  const e2 = ents.add('processor', 40, 20);
  e2.queue.push('tyre-chunk');
  ents.add('wind-vane', 43, 20);
  for (let i = 0; i < Math.ceil((total + 1) * 60); i++) ents.update(1 / 60, { sun01: 0, wind01: 0.2 });
  t.eq(e2.queue.length, 0, 'adjacent wind vane powers the machine in a breeze');
}

console.log('\n[quests] M2 chain: scavenge → processing → power-up');
{
  const { makeQuests } = await import('../src/game/quests.js');
  const q = makeQuests(null);
  let procs = 0, gens = 0;
  const ctx = {
    player: { beam: null, tool: 'laser' }, pulley: { active: false }, codex: new Set(),
    env: { precip01: () => 0 }, power: { frac: () => 0.95 },
    builtCount: type => type === 'processor' ? procs : (type === 'solar' || type === 'wind-vane') ? gens : 0,
    exposedNow: false, stats: { garbageDug: 0, matsExtracted: 0 }, procQueued: 0,
  };
  q.emit('garbage-first');
  q.update(1 / 60, ctx);
  t.ok(q.isActive('scavenge'), 'first junk activates the survey');
  ctx.stats.garbageDug = 3; q.update(1 / 60, ctx);
  t.ok(q.isDone('scavenge'), 'three deposits complete the survey');
  q.update(1 / 60, ctx);
  t.ok(q.isActive('processing'), 'reclamation chains from the survey');
  procs = 1; q.update(1 / 60, ctx);
  ctx.procQueued = 3; q.update(1 / 60, ctx);
  ctx.stats.matsExtracted = 6; q.update(1 / 60, ctx);
  t.ok(q.isDone('processing'), 'build + feed + extract completes reclamation');
  q.update(1 / 60, ctx);
  t.ok(q.isActive('power-up'), 'the grid chains from reclamation');
  gens = 1; q.update(1 / 60, ctx); q.update(1 / 60, ctx);
  t.ok(q.isDone('power-up'), 'generator + full battery completes the grid');
}

// ===================================================================== v4 M3: dig power tiers
console.log('\n[laser] hp curve + mk tiers: deep rock is chewy until you upgrade');
{
  const w = makeWorld(21);
  // find a jurassic (hp 3) rock tile
  const col = w.spawnCol + 60;
  let ty = w.surface[col] + 150;   // jurassic band: depth 140-200
  while (w.tileAt(col, ty) !== cfg.T_ROCK && ty < w.surface[col] + 199) ty++;
  t.eq(w.stratumAt(col, ty).id, 'jurassic', 'test tile sits in the jurassic');
  t.eq(w.hpAt(col, ty), 3, 'jurassic rock takes 3 mk1 hits');
  t.eq(w.dig(col, ty, 1).broke, false, 'first mk1 hit chips');
  t.eq(w.damageAt(col, ty), 1, 'damage recorded');
  t.eq(w.dig(col, ty, 2).broke, true, 'mk2 strike finishes it (1+2 ≥ 3)');
  // mk3 one-shots hp-4 rock
  const col2 = w.spawnCol + 80;
  let ty2 = w.surface[col2] + 260;   // carboniferous: hp 4
  while (w.tileAt(col2, ty2) !== cfg.T_ROCK && ty2 < w.surface[col2] + 309) ty2++;
  t.eq(w.dig(col2, ty2, 4).broke, true, 'mk3 (power 4) one-shots carboniferous rock');
}

// ===================================================================== v4 M3: hazards
console.log('\n[gas] clouds are bounded, seep upward, and vent at the sky');
{
  const { makeHazards } = await import('../src/game/hazards.js');
  const w = makeWorld(44);
  const hz = makeHazards(w);
  // carve a chimney from depth 70 to the surface at an off-camp column
  const col = w.spawnCol + 60;
  for (let d = 0; d <= 70; d++) {
    const ty = w.surface[col] + d;
    if (w.diggable(col, ty)) w.dig(col, ty, 999);
  }
  t.ok(hz.releaseGas(col, w.surface[col] + 69), 'cloud released into the chimney');
  t.ok(hz._cellCount() > 0 && hz._cellCount() <= 40, `cells bounded (${hz._cellCount()})`);
  const p = { tx: () => 0, cy: () => 0 };   // player far away
  for (let i = 0; i < 60 * 40 && hz._cellCount() > 0; i++) hz.update(1 / 60, p);
  t.eq(hz._cellCount(), 0, 'cloud fully vented/expired up the chimney');
}

console.log('\n[cave-in] wide unsupported spans can drop; a pillar splits them');
{
  const { makeHazards } = await import('../src/game/hazards.js');
  // deterministic: force the collapse roll
  const oldRandom = Math.random;
  Math.random = () => 0;   // always below the collapse chance
  try {
    const w = makeWorld(45);
    const hz = makeHazards(w);
    const col = w.spawnCol + 70;
    const cy = w.surface[col] + 30;   // depth 30 (> 12)
    // carve a 10-wide, 2-tall room so the ceiling is a 10-span
    for (let x = col; x < col + 10; x++) for (let dy = 0; dy < 2; dy++) {
      if (w.diggable(x, cy + dy)) w.dig(x, cy + dy, 999);
    }
    const res = hz.onDig(col + 5, cy);
    t.ok(res.collapsed.length >= 2, `10-span ceiling collapsed (${res.collapsed.length} tiles of rubble)`);
    t.ok(res.payout >= res.collapsed.length, 'cave-in pays out regolith');
    t.ok(res.collapsed.every(c => w.tileAt(c.tx, c.ty) === cfg.T_PLACED), 'debris piles as placed soil');

    // same room shape, but with a support pillar mid-span: no collapse
    const w2 = makeWorld(46);
    const hz2 = makeHazards(w2);
    const col2 = w2.spawnCol + 70;
    const cy2 = w2.surface[col2] + 30;
    for (let x = col2; x < col2 + 10; x++) for (let dy = 0; dy < 2; dy++) {
      if (w2.diggable(x, cy2 + dy)) w2.dig(x, cy2 + dy, 999);
    }
    w2.place(col2 + 5, cy2, cfg.T_PLACED);       // the pillar (fills to the ceiling row)
    const res2 = hz2.onDig(col2 + 2, cy2);
    t.eq(res2.collapsed.length, 0, 'a mid-span pillar splits the ceiling - no collapse');
  } finally { Math.random = oldRandom; }
}

// ===================================================================== v3.6.1: parachute
console.log('\n[parachute] a long fast fall deploys + caps descent');
{
  clearKeys();
  const w = makeWorld(64);
  const col = w.spawnCol + 40;
  const p = makePlayer(col * cfg.TILE + 2, (w.surface[col] - 60) * cfg.TILE);   // high up, over open air
  let deployed = false, maxVy = 0;
  for (let i = 0; i < 240 && !p.onGround; i++) {
    updatePlayer(p, w, 1 / 60);
    if (p.chute) deployed = true;
    if (p.chute) maxVy = Math.max(maxVy, p.vy);
  }
  t.ok(deployed, 'parachute deployed during the long fall');
  t.ok(maxVy <= 160, `descent capped to a gentle rate under the chute (max ${Math.round(maxVy)}px/s)`);
}

t.done();

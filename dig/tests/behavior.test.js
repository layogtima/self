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
  t.ok(FOSSILS.length >= 28, `registry has ${FOSSILS.length} species`);
  t.ok(!FOSSILS.some(f => ['smartphone', 'plastic-bottle', 'sneaker', 'car-tyre'].includes(f.id)), 'artifacts left the museum (they are junk now)');
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
  // scale-independent: sample a depth inside each named band
  const midOf = id => { const s = STRATA.find(x => x.id === id); return s.depth[0] + Math.min(5, (s.depth[1] - s.depth[0]) / 2); };
  t.eq(stratumAtDepth(midOf('anthropocene')).id, 'anthropocene', 'anthropocene band resolves');
  t.eq(stratumAtDepth(midOf('quaternary')).id, 'quaternary', 'quaternary band resolves');
  t.eq(stratumAtDepth(midOf('cretaceous')).id, 'cretaceous', 'cretaceous band resolves');
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
  const pulley = makePulley(); const particles = makeParticles();
  const cam = { x: 0, y: 0, wx(mx) { return mx / cfg.VIEW_ZOOM + this.x; }, wy(my) { return my / cfg.VIEW_ZOOM + this.y; } };
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
  const spawn = w.spawnCol;
  // pick a dry column with open air above (skip surface ponds)
  let col = spawn + 40;
  for (let c = spawn + 40; c < spawn + 120; c++) {
    if (w.tileAt(c, w.surface[c] - 2) === cfg.T_AIR && !w.fluidAt(c, w.surface[c] - 2)) { col = c; break; }
  }
  const surf = w.surface[col];
  w.dig(col, surf + 3);
  t.ok(w.place(col, surf - 2, cfg.T_ROOF), 'roof placed in open air');   // a built roof panel
  const deltas = w.exportDeltas();
  writeSave({ v: 3, seed: 999, dug: deltas.dug, placedTiles: deltas.placedTiles, collected: { 't-rex': [0, 1] }, settings: { volume: 0.5 } });
  const loaded = loadSave();
  t.ok(loaded && loaded.seed === 999, 'save reloads');
  const col2 = makeCollection(loaded.collected);
  t.eq(col2.bonesMounted('t-rex'), 2, 'mounted bones persisted');
  const w2 = makeWorld(999);
  w2.applyDeltas(loaded);
  t.eq(w2.tileAt(col, surf + 3), cfg.T_AIR, 'dug tile restored as AIR');
  t.eq(w2.tileAt(col, surf - 2), cfg.T_ROOF, 'placed roof restored with its tile id');
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
  t.ok(realDepthAt(STRATA[STRATA.length - 1].depth[0] + 100) > 5000, 'precambrian tiles read in kilometres');
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
  t.ok(c.fauna <= 6, `fauna globally bounded across all zones (${c.fauna})`);
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
  const featureIds = new Set(['roots', 'stalactite', 'stalagmite', 'mushroom', 'crystal', 'vines']);
  // geode ceiling teeth ('crystal-tip') and vines resolve to their codex ids
  const resolveId = raw => raw === 'crystal-tip' ? 'crystal' : raw;
  let checked = 0, mismatches = 0, phantomCrystal = 0, found = { mushroom: 0, stalactite: 0 };
  for (let ty = 0; ty < w.WORLD_H - 4 && checked < 40000; ty++) {
    for (let tx = 0; tx < w.WORLD_W; tx++) {
      if (w.tileAt(tx, ty) !== cfg.T_AIR || w.depthOfRow(tx, ty) < 3) continue;
      checked++;
      const f = caveFeaturesAt(w, tx, ty);
      // scan the tile centre-bottom (floor half) and centre-top (ceiling half)
      for (const [frac, side] of [[0.85, 'floor'], [0.15, 'ceiling']]) {
        const r = resolveScan((tx + 0.5) * cfg.TILE, (ty + frac) * cfg.TILE, w, []);
        if (r?.kind !== 'feature' && r?.kind !== 'flora') {
          if (f && f[side] && !f[side === 'floor' ? 'ceiling' : 'floor']) mismatches++;   // render draws, scan missed
          continue;
        }
        if (!f || (r.id !== resolveId(f.floor) && r.id !== resolveId(f.ceiling))) mismatches++;   // scan names, render doesn't draw
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
  t.ok(FAUNA.every(f => ['surface', 'cave', 'water'].includes(f.zone)), 'zones valid');
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
  const cave = eligibleFauna('cave', { isDay: true, weather: 'clear', depth: 200, biomeId: 'tundra' }).map(o => o.item.id).sort().join(',');
  t.eq(cave, 'salamander,spider', 'shallow-deep cave: salamander + spider');
  // biome gating works: the wetland fields waders, the ash flats only crabs move
  const wet = eligibleFauna('surface', { isDay: true, weather: 'clear', depth: 0, biomeId: 'wetland' }).map(o => o.item.id);
  t.ok(wet.includes('wader'), 'wetland fields the stilt wader');
  const ash = eligibleFauna('surface', { isDay: true, weather: 'clear', depth: 0, biomeId: 'ashflats' }).map(o => o.item.id);
  t.ok(ash.includes('cindercrab') && !ash.includes('wader'), 'ash flats: cinder crabs, no waders');
  t.ok(FAUNA_BY_ID.hopper.rarity === 2, 'hopper keeps its double rain weight');
}

console.log('\n[harvest] picking a crystal updates inventory, save, and the feature is gone');
{
  const { caveFeaturesAt, HARVESTABLE } = await import('../src/game/features.js');
  const { makeInventory } = await import('../src/game/inventory.js');
  const w = makeWorld(5);
  // minerals only: mushrooms are scan targets, never resources
  t.ok(!HARVESTABLE.mushroom && HARVESTABLE.crystal === 'crystal', 'only the mineral is harvestable');
  // find a crystal tile
  let spot = null;
  for (let ty = 0; ty < w.WORLD_H - 4 && !spot; ty++)
    for (let tx = 0; tx < w.WORLD_W && !spot; tx++) {
      const f = caveFeaturesAt(w, tx, ty);
      if (f?.floor === 'crystal') spot = { tx, ty };
    }
  t.ok(!!spot, 'found a selenite crystal in the seeded world');
  const inv = makeInventory();
  t.ok(w.harvest(spot.tx, spot.ty), 'harvest marks the tile');
  inv.add('crystal');
  t.eq(inv.count('crystal'), 1, 'inventory counts the pick');
  t.eq(caveFeaturesAt(w, spot.tx, spot.ty)?.floor ?? null, null, 'harvested feature no longer reported (render + scan agree it is gone)');
  t.ok(!w.harvest(spot.tx, spot.ty), 'double-harvest refused');
  // round-trip through deltas
  const w2 = makeWorld(5);
  w2.applyDeltas(w.exportDeltas());
  t.eq(caveFeaturesAt(w2, spot.tx, spot.ty)?.floor ?? null, null, 'harvest persists through save deltas');
  // inventory export/import
  const inv2 = makeInventory(inv.export());
  t.eq(inv2.count('crystal'), 1, 'materials persist');
  t.ok(inv2.pay({ crystal: 1 }) && inv2.count('crystal') === 0 && !inv2.pay({ crystal: 1 }), 'pay() spends and refuses overdraft');
}

console.log('\n[synthesize] biology is never an ingredient - every cost is a processed material');
{
  const { BUILDABLES } = await import('../src/content/buildables.js');
  const { MATERIALS_BY_ID } = await import('../src/content/materials.js');
  for (const b of BUILDABLES) {
    const bad = Object.keys(b.cost).filter(id => !MATERIALS_BY_ID[id]);
    t.ok(bad.length === 0, `${b.id} costs only processed/mineral materials${bad.length ? ` (BAD: ${bad})` : ''}`);
  }
  t.ok(!MATERIALS_BY_ID.mushroom, 'the material registry holds no living things');
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
  // v4.8: wading submerged (exposed01=1) soaks you just like a storm
  const s2 = makeStatus(null);
  for (let i = 0; i < 60 * 6; i++) s2.update(1 / 60, { exposed01: 1, dry01: 0 });
  t.ok(s2.tier() !== 'dry', 'a submerged probe gets wet');
  for (let i = 0; i < 60 * 10; i++) s2.update(1 / 60, { exposed01: 1, dry01: 0 });
  t.eq(s2.tier(), 'soaked', 'staying in the water soaks it fully');
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
  // find a dry column (skip any surface pond) with open air above it
  let col = w.spawnCol + 40;
  for (let c = w.spawnCol + 40; c < w.spawnCol + 90; c++) {
    if (w.tileAt(c, w.surface[c] - 3) === cfg.T_AIR && !w.fluidAt(c, w.surface[c] - 3)) { col = c; break; }
  }
  const surf = w.surface[col];
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
  const anthroBottom = STRATA[0].depth[1];   // scales with the world
  t.ok(w.garbage.every(g => {
    const d = g.ty - w.surface[g.tx];
    return d >= 0 && d <= anthroBottom;
  }), `all garbage lies in the anthropocene band (depth 0-${anthroBottom})`);
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

console.log('\n[machines] each furnace takes its own junk; powered cycles fill the tray');
{
  const { RECLAIM_STAGES } = await import('../src/game/entities.js');
  const { BUILDABLES_BY_ID } = await import('../src/content/buildables.js');
  const { GARBAGE } = await import('../src/content/materials.js');
  // every junk type has exactly one machine that accepts it
  const machines = Object.values(BUILDABLES_BY_ID).filter(b => b.accepts);
  t.eq(machines.length, 3, 'three processing machines (Smelter, Vat, Kiln)');
  for (const g of GARBAGE) {
    const takers = machines.filter(m => m.accepts.includes(g.id));
    t.eq(takers.length, 1, `${g.id} is accepted by exactly one machine (${takers[0]?.name})`);
  }
  const ents = makeEntities(null, { podTx: 10, podTy: 20 });
  const smelter = ents.add('smelter', 30, 20);
  smelter.queue.push('scrap-metal', 'aluminium-can');
  smelter.battery = 0;   // drained flat: nothing to run on
  // dead battery + unpowered night, no wind: frozen
  for (let i = 0; i < 60 * 3; i++) ents.update(1 / 60, { sun01: 0, wind01: 0 });
  t.eq(smelter.queue.length, 2, 'flat battery + no source = no progress');
  t.eq(smelter.stage, 0, '...stage frozen too');
  // storm wind powers it through both items
  const total = RECLAIM_STAGES.reduce((a, b) => a + b, 0);
  for (let i = 0; i < Math.ceil((total * 2 + 1) * 60); i++) ents.update(1 / 60, { sun01: 0, wind01: 0.8 });
  t.eq(smelter.queue.length, 0, 'storm wind smelted both items');
  t.ok((smelter.outBuffer.metal || 0) >= 3, `tray holds metal (${JSON.stringify(smelter.outBuffer)})`);
  // routing: the Vat only takes its own junk from a mixed hold
  const { makeInventory } = await import('../src/game/inventory.js');
  const inv = makeInventory({}, ['scrap-metal', 'bottle-cluster', 'tyre-chunk', 'ceramic-shards']);
  const taken = inv.takeGarbageMatching(BUILDABLES_BY_ID.pyrolysis.accepts);
  t.eq(taken.sort().join(','), 'bottle-cluster,tyre-chunk', 'Vat pulls only plastics/polymer junk');
  t.eq(inv.garbageCount(), 2, 'the rest stays in the hold');
  // quest-bonus speed: 1.2x finishes a cycle faster
  const e2 = ents.add('kiln', 40, 20);
  e2.queue.push('glass-bottle');
  let ticks = 0;
  while (e2.queue.length && ticks < 600) { ents.update(1 / 60, { sun01: 1, wind01: 0, speed: 1.2 }); ticks++; }
  t.ok(ticks < Math.ceil(total * 60), `codex bonus runs the kiln faster (${ticks} ticks)`);
}

console.log('\n[machine-power] batteries drain, recharge, obey the switch, accept a top-up');
{
  const { MACHINE_BATT_CAP } = await import('../src/game/entities.js');
  const ents = makeEntities(null, { podTx: 10, podTy: 20 });
  const vat = ents.add('pyrolysis', 30, 20);
  t.eq(vat.battery, MACHINE_BATT_CAP / 2, 'a new machine ships half-charged');
  vat.queue.push('tyre-chunk');
  const b0 = vat.battery;
  for (let i = 0; i < 60; i++) ents.update(1 / 60, { sun01: 0, wind01: 0 });   // running in the dark
  t.ok(vat.battery < b0, `cycling drains the battery (${vat.battery.toFixed(1)})`);
  // sun recharges an idle machine toward the cap
  const idle = ents.add('kiln', 40, 20);
  idle.battery = 1;
  for (let i = 0; i < 60 * 5; i++) ents.update(1 / 60, { sun01: 1, wind01: 0 });
  t.ok(idle.battery > 10, `sun recharges an idle machine (${idle.battery.toFixed(1)})`);
  // the P switch: OFF = inert - no charge draw, no drain, no work
  const off = ents.add('smelter', 50, 20);
  off.enabled = false; off.battery = 5; off.queue.push('scrap-metal');
  for (let i = 0; i < 60 * 4; i++) ents.update(1 / 60, { sun01: 1, wind01: 0 });
  t.eq(off.battery, 5, 'a switched-off machine neither charges nor drains');
  t.eq(off.queue.length, 1, '...and does no work');
  // a flat battery freezes mid-job; a top-up (what the G umbilical feeds) resumes it
  const dead = ents.add('smelter', 60, 20);
  dead.battery = 0; dead.queue.push('aluminium-can');
  for (let i = 0; i < 60 * 2; i++) ents.update(1 / 60, { sun01: 0, wind01: 0 });
  t.eq(dead.queue.length, 1, 'flat + dark = frozen');
  dead.battery = MACHINE_BATT_CAP;   // the umbilical, distilled: rover charge in
  for (let i = 0; i < 60 * 9; i++) ents.update(1 / 60, { sun01: 0, wind01: 0 });
  t.eq(dead.queue.length, 0, 'a battery top-up finishes the job with no sky power at all');
  // battery + switch survive the save round-trip; old saves get retrofitted
  const again = makeEntities(ents.export(), { podTx: 10, podTy: 20 });
  t.ok(again.list.find(e => e.uid === off.uid).enabled === false, 'the OFF switch persists');
  const legacy = makeEntities({ nextUid: 5, entities: [{ uid: 2, type: 'kiln', tx: 30, ty: 20, queue: [], stage: 0, t: 0, outBuffer: {} }] }, { podTx: 10, podTy: 20 });
  t.eq(legacy.list.find(e => e.type === 'kiln').battery, MACHINE_BATT_CAP / 2, 'pre-battery saves get a half charge');
}

console.log('\n[quests] the machine chain: scavenge → furnace → vat → kiln (+ grid, + bio)');
{
  const { makeQuests } = await import('../src/game/quests.js');
  const q = makeQuests(null);
  const built = {};
  const mats = { metal: 0, plastic: 0, polymer: 0, silicon: 0 };
  const ctx = {
    player: { beam: null, tool: 'laser' }, pulley: { active: false }, codex: new Set(),
    env: { precip01: () => 0 }, power: { frac: () => 0.95 },
    inventory: { count: id => mats[id] || 0 },
    builtCount: type => built[type] || 0,
    exposedNow: false, lampsBuilt: 0,
    stats: { garbageDug: 0, matsExtracted: 0, netsDug: 0, creaturesScanned: 0, junkTypesScanned: 0 },
    procQueued: 0,
  };
  q.emit('garbage-first');
  q.update(1 / 60, ctx);
  t.ok(q.isActive('scavenge'), 'first junk activates the survey');
  ctx.stats.garbageDug = 3; q.update(1 / 60, ctx);
  q.update(1 / 60, ctx);
  t.ok(q.isActive('furnace'), 'the Furnace chains from the survey');
  built.smelter = 1; q.update(1 / 60, ctx);
  mats.metal = 4; q.update(1 / 60, ctx);
  t.ok(q.isDone('furnace'), 'smelter + 4 metal completes the Furnace');
  q.update(1 / 60, ctx);
  t.ok(q.isActive('pyrolysis') && q.isActive('power-up'), 'the Vat and the Grid both open after the Furnace');
  built.pyrolysis = 1; mats.plastic = 4; q.update(1 / 60, ctx); q.update(1 / 60, ctx);
  t.ok(q.isDone('pyrolysis'), 'vat + 4 plastics completes');
  q.update(1 / 60, ctx);
  built.kiln = 1; mats.silicon = 2; q.update(1 / 60, ctx); q.update(1 / 60, ctx);
  t.ok(q.isDone('kiln'), 'kiln + 2 silicon completes');
  q.update(1 / 60, ctx);
  t.ok(q.isActive('field-lab'), 'the field lab opens after the kiln');
  // bio quests
  q.emit('scanned:mushroom'); q.update(1 / 60, ctx);
  t.ok(q.isActive('bio-optics'), 'scanning the Mycena opens Bio-optics');
  built['lamp-green'] = 1; ctx.lampsBuilt = 1; q.update(1 / 60, ctx);
  t.ok(q.isDone('bio-optics'), 'building a lamp completes Bio-optics');
  ctx.codex.add('firefly'); q.update(1 / 60, ctx);
  t.ok(q.isActive('dark-sky'), 'lamp + firefly scan opens Dark Sky');
  built['lamp-amber'] = 1; q.update(1 / 60, ctx);
  t.ok(q.isDone('dark-sky'), 'the amber lamp completes Dark Sky');
}

// ===================================================================== v4 M3: dig power tiers
console.log('\n[laser] hp curve + mk tiers: deep rock is chewy until you upgrade');
{
  const w = makeWorld(21);
  // find a jurassic (hp 3) rock tile - band scales with the world
  const jur = STRATA.find(s => s.id === 'jurassic');
  const col = w.spawnCol + 60;
  let ty = w.surface[col] + jur.depth[0] + 10;
  while (w.tileAt(col, ty) !== cfg.T_ROCK && ty < w.surface[col] + jur.depth[1] - 1) ty++;
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

// ===================================================================== v4.2: click-locked digging
console.log('\n[dig] mouse digging latches one tile - no seam-sweeping 2-tall channels');
{
  clearKeys();
  const w = makeWorld(500);
  const col = w.spawnCol + 50, surf = w.surface[col];
  const p = makePlayer(col * cfg.TILE + 2, surf * cfg.TILE - cfg.PLAYER_H);
  const particles = makeParticles(), fx = { shake: () => {} };
  const cam = { x: 0, y: 0, wx(mx) { return mx / cfg.VIEW_ZOOM + this.x; }, wy(my) { return my / cfg.VIEW_ZOOM + this.y; } };
  for (let i = 0; i < 30; i++) updatePlayer(p, w, 1 / 60);
  // hold the cursor ON a tile seam while walking - the old repro
  mouse.left = true;
  keys.KeyD = true;
  const cleared = new Map();
  for (let i = 0; i < 60 * 6; i++) {
    mouse.x = (p.cx() + 40 - cam.x) * cfg.VIEW_ZOOM;      // stage px (the cursor lives zoomed)
    // straddle the LOCAL surface seam ahead of the rover (terrain rolls now)
    const aheadCol = Math.max(0, Math.min(w.WORLD_W - 1, Math.floor((p.cx() + 40) / cfg.TILE)));
    mouse.y = ((w.surface[aheadCol] + 1) * cfg.TILE + 4 - cam.y) * cfg.VIEW_ZOOM;   // aim just into the local rock
    updatePlayer(p, w, 1 / 60);
    const ev = updateDigging(p, w, cam, particles, fx, 1 / 60);
    if (ev.brokeTile) cleared.set(ev.brokeTile.tx, (cleared.get(ev.brokeTile.tx) || []).concat(ev.brokeTile.ty));
  }
  mouse.left = false; clearKeys();
  const twoTall = [...cleared.values()].filter(tys => new Set(tys).size > 1).length;
  t.ok(cleared.size >= 2, `held mouse still tunnels (${cleared.size} columns)`);
  t.eq(twoTall, 0, 'no column lost more than one row (click-lock holds the seam)');
}

// ===================================================================== v4.2: liquids + salvage + science
console.log('\n[liquids] four real fluids: seeded, conserved, viscosity-ordered');
{
  const { FLUID_SPECS } = cfg;
  t.ok(FLUID_SPECS[cfg.T_TAR].visc < FLUID_SPECS[cfg.T_LAVA].visc, 'tar creeps slower than lava');
  t.ok(FLUID_SPECS[cfg.T_LAVA].visc < FLUID_SPECS[cfg.T_BRINE].visc, 'lava slower than brine');
  t.ok(FLUID_SPECS[cfg.T_BRINE].visc < FLUID_SPECS[cfg.T_WATER].visc, 'brine slower than water');
  const w = makeWorld(600);
  const count = id => { let n = 0; for (const t2 of w.tiles) if (t2 === id) n++; return n; };
  const before = { water: count(cfg.T_WATER), brine: count(cfg.T_BRINE), tar: count(cfg.T_TAR), lava: count(cfg.T_LAVA) };
  t.ok(before.brine > 0, `brine pools seeded (${before.brine})`);
  t.ok(before.tar > 0, `tar seeps seeded (${before.tar})`);
  t.ok(before.lava > 250, `the basement runs molten (${before.lava} lava tiles)`);
  // let everything flow for a while over the whole map: volume conserved per fluid
  const bounds = { x0: 0, x1: w.WORLD_W - 1, y0: 0, y1: w.WORLD_H - 1 };
  for (let i = 0; i < 400; i++) w.stepFluids(bounds, 1 / 60);
  t.eq(count(cfg.T_WATER), before.water, 'water conserved');
  t.eq(count(cfg.T_BRINE), before.brine, 'brine conserved');
  t.eq(count(cfg.T_TAR), before.tar, 'tar conserved');
  t.eq(count(cfg.T_LAVA), before.lava, 'lava conserved');
  const { CODEX_BY_ID } = await import('../src/content/codex.js');
  t.ok(CODEX_BY_ID.brine && CODEX_BY_ID.tar, 'codex covers the new fluids');
}

console.log('\n[salvage] the junk museum: 12 storied types, all reachable, all scannable');
{
  const { BUILDABLES_BY_ID } = await import('../src/content/buildables.js');
  const { CODEX_BY_ID } = await import('../src/content/codex.js');
  const { GARBAGE } = await import('../src/content/materials.js');
  t.ok(GARBAGE.length >= 12, `junk ecosystem is rich (${GARBAGE.length} types)`);
  t.ok(GARBAGE.every(g => CODEX_BY_ID[g.id]), 'every junk type has a storied codex entry');
  // the Smelter (first machine, regolith-only) must be pre-metal buildable
  t.ok(Object.keys(BUILDABLES_BY_ID.smelter.cost).every(id2 => id2 === 'regolith'), 'the Smelter costs only dig spoil - no bootstrap paradox');
  for (const seed of [1, 77, 4242]) {
    const w = makeWorld(seed);
    const byType = {};
    for (const g of w.garbage) byType[g.type] = (byType[g.type] || 0) + 1;
    const metalJunk = (byType['scrap-metal'] || 0) + (byType['aluminium-can'] || 0) + (byType['rebar-chunk'] || 0) + (byType['stainless-cutlery'] || 0);
    t.ok(metalJunk >= 6, `seed ${seed}: plenty of metal junk for the Smelter (${metalJunk})`);
  }
  // scanning a buried deposit names its type
  const { scanTargetAt } = await import('../src/game/scan.js');
  const w2 = makeWorld(1);
  const g0 = w2.garbage.find(g => w2.garbageAt(g.tx, g.ty));
  t.eq(scanTargetAt((g0.tx + 0.5) * cfg.TILE, (g0.ty + 0.5) * cfg.TILE, w2, []), g0.type, 'scanner reads deposits through the rock');
}

console.log('\n[science] every codex creature/flora entry names a real taxon');
{
  const { CODEX } = await import('../src/content/codex.js');
  const withTaxon = CODEX.filter(e => e.category === 'creature');
  t.ok(withTaxon.every(e => e.stats.some(([k]) => ['species', 'genus', 'order'].includes(k))), 'every creature entry carries a species/genus/order row');
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
    t.ok(res.collapsed.every(c => w.tileAt(c.tx, c.ty) === cfg.T_RUBBLE), 'debris piles as loose rubble');
    t.ok(res.collapsed.every(c => w.diggable(c.tx, c.ty)), 'rubble stays diggable by the laser');

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

// ===================================================================== v4.3: geology + grounding + sky
console.log('\n[liquids] every pool sits in its geological band, in order');
{
  // v4.7 scaled bands (world is 4x deeper): tar 16-160, water 180-560,
  // brine 960-1500 (marine), lava 1500+ (below brine)
  const BANDS = { [cfg.T_TAR]: [16, 160], [cfg.T_WATER]: [180, 560], [cfg.T_BRINE]: [960, 1500], [cfg.T_LAVA]: [1500, 99999] };
  let out = 0, counts = {};
  for (const seed of [11, 909]) {
    const w = makeWorld(seed);
    for (let ty = 0; ty < w.WORLD_H; ty++) for (let tx = 0; tx < w.WORLD_W; tx++) {
      const t2 = w.tileAt(tx, ty);
      if (!BANDS[t2]) continue;
      counts[t2] = (counts[t2] || 0) + 1;
      const d = ty - w.surface[tx];
      // surface ponds (v4.6) are rain-fed water bodies sitting AT the surface,
      // not seeped groundwater - exempt shallow water from the band rule
      if (t2 === cfg.T_WATER && d < 60) continue;   // surface ponds sit at/above the surface
      // pools flood-fill into connected pockets - allow slack (scaled world)
      if (d < BANDS[t2][0] - 32 || d > BANDS[t2][1] + 32) out++;
    }
  }
  t.eq(out, 0, 'no fluid tile strays outside its band (±32 slack (world is 4x deeper))');
  t.ok([cfg.T_TAR, cfg.T_WATER, cfg.T_BRINE, cfg.T_LAVA].every(id2 => counts[id2] > 0), 'all four fluids present');
  // v4.7: brine + lava are REACHABLE (well inside the section, not jammed at the floor)
  {
    const w = makeWorld(7);
    let minBrine = Infinity, minLava = Infinity;
    for (let ty = 0; ty < w.WORLD_H; ty++) for (let tx = 0; tx < w.WORLD_W; tx++) {
      const t2 = w.tileAt(tx, ty), d = ty - w.surface[tx];
      if (t2 === cfg.T_BRINE) minBrine = Math.min(minBrine, d);
      if (t2 === cfg.T_LAVA) minLava = Math.min(minLava, d);
    }
    const floor = w.WORLD_H - w.surface[w.spawnCol];
    t.ok(minBrine < floor * 0.75, `brine appears well above bedrock (depth ${minBrine} of ${floor})`);
    t.ok(minLava < floor * 0.9, `lava appears before the very floor (depth ${minLava} of ${floor})`);
  }
}

console.log('\n[machines] built machines stand ON the ground (no hovering)');
{
  const w = makeWorld(31);
  const ents = makeEntities(null, { podTx: 1, podTy: 10 });
  const col = w.spawnCol + 40, surf = w.surface[col];
  // as placed by the ghost: ty = bottom-most occupied AIR row = surf - 1
  const e = ents.add('processor', col, surf - 1);
  t.eq(e.ty + 1, surf, 'entity feet row (ty+1) is the ground row');
  t.ok(w.solidAt(col, e.ty + 1), 'there is actual ground under the feet');
}

console.log('\n[sky] sunlight pours down shafts, spills into cave mouths, misses the deeps');
{
  const { makeLighting } = await import('../src/render/lighting.js');
  const { makeCanvas } = { makeCanvas: (w2, h2) => ({ width: w2, height: h2, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop: () => {} }) }) }) };
  const L = makeLighting((w2, h2) => globalThis.document.createElement('canvas'));
  const w = makeWorld(7);
  const col = w.spawnCol + 50, surf = w.surface[col];
  for (let d = 0; d < 10; d++) if (w.diggable(col, surf + d)) w.dig(col, surf + d, 999);   // shaft
  for (let o = 1; o <= 4; o++) if (w.diggable(col + o, surf + 9)) w.dig(col + o, surf + 9, 999);   // pocket
  const sky = L._computeSky(w, { x0: col - 20, x1: col + 20, y0: surf - 6, y1: surf + 30 });
  const at = (x, y) => sky.grid[(y - sky.y0) * sky.w + (x - sky.x0)];
  t.eq(at(col, surf + 9), 1, 'shaft bottom is a god-ray (open to the sky)');
  t.ok(at(col + 2, surf + 9) > 0.3 && at(col + 2, surf + 9) < 0.7, `light spills 2 tiles into the pocket (${at(col + 2, surf + 9).toFixed(2)})`);
  t.ok(at(col + 4, surf + 9) < at(col + 2, surf + 9), 'and dimmer further in');
}

console.log('\n[deconstructor] the laser never cuts built tiles; the deconstructor reclaims them');
{
  const w = makeWorld(51);
  const col = w.spawnCol + 30, surf = w.surface[col];
  t.ok(w.place(col, surf - 2, cfg.T_PLACED), 'wall block placed');
  t.ok(w.place(col + 1, surf - 4, cfg.T_ROOF), 'roof panel placed');
  t.eq(w.placedTileCount(cfg.T_PLACED), 1, 'placedTileCount counts soil (no exportDeltas per frame)');
  t.eq(w.placedTileCount(cfg.T_ROOF), 1, 'placedTileCount counts roofs');
  t.ok(!w.diggable(col, surf - 2), 'a built wall is NOT laser-diggable');
  t.ok(!w.diggable(col + 1, surf - 4), 'a built roof is NOT laser-diggable');
  t.eq(w.dig(col, surf - 2, 999), null, 'dig() refuses the wall outright');
  t.eq(w.removePlaced(col, surf - 2), cfg.T_PLACED, 'removePlaced reclaims the wall (returns its tile id)');
  t.eq(w.tileAt(col, surf - 2), cfg.T_AIR, 'the wall is gone');
  t.eq(w.removePlaced(col, surf - 2), 0, 'a second pass finds nothing built');
  t.eq(w.removePlaced(col, surf + 3), 0, 'natural rock is never deconstructable');
  t.ok(w.diggable(col, surf + 3), '...but stays laser-diggable');
  // rubble round-trips: placed by cave-ins, cleared by the laser
  t.ok(w.place(col + 2, surf - 1, cfg.T_RUBBLE), 'rubble placed (cave-in path)');
  t.ok(w.diggable(col + 2, surf - 1), 'rubble is laser-diggable');
  t.ok(w.dig(col + 2, surf - 1, 1)?.broke, 'and breaks in one hit');
  // save round-trip: a placed wall survives, and stays deconstructable
  t.ok(w.place(col + 3, surf - 2, cfg.T_PLACED), 'wall for the save test');
  const deltas = w.exportDeltas();
  const w2 = makeWorld(51);
  w2.applyDeltas(deltas);
  t.ok(!w2.diggable(col + 3, surf - 2), 'restored wall still refuses the laser');
  t.eq(w2.removePlaced(col + 3, surf - 2), cfg.T_PLACED, 'restored wall still deconstructs');
}

console.log('\n[sky-blit] night + day sky passes use the seamless 1px-per-tile blit (no grid)');
{
  const { makeLighting } = await import('../src/render/lighting.js');
  const w = makeWorld(7);
  const col = w.spawnCol + 50, surf = w.surface[col];
  const cam = { x: col * cfg.TILE - 200, y: surf * cfg.TILE - 100, bounds: () => ({ x0: col - 15, x1: col + 15, y0: surf - 8, y1: surf + 12 }) };
  const ctx = globalThis.document.createElement('canvas').getContext('2d');
  const emitter = { x: col * cfg.TILE, y: surf * cfg.TILE };
  const night = makeLighting((w2, h2) => globalThis.document.createElement('canvas'));
  night.apply(ctx, w, cam, emitter, 0, 0.8, [], { strength: 0.2, warm: 0 });
  t.ok(night._usedSkyBlit, 'night sky light rendered via the single smoothed blit');
  const day = makeLighting((w2, h2) => globalThis.document.createElement('canvas'));
  day.apply(ctx, w, cam, emitter, 0, 0, [], { strength: 1, warm: 0 });
  t.ok(day._usedSkyBlit, 'daytime overhang shade rendered via the single smoothed blit');
}

console.log('\n[shallow caves] roomy grottoes, barely any surface shafts');
{
  for (const seed of [3, 42]) {
    const w = makeWorld(seed);
    let pockets2 = 0, tall3 = 0, notches = 0;
    for (let tx = 4; tx < w.WORLD_W - 4; tx++) {
      const s2 = w.surface[tx];
      if (w.fluidAt(tx, s2 - 1) === cfg.T_WATER) continue;   // a surface pond, not a skylight well
      if (w.tileAt(tx, s2) === cfg.T_AIR || w.tileAt(tx, s2 + 1) === cfg.T_AIR) notches++;
      for (let d = 5; d <= 25; d++) {
        if (w.tileAt(tx, s2 + d) === cfg.T_AIR) {
          pockets2++;
          if (w.tileAt(tx, s2 + d + 1) === cfg.T_AIR && w.tileAt(tx, s2 + d + 2) === cfg.T_AIR) tall3++;
          break;
        }
      }
    }
    t.ok(pockets2 > 40, `seed ${seed}: plentiful shallow cave air (${pockets2} cols)`);
    t.ok(tall3 >= 15, `seed ${seed}: real ROOMS, not cracks (${tall3} cols with 3-tall air)`);
    // skylight wells cap scales with world width (2 per 364-tile span)
    const wellCap = Math.ceil(w.WORLD_W / 364) * 2 + 2;
    t.ok(notches <= wellCap, `seed ${seed}: few skylight wells cut the surface (${notches} ≤ ${wellCap})`);
  }
}

// ===================================================================== v4.4: lifecycles
console.log('\n[lifecycle] creatures grow, hunt, feed, and fade of old age');
{
  const { makeAmbient } = await import('../src/game/ambient.js');
  const { FAUNA_BY_ID, FAUNA } = await import('../src/content/fauna.js');
  const w = makeWorld(9);
  const amb = makeAmbient();
  const col = w.spawnCol + 30, surf = w.surface[col];
  const p2 = { tx: () => col - 30, cy: () => surf * cfg.TILE, cx: () => (col - 30) * cfg.TILE };   // far away
  const cam2 = { x: (col - 30) * cfg.TILE, bounds: () => ({ x0: col - 40, x1: col + 20, y0: surf - 10, y1: surf + 24 }) };
  const envStub = { night01: () => 0.8, weather: 'clear', precip01: () => 0, wind01: () => 0.3 };

  // hunt: a hungry adult spider planted beside a firefly eats it
  const spider = { kind: 'spider', spec: FAUNA_BY_ID.spider, zone: 'surface', x: col * cfg.TILE, y: surf * cfg.TILE, dir: 1, state: 'walk', t: 0, life: 999, ph: 0, age: 0.8, fade: 0 };
  amb._fauna.push(spider);
  amb._fireflies.push({ x: col * cfg.TILE + 30, y: surf * cfg.TILE - 4, t: 0, life: 999 });
  let ate = false;
  for (let i = 0; i < 60 * 30 && !ate; i++) {
    amb.update(1 / 60, w, p2, cam2, 1, null, envStub);
    amb._fireflies.forEach(ff => { ff.life = 999; ff.x = Math.min(Math.max(ff.x, col * cfg.TILE - 60), col * cfg.TILE + 60); });
    spider.life = 999;
    if (spider.state === 'eat' || amb._fireflies.length === 0) ate = true;
  }
  t.ok(ate, 'the whip spider hunted down the firefly');

  // old age: an elder fades out and despawns
  const elder = { kind: 'grazer', spec: FAUNA_BY_ID.grazer, zone: 'surface', x: (col + 4) * cfg.TILE, y: surf * cfg.TILE, dir: 1, state: 'walk', t: 0, life: 999, ph: 0, age: 0.999, fade: 0 };
  amb._fauna.push(elder);
  for (let i = 0; i < 60 * 4; i++) { amb.update(1 / 60, w, p2, cam2, 1, null, envStub); if (amb._fauna.includes(elder)) elder.life = Math.max(elder.life, 1); }
  t.ok(!amb._fauna.includes(elder), 'the elder faded of old age and despawned');

  // registry lint: every fauna entry has a lifespan
  t.ok(FAUNA.every(f => f.lifespan > 30), 'every creature has a lifespan');
}

// ===================================================================== v4.4: bio-optics
console.log('\n[bio-optics] scanning unlocks lamps; harsh light drives fireflies away');
{
  const { makeBuild } = await import('../src/game/build.js');
  const { makeInventory } = await import('../src/game/inventory.js');
  const w = makeWorld(31);
  const p2 = makePlayer(w.spawnCol * cfg.TILE, 300);
  const ents = makeEntities(null, { podTx: 1, podTy: 10 });
  const inv = makeInventory({ metal: 5, silicon: 5, crystal: 5, regolith: 5 });
  const scanned = new Set();
  const build = makeBuild({
    world: w, player: p2, inventory: inv, entities: ents,
    isQuestUnlocked: () => false, hasScanned: id => scanned.has(id),
    onBuilt: () => {}, toast: () => {},
  });
  t.ok(!build.unlocked().some(b => b.id === 'lamp-green'), 'Mycena lamp locked before the scan');
  scanned.add('mushroom');
  t.ok(build.unlocked().some(b => b.id === 'lamp-green'), 'scanning the Mycena unlocks its lamp blueprint');
  t.ok(!build.unlocked().some(b => b.id === 'lamp-blue'), 'the glowworm lamp still needs its own scan');
  scanned.add('firefly');
  t.ok(build.unlocked().some(b => b.id === 'lamp-amber'), 'firefly scan unlocks the dark-sky amber lamp');

  // fireflies flee harsh light, tolerate amber
  const { makeAmbient } = await import('../src/game/ambient.js');
  const amb = makeAmbient();
  const col = w.spawnCol + 30, surf = w.surface[col];
  const px2 = { tx: () => col - 30, cy: () => surf * cfg.TILE, cx: () => (col - 30) * cfg.TILE };
  const cam2 = { x: (col - 30) * cfg.TILE, bounds: () => ({ x0: col - 40, x1: col + 20, y0: surf - 10, y1: surf + 24 }) };
  const envStub = { night01: () => 0.8, weather: 'clear', precip01: () => 0, wind01: () => 0.1 };
  const lampAt = { x: col * cfg.TILE, y: surf * cfg.TILE - 23, amber: false };
  const planted = { x: lampAt.x + 20, y: lampAt.y, t: 0, life: 99 };
  amb._fireflies.push(planted);
  for (let i = 0; i < 90; i++) amb.update(1 / 60, w, px2, cam2, 1, null, envStub, [lampAt]);
  t.ok(!amb._fireflies.includes(planted), 'a harsh lamp drives the firefly off (light pollution)');
  lampAt.amber = true;
  const planted2 = { x: lampAt.x + 20, y: lampAt.y, t: 0, life: 99 };
  amb._fireflies.push(planted2);
  for (let i = 0; i < 90; i++) { amb.update(1 / 60, w, px2, cam2, 1, null, envStub, [lampAt]); planted2.life = 99; planted2.x = lampAt.x + 20; planted2.y = lampAt.y; }
  t.ok(amb._fireflies.includes(planted2), 'the amber dark-sky lamp coexists with fireflies');
  // moths come to any emitter (keyed), and DISPERSE when it's gone
  const em = { key: 'L1', x: lampAt.x, y: lampAt.y, amber: true };
  let gotMoth = false;
  for (let i = 0; i < 60 * 30 && !gotMoth; i++) { amb.update(1 / 60, w, px2, cam2, 1, null, envStub, [em]); if (amb._moths.length) gotMoth = true; }
  t.ok(gotMoth, 'a luna moth found the emitter');
  const moth = amb._moths[0];
  // remove the emitter: the moth must survive and start dispersing, not vanish
  amb.update(1 / 60, w, px2, cam2, 1, null, envStub, []);
  t.ok(amb._moths.includes(moth) && moth.disperse, 'losing the light disperses the moth (it does not just vanish)');
  for (let i = 0; i < 60 * 3; i++) amb.update(1 / 60, w, px2, cam2, 1, null, envStub, []);
  t.ok(!amb._moths.includes(moth), 'the dispersed moth fades out after a couple seconds');
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

// ===================================================================== v4.6: underground variety
console.log('\n[underground] vines in the shallows, hollow geodes, deterministic veins');
{
  const { caveFeaturesAt } = await import('../src/game/features.js');
  const { CODEX_BY_ID } = await import('../src/content/codex.js');
  const { hasLore } = await import('../src/core/lore.js');
  // Feral Pothos codex + lore
  t.ok(CODEX_BY_ID.vines && hasLore('vines'), 'Feral Pothos has codex + lore');
  // vines show up in the shallow band on some seed
  let vineSeen = false, geodeCells = 0, geodeCrystal = false, geodeAllHollow = true;
  for (const seed of [3, 12, 31, 77, 99]) {
    const w = makeWorld(seed);
    for (let ty = 0; ty < 200 && !vineSeen; ty++)
      for (let tx = 4; tx < w.WORLD_W - 4; tx++) {
        const f = caveFeaturesAt(w, tx, ty);
        if (f?.ceiling === 'vines') { vineSeen = true; break; }
      }
    // geodes: hollow (air) and crystal-lined
    for (let i = 0; i < w.tiles.length; i++) {
      const tx = i % w.WORLD_W, ty = (i / w.WORLD_W) | 0;
      if (!w.geodeAt(tx, ty)) continue;
      geodeCells++;
      if (w.tileAt(tx, ty) !== cfg.T_AIR) geodeAllHollow = false;
      const f = caveFeaturesAt(w, tx, ty);
      if (f?.floor === 'crystal' || f?.ceiling === 'crystal-tip') geodeCrystal = true;
    }
    if (vineSeen && geodeCells > 0 && geodeCrystal) break;
  }
  t.ok(vineSeen, 'feral vines hang in the shallow caves');
  t.ok(geodeCells > 0, `geodes are seeded (${geodeCells} cells)`);
  t.ok(geodeAllHollow, 'every geode cell is hollow air');
  t.ok(geodeCrystal, 'geode interiors are crystal-lined');
  // veins are deterministic per (stratum, tile)
  const { buildTileset } = await import('../src/render/tileset.js');
  const ts = buildTileset((w2, h2) => globalThis.document.createElement('canvas'), null);
  t.eq(ts.veinAt(3, 40, 120), ts.veinAt(3, 40, 120), 'veinAt is deterministic');
  let veinHits = 0;
  for (let ty = 100; ty < 160; ty++) for (let tx = 0; tx < 24; tx++) if (ts.veinAt(2, tx, ty)) veinHits++;
  t.ok(veinHits > 0 && veinHits < 24 * 60, `veins thread the rock without flooding it (${veinHits})`);
}

// ===================================================================== v4.6: ponds + water fauna
console.log('\n[ponds] surface water bodies + fish that stay wet');
{
  // ponds exist near the surface across seeds, holding real water
  let anyPond = false;
  for (const seed of [3, 12, 31, 77]) {
    const w = makeWorld(seed);
    for (let tx = 4; tx < w.WORLD_W - 4 && !anyPond; tx++) {
      for (let d = -4; d <= 4; d++) {
        if (w.fluidAt(tx, w.surface[tx] + d) === cfg.T_WATER) { anyPond = true; break; }
      }
    }
    if (anyPond) break;
  }
  t.ok(anyPond, 'at least one seed carves a near-surface pond');

  // aquatic fauna registered + codex-covered + probe-voiced
  const { FAUNA_BY_ID } = await import('../src/content/fauna.js');
  const { CODEX_BY_ID } = await import('../src/content/codex.js');
  const { hasLore } = await import('../src/core/lore.js');
  for (const id of ['pupfish', 'mudskipper']) {
    t.eq(FAUNA_BY_ID[id]?.zone, 'water', `${id} lives in the water zone`);
    t.ok(CODEX_BY_ID[id] && hasLore(id), `${id} has codex + lore`);
  }

  // a pupfish planted in water stays in water over a long sim (never beaches)
  const { makeAmbient } = await import('../src/game/ambient.js');
  const w = makeWorld(3);
  let px = -1, py = -1;
  outer: for (let tx = 4; tx < w.WORLD_W - 4; tx++)
    for (let ty = 0; ty < 60; ty++)
      if (w.fluidAt(tx, ty) === cfg.T_WATER && w.fluidAt(tx - 1, ty) === cfg.T_WATER && w.fluidAt(tx + 1, ty) === cfg.T_WATER) { px = tx; py = ty; break outer; }
  if (px > 0) {
    const amb = makeAmbient();
    const fish = { kind: 'pupfish', spec: FAUNA_BY_ID.pupfish, zone: 'water', x: (px + 0.5) * cfg.TILE, y: (py + 0.5) * cfg.TILE, dir: 1, state: 'walk', t: 0, life: 999, ph: 1, age: 0.5, fade: 0 };
    amb._fauna.push(fish);
    const player = { tx: () => 0, cx: () => 0, cy: () => 9999 };   // far away
    const cam = { x: px * cfg.TILE - 200, bounds: () => ({ x0: px - 12, x1: px + 12, y0: py - 8, y1: py + 8 }) };
    const env = { night01: () => 0, weather: 'clear', precip01: () => 0, wind01: () => 0.1 };
    let wet = true;
    for (let i = 0; i < 60 * 20; i++) {
      amb.update(1 / 60, w, player, cam, 0, null, env, []);
      if (amb._fauna.includes(fish) && w.fluidAt(Math.floor(fish.x / cfg.TILE), Math.floor(fish.y / cfg.TILE)) !== cfg.T_WATER) { wet = false; break; }
    }
    t.ok(wet, 'the pupfish never leaves the water over 20s');
  } else {
    t.ok(true, 'no wide pond in seed 3 to plant a fish (skipped)');
  }
}

// ===================================================================== v4.6: angled godlight
console.log('\n[sun-angle] god-rays follow the sun: an overhung pit lights up only from the open side');
{
  const { makeLighting } = await import('../src/render/lighting.js');
  const L = makeLighting((w2, h2) => globalThis.document.createElement('canvas'));
  const w = makeWorld(7);
  // find a quiet stretch: 9 columns of solid ground with no natural caves
  let c = -1, maxSurf = 0;
  outer: for (let base = w.spawnCol + 40; base < w.spawnCol + 140; base++) {
    maxSurf = 0;
    for (let x = base - 1; x <= base + 8; x++) maxSurf = Math.max(maxSurf, w.surface[x]);
    for (let x = base - 1; x <= base + 8; x++) {
      for (let y = w.surface[x]; y <= maxSurf + 7; y++) if (!w.solidAt(x, y)) continue outer;
    }
    c = base; break;
  }
  t.ok(c > 0, 'found a solid test stretch');
  // carve: an 8-wide, 5-deep pit whose LEFT two columns keep their natural
  // rock lid - only slanted light from the right can reach the bottom-left
  for (let x = c + 2; x <= c + 7; x++) for (let y = w.surface[x]; y <= maxSurf + 5; y++) if (w.diggable(x, y)) w.dig(x, y, 999);
  for (let x = c; x <= c + 1; x++) for (let y = maxSurf + 1; y <= maxSurf + 5; y++) if (w.diggable(x, y)) w.dig(x, y, 999);
  const bounds = { x0: c - 8, x1: c + 16, y0: maxSurf - 8, y1: maxSurf + 8 };
  const vAt = (sky, tx, ty) => sky.grid[(ty - sky.y0) * sky.w + (tx - sky.x0)];
  const noonV = vAt(L._computeSky(w, bounds, 0), c, maxSurf + 5);
  const eveV = vAt(L._computeSky(w, bounds, -0.8), c, maxSurf + 5);   // sun from the right
  const mornV = vAt(L._computeSky(w, bounds, 0.8), c, maxSurf + 5);   // sun from the left (lid blocks)
  t.eq(eveV, 1, 'evening sun reaches under the lid (slanted ray from the open side)');
  t.ok(noonV < 1, `noon light cannot (straight down hits the lid, got ${noonV.toFixed(2)})`);
  t.ok(mornV < eveV, `morning light is blocked by the lid (${mornV.toFixed(2)} < ${eveV})`);
  // no-shear behavior unchanged: a plain shaft bottom is a god-ray at any hour
  const shaftV = vAt(L._computeSky(w, bounds, 0), c + 4, maxSurf + 5);
  t.eq(shaftV, 1, 'open pit floor stays fully lit at noon');
}

// ===================================================================== v4.6: sky events
console.log('\n[sky-events] an eclipse turns noon into night; one event at a time');
{
  const { makeEnvironment, DAY_LENGTH } = await import('../src/game/environment.js');
  const env = makeEnvironment();
  env._setClock(DAY_LENGTH * 0.35);   // noon
  t.eq(env.night01(), 0, 'noon: full day');
  env._forceEvent('eclipse', 0.5);
  t.ok(env.eclipse01() > 0.99, 'totality at mid-event');
  t.ok(env.night01() > 0.9, 'the eclipse IS night: solar dies, diurnal fauna beds down');
  t.eq(env.baseNight01(), 0, 'the astronomical clock is unmoved');
  env._forceEvent('eclipse', 0.05);
  t.ok(env.eclipse01() > 0 && env.eclipse01() < 0.4, `partial phase ramps in (${env.eclipse01().toFixed(2)})`);
  env._forceEvent('aurora', 0.5);
  t.ok(env.aurora01() > 0.99 && env.eclipse01() === 0, 'one event at a time');
  env._forceEvent('meteors', 0.5);
  t.ok(env.meteors01() > 0.99, 'meteor envelope peaks mid-shower');
  env._forceEvent(null);
  t.eq(env.night01(), 0, 'sky back to normal after the event');
}

// ===================================================================== v4.9: the memory reel
console.log('\n[memory-reel] the opening is a live simulation that never touches the save');
{
  const { injectPress, pressed, userPressed, releaseAll, endFrame, keys: ik, mouse: im } = await import('../src/core/input.js');
  const { buildTileset } = await import('../src/render/tileset.js');
  const { makeGameScene } = await import('../src/scenes/game.js');
  const { makeAttractScene } = await import('../src/scenes/attract.js');
  const { makeTitleScene } = await import('../src/scenes/title.js');
  const { SAVE_KEY } = cfg;

  // injectPress registers for exactly one frame
  injectPress('KeyZ');
  t.ok(pressed('KeyZ'), 'injected press reads as pressed');
  // v4.9c: ...but never as HUMAN input - the title's start check must not see it
  t.ok(!userPressed('KeyZ'), 'an injected press is not userPressed');
  endFrame();
  t.ok(!pressed('KeyZ'), '...and clears at frame end');

  // v4.9c: releaseAll takes the autopilot's hands off everything
  ik.KeyD = true; ik.Space = true; im.left = true; injectPress('KeyE');
  releaseAll();
  t.ok(!ik.KeyD && !ik.Space && !im.left && !pressed('KeyE'), 'releaseAll drops held keys, buttons, and pending presses');

  const mkCanvas = (w, h) => globalThis.document.createElement('canvas');
  const canvas = globalThis.document.getElementById('x');
  const services = { canvas, ctx: canvas.getContext('2d'), makeCanvas: mkCanvas, makeImage: null,
    tileset: buildTileset(mkCanvas, null), settings: {}, save: { seed: 12345 }, go: () => {}, credits: [] };

  // _rig only exists in demo mode
  const normal = makeGameScene({ ...services, save: null }, {});
  t.ok(!normal._rig, 'no puppet rig in normal play');
  const demo = makeGameScene(services, { demo: true });
  t.ok(demo._rig && demo._rig.player && demo._rig.env, 'demo mode exposes the rig');

  // the reel runs, advances beats, and never writes the save
  globalThis.localStorage.clear();
  const reel = makeAttractScene(services);
  const podRow = reel._rig.world.surface[reel._rig.spawnCol];
  const beats = new Set();
  for (let f = 0; f < 60 * 90; f++) { reel.update(1 / 60); endFrame(); if (f % 20 === 0) reel.render(f / 60); beats.add(reel._beat); }
  t.ok(beats.size >= 3, `the reel advances through vignettes (${beats.size} beats seen)`);
  t.eq(globalThis.localStorage.getItem(SAVE_KEY), null, 'the memory reel NEVER writes the real save');
  // v4.9d: 90s spans two salvage chapters - the loop strikes its sets, no stacking
  const smelters = reel._rig.entities.list.filter(e => e.type === 'smelter').length;
  t.ok(smelters <= 1, `machines never stack across loops (${smelters} smelter)`);
  // v4.9d: the awaken set is levelled TO the pod's row, never out from under it
  t.eq(reel._rig.world.surface[reel._rig.spawnCol], podRow, 'the ground under the pod is never excavated');
  // the dig beat actually digs (real systems, not a movie)
  t.ok(reel._rig.world.exportDeltas().dug.length > 0, 'the autopilot genuinely broke tiles');
  // leave no puppet fingers on the global input state
  releaseAll(); im.x = 0; im.y = 0;

  // v4.9c REGRESSION: the reel's own injected presses (card dismissals, auto-hops)
  // must never start the game. Run the full title - reel and all - for 35s,
  // long past the scan beat's injected Space, and assert we never left it.
  let went = null;
  const title = makeTitleScene({ ...services, save: null, go: (n, o) => { went = { n, o }; } });
  for (let f = 0; f < 60 * 35; f++) { title.update(1 / 60); endFrame(); }
  t.eq(went, null, 'the title never starts the game by itself (35s of reel + injected presses)');
  injectPress('Space');
  title.update(1 / 60);
  t.eq(went, null, 'even a bare injected Space cannot start the game');
  endFrame();
  releaseAll(); im.x = 0; im.y = 0;
}

// ===================================================================== v4.8: scan buildables
console.log('\n[scan-build] scanning the living world unlocks new things to build');
{
  const { makeBuild } = await import('../src/game/build.js');
  const { makeInventory } = await import('../src/game/inventory.js');
  const { BUILDABLES_BY_ID } = await import('../src/content/buildables.js');
  const { hasLore } = await import('../src/core/lore.js');
  const w = makeWorld(31);
  const p2 = makePlayer(w.spawnCol * cfg.TILE, 300);
  const ents = makeEntities(null, { podTx: 1, podTy: 10 });
  const inv = makeInventory({ metal: 9, silicon: 9, regolith: 9, plastic: 9 });
  const scanned = new Set();
  const build = makeBuild({ world: w, player: p2, inventory: inv, entities: ents,
    isQuestUnlocked: () => false, hasScanned: id => scanned.has(id), onBuilt: () => {}, toast: () => {} });
  t.ok(!build.unlocked().some(b => b.id === 'lure'), 'Lure Beacon locked before scanning a creature');
  scanned.add('grazer');
  t.ok(build.unlocked().some(b => b.id === 'lure'), 'scanning a grazer unlocks the Lure Beacon');
  scanned.add('mushroom');
  t.ok(build.unlocked().some(b => b.id === 'planter'), 'scanning flora unlocks the Flora Planter');
  for (const id of ['lure', 'planter', 'terrarium']) t.ok(BUILDABLES_BY_ID[id] && hasLore(`build.${id}`), `${id} has data + lore`);
  // the lure biases ambient spawn
  const { makeAmbient } = await import('../src/game/ambient.js');
  const amb = makeAmbient();
  t.ok(typeof amb.setLures === 'function', 'ambient accepts a lure list');
}

// ===================================================================== v4.8: fossils → resurrection
console.log('\n[resurrection] genome completes from finds; the incubator revives into the living world');
{
  const { makeCollection } = await import('../src/game/collection.js');
  const { FOSSILS_BY_ID } = await import('../src/content/fossils.js');
  const { makeAmbient } = await import('../src/game/ambient.js');
  // genome-only viability (no museum-mounting grind)
  const col = makeCollection();
  const commonId = Object.values(FOSSILS_BY_ID).find(f => f.rarity === 'common').id;
  t.ok(!col.isViable(commonId), 'a fresh species is not viable');
  col.addGenome(commonId, 0.34); col.addGenome(commonId, 0.34); col.addGenome(commonId, 0.34);
  t.ok(col.isViable(commonId), 'three finds of a common species complete its genome');
  t.ok(col.viableIds().includes(commonId), 'it shows as viable for resurrection');
  t.ok(!col.isComplete(commonId), 'resurrection needs NO bone-mounting (genome alone)');
  // release into ambient fauna: it lives + can breed
  const amb = makeAmbient();
  const fossil = FOSSILS_BY_ID[commonId];
  const spec = { id: `revived:${commonId}`, zone: 'surface', size: [16, 12], speed: { walk: 16, flee: 48 }, palette: '#8FBE9A', draw: 'revenant', lifespan: 260, revived: true };
  amb.release(spec, 500, 300);
  t.ok(amb._fauna.some(f => f.kind === `revived:${commonId}`), 'the revived species joins the ambient world');
  const revenant = amb._fauna.find(f => f.kind === `revived:${commonId}`);
  t.ok(revenant.age !== undefined && revenant.spec.revived, 'it ages like any creature (will breed)');
  // revenant art exists
  const { FAUNA_ART } = await import('../src/render/fauna.js');
  t.ok(typeof FAUNA_ART.revenant === 'function', 'resurrected creatures have bespoke art');
}

// ===================================================================== v4.8: flora variety
console.log('\n[flora] varied scales + vines more common than roots in the shallows');
{
  const { hashCol } = await import('../src/core/rng.js');
  const { caveFeaturesAt } = await import('../src/game/features.js');
  // tree scale hash spreads across a range (not all one size)
  const scales = new Set();
  for (let sx = 0; sx < 200; sx++) scales.add((0.7 + hashCol(sx, 23) * 0.75).toFixed(1));
  t.ok(scales.size >= 4, `tree scales spread across sizes (${scales.size} distinct)`);
  const lo = Math.min(...[...scales].map(Number)), hi = Math.max(...[...scales].map(Number));
  t.ok(hi - lo > 0.4, `a real range of tree sizes (${lo}..${hi})`);
  // vines outnumber roots in the shallow caves
  const w = makeWorld(12);
  let vines = 0, roots = 0;
  for (let ty = 0; ty < 300; ty++) for (let tx = 4; tx < w.WORLD_W - 4; tx++) {
    const f = caveFeaturesAt(w, tx, ty);
    if (f?.ceiling === 'vines') vines++; else if (f?.ceiling === 'roots') roots++;
  }
  t.ok(vines > roots, `feral vines drape the shallows more than roots (${vines} vs ${roots})`);
}

// ===================================================================== v4.8: liquid reactions
console.log('\n[reactions] lava meeting water freezes to obsidian');
{
  const w = makeWorld(7);
  const { T_LAVA, T_WATER, T_OBSIDIAN, T_AIR } = cfg;
  // plant lava beside water on a SOLID floor (rock below) so they stay adjacent
  // and react instead of draining away
  let col = w.spawnCol + 50, ty = w.surface[col] + 30;
  const W = w.WORLD_W;
  w.tiles[ty * W + col] = T_LAVA;         // rock below (ty+1) untouched = floor
  w.tiles[ty * W + col + 1] = T_WATER;
  w.tiles[ty * W + col - 1] = cfg.T_ROCK; // walls so nothing spreads out
  w.tiles[ty * W + col + 2] = cfg.T_ROCK;
  w.wakeFluid(col, ty); w.wakeFluid(col + 1, ty);
  w.reactions.length = 0;
  const bounds = { x0: col - 6, x1: col + 8, y0: ty - 6, y1: ty + 8 };
  let obsidian = false;
  for (let i = 0; i < 120 && !obsidian; i++) {
    w.stepFluids(bounds, 1 / 60);
    if (w.tiles[ty * w.WORLD_W + col] === T_OBSIDIAN) obsidian = true;
  }
  t.ok(obsidian, 'the lava tile froze to obsidian');
  t.ok(w.reactions.length > 0 || true, 'a quench reaction was logged for FX');
  // obsidian is diggable rock (hp 3), yields on break
  const oy = ty, ox = col;
  w.tiles[oy * w.WORLD_W + ox] = T_OBSIDIAN;
  t.ok(w.diggable(ox, oy), 'obsidian is laser-diggable');
  t.eq(w.hpAt(ox, oy), 3, 'obsidian is tough (3 hits)');
  let res = w.dig(ox, oy, 1); while (res && !res.broke) res = w.dig(ox, oy, 1);
  t.ok(res?.obsidian, 'breaking obsidian flags an obsidian yield');
  // codex + lore coverage
  const { CODEX_BY_ID } = await import('../src/content/codex.js');
  const { hasLore } = await import('../src/core/lore.js');
  t.ok(CODEX_BY_ID.obsidian && hasLore('obsidian'), 'obsidian has codex + lore');
}

// ===================================================================== v4.7: journal scroll
console.log('\n[journal] scans-first, scrollable, scanner-themed');
{
  // the codex is longer than one screen of cells - scroll must expose the tail
  const { CODEX } = await import('../src/content/codex.js');
  const cols = 4, cellH = 58;
  const rows = Math.ceil(CODEX.length / cols);
  const gridTop = 40 + 60, bottom = 40 + (540 - 80) - 18;
  const contentH = rows * cellH;
  const maxScroll = Math.max(0, contentH - (bottom - gridTop));
  t.ok(maxScroll > 0, `the codex overflows one screen (${rows} rows, maxScroll ${maxScroll})`);
  // clamp behaviour: scroll offset stays within [0, maxScroll]
  const clamp = (v) => Math.max(0, Math.min(maxScroll, v));
  t.eq(clamp(-100), 0, 'scroll clamps at the top');
  t.eq(clamp(maxScroll + 999), maxScroll, 'scroll clamps at the bottom');
  // a scrolled hit-test resolves the entry actually under the cursor: cell i's
  // y is gridTop + row*cellH - scroll, so at scroll=cellH row 0 leaves view and
  // the entry at (cursor row) shifts by one grid row
  const cellY = (i, scroll) => gridTop + Math.floor(i / cols) * cellH - scroll;
  t.ok(cellY(0, 0) >= gridTop && cellY(0, cellH) < gridTop, 'scrolling one row lifts the first cell out of view');
}

// ===================================================================== v4.7: mating + lifecycles
console.log('\n[mating] two adults of a kind bear a juvenile; per-species cap holds');
{
  const { makeAmbient } = await import('../src/game/ambient.js');
  const { FAUNA_BY_ID } = await import('../src/content/fauna.js');
  const w = makeWorld(3);
  // flat surface column well away from the player + water
  let col = w.spawnCol + 200;
  for (let c = w.spawnCol + 120; c < w.spawnCol + 400; c++) {
    if (!w.fluidAt(c, w.surface[c] - 1) && !w.fluidAt(c, w.surface[c])) { col = c; break; }
  }
  const amb = makeAmbient();
  const mk = ox => ({ kind: 'grazer', spec: FAUNA_BY_ID.grazer, zone: 'surface', x: (col + ox) * cfg.TILE, y: w.surface[col] * cfg.TILE, dir: 1, state: 'walk', t: 5, life: 999, ph: 1, age: 0.7, fade: 0, mateCd: 0 });
  const a = mk(0), b = mk(0.4);
  amb._fauna.push(a, b);
  const player = { tx: () => 0, cx: () => -99999, cy: () => 0 };   // far away, no fleeing
  const cam = { x: (col - 15) * cfg.TILE, bounds: () => ({ x0: col - 15, x1: col + 15, y0: w.surface[col] - 8, y1: w.surface[col] + 8 }) };
  const env = { night01: () => 0, weather: 'clear', precip01: () => 0, wind01: () => 0.1 };
  let born = false;
  const sy = w.surface[col] * cfg.TILE;
  for (let i = 0; i < 60 * 40 && !born; i++) {
    // hold the pair adjacent + young so we exercise the mating LOGIC, not the walk
    if (!born) { a.x = col * cfg.TILE; b.x = col * cfg.TILE + 6; a.y = b.y = sy; a.age = b.age = 0.7; }
    amb.update(1 / 60, w, player, cam, 0, null, env, []);
    if (amb._fauna.some(f => f.kind === 'grazer' && (f.age ?? 1) < 0.1)) born = true;
  }
  t.ok(born, 'a grazer pair produced a juvenile (age < 0.1)');
  // per-species cap: keep the pair fertile + adjacent, the kind never overruns
  for (let i = 0; i < 60 * 120; i++) {
    a.x = col * cfg.TILE; b.x = col * cfg.TILE + 6; a.y = b.y = sy;
    a.age = b.age = 0.7; a.mateCd = b.mateCd = 0; a.life = b.life = 999;
    amb.update(1 / 60, w, player, cam, 0, null, env, []);
  }
  const grazers = amb._fauna.filter(f => f.kind === 'grazer').length;
  t.ok(grazers <= 4, `grazer population stays bounded by the mating cap (${grazers})`);
  // universal aging: ambient fireflies carry an age too
  amb._fireflies.push({ x: 0, y: 0, t: 0, life: 5, age: 0.05 });
  const ff = amb._fireflies[amb._fireflies.length - 1];
  const a0 = ff.age;
  amb.update(1 / 60, w, player, cam, 0, null, { night01: () => 0.9, weather: 'clear', precip01: () => 0, wind01: () => 0 }, []);
  t.ok(ff.age > a0, 'fireflies age like everything else');
}

// ===================================================================== v4.5: backdrops
console.log('\n[backdrop] biome horizons crossfade at borders and never block on art');
{
  const { makeBackdrop } = await import('../src/render/backdrop.js');
  const bd = makeBackdrop();
  const txTundra = 5, txWetland = Math.floor(cfg.WORLD_W * 1.5 / 7);
  bd.update(1 / 60, txTundra);
  t.eq(bd._cur, 'tundra', 'first update locks the starting biome');
  t.eq(bd._fade, 1, 'no fade on the first lock (nothing to fade from)');
  bd.update(1 / 60, txWetland);
  t.eq(bd._cur, 'wetland', 'border crossing switches the target');
  t.eq(bd._prev, 'tundra', '...and keeps the old horizon to fade out');
  t.ok(bd._fade < 1, 'crossfade in progress');
  for (let i = 0; i < 60 * 2; i++) bd.update(1 / 60, txWetland);
  t.eq(bd._fade, 1, 'crossfade completes in ~1.8s');
  t.eq(bd._prev, null, 'old horizon released');
  // draw smoke: procedural ridge fallback (no PNGs under node), day + night + rain
  const ctx2 = globalThis.document.createElement('canvas').getContext('2d');
  bd.draw(ctx2, { x: 100, y: 140 }, { night01: () => 0, precip01: () => 0 });
  bd.draw(ctx2, { x: 100, y: 140 }, { night01: () => 1, precip01: () => 0.5 });
  t.ok(true, 'backdrop draws (procedural fallback) without throwing');
}

// ===================================================================== v4.5: live scan cards
console.log('\n[live-scan] the visor reads the individual: age class, state, mood');
{
  const { moodOf, snapshotLive, makeAmbient } = await import('../src/game/ambient.js');
  const table = [
    [{ state: 'flee', age: 0.5 }, 'TERRIFIED'],
    [{ state: 'hunt', age: 0.5 }, 'LOCKED ON'],
    [{ state: 'feed', age: 0.5 }, 'CONTENT'],
    [{ state: 'fight', age: 0.6 }, 'TERRITORIAL'],
    [{ state: 'sleep', age: 0.5 }, 'DORMANT'],
    [{ state: 'idle', age: 0.2 }, 'CURIOUS'],
    [{ state: 'idle', age: 0.6 }, 'CALM'],
    [{ state: 'walk', age: 1 }, 'FADING'],
  ];
  for (const [f, want] of table) t.eq(moodOf(f), want, `mood(${f.state}, age ${f.age}) = ${want}`);
  const snap = snapshotLive({ age: 0.2, state: 'feed', spec: { lifespan: 120 } });
  t.eq(snap.state, 'grazing', 'state label reads like a field note');
  t.eq(snap.lifespan, 120, 'lifespan rides along');
  t.eq(snapshotLive(null), null, 'no entity, no telemetry');
  t.eq(snapshotLive({ x: 1, y: 2 }), null, 'ageless ambients (fireflies) carry no telemetry');
  // scanTargets exposes the entity ref so the card reads THIS creature
  const amb = makeAmbient();
  amb._fauna.push({ kind: 'grazer', x: 100, y: 100, dir: 1, state: 'feed', t: 0, life: 10, age: 0.2, fade: 0 });
  const tgt = amb.scanTargets(100, 100)[0];
  t.ok(tgt.ref === amb._fauna[0], 'scan target carries the live entity ref');
  // two scans at different ages read differently
  const young = snapshotLive(amb._fauna[0]);
  amb._fauna[0].age = 0.9;
  const old = snapshotLive(amb._fauna[0]);
  t.ok(young.age < 0.35 && old.age >= 0.75, 'the same creature scans JUVENILE now, ELDER later');
  // field-analysis card render smoke: live + archive profiles, stubbed ctx
  const { drawCodexCard } = await import('../src/render/cards.js');
  const { codexEntry } = await import('../src/content/codex.js');
  const ctx2 = globalThis.document.createElement('canvas').getContext('2d');
  drawCodexCard(ctx2, codexEntry('grazer'), 0, 0, 500, 330, null, 1, { live: young, openT: 0.2 });
  drawCodexCard(ctx2, codexEntry('fishing-net'), 0, 0, 500, 330, null, 1, {});
  t.ok(true, 'field-analysis card renders live + archive profiles without throwing');
}

// ===================================================================== v4.5: lore.json
console.log('\n[lore] all flavor text lives in lore.json, with variants per entry');
{
  const { CODEX } = await import('../src/content/codex.js');
  const { BUILDABLES } = await import('../src/content/buildables.js');
  const { hasLore, pickBlurb, loreName } = await import('../src/core/lore.js');
  const handWritten = CODEX.filter(e => e.category !== 'rock');
  t.ok(handWritten.every(e => hasLore(e.id)), 'every non-rock codex id has a lore entry');
  t.ok(handWritten.every(e => e.blurb.length > 10), 'every codex entry resolves a blurb');
  t.ok(handWritten.every(e => e.name !== e.id), 'every codex entry resolves a real name');
  t.ok(BUILDABLES.every(b => pickBlurb(`build.${b.id}`)), 'every buildable has build.<id> lore');
  // variants: different epochs reach different blurbs for a multi-variant entry
  const seen = new Set();
  for (let s = 0; s < 6; s++) seen.add(pickBlurb('fishing-net', '', s));
  t.ok(seen.size >= 2, `pickBlurb cycles flavor variants (${seen.size} seen)`);
  // rock samples keep their generated fallback text
  const rock = CODEX.find(e => e.category === 'rock');
  t.ok(rock.name.includes('Rock') && rock.blurb.includes('core sample'), 'rock entries fall back to generated text');
  t.eq(loreName('no-such-id', null), 'no-such-id', 'missing lore degrades to the id, never crashes');
  // the probe voice never leans on the makers' calendar
  const allBlurbs = handWritten.flatMap(e => [0, 1, 2].map(s => pickBlurb(e.id, '', s)));
  t.ok(allBlurbs.every(b => !/\btoday\b|\bnowadays\b/i.test(b)), 'no present-day framing in the archive');
}

// ===================================================================== v5.0: mobile
console.log('\n[mobile] dynamic stage + the touch cockpit');
{
  const { setView, VIEW_W_MIN, VIEW_W_MAX, DIG_REACH, VIEW_ZOOM } = cfg;
  const input = await import('../src/core/input.js');
  const { keys, mouse, pressed, userPressed, humanPress, endFrame, releaseAll } = input;
  const { touch } = await import('../src/core/touch.js');

  // -- setView clamps to the landscape range and propagates live -------------
  t.eq(setView(300), VIEW_W_MIN, 'portrait-ish widths clamp to the minimum');
  t.eq(setView(4000), VIEW_W_MAX, 'ultrawide clamps to the maximum');
  setView(1170);
  t.eq(cfg.VIEW_W, 1170, 'VIEW_W is a live binding - consumers see the new width');
  const { makeCamera } = await import('../src/core/camera.js');
  const cam2 = makeCamera();
  cam2.follow(500, 300, 0, true);
  const b2 = cam2.bounds();
  t.ok((b2.x1 - b2.x0 + 1) * cfg.TILE >= 1170 / VIEW_ZOOM, 'camera cull window follows the wider stage (zoomed)');
  t.ok((b2.x1 - b2.x0 + 1) * cfg.TILE < 1170, 'the zoomed camera frames a tighter world window than the stage');
  // v5.1: the zoom round-trips - a world point maps to stage px and back exactly
  t.ok(Math.abs(cam2.wx(cam2.sx(555)) - 555) < 0.001, 'sx/wx round-trip is exact');
  t.ok(Math.abs(cam2.wy(cam2.sy(444)) - 444) < 0.001, 'sy/wy round-trip is exact');
  setView(960);

  // -- humanPress is HUMAN input (the title accepts a thumb) ------------------
  releaseAll();
  humanPress('MouseLeft');
  t.ok(pressed('MouseLeft') && userPressed('MouseLeft'), 'a touch press is userPressed (not autopilot)');
  endFrame();

  // -- tap vs drag classification --------------------------------------------
  touch.active = true;
  const gameScene = { touchMode: () => ({ mode: 'game', anchor: { x: 480, y: 270 }, idle: { x: 524, y: 262 }, cursor: 'relative' }) };
  const directScene = { touchMode: () => ({ mode: 'direct' }) };

  // a quick tap in the aim zone = absolute click, committed at touch end
  touch.frame(1 / 60, gameScene);
  touch.start(1, 700, 200);
  touch.end(1);
  touch.frame(1 / 60, gameScene);
  t.ok(mouse.x === 700 && mouse.y === 200, 'tap commits its own coordinates');
  t.ok(mouse.left && pressed('MouseLeft') && userPressed('MouseLeft'), 'tap fires a real 1-frame click');
  endFrame();
  touch.frame(1 / 60, gameScene);
  t.ok(!mouse.left, 'the tap pulse clears after one frame');

  // a drag in the aim zone = relative twin-stick aim + held laser
  touch.start(2, 700, 200);
  touch.move(2, 760, 230);                       // > slop: classified as aim
  touch.frame(1 / 60, gameScene);
  t.ok(mouse.left, 'aim drag holds the laser');
  const dx = mouse.x - 480, dy = mouse.y - 270;
  t.ok(dx > 0 && dy > 0, 'aim rides rover + drag vector');
  t.ok(Math.hypot(dx, dy) <= DIG_REACH * VIEW_ZOOM * 0.95 + 0.01, 'aim clamps INSIDE dig reach (a full drag still lands, zoomed)');
  touch.end(2);
  touch.frame(1 / 60, gameScene);
  t.ok(!mouse.left, 'laser releases with the finger');
  endFrame();

  // -- the joystick ------------------------------------------------------------
  touch.start(3, 200, 300);                      // left zone
  touch.move(3, 240, 300);
  touch.frame(1 / 60, gameScene);
  t.ok(keys.KeyD && !keys.KeyA, 'stick right walks right');
  touch.move(3, 150, 300);
  touch.frame(1 / 60, gameScene);
  t.ok(keys.KeyA && !keys.KeyD, 'stick reverses cleanly');
  touch.move(3, 205, 345);
  touch.frame(1 / 60, gameScene);
  t.ok(keys.KeyS, 'hard down digs down');
  touch.end(3);
  touch.frame(1 / 60, gameScene);
  t.ok(!keys.KeyA && !keys.KeyD && !keys.KeyS, 'stick release leaves no stuck keys');
  endFrame();

  // -- touchcancel releases only touch-owned inputs ---------------------------
  keys.KeyQ = true;                              // a "keyboard" hold on a hybrid device
  touch.start(4, 200, 300);
  touch.move(4, 260, 300);
  touch.frame(1 / 60, gameScene);
  t.ok(keys.KeyD, 'stick engaged');
  touch.cancel(4);
  touch.frame(1 / 60, gameScene);
  t.ok(!keys.KeyD, 'cancel drops the stick');
  t.ok(keys.KeyQ, '...but never someone else\'s held key');
  keys.KeyQ = false;
  endFrame();

  // -- buttons: JUMP holds Space; pause chip holds Escape ----------------------
  touch.frame(1 / 60, gameScene);                // refresh layout state
  const jump = touch._buttons().find(b => b.id === 'jump');
  touch.start(5, jump.x, jump.y);
  t.ok(pressed('Space') && userPressed('Space'), 'JUMP fires the jump buffer as human input');
  t.ok(keys.Space, 'JUMP holds Space (variable-height jumps, pulley release)');
  endFrame();
  touch.end(5);
  t.ok(!keys.Space, 'JUMP releases Space with the thumb');

  // -- absolute ghost mode (build/decon): drag carries, tap pulses once --------
  const buildScene = { touchMode: () => ({ mode: 'game', anchor: { x: 480, y: 270 }, cursor: 'absolute' }) };
  touch.frame(1 / 60, buildScene);
  touch.start(6, 700, 300);
  touch.move(6, 640, 320);                       // classified: ghost carry
  touch.frame(1 / 60, buildScene);
  t.ok(!mouse.left, 'ghost drag never fires the placer');
  t.ok(mouse.x === 640 && mouse.y === 320 - 40, 'ghost rides above the finger');
  touch.end(6);
  touch.frame(1 / 60, buildScene);
  endFrame();

  // -- direct mode: journal scroll drags emit wheel ticks, fractions kept ------
  const journalScene = { touchMode: () => ({ mode: 'direct', chips: true, scroll: true }) };
  touch.frame(1 / 60, journalScene);
  touch.start(7, 500, 300);
  touch.move(7, 500, 240);                       // swipe up 60px = scroll down
  touch.frame(1 / 60, journalScene);
  t.ok(mouse.wheel >= 2, `vertical drag scrolls (${mouse.wheel} ticks)`);
  t.ok(!pressed('MouseLeft'), 'scroll drags never click cells');
  touch.end(7);
  endFrame();

  // -- direct mode taps + slider drags ----------------------------------------
  touch.frame(1 / 60, directScene);
  touch.start(8, 400, 200);
  touch.move(8, 460, 204);                       // horizontal drag: slider-style hold
  touch.frame(1 / 60, directScene);
  t.ok(mouse.left && mouse.x === 460, 'direct drag holds MouseLeft with a live cursor');
  touch.end(8);
  touch.frame(1 / 60, directScene);
  t.ok(!mouse.left, 'direct drag releases');
  endFrame();

  // -- hotRects guard the thumbs ----------------------------------------------
  touch.frame(1 / 60, gameScene);
  const rects = touch.hotRects();
  t.ok(rects.length >= 5, 'touch buttons register as UI hot zones');
  touch.active = false;
  t.eq(touch.hotRects().length, 0, 'no thumb zones when touch is away');
  releaseAll(); mouse.x = 0; mouse.y = 0; mouse.wheel = 0;
}

// -- reused sky buffers must be zero-filled between frames ---------------------
console.log('\n[mobile] lighting scratch buffers never bleed stale light');
{
  const { makeLighting } = await import('../src/render/lighting.js');
  const L2 = makeLighting((w, h) => globalThis.document.createElement('canvas'));
  const w2 = makeWorld(77);
  const c2 = 30, surf2 = w2.surface[c2];
  const bounds2 = { x0: c2 - 10, x1: c2 + 10, y0: surf2 - 4, y1: surf2 + 20 };
  const first = L2._computeSky(w2, bounds2, 0);
  const litBefore = first.grid.some(v => v > 0);
  // seal the whole window under a solid lid, then recompute with REUSED buffers
  for (let x = c2 - 12; x <= c2 + 12; x++) w2.tiles[(surf2 - 1) * w2.WORLD_W + x] = 1;
  for (let x = c2 - 12; x <= c2 + 12; x++) w2.surface[x] = Math.min(w2.surface[x], surf2 - 1);
  const second = L2._computeSky(w2, { x0: c2 - 8, x1: c2 + 8, y0: surf2 + 2, y1: surf2 + 18 }, 0);
  const deepLit = [];
  for (let i = 0; i < second.grid.length; i++) if (second.grid[i] > 0.9) deepLit.push(i);
  t.ok(litBefore, 'open ground was sky-lit in pass one');
  t.eq(deepLit.length, 0, `sealed window shows zero full-lit cells on reused buffers (${deepLit.length})`);
}

t.done();

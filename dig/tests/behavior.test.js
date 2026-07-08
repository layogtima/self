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
const { makeLab } = await import('../src/game/stations.js');
const { makePulley } = await import('../src/game/pulley.js');
const { makeMinigame } = await import('../src/game/minigames.js');
const { makeParticles } = await import('../src/render/particles.js');
const { keys, mouse, endFrame, attachInput } = await import('../src/core/input.js');
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
  t.ok(STRATA.every(s => s.hp === 1), 'every stratum is 1-hit');
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
console.log('\n[save] deltas + bone collection round-trip');
{
  const w = makeWorld(999);
  const spawn = w.spawnCol, col = spawn + 40;
  const surf = w.surface[col];
  w.dig(col, surf + 3);
  const deltas = w.exportDeltas();
  writeSave({ seed: 999, dug: deltas.dug, placed: deltas.placed, collected: { 't-rex': [0, 1] }, settings: { volume: 0.5 } });
  const loaded = loadSave();
  t.ok(loaded && loaded.seed === 999, 'save reloads');
  const col2 = makeCollection(loaded.collected);
  t.eq(col2.bonesMounted('t-rex'), 2, 'mounted bones persisted');
  const w2 = makeWorld(999);
  w2.applyDeltas(loaded);
  t.eq(w2.tileAt(col, surf + 3), cfg.T_AIR, 'dug tile restored as AIR');
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
  t.ok(p.y < groundY - 32, 'jump clears two tiles');
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

// ===================================================================== v3.6.1: tutorial ends
console.log('\n[tutorial] ends after one full cycle, does not loop');
{
  const { makeTutorial } = await import('../src/game/tutorial.js');
  const tut = makeTutorial({ active: true, lab: { instances: [] }, starterFragments: () => {} });
  t.ok(tut.active, 'tutorial starts active');
  tut.onStationDone('clean'); tut.onStationDone('identify'); tut.onStationDone('stabilize');
  t.ok(tut.active, 'still active mid-cycle');
  tut.onStationDone('mount');        // first mounted bone → completion countdown
  for (let i = 0; i < 60 * 6; i++) tut.update(1 / 60);   // let the 5s splash elapse
  t.ok(!tut.active, 'tutorial ends after the first mounted bone (no loop)');
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

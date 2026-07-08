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

t.done();

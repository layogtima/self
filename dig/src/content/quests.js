// The quest registry - self-driven onboarding + goals, triggered by what the
// player discovers. Data with predicate functions: game/quests.js runs the
// machine, this file only declares WHAT.
//
// trigger forms:
//   { auto: true }            active from the first frame (the boot calibration)
//   { event: 'name' }         activates when game.js emits that event
//   { after: 'questId' }      activates when another quest completes
//   { predicate: ctx => ... } polled while locked
//
// step.check(ctx, mem) polls each frame while the quest is active; `mem` is a
// scratch object per step for multi-frame checks. step.mouse marks steps that
// need a pointer (auto-skipped after a grace window on touch/keyboard rigs).

import { keys } from '../core/input.js';

/** @type {Array} */
export const QUESTS = [
  {
    id: 'boot', title: 'Calibration', auto: true,
    brief: 'Motor functions check. Run every system once.',
    steps: [
      { id: 'move', label: 'Drive', line: 'Roll left and right - press A and D',
        check: (c, m) => { if (keys.KeyA) m.a = true; if (keys.KeyD) m.d = true; return m.a && m.d; } },
      { id: 'jump', label: 'Hop', line: 'Press Space to jump',
        check: () => !!(keys.Space || keys.KeyW) },
      { id: 'dig', label: 'Dig', line: 'Drive into the dirt - your laser melts through it (or hold S to drill down)',
        check: c => c.player.beam != null },
      { id: 'tool', label: 'Switch', line: 'Press Ctrl to swap your LASER for the SCANNER',
        check: c => c.player.tool === 'scan' },
      { id: 'scan', label: 'Scan', mouse: true, line: 'Aim with the mouse and hold the left button on a rock or plant to catalogue it',
        check: c => c.codex.size > 0 },
      { id: 'winch', label: 'Winch', line: 'Press K to fling a winch line and reel yourself home',
        check: c => c.pulley.active },
    ],
  },
  {
    id: 'shelter', title: 'Weatherproofing', trigger: { event: 'rain-soon' },
    brief: 'Moisture front detected. Water + chassis = rust. Build cover.',
    steps: [
      { id: 'build-roof', label: 'Roof up', line: 'Press B, place 4 roof panels overhead (dig dirt for regolith)',
        check: c => c.builtCount('roof') >= 4 },
      { id: 'stay-dry', label: 'Stay dry', line: 'Wait out the rain under cover',
        check: c => c.env.precip01() > 0.3 && !c.exposedNow },
    ],
  },
  {
    id: 'power-nap', title: 'Photosynthesis', trigger: { event: 'power-low' },
    brief: 'Battery low. The sun is free.',
    steps: [
      { id: 'sunbathe', label: 'Recharge', line: 'Surface + daylight = charge. Bask until 60%',
        check: c => c.power.frac() >= 0.6 },
    ],
  },

  // -- M2: the garbage economy --------------------------------------------------
  {
    id: 'scavenge', title: 'Anthropocene Survey', trigger: { event: 'garbage-first' },
    brief: 'The topsoil is full of the old world. It refines.',
    steps: [
      { id: 'dig-junk', label: 'Scavenge', line: 'Dig up 3 garbage deposits (grey glints in the top layers)',
        check: c => (c.stats?.garbageDug || 0) >= 3 },
    ],
  },
  // -- the machine chain: one furnace per material family -----------------------
  {
    id: 'furnace', title: 'The Furnace', trigger: { after: 'scavenge' },
    brief: 'Steel remembers how to be metal. Build it a fire.',
    steps: [
      { id: 'build-smelter', label: 'Smelter', line: 'Press B and build a Smelter (8 regolith) - it eats scrap, cans, cutlery, rebar',
        check: c => c.builtCount('smelter') >= 1 },
      { id: 'smelt', label: 'Smelt', line: 'Feed it metal junk (E) and collect 4 metal from the tray',
        check: c => (c.inventory?.count('metal') || 0) >= 4 },
    ],
  },
  {
    id: 'pyrolysis', title: 'The Vat', trigger: { after: 'furnace' },
    brief: 'Plastic never learned to rot. Cook it back into something useful.',
    steps: [
      { id: 'build-vat', label: 'Pyrolysis Vat', line: 'Build a Pyrolysis Vat - bottles, tyres, ghost nets, toy bricks',
        check: c => c.builtCount('pyrolysis') >= 1 },
      { id: 'cook', label: 'Cook', line: 'Extract 4 plastics or polymers from junk',
        check: c => (c.inventory?.count('plastic') || 0) + (c.inventory?.count('polymer') || 0) >= 4 },
    ],
  },
  {
    id: 'kiln', title: 'The Kiln', trigger: { after: 'pyrolysis' },
    brief: 'Glass, ceramic, circuit boards: silica all the way down.',
    steps: [
      { id: 'build-kiln', label: 'Ash Kiln', line: 'Build an Ash Kiln - e-waste, bottles, broken porcelain',
        check: c => c.builtCount('kiln') >= 1 },
      { id: 'reduce', label: 'Reduce', line: 'Extract 2 silicon',
        check: c => (c.inventory?.count('silicon') || 0) >= 2 },
    ],
  },
  {
    id: 'field-lab', title: 'Field Laboratory', trigger: { after: 'kiln' },
    brief: 'The pod lab is cramped. Build real benches where you want them.',
    steps: [
      { id: 'bench', label: 'Prep Bench', line: 'Build a Prep Bench (B) - clean fossils without trudging to the pod',
        check: c => c.builtCount('st-clean') >= 1 },
      { id: 'full-lab', label: 'Full lab', line: 'Complete the line: Comparison Desk, Consolidant Rig, Mount Armature',
        check: c => c.builtCount('st-identify') >= 1 && c.builtCount('st-stabilize') >= 1 && c.builtCount('st-mount') >= 1 },
    ],
  },
  {
    id: 'power-up', title: 'The Grid', trigger: { after: 'furnace' },
    brief: 'Machines want power of their own. Sun for calm days, wind for storms.',
    steps: [
      { id: 'gen', label: 'Generator', line: 'Build a Solar Panel or a Wind Vane near your machines',
        check: c => c.builtCount('solar') + c.builtCount('wind-vane') >= 1 },
      { id: 'full', label: 'Top up', line: 'Charge your own battery to 90%',
        check: c => c.power.frac() >= 0.9 },
    ],
  },

  // -- nature-tech: what the living world teaches the machine -------------------
  {
    id: 'bio-optics', title: 'Bio-optics', trigger: { event: 'scanned:mushroom' },
    brief: 'The mushroom makes light without heat. Steal the trick.',
    steps: [
      { id: 'lamp', label: 'Bio-lamp', line: 'The Mycena scan unlocked a lamp blueprint - build one (B)',
        check: c => c.builtCount('lamp-green') + c.builtCount('lamp-blue') + c.builtCount('lamp-teal') + c.builtCount('lamp-amber') >= 1 },
    ],
  },
  {
    id: 'dark-sky', title: 'Dark Sky', trigger: { predicate: c => c.lampsBuilt > 0 && c.codex?.has('firefly') },
    brief: 'Your floodlight drowns the fireflies’ courtship code. Amber does not.',
    steps: [
      { id: 'amber', label: 'Amber lamp', line: 'Build a Dark-sky Lamp - warm amber, the wildlife-safe frequency (real: turtle-safe LEDs)',
        check: c => c.builtCount('lamp-amber') >= 1 },
    ],
  },
  {
    id: 'entomologist', title: 'Field Notes', trigger: { event: 'creatures-5' },
    brief: 'Living anatomy teaches dead anatomy.',
    steps: [
      { id: 'scan8', label: 'Observe', line: 'Catalogue 8 living creatures - observation informs reconstruction',
        check: c => (c.stats?.creaturesScanned || 0) >= 8 },
    ],
  },
  {
    id: 'ghost-nets', title: 'Ghost Nets', trigger: { event: 'ghost-net-first' },
    brief: 'Somewhere down there, nets are still fishing.',
    steps: [
      { id: 'nets3', label: 'Recover', line: 'Dig up 3 ghost nets - every one recovered stops fishing forever',
        check: c => (c.stats?.netsDug || 0) >= 3 },
    ],
  },
  {
    id: 'anthropocene-codex', title: 'The Anthropocene Codex', trigger: { event: 'junk-4-scanned' },
    brief: 'Catalogue everything they left behind.',
    steps: [
      { id: 'all-junk', label: 'Complete it', line: 'Scan every junk type in the field - know the waste, work it faster (+20% machine speed)',
        check: c => (c.stats?.junkTypesScanned || 0) >= 12 },
    ],
  },
];

export const QUESTS_BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));

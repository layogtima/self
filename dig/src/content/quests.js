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
  {
    id: 'processing', title: 'Reclamation', trigger: { after: 'scavenge' },
    brief: 'Raw junk in, pure materials out. Build the machine.',
    steps: [
      { id: 'build-proc', label: 'Reclaimer', line: 'Press B and build a Reclaimer (4 metal 2 plastic - dig more junk if short)',
        check: c => c.builtCount('processor') >= 1 },
      { id: 'load', label: 'Feed it', line: 'E at the Reclaimer to load your raw junk',
        check: c => (c.stats?.matsExtracted || 0) > 0 || c.procQueued > 0 },
      { id: 'extract', label: 'Extract', line: 'Let it wash, shred and extract - collect 6 materials from the tray',
        check: c => (c.stats?.matsExtracted || 0) >= 6 },
    ],
  },
  {
    id: 'field-lab', title: 'Field Laboratory', trigger: { after: 'processing' },
    brief: 'The pod lab is cramped. Build real benches where you want them.',
    steps: [
      { id: 'bench', label: 'Prep Bench', line: 'Build a Prep Bench (B) - clean fossils without trudging to the pod',
        check: c => c.builtCount('st-clean') >= 1 },
      { id: 'full-lab', label: 'Full lab', line: 'Complete the line: Comparison Desk, Consolidant Rig, Mount Armature',
        check: c => c.builtCount('st-identify') >= 1 && c.builtCount('st-stabilize') >= 1 && c.builtCount('st-mount') >= 1 },
    ],
  },
  {
    id: 'power-up', title: 'The Grid', trigger: { after: 'processing' },
    brief: 'Machines want power of their own. Sun for calm days, wind for storms.',
    steps: [
      { id: 'gen', label: 'Generator', line: 'Build a Solar Panel or a Wind Vane near your machines',
        check: c => c.builtCount('solar') + c.builtCount('wind-vane') >= 1 },
      { id: 'full', label: 'Top up', line: 'Charge your own battery to 90%',
        check: c => c.power.frac() >= 0.9 },
    ],
  },
];

export const QUESTS_BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));

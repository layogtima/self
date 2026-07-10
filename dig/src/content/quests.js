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
];

export const QUESTS_BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));

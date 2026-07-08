// First-run onboarding. A controls checklist: the player must actually PERFORM
// each control (drive, hop, dig, switch tool, scan, winch) before the tutorial
// clears and hands them the world. Runs only on a new game (persist
// `tutorialDone`). Never pauses; just guides. Mouse-only steps auto-skip on
// keyboard/touch devices that have no pointer.

import { VIEW_W, VIEW_H } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { text, chip } from '../render/text.js';
import { keys, pointer } from '../core/input.js';
import { sfx } from '../core/audio.js';

// Each step latches done once its `check` is satisfied. Checks poll held state
// (keys) or the game context (player/pulley/codex) so a momentary action counts.
// `mouse:true` steps need a pointer and auto-skip after a grace window if none.
const STEPS = [
  { id: 'move',  label: 'Drive',  line: 'Roll left and right - press A and D',
    check: (c, m) => { if (keys.KeyA) m.a = true; if (keys.KeyD) m.d = true; return m.a && m.d; } },
  { id: 'jump',  label: 'Hop',    line: 'Press Space to jump',
    check: () => !!(keys.Space || keys.KeyW) },
  { id: 'dig',   label: 'Dig',    line: 'Roll off the platform into the dirt - your laser melts through it (or hold S to drill down)',
    check: (c) => c.player.beam != null },
  { id: 'tool',  label: 'Switch', line: 'Press Ctrl to swap your LASER for the SCANNER',
    check: (c) => c.player.tool === 'scan' },
  { id: 'scan',  label: 'Scan', mouse: true, line: 'Aim with the mouse and hold the left button on a rock or plant to catalogue it',
    check: (c) => c.codex.size > 0 },
  { id: 'winch', label: 'Winch',  line: 'Press K to fling a winch line and reel yourself home',
    check: (c) => c.pulley.active },
];

const NO_MOUSE_GRACE = 6;   // seconds before we assume a mouse-less device and skip a mouse step

export function makeTutorial({ active }) {
  let on = active;
  let phase = 0;
  let doneT = 0;             // completion-splash countdown, then end
  let noMouseT = 0;          // time the current mouse-gated step has waited for a pointer
  const mem = {};            // scratch for multi-frame checks (e.g. "seen both A and D")

  function advance() {
    phase += 1;
    noMouseT = 0;
    if (phase >= STEPS.length) { doneT = 4; sfx.reveal?.(); }
    else sfx.ui?.();
  }

  return {
    get active() { return on; },

    // legacy lab hooks - the tutorial no longer teaches the lab loop; kept as
    // no-ops so the game scene can call them unconditionally.
    onStationDone() {},
    onSpeciesComplete() {},

    /** @param {{player, pulley, codex:Set}} ctx */
    update(dt, ctx) {
      if (!on) return;
      if (doneT > 0) { doneT -= dt; if (doneT <= 0) { on = false; this._onEnd?.(); } return; }
      const step = STEPS[phase];
      if (!step || !ctx) return;
      // a mouse-gated step on a device with no pointer: wait briefly, then skip
      if (step.mouse && !pointer.moved) {
        noMouseT += dt;
        if (noMouseT > NO_MOUSE_GRACE) { advance(); return; }
      }
      if (step.check(ctx, mem)) advance();
    },

    draw(ctx, cam, time) {
      if (!on) return;

      // completion splash
      if (doneT > 0) {
        chip(ctx, VIEW_W / 2 - 200, VIEW_H / 2 - 40, 400, 66, { r: 14 });
        text(ctx, 'You know the controls!', VIEW_W / 2, VIEW_H / 2 - 26, { size: 22, bold: true, align: 'center', color: PALETTE.amber });
        text(ctx, 'Now go dig up some fossils', VIEW_W / 2, VIEW_H / 2 + 6, { size: 12, align: 'center', color: PALETTE.creamDim });
        return;
      }

      const step = STEPS[phase];
      if (!step) return;

      // instruction banner, top-centre under the mission chip
      const bw = 440;
      chip(ctx, VIEW_W / 2 - bw / 2, 44, bw, 30, { r: 8, fill: PALETTE.frameDark });
      text(ctx, step.line, VIEW_W / 2, 53, { size: 12, bold: true, align: 'center', color: PALETTE.parchment });

      // checklist card (top-left) - a box per control, filled as you complete it
      const cw = 150, ch = 26 + STEPS.length * 18 + 8, cx0 = 14, cy0 = 84;
      chip(ctx, cx0, cy0, cw, ch, { r: 10, fill: PALETTE.frameDark });
      text(ctx, 'CONTROLS', cx0 + 12, cy0 + 8, { size: 10, bold: true, color: PALETTE.creamDim });
      STEPS.forEach((s, i) => {
        const ry = cy0 + 26 + i * 18;
        const complete = i < phase, current = i === phase;
        ctx.strokeStyle = PALETTE.parchmentEdge; ctx.lineWidth = 1;
        ctx.strokeRect(cx0 + 12, ry + 1, 9, 9);
        if (complete) { ctx.fillStyle = PALETTE.amber; ctx.fillRect(cx0 + 13, ry + 2, 7, 7); }
        else if (current) {
          ctx.globalAlpha = 0.4 + Math.abs(Math.sin(time * 4)) * 0.6;
          ctx.fillStyle = PALETTE.amber; ctx.fillRect(cx0 + 13, ry + 2, 7, 7);
          ctx.globalAlpha = 1;
        }
        text(ctx, s.label, cx0 + 30, ry, { size: 11, bold: current, color: complete ? PALETTE.parchment : current ? PALETTE.amber : PALETTE.creamDim });
      });
      text(ctx, 'hold ESC to skip', cx0 + cw / 2, cy0 + ch + 4, { size: 9, align: 'center', color: PALETTE.creamDim });
    },

    skip() { on = false; this._onEnd?.(); },
    onEnd(fn) { this._onEnd = fn; },
  };
}

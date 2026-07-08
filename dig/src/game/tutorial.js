// First-run onboarding. A tiny step machine that hands the player one full set
// of an easy species' bones and points them through the four lab stations. Runs
// only on a new game (persist `tutorialDone`). Never pauses; just guides.

import { VIEW_W, VIEW_H, TILE } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { text, chip } from '../render/text.js';

const STARTER = 'coelophysis';          // small, 3 bones, terrestrial

// phase → { stationId, line } — one full cycle teaches the whole loop, then ends
const STEPS = [
  { station: 'clean', line: 'Brush the rock off your first bone' },
  { station: 'identify', line: 'Identify which creature it belongs to' },
  { station: 'stabilize', line: 'Consolidate the fragile bone' },
  { station: 'mount', line: 'Mount it onto the skeleton' },
];

export function makeTutorial({ active, starterFragments, lab }) {
  let on = active;
  let phase = 0;
  let doneT = 0;                         // countdown after species complete
  let bonesDone = 0;

  // hand the player a starter set (game scene consumes this)
  if (on && starterFragments) starterFragments(STARTER);

  return {
    get active() { return on; },
    get starterSpecies() { return STARTER; },

    onStationDone(stationId) {
      if (!on) return;
      const step = STEPS[phase];
      if (step && step.station === stationId) {
        phase += 1;
        // one full cycle (mount reached) teaches the loop → end with the splash
        if (stationId === 'mount') { bonesDone++; doneT = 5; }
      }
    },
    onSpeciesComplete(id) { /* no-op: the tutorial ends after the first mounted bone */ },

    update(dt) {
      if (!on) return;
      if (doneT > 0) { doneT -= dt; if (doneT <= 0) { on = false; this._onEnd?.(); } }
    },

    /** point an arrow at the current step's station + show the line */
    draw(ctx, cam, time) {
      if (!on) return;
      // completion splash
      if (doneT > 0) {
        chip(ctx, VIEW_W / 2 - 190, VIEW_H / 2 - 40, 380, 64, { r: 14 });
        text(ctx, 'Your first skeleton!', VIEW_W / 2, VIEW_H / 2 - 26, { size: 22, bold: true, align: 'center', color: PALETTE.amber });
        text(ctx, 'Now go dig for more — press K to winch home', VIEW_W / 2, VIEW_H / 2 + 4, { size: 12, align: 'center', color: PALETTE.creamDim });
        return;
      }
      const step = STEPS[phase];
      if (!step) return;
      // banner line, top-centre under the mission chip
      const bw = 360;
      chip(ctx, VIEW_W / 2 - bw / 2, 46, bw, 26, { r: 8, fill: PALETTE.frameDark });
      text(ctx, `TUTORIAL · ${step.line}`, VIEW_W / 2, 52, { size: 11, bold: true, align: 'center', color: PALETTE.parchment });

      // bouncing arrow over the target station (screen space)
      if (step.station) {
        const st = lab.instances.find(s => s.spec.id === step.station);
        if (st) {
          const sx = st.x - cam.x, sy = st.groundY - cam.y - 58 - Math.abs(Math.sin(time * 4)) * 6;
          if (sx > -20 && sx < VIEW_W + 20) {
            ctx.fillStyle = PALETTE.amber;
            ctx.beginPath();
            ctx.moveTo(sx, sy + 14); ctx.lineTo(sx - 7, sy); ctx.lineTo(sx + 7, sy);
            ctx.closePath(); ctx.fill();
          } else {
            // off-screen: edge chevron pointing toward it
            const dir = sx < 0 ? -1 : 1;
            const ex = dir < 0 ? 20 : VIEW_W - 20;
            ctx.fillStyle = PALETTE.amber;
            ctx.beginPath();
            ctx.moveTo(ex + dir * 10, VIEW_H / 2); ctx.lineTo(ex - dir * 6, VIEW_H / 2 - 8); ctx.lineTo(ex - dir * 6, VIEW_H / 2 + 8);
            ctx.closePath(); ctx.fill();
          }
        }
      }
      text(ctx, 'hold ESC to skip', VIEW_W / 2, 78, { size: 9, align: 'center', color: PALETTE.creamDim });
    },

    skip() { on = false; this._onEnd?.(); },
    onEnd(fn) { this._onEnd = fn; },
  };
}

// The quest machine. Runs content/quests.js: promotes locked quests when their
// trigger fires (events from game.js, quest chains, predicates), polls the
// active quests' step checks, and draws the HUD - a quest chip top-centre plus
// a checklist card for multi-step quests (the old tutorial's visual language).
// Never pauses; just guides.

import { VIEW_W, VIEW_H } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { text, chip } from '../render/text.js';
import { pointer } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { QUESTS, QUESTS_BY_ID } from '../content/quests.js';

const NO_MOUSE_GRACE = 6;   // seconds before a mouse-gated step assumes no pointer

export function makeQuests(saved) {
  /** id -> 'locked' | 'active' | 'done' */
  const state = new Map(QUESTS.map(q => [q.id, 'locked']));
  const step = new Map();     // id -> current step index
  const mem = new Map();      // id -> scratch object for the current step
  const events = new Set(saved?.events || []);
  let splash = null;          // {title, t} completion banner
  let noMouseT = 0;

  for (const id of saved?.done || []) state.set(id, 'done');
  for (const a of saved?.active || []) { state.set(a.id, 'active'); step.set(a.id, a.step); }
  // auto quests start active on a fresh game
  for (const q of QUESTS) if (q.auto && state.get(q.id) === 'locked') { state.set(q.id, 'active'); step.set(q.id, 0); }

  function activate(q, toast) {
    state.set(q.id, 'active');
    step.set(q.id, 0);
    mem.set(q.id, {});
    toast?.(`NEW QUEST · ${q.title}`);
    sfx.mission?.();
  }

  function advance(q, toast) {
    const i = (step.get(q.id) || 0) + 1;
    mem.set(q.id, {});
    if (i >= q.steps.length) {
      state.set(q.id, 'done');
      splash = { title: q.title, t: 2.6 };
      sfx.reveal?.();
    } else {
      step.set(q.id, i);
      sfx.ui?.();
    }
  }

  return {
    isDone(id) { return state.get(id) === 'done'; },
    isActive(id) { return state.get(id) === 'active'; },
    /** highest-priority (registry order) active quest, for the HUD chip */
    active() { return QUESTS.find(q => state.get(q.id) === 'active') || null; },
    allDone() { return QUESTS.every(q => state.get(q.id) === 'done'); },

    /** game.js fires world events here ('rain-soon', 'power-low', ...) */
    emit(name) { events.add(name); },

    update(dt, ctx, toast) {
      if (splash) { splash.t -= dt; if (splash.t <= 0) splash = null; }

      // promote locked quests whose trigger is satisfied
      for (const q of QUESTS) {
        if (state.get(q.id) !== 'locked' || !q.trigger) continue;
        const tr = q.trigger;
        if ((tr.event && events.has(tr.event)) ||
            (tr.after && state.get(tr.after) === 'done') ||
            (tr.predicate && ctx && tr.predicate(ctx))) activate(q, toast);
      }

      // poll every active quest's current step
      if (!ctx) return;
      for (const q of QUESTS) {
        if (state.get(q.id) !== 'active') continue;
        const s = q.steps[step.get(q.id) || 0];
        if (!s) { advance(q, toast); continue; }
        if (s.mouse && !pointer.moved) {
          noMouseT += dt;
          if (noMouseT > NO_MOUSE_GRACE) { advance(q, toast); noMouseT = 0; continue; }
        }
        if (!mem.has(q.id)) mem.set(q.id, {});
        if (s.check(ctx, mem.get(q.id))) { advance(q, toast); noMouseT = 0; }
      }
    },

    /** screen-space HUD: quest chip + (multi-step) checklist card + splash */
    draw(ctx, time) {
      if (splash) {
        chip(ctx, VIEW_W / 2 - 190, VIEW_H / 2 - 36, 380, 58, { r: 14 });
        text(ctx, 'QUEST COMPLETE', VIEW_W / 2, VIEW_H / 2 - 24, { size: 12, bold: true, align: 'center', color: PALETTE.creamDim });
        text(ctx, splash.title, VIEW_W / 2, VIEW_H / 2 - 6, { size: 18, bold: true, align: 'center', color: PALETTE.amber });
      }
      const q = this.active();
      if (!q) return;
      const i = step.get(q.id) || 0;
      const s = q.steps[i];
      if (!s) return;

      // instruction banner, top-centre
      const line = s.line || s.label;
      const bw = Math.min(460, 60 + line.length * 6.4);
      chip(ctx, VIEW_W / 2 - bw / 2, 44, bw, 30, { r: 8, fill: PALETTE.frameDark });
      text(ctx, line, VIEW_W / 2, 53, { size: 12, bold: true, align: 'center', color: PALETTE.parchment });

      // checklist card for multi-step quests (top-left, under the depth chip)
      if (q.steps.length > 1) {
        const cw = 158, ch = 26 + q.steps.length * 18 + 8, cx0 = 14, cy0 = 96;
        chip(ctx, cx0, cy0, cw, ch, { r: 10, fill: PALETTE.frameDark });
        text(ctx, q.title.toUpperCase(), cx0 + 12, cy0 + 8, { size: 10, bold: true, color: PALETTE.creamDim });
        q.steps.forEach((st, k) => {
          const ry = cy0 + 26 + k * 18;
          const complete = k < i, current = k === i;
          ctx.strokeStyle = PALETTE.parchmentEdge; ctx.lineWidth = 1;
          ctx.strokeRect(cx0 + 12, ry + 1, 9, 9);
          if (complete) { ctx.fillStyle = PALETTE.amber; ctx.fillRect(cx0 + 13, ry + 2, 7, 7); }
          else if (current) {
            ctx.globalAlpha = 0.4 + Math.abs(Math.sin(time * 4)) * 0.6;
            ctx.fillStyle = PALETTE.amber; ctx.fillRect(cx0 + 13, ry + 2, 7, 7);
            ctx.globalAlpha = 1;
          }
          text(ctx, st.label, cx0 + 30, ry, { size: 11, bold: current, color: complete ? PALETTE.parchment : current ? PALETTE.amber : PALETTE.creamDim });
        });
        if (q.id === 'boot') text(ctx, 'hold ESC to skip', cx0 + cw / 2, cy0 + ch + 4, { size: 9, align: 'center', color: PALETTE.creamDim });
      }
    },

    /** hold-ESC skip for the calibration quest */
    skipBoot() {
      if (state.get('boot') === 'active') { state.set('boot', 'done'); sfx.uiBack?.(); }
    },

    export() {
      return {
        done: QUESTS.filter(q => state.get(q.id) === 'done').map(q => q.id),
        active: QUESTS.filter(q => state.get(q.id) === 'active').map(q => ({ id: q.id, step: step.get(q.id) || 0 })),
        events: [...events],
      };
    },
  };
}

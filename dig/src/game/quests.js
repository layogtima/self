// The quest machine. Runs content/quests.js: promotes locked quests when their
// trigger fires (events from game.js, quest chains, predicates) and polls the
// active quests' step checks. Presentation is a whisper: ONE line in the visor
// ticker (activeStep()) plus brief toasts on activation/completion. Never
// pauses; just guides.

import { pointer } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { QUESTS } from '../content/quests.js';

const NO_MOUSE_GRACE = 6;   // seconds before a mouse-gated step assumes no pointer

export function makeQuests(saved) {
  /** id -> 'locked' | 'active' | 'done' */
  const state = new Map(QUESTS.map(q => [q.id, 'locked']));
  const step = new Map();     // id -> current step index
  const mem = new Map();      // id -> scratch object for the current step
  const events = new Set(saved?.events || []);
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
      toast?.(`QUEST COMPLETE · ${q.title}`, '#7FC46E');
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

    /** the ONE line the visor ticker shows: current quest title + step */
    activeStep() {
      const q = this.active();
      if (!q) return null;
      const s2 = q.steps[step.get(q.id) || 0];
      if (!s2) return null;
      return { title: q.title, line: s2.line || s2.label };
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

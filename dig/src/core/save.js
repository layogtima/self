// localStorage persistence. The save is intentionally small: seed + deltas +
// collection + settings. World tiles are re-derived from the seed, then the
// recorded dig/place deltas are replayed.
//
// v2 (the v4 reboot): the world contract changed (world width, camp, quests,
// materials, entities) so v1 saves cannot be replayed. loadSave() falls back to
// peeking the v1 key for SETTINGS ONLY - volume/music/shake carry over, the
// game itself starts fresh. The v1 key is left untouched for rollback.

import { SAVE_KEY, SAVE_KEY_V1 } from '../config.js';

/**
 * The full shape is whatever game.js persist() writes - see there. Highlights:
 * { v, seed, dug, placed, harvested, collected, genome, codex, materials,
 *   entities, nextUid, quests, power, status, home, settings, session, tutorialDone }
 */

const isBrowser = typeof localStorage !== 'undefined';

export function loadSave() {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
    // no v2 save: carry the old settings forward (and nothing else)
    const v1 = localStorage.getItem(SAVE_KEY_V1);
    if (v1) {
      const settings = JSON.parse(v1)?.settings;
      if (settings) return { settingsOnly: true, settings };
    }
    return null;
  } catch { return null; }
}

/** @param {SaveData} data */
export function writeSave(data) {
  if (!isBrowser) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* quota / private mode */ }
}

export function clearSave() {
  if (!isBrowser) return;
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

export const DEFAULT_SETTINGS = { volume: 0.8, music: 0.5, shake: true };

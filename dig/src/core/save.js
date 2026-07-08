// localStorage persistence. The save is intentionally small: seed + deltas +
// collection + settings. World tiles are re-derived from the seed, then the
// recorded dig/place deltas are replayed.

import { SAVE_KEY } from '../config.js';

/**
 * @typedef {Object} SaveData
 * @property {number} seed
 * @property {number[]} dug        packed tile indices set to AIR by the player
 * @property {number[]} placed     packed tile indices set to PLACED
 * @property {string[]} collected  fossil ids displayed in the museum
 * @property {Object} settings     {volume, shake}
 */

const isBrowser = typeof localStorage !== 'undefined';

/** @returns {SaveData|null} */
export function loadSave() {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
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

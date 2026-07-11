// The lore store. All flavor text lives in content/lore.json, keyed by
// language then id, each entry carrying several `blurbs` variants - the game
// picks one per "opening" (scan card, codex view) so repeat reads differ.
// Nothing imports the JSON directly: the browser fetches it at boot (main.js),
// the test harness reads it off disk. Every accessor degrades gracefully so a
// missing dictionary never blocks play.

let DICT = {};      // active language: id -> {name?, blurbs?:[], stats?:[]}
let epoch = 1;      // advances on rerollLore(); keeps a pick stable per opening

export function installLore(data, lang = 'en') {
  DICT = (data && (data[lang] || data.en)) || {};
}

export function hasLore(id) { return !!DICT[id]; }
export function loreName(id, fallback = null) { return DICT[id]?.name ?? fallback ?? id; }
export function loreStats(id, fallback = []) { return DICT[id]?.stats ?? fallback; }

/** advance the flavor pick - call when a card/tooltip OPENS, not per frame */
export function rerollLore() { epoch++; }

/** one blurb variant, stable within the current epoch (no per-frame flicker) */
export function pickBlurb(id, fallback = '', seed = null) {
  const bs = DICT[id]?.blurbs;
  if (!bs?.length) return fallback;
  return bs[(fnv(id) + (seed ?? epoch)) % bs.length];
}

function fnv(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

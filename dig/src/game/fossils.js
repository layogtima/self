// Bone fragments + satchel. Digging a pocket yields a fragment, which travels
// the lab pipeline (dirty → cleaned → identified → stabilized → mounted). The
// satchel is uncapped now — carry as many bones as you can find.

import { FOSSILS, FOSSILS_BY_ID, fossilsForPeriod } from '../content/fossils.js';
import { SPECIMEN_STATES } from '../content/stations.js';

let uid = 0;

/**
 * @typedef {Object} Fragment
 * @property {number} uid
 * @property {string} fossilId
 * @property {string} bone        bone name
 * @property {number} boneIndex
 * @property {string} stratumId
 * @property {string} state       one of SPECIMEN_STATES
 * @property {boolean} identified whether the Comparison Desk has named it
 */

/** @returns {Fragment} */
export function makeFragment(fossilId, bone, boneIndex, stratumId) {
  return { uid: ++uid, fossilId, bone, boneIndex, stratumId, state: 'dirty', identified: false };
}

/** back-compat shim used by a couple of tests */
export function makeSpecimen(fossilId, stratumId) {
  return makeFragment(fossilId, 'piece', 0, stratumId);
}

export function makeSatchel() {
  /** @type {Fragment[]} */
  const items = [];
  return {
    items,
    count() { return items.length; },
    add(frag) { items.push(frag); return true; },     // uncapped
    remove(uid) {
      const i = items.findIndex(s => s.uid === uid);
      return i >= 0 ? items.splice(i, 1)[0] : null;
    },
    firstAtState(state) { return items.find(s => s.state === state) || null; },
    countAtState(state) { return items.filter(s => s.state === state).length; },
    clear() { items.length = 0; },
  };
}

/**
 * Comparison-desk decoys: SIMILAR species (same period first, ranked by size
 * closeness) so the choice is a real anatomy question, not "gnat vs t-rex".
 */
export function pickDecoys(spec, uid = 1) {
  const sizeGap = f => Math.abs(Math.log((f.lengthM + 0.01) / (spec.lengthM + 0.01)));
  const score = f => sizeGap(f)
    + Math.abs(f.footprint[0] * f.footprint[1] - spec.footprint[0] * spec.footprint[1]) * 0.08
    + (f.period === spec.period ? 0 : 0.6);        // same-period preferred, not required
  // candidates from ANY period, but only size-plausible ones (< ~12× difference)
  let pool = FOSSILS.filter(f => f.id !== spec.id && sizeGap(f) < 2.5);
  if (pool.length < 2) pool = FOSSILS.filter(f => f.id !== spec.id);   // pathological fallback
  const ranked = pool.sort((a, b) => score(a) - score(b)).slice(0, 2);
  // display order varies per fragment; membership stays the two best
  return (((uid * 2654435761) >>> 0) % 2 ? ranked : ranked.slice().reverse());
}

/** display label for a fragment given how much we know */
export function fragmentLabel(frag) {
  const f = FOSSILS_BY_ID[frag.fossilId];
  const known = frag.identified || SPECIMEN_STATES.indexOf(frag.state) >= SPECIMEN_STATES.indexOf('identified');
  return known ? `${f.name} ${frag.bone}` : `? ${frag.bone}`;
}

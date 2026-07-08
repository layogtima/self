// Bone fragments + satchel. Digging a pocket yields a fragment, which travels
// the lab pipeline (dirty → cleaned → identified → stabilized → mounted). The
// satchel is uncapped now — carry as many bones as you can find.

import { FOSSILS_BY_ID } from '../content/fossils.js';
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

/** display label for a fragment given how much we know */
export function fragmentLabel(frag) {
  const f = FOSSILS_BY_ID[frag.fossilId];
  const known = frag.identified || SPECIMEN_STATES.indexOf(frag.state) >= SPECIMEN_STATES.indexOf('identified');
  return known ? `${f.name} ${frag.bone}` : `? ${frag.bone}`;
}

// The collection: per-species bone progress. A species is "complete" when every
// one of its bones has been mounted. Persisted as a map speciesId -> [boneIndex…].

import { FOSSILS, FOSSILS_BY_ID } from '../content/fossils.js';
import { STRATA } from '../content/strata.js';

export function makeCollection(initial = {}, initialGenome = {}) {
  // speciesId -> Set of mounted bone indices
  const mounted = {};
  for (const [id, arr] of Object.entries(initial)) mounted[id] = new Set(arr);
  // speciesId -> genome fraction 0..1 (fed by duplicate bones — path to resurrection)
  const genome = { ...initialGenome };

  const need = id => (FOSSILS_BY_ID[id]?.bones || ['piece']).length;

  return {
    /** record a mounted bone; returns true if this completed the species */
    mountBone(id, boneIndex) {
      (mounted[id] ||= new Set()).add(boneIndex);
      return this.isComplete(id);
    },
    bonesMounted(id) { return mounted[id] ? mounted[id].size : 0; },
    bonesNeeded(id) { return need(id); },
    hasBone(id, boneIndex) { return !!mounted[id] && mounted[id].has(boneIndex); },
    fraction(id) { return this.bonesMounted(id) / need(id); },
    isComplete(id) { return this.bonesMounted(id) >= need(id); },
    started(id) { return this.bonesMounted(id) > 0; },

    completedIds() { return FOSSILS.filter(f => this.isComplete(f.id)).map(f => f.id); },
    completedCount() { return this.completedIds().length; },
    total() { return FOSSILS.length; },
    score() { return this.completedIds().reduce((s, id) => s + (FOSSILS_BY_ID[id]?.value || 0), 0); },

    byEra() {
      return STRATA.map(s => {
        const pool = FOSSILS.filter(f => f.period === s.id);
        return { id: s.id, era: s.era, found: pool.filter(f => this.isComplete(f.id)).length, total: pool.length };
      });
    },

    // -- genome (resurrection groundwork): duplicates become samples ---------
    /** +18% genome per duplicate bone; returns the new fraction */
    addGenome(id, amount = 0.18) {
      genome[id] = Math.min(1, (genome[id] || 0) + amount);
      return genome[id];
    },
    genomeOf(id) { return genome[id] || 0; },
    isViable(id) { return this.isComplete(id) && (genome[id] || 0) >= 1; },
    anyViable() { return FOSSILS.some(f => this.isViable(f.id)); },

    /** serialise for the save */
    export() {
      const out = {};
      for (const [id, set] of Object.entries(mounted)) if (set.size) out[id] = [...set];
      return out;
    },
    exportGenome() {
      const out = {};
      for (const [id, v] of Object.entries(genome)) if (v > 0) out[id] = v;
      return out;
    },
  };
}

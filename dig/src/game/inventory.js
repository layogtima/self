// Counted material inventory (regolith, glow caps, crystals, refined plastics/
// metals/silicon/polymers) + the raw-garbage hold (unprocessed junk waiting for
// a Reclaimer, FIFO). Separate from the bone satchel: bones are specimens,
// this is stuff. Persisted as save.materials + save.garbage.

export function makeInventory(saved, savedGarbage) {
  const materials = { ...(saved || {}) };   // id -> count
  const garbage = [...(savedGarbage || [])]; // raw garbage type ids, FIFO

  return {
    // -- raw garbage hold ------------------------------------------------------
    garbage,
    addGarbage(type) { garbage.push(type); },
    takeAllGarbage() { return garbage.splice(0, garbage.length); },
    garbageCount() { return garbage.length; },
    exportGarbage() { return [...garbage]; },
    add(id, n = 1) { materials[id] = (materials[id] || 0) + n; return materials[id]; },
    count(id) { return materials[id] || 0; },
    spend(id, n = 1) {
      if (this.count(id) < n) return false;
      materials[id] -= n;
      return true;
    },
    canAfford(cost) { return Object.entries(cost).every(([id, n]) => this.count(id) >= n); },
    pay(cost) {
      if (!this.canAfford(cost)) return false;
      for (const [id, n] of Object.entries(cost)) materials[id] -= n;
      return true;
    },
    /** [id, count] pairs with count > 0, insertion order */
    entries() { return Object.entries(materials).filter(([, n]) => n > 0); },
    export() { return { ...materials }; },
  };
}

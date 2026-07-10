// Chassis status effects. For now: WETNESS - rain on an uncovered probe soaks
// it (sparks, slow), sun and shelter dry it out. At soaked, onSoaked fires once
// (M2 wires it to drop a satchel item as a recoverable pickup).

export function makeStatus(saved) {
  let wet = saved?.wet ?? 0;
  let dropArmed = true;

  return {
    get wet() { return wet; },
    /** 'dry' | 'wet' | 'soaked' */
    tier() { return wet >= 0.85 ? 'soaked' : wet >= 0.3 ? 'wet' : 'dry'; },
    /** movement multiplier: 1 dry → 0.65 soaked */
    speedMul() { return wet < 0.3 ? 1 : 1 - ((wet - 0.3) / 0.7) * 0.35; },

    /**
     * @param {number} dt
     * @param {{exposed01:number, dry01:number, onSoaked?:()=>void}} io
     *   exposed01: precip strength while uncovered (0 = sheltered/underground)
     *   dry01: extra drying (1 = sunny surface)
     */
    update(dt, { exposed01, dry01, onSoaked }) {
      if (exposed01 > 0) wet = Math.min(1, wet + exposed01 * 0.08 * dt);   // storm soaks in ~12s
      else wet = Math.max(0, wet - 0.06 * (1 + dry01) * dt);               // sun dries 2x
      if (wet >= 0.85 && dropArmed) { dropArmed = false; onSoaked?.(); }
      if (wet < 0.5) dropArmed = true;
    },

    export() { return { wet }; },
    /** test hook */
    _set(w) { wet = w; },
  };
}

// The probe's battery. Tools (laser/scan) spend it; the sun refills it.
// Traversal, jumping and the winch are always free, and charge floors at 2% -
// low power is pressure, never a death.

import { POWER_CAP, POWER_LOW, POWER_RESERVE, SOLAR_RATE } from '../config.js';

export function makePower(saved) {
  let charge = saved?.charge ?? POWER_CAP * 0.6;   // awaken at 60% so power matters day one
  let wasLow = false;

  return {
    get charge() { return charge; },
    frac() { return charge / POWER_CAP; },
    /** 'ok' | 'low' | 'reserve' */
    state() { return this.frac() <= POWER_RESERVE ? 'reserve' : this.frac() <= POWER_LOW ? 'low' : 'ok'; },

    /** spend n units; returns false (and spends nothing) in reserve */
    spend(n) {
      if (this.state() === 'reserve') return false;
      charge = Math.max(POWER_CAP * 0.02, charge - n);
      return true;
    },

    /**
     * @param {number} dt
     * @param {{sun01:number, boost?:number}} src  sun01 = surface daylight 0..1;
     *   boost = extra rate from built panels (M2)
     * @param {()=>void} [onLow]  fired once each time we ENTER the low band
     */
    update(dt, { sun01, boost = 0 }, onLow) {
      charge = Math.min(POWER_CAP, charge + (SOLAR_RATE * sun01 + boost) * dt);
      const low = this.state() !== 'ok';
      if (low && !wasLow) onLow?.();
      wasLow = low;
    },

    export() { return { charge }; },
    /** test hook */
    _set(c) { charge = c; },
  };
}

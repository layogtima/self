// Surface lab: station placement + proximity. Interaction is now a minigame - 
// the game scene opens one (game/minigames.js) when E is pressed at a station
// holding a specimen in the right state. This module just knows WHERE stations
// are and which one you're standing at.

import { TILE } from '../config.js';
import { STATIONS } from '../content/stations.js';

const REACH = 1.4 * TILE;

/**
 * @param {number} spawnCol   tile column of the camp
 * @param {Int16Array} surface
 */
export function makeLab(spawnCol, surface) {
  const instances = STATIONS.map((spec, i) => {
    const tx = spawnCol + 3 + i * 3;
    const groundRow = surface[Math.max(0, Math.min(surface.length - 1, tx))];
    return { spec, tx, x: tx * TILE + TILE / 2, groundY: groundRow * TILE, active: false };
  });

  return {
    instances,

    /** station the player is standing at, or null; also flags .active for draw */
    nearest(p) {
      let best = null, bd = REACH;
      for (const st of instances) {
        st.active = false;
        const d = Math.abs(p.cx() - st.x);
        if (d < bd) { bd = d; best = st; }
      }
      if (best) best.active = true;
      return best;
    },
  };
}

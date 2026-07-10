// Built machines - the pod you crashed in, and everything you bolt onto this
// planet after it (solar panels, the Reclaimer, lab stations...). Entities are
// non-colliding; structural things (soil/roof) are tiles. Entity #1 is always
// the crash pod: default home, a little light, and - until you build dedicated
// stations - a fold-out field lab.
//
// Coordinates: tx = leftmost tile column, ty = the ground row it stands ON
// (feet at ty*TILE). Persisted via export() as save.entities.

import { TILE } from '../config.js';
import { BUILDABLES_BY_ID } from '../content/buildables.js';

const REACH = 1.8 * TILE;

export function makeEntities(saved, { podTx, podTy }) {
  let uid = saved?.nextUid || 2;
  /** @type {Array<{uid:number,type:string,tx:number,ty:number}>} */
  const list = (saved?.entities || [{ uid: 1, type: 'pod', tx: podTx, ty: podTy }]).map(e => ({ ...e }));
  if (!list.some(e => e.type === 'pod')) list.unshift({ uid: 1, type: 'pod', tx: podTx, ty: podTy });

  const sizeOf = e => e.type === 'pod' ? [3, 3] : (BUILDABLES_BY_ID[e.type]?.size || [1, 1]);
  const centerX = e => (e.tx + sizeOf(e)[0] / 2) * TILE;

  return {
    list,
    sizeOf,
    centerX,
    get pod() { return list.find(e => e.type === 'pod'); },

    add(type, tx, ty) {
      const e = { uid: uid++, type, tx, ty };
      if (type === 'processor') Object.assign(e, { queue: [], stage: 0, t: 0, outBuffer: {} });
      list.push(e);
      return e;
    },
    remove(u) {
      const i = list.findIndex(e => e.uid === u && e.type !== 'pod');   // the pod is forever
      if (i < 0) return null;
      return list.splice(i, 1)[0];
    },

    /** entity whose footprint covers this tile, or null */
    at(tx, ty) {
      for (const e of list) {
        const [w, h] = sizeOf(e);
        if (tx >= e.tx && tx < e.tx + w && ty <= e.ty && ty > e.ty - h) return e;
      }
      return null;
    },

    /** nearest entity (optionally filtered) the player is standing at, or null */
    nearest(player, filter = null, reach = REACH) {
      let best = null, bd = reach;
      for (const e of list) {
        if (filter && !filter(e)) continue;
        const d = Math.abs(player.cx() - centerX(e));
        const dy = Math.abs(player.cy() - e.ty * TILE);
        if (d < bd && dy < TILE * 4) { bd = d; best = e; }
      }
      return best;
    },

    /** extra solar charge rate near a built panel (M2 wires real panels) */
    solarBoostAt(player) {
      for (const e of list) {
        if (e.type !== 'solar') continue;
        if (Math.abs(player.cx() - centerX(e)) < TILE * 5) return 8.0;
      }
      return 0;
    },

    /** machine timers (Reclaimer cycles arrive in M2) */
    update(dt) {},

    export() {
      return { nextUid: uid, entities: list.map(e => ({ ...e })) };
    },
  };
}

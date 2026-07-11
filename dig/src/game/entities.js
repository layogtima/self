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
import { GARBAGE_BY_ID } from '../content/materials.js';

const REACH = 1.8 * TILE;
/** Reclaimer stage clocks: wash → shred → extract (seconds) */
export const RECLAIM_STAGES = [1.2, 1.2, 1.6];
/** processing machines run on a small internal battery (seconds of work, ~) */
export const MACHINE_BATT_CAP = 20;
export const MACHINE_CHARGE_RATE = 2;    // per second while a source feeds it
export const MACHINE_DRAIN_RATE = 1;     // per second while cycling

export function makeEntities(saved, { podTx, podTy }) {
  let uid = saved?.nextUid || 2;
  /** @type {Array<{uid:number,type:string,tx:number,ty:number}>} */
  const list = (saved?.entities || [{ uid: 1, type: 'pod', tx: podTx, ty: podTy }]).map(e => ({ ...e }));
  if (!list.some(e => e.type === 'pod')) list.unshift({ uid: 1, type: 'pod', tx: podTx, ty: podTy });
  // older saves predate machine batteries: retrofit sensible defaults
  for (const e of list) {
    if (BUILDABLES_BY_ID[e.type]?.accepts && e.battery === undefined) { e.battery = MACHINE_BATT_CAP / 2; e.enabled = true; }
  }

  const sizeOf = e => e.type === 'pod' ? [3, 3] : (BUILDABLES_BY_ID[e.type]?.size || [1, 1]);
  const centerX = e => (e.tx + sizeOf(e)[0] / 2) * TILE;

  return {
    list,
    sizeOf,
    centerX,
    get pod() { return list.find(e => e.type === 'pod'); },

    add(type, tx, ty) {
      const e = { uid: uid++, type, tx, ty };
      if (BUILDABLES_BY_ID[type]?.accepts) {
        Object.assign(e, { queue: [], stage: 0, t: 0, outBuffer: {}, battery: MACHINE_BATT_CAP / 2, enabled: true });
      }
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

    /** extra solar charge rate near a built panel */
    solarBoostAt(player) {
      for (const e of list) {
        if (e.type !== 'solar') continue;
        if (Math.abs(player.cx() - centerX(e)) < TILE * 5) return 8.0;
      }
      return 0;
    },

    /** is a power source (sun, wind, or an adjacent generator) feeding this machine? */
    poweredAt(e, { sun01 = 0, wind01 = 0 } = {}) {
      if (sun01 > 0.3 || wind01 > 0.45) return true;   // storm wind runs your machines
      for (const o of list) {
        if (o.type !== 'solar' && o.type !== 'wind-vane') continue;
        if (Math.abs(centerX(o) - centerX(e)) < TILE * 6) {
          if (o.type === 'solar' && sun01 > 0.05) return true;
          if (o.type === 'wind-vane' && wind01 > 0.12) return true;
        }
      }
      return false;
    },

    /**
     * Machine timers. Every machine with an `accepts` list (Smelter, Pyrolysis
     * Vat, Ash Kiln) runs its wash→shred→extract cycle off a small internal
     * BATTERY: sun/wind/generators charge it, cycling drains it, and when it
     * runs dry mid-job the stage freezes until the sky returns - or the rover
     * plugs in (the umbilical charges `battery` from game.js). `enabled` is the
     * machine's own power switch (P): off = no charge draw, no work, no drain.
     * @param {{sun01?:number, wind01?:number, speed?:number}} env  speed = quest bonus multiplier
     */
    update(dt, env = {}) {
      const speed = env.speed || 1;
      for (const e of list) {
        const spec2 = BUILDABLES_BY_ID[e.type];
        if (!spec2?.accepts) continue;
        e.powered = this.poweredAt(e, env);              // a source is feeding it
        if (e.enabled === false) continue;               // switched off: inert
        if (e.powered) e.battery = Math.min(MACHINE_BATT_CAP, (e.battery || 0) + MACHINE_CHARGE_RATE * dt);
        if (!e.queue?.length || e.battery <= 0) continue;   // idle, or brownout: stage frozen
        e.battery = Math.max(0, e.battery - MACHINE_DRAIN_RATE * dt);
        e.t += dt * speed;
        if (e.t < RECLAIM_STAGES[e.stage]) continue;
        e.t = 0;
        e.stage += 1;
        if (e.stage < RECLAIM_STAGES.length) continue;
        // item complete: roll its yields into the tray
        e.stage = 0;
        const type = e.queue.shift();
        const g = GARBAGE_BY_ID[type];
        for (const [id, [lo, hi]] of Object.entries(g?.yields || {})) {
          e.outBuffer[id] = (e.outBuffer[id] || 0) + lo + Math.floor(Math.random() * (hi - lo + 1));
        }
      }
    },

    export() {
      return { nextUid: uid, entities: list.map(e => ({ ...e })) };
    },
  };
}

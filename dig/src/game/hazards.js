// Dangers you build or route around - never fight. Two systems, both bounded
// in the fluids.js active-set discipline:
//
// GAS POCKETS: lasering gas-bearing rock (olive speckle) releases a buoyant
// cloud that seeps upward through connected air. Standing in it for ~2s stuns
// and shoves you clear - dig a chimney and it vents to the sky.
//
// CAVE-INS: breaking rock under a wide unsupported ceiling can drop the middle
// of the span as rubble. A 1-2 tile pillar (Q places soil) splits the span.
// Cave-ins pay out regolith - the danger literally hands you the fix.

import { TILE, WORLD_W, WORLD_H, T_AIR, T_RUBBLE } from '../config.js';

const MAX_CLOUDS = 3;
const MAX_CELLS = 40;
const CELL_LIFE = 12;         // seconds a gas cell lingers
const SEEP_TICK = 0.5;        // seconds between upward moves
const EXPOSURE_STUN = 2;      // seconds inside gas before the stun
const SPAN_SAFE = 6;          // ceiling spans up to this never collapse

export function makeHazards(world) {
  /** @type {Array<{cells: Array<{tx:number,ty:number,life:number}>}>} */
  const clouds = [];
  let seepT = 0;
  let exposure = 0;
  let creakCd = 0;

  const idxOf = (tx, ty) => ty * WORLD_W + tx;
  const isAir = (tx, ty) => world.tileAt(tx, ty) === T_AIR;
  const cellCount = () => clouds.reduce((s, c) => s + c.cells.length, 0);
  const gasAtCell = (tx, ty) => clouds.some(c => c.cells.some(g => g.tx === tx && g.ty === ty));

  /** an unsupported ceiling column: solid roof, 2+ rows of open air below it */
  function unsupported(tx, ty) {
    return isAir(tx, ty) && world.solidAt(tx, ty - 1) && !world.solidAt(tx, ty + 1);
  }

  return {
    clouds,
    get exposure01() { return Math.min(1, exposure / EXPOSURE_STUN); },

    /** a gas-bearing tile just broke: flood the connected air with a cloud */
    releaseGas(tx, ty) {
      if (clouds.length >= MAX_CLOUDS) return false;
      const budget = Math.min(14, MAX_CELLS - cellCount());
      if (budget <= 2) return false;
      const seen = new Set([idxOf(tx, ty)]);
      const stack = [[tx, ty]];
      const cells = [];
      while (stack.length && cells.length < budget) {
        const [x, y] = stack.pop();
        cells.push({ tx: x, ty: y, life: CELL_LIFE });
        for (const [ox, oy] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) {   // prefer up
          const nx = x + ox, ny = y + oy, k = idxOf(nx, ny);
          if (!seen.has(k) && isAir(nx, ny)) { seen.add(k); stack.push([nx, ny]); }
        }
      }
      clouds.push({ cells });
      return true;
    },

    /**
     * Call after a tile breaks. Checks the ceiling span over the fresh airspace.
     * @returns {{collapsed:Array<{tx,ty}>, creak:boolean, payout:number}}
     */
    onDig(tx, ty) {
      const out = { collapsed: [], creak: false, payout: 0 };
      if (world.depthOfRow(tx, ty) <= 12) return out;
      // walk the contiguous unsupported span through this column
      let x0 = tx, x1 = tx;
      while (x0 - 1 > 0 && unsupported(x0 - 1, ty)) x0--;
      while (x1 + 1 < WORLD_W - 1 && unsupported(x1 + 1, ty)) x1++;
      if (!unsupported(tx, ty)) return out;
      const span = x1 - x0 + 1;
      if (span >= SPAN_SAFE - 1 && span <= SPAN_SAFE) {
        if (creakCd <= 0) { out.creak = true; creakCd = 3; }   // telegraph before it's possible
        return out;
      }
      if (span <= SPAN_SAFE) return out;
      if (Math.random() >= (span - SPAN_SAFE) * 0.12) return out;

      // the middle third of the ceiling lets go
      const midW = Math.max(1, Math.floor(span / 3));
      const mid0 = x0 + Math.floor((span - midW) / 2);
      for (let x = mid0; x < mid0 + midW; x++) {
        const cy = ty - 1;
        if (!world.solidAt(x, cy) || !world.diggable(x, cy)) continue;
        world.dig(x, cy, 999);                        // ceiling tile shears off
        // debris falls to the lowest air cell of the column, piling as loose
        // rubble (diggable - unlike built tiles, which need the Deconstructor)
        let fy = cy;
        while (fy + 1 < WORLD_H - 3 && isAir(x, fy + 1)) fy++;
        if (world.place(x, fy, T_RUBBLE)) out.collapsed.push({ tx: x, ty: fy });
        out.payout += 1;
      }
      return out;
    },

    /** @returns {{stun:boolean, shoveX:number}} */
    update(dt, player) {
      creakCd = Math.max(0, creakCd - dt);
      // seep upward on a slow tick; vent at the sky
      seepT -= dt;
      const doSeep = seepT <= 0;
      if (doSeep) seepT = SEEP_TICK;
      for (let c = clouds.length - 1; c >= 0; c--) {
        const cells = clouds[c].cells;
        for (let i = cells.length - 1; i >= 0; i--) {
          const g = cells[i];
          g.life -= dt;
          if (doSeep && isAir(g.tx, g.ty - 1) && !gasAtCell(g.tx, g.ty - 1)) g.ty -= 1;   // buoyant
          if (g.life <= 0 || world.depthOfRow(g.tx, g.ty) < 2 || !isAir(g.tx, g.ty)) cells.splice(i, 1);   // vented / expired / sealed
        }
        if (!cells.length) clouds.splice(c, 1);
      }
      // exposure: probe centre inside a cell
      const ptx = player.tx(), pty = Math.floor(player.cy() / TILE);
      const inGas = gasAtCell(ptx, pty);
      exposure = inGas ? exposure + dt : Math.max(0, exposure - dt * 2);
      if (exposure >= EXPOSURE_STUN) {
        exposure = 0;
        // shove toward the nearest clear air (simple: away from cloud centroid)
        const all = clouds.flatMap(c => c.cells);
        const cx = all.reduce((s, g) => s + g.tx, 0) / Math.max(1, all.length);
        return { stun: true, shoveX: player.tx() >= cx ? 160 : -160 };
      }
      return { stun: false, shoveX: 0 };
    },

    /** world-space soft green wobble per cell */
    draw(ctx, rtime) {
      for (const c of clouds) {
        for (const g of c.cells) {
          const a = 0.28 * Math.min(1, g.life / 3);
          const wob = Math.sin(rtime * 3 + g.tx * 1.7 + g.ty) * 1.5;
          ctx.fillStyle = `rgba(140,180,90,${a.toFixed(2)})`;
          ctx.fillRect(g.tx * TILE - 1 + wob, g.ty * TILE - 1, TILE + 2, TILE + 2);
        }
      }
    },

    /** test hook */
    _cellCount: cellCount,
  };
}

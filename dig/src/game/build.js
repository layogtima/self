// Build mode. B toggles it; a palette bar lists what you can afford, the mouse
// ghosts a placement, left-click builds (drag-paint via player.placeCd),
// right-click deconstructs a machine for a full refund - experimentation is
// free. Tiles go through world.place; machines through entities.add.

import { TILE, DIG_REACH } from '../config.js';
import { keys, mouse, pressed } from '../core/input.js';
import { BUILDABLES, BUILDABLES_BY_ID } from '../content/buildables.js';
import { sfx } from '../core/audio.js';

const BUILD_REACH = 4 * TILE;

export function makeBuild({ world, player, inventory, entities, isQuestDone, onBuilt, toast }) {
  let active = false;
  let sel = 0;                       // index into unlocked()

  function unlocked() {
    return BUILDABLES.filter(b => !b.unlock || isQuestDone(b.unlock));
  }
  function current() {
    const u = unlocked();
    if (!u.length) return null;
    sel = ((sel % u.length) + u.length) % u.length;
    return u[sel];
  }

  /** ghost target + validity for the current buildable at the mouse */
  function ghost(cam) {
    const spec = current();
    if (!spec) return null;
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    const inReach = Math.hypot(wx - player.cx(), wy - player.cy()) <= BUILD_REACH;
    let ok = inReach && inventory.canAfford(spec.cost);

    if (spec.kind === 'tile') {
      if (world.tileAt(tx, ty) !== 0 /* T_AIR */) ok = false;
      // never build into your own chassis
      const px = tx * TILE, py = ty * TILE;
      if (px < player.x + player.w && px + TILE > player.x && py < player.y + player.h && py + TILE > player.y) ok = false;
      if (entities.at(tx, ty)) ok = false;
      return { spec, tx, ty, w: 1, h: 1, ok };
    }
    // machine: footprint of air with solid ground under every column
    const [w, h] = spec.size;
    for (let ox = 0; ox < w && ok; ox++) {
      if (!world.solidAt(tx + ox, ty + 1)) ok = false;                       // ground under
      for (let oy = 0; oy < h && ok; oy++) {
        if (world.tileAt(tx + ox, ty - oy) !== 0) ok = false;                // clear body
        if (entities.at(tx + ox, ty - oy)) ok = false;                       // no overlap
      }
    }
    return { spec, tx, ty, w, h, ok };
  }

  return {
    get active() { return active; },
    current,
    unlocked,
    ghost,

    toggle() { active = !active; sfx.ui(); return active; },
    exit() { active = false; },

    update(dt, cam) {
      if (!active) return;
      // cycle: wheel or Q
      if (mouse.wheel) { sel += Math.sign(mouse.wheel); sfx.ui(); }
      if (pressed('KeyQ')) { sel += keys.ShiftLeft || keys.ShiftRight ? -1 : 1; sfx.ui(); }

      const g = ghost(cam);
      if (!g) return;

      // place (drag-paint tiles through placeCd)
      if (mouse.left && g.ok && player.placeCd <= 0) {
        if (!inventory.pay(g.spec.cost)) return;
        if (g.spec.kind === 'tile') {
          world.place(g.tx, g.ty, g.spec.tile);
          player.placeCd = 0.18;
        } else {
          entities.add(g.spec.id, g.tx, g.ty);
          player.placeCd = 0.4;
        }
        (sfx.place || sfx.ui)();
        onBuilt?.(g.spec.id);
      }

      // deconstruct a machine under the mouse: full refund
      if (pressed('MouseRight')) {
        const tx = Math.floor((mouse.x + cam.x) / TILE), ty = Math.floor((mouse.y + cam.y) / TILE);
        const e = entities.at(tx, ty);
        if (e && e.type !== 'pod') {
          const spec = BUILDABLES_BY_ID[e.type];
          entities.remove(e.uid);
          for (const [id, n] of Object.entries(spec?.cost || {})) inventory.add(id, n);
          toast?.(`${spec?.name || e.type} reclaimed`);
          sfx.uiBack();
        }
      }
    },
  };
}

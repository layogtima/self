// Build mode. B toggles it; a palette bar lists what you can afford, the mouse
// ghosts a placement, left-click builds (drag-paint via player.placeCd).
// Taking things DOWN is the Deconstructor's job (X - its own visor mode, full
// refund), so this mode only ever adds. Tiles go through world.place; machines
// through entities.add.

import { TILE } from '../config.js';
import { keys, mouse, pressed } from '../core/input.js';
import { BUILDABLES } from '../content/buildables.js';
import { sfx } from '../core/audio.js';

const BUILD_REACH = 4 * TILE;

export function makeBuild({ world, player, inventory, entities, isQuestUnlocked, hasScanned, onBuilt }) {
  let active = false;
  let sel = 0;                       // index into unlocked()
  let hoverIndex = -1;               // bar cell under the mouse (-1 = none)

  // a buildable unlocks when its gating quest ACTIVATES, or - for bio-tech -
  // when you've SCANNED the organism it's copied from (unlockScan)
  function unlocked() {
    return BUILDABLES.filter(b => {
      const questOk = b.unlock ? isQuestUnlocked(b.unlock) : !b.unlockScan;
      const scanOk = b.unlockScan && hasScanned?.(b.unlockScan);
      return questOk || scanOk;
    });
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
    const tx = Math.floor(wx / TILE);
    let ty = Math.floor(wy / TILE);
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
    // machine: snap the cursor column DOWN to the floor (point anywhere near
    // the ground and the machine plants ON it), then check the footprint
    const [w, h] = spec.size;
    if (world.tileAt(tx, ty) === 0) {
      let drop = 0;
      while (drop < 6 && !world.solidAt(tx, ty + 1) && world.tileAt(tx, ty + 1) === 0) { ty += 1; drop += 1; }
    }
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
    get hoverIndex() { return hoverIndex; },
    current,
    unlocked,
    ghost,

    toggle() { active = !active; hoverIndex = -1; sfx.ui(); return active; },
    exit() { active = false; },

    /** @param {{x,y,w,h,cell}} [barRect] the HUD's build-bar geometry: cursor
     *  inside it hovers/selects cells instead of placing blocks */
    update(dt, cam, barRect = null) {
      if (!active) return;
      // cycle: wheel or Q
      if (mouse.wheel) { sel += Math.sign(mouse.wheel); sfx.ui(); }
      if (pressed('KeyQ')) { sel += keys.ShiftLeft || keys.ShiftRight ? -1 : 1; sfx.ui(); }

      // the bar is a menu, not the world: hovering shows a tooltip, clicking selects
      hoverIndex = -1;
      if (barRect && mouse.x >= barRect.x && mouse.x <= barRect.x + barRect.w &&
          mouse.y >= barRect.y - 60 && mouse.y <= barRect.y + barRect.h) {
        if (mouse.y >= barRect.y) {
          hoverIndex = Math.max(0, Math.min(unlocked().length - 1, Math.floor((mouse.x - barRect.x - 6) / barRect.cell)));
          if (pressed('MouseLeft')) { sel = hoverIndex; sfx.ui(); }
        }
        return;   // never place through the menu
      }

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
    },
  };
}

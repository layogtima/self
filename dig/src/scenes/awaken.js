// The awakening. No falling from orbit - you were already here. Black screen,
// a hum, a typewriter boot log with two quietly ominous lines, then the game
// scene takes over with its own HUD power-on (opts.boot). Any key skips.

import { VIEW_W, VIEW_H } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { text } from '../render/text.js';
import { anyPressed } from '../core/input.js';
import { sfx } from '../core/audio.js';

const LOG = [
  ['DG-3 … REBOOT', 0.3],
  ['core temp … nominal', 0.9],
  ['memory … 2 sectors corrupted', 1.4],
  ['objective … [NOT FOUND]', 2.0],
  ['optics … initializing', 2.6],
];
const T_DONE = 3.4;

export function makeAwakenScene(services) {
  const { ctx } = services;
  let t = 0;
  let blipped = 0;

  return {
    update(dt) {
      t += dt;
      // one soft blip as each line lands
      const due = LOG.filter(([, at]) => at <= t).length;
      if (due > blipped) { blipped = due; sfx.ui?.(); }
      if (t > 0.5 && anyPressed()) t = T_DONE;
      if (t >= T_DONE) services.go('game', { boot: true });
    },

    render(time) {
      ctx.fillStyle = '#05070C';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      // faint scanline flicker while the optics warm up
      ctx.fillStyle = `rgba(75,227,232,${(0.02 + Math.random() * 0.02).toFixed(3)})`;
      for (let y = (time * 40 | 0) % 4; y < VIEW_H; y += 4) ctx.fillRect(0, y, VIEW_W, 1);

      const x = VIEW_W / 2 - 170, y0 = VIEW_H / 2 - 60;
      LOG.forEach(([line, at], i) => {
        if (t < at) return;
        // typewriter reveal over 0.4s per line
        const chars = Math.min(line.length, Math.floor((t - at) / 0.4 * line.length));
        const shown = line.slice(0, chars);
        const glitch = line.includes('corrupted') || line.includes('NOT FOUND');
        text(ctx, shown, x, y0 + i * 22, {
          size: 14, bold: glitch,
          color: glitch ? PALETTE.amber : '#4BE3E8',
        });
      });
      // blinking cursor after the last visible line
      if ((time * 2 | 0) % 2 === 0) {
        const visible = LOG.filter(([, at]) => at <= t).length;
        ctx.fillStyle = '#4BE3E8';
        ctx.fillRect(x, y0 + visible * 22 + 2, 8, 12);
      }
      text(ctx, 'any key', VIEW_W / 2, VIEW_H - 34, { size: 10, align: 'center', color: 'rgba(120,150,160,0.5)' });
    },
  };
}

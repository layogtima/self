// Title: a full-screen dossier. Blueprint grid backdrop with drifting fossil
// silhouettes, a chunky framed wordmark plate, amber Start. Enter also starts.

import { VIEW_W, VIEW_H, TILE } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { text, blueprintPanel, roundRect, measure } from '../render/text.js';
import { drawProbe, drawFossil } from '../render/sprites.js';
import { mouse, pressed } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { updateMusic, setMusicDepth } from '../core/music.js';
import { FOSSILS } from '../content/fossils.js';
import { STRATA } from '../content/strata.js';

export function makeTitleScene(services) {
  const { ctx, makeCanvas } = services;
  const buttons = [
    { id: 'start', label: 'DIG', x: VIEW_W / 2 - 160, y: 372, w: 150, h: 54, primary: true },
    { id: 'settings', label: 'Settings', x: VIEW_W / 2 + 10, y: 372, w: 150, h: 54 },
  ];
  // slow-drifting background silhouettes (deterministic picks)
  const drifters = [3, 8, 11, 19, 22, 6].map((fi, i) => ({
    spec: FOSSILS[fi % FOSSILS.length],
    x: (i * 220) % VIEW_W,
    y: 60 + (i * 97) % 380,
    v: 4 + (i % 3) * 2,
  }));

  const hit = b => mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h;

  return {
    update(dt) {
      setMusicDepth(0);
      updateMusic(dt);
      for (const d of drifters) { d.x += d.v * dt; if (d.x > VIEW_W + 90) d.x = -90; }
      if (pressed('Enter') || pressed('Space')) { sfx.ui(); services.go(services.save ? 'game' : 'intro'); return; }
      if (pressed('MouseLeft')) {
        for (const b of buttons) if (hit(b)) { sfx.ui(); services.go(b.id === 'start' ? (services.save ? 'game' : 'intro') : 'settings'); return; }
      }
    },
    render(time) {
      // the whole screen is one blueprint sheet
      const { ix, iy, iw, ih } = blueprintPanel(ctx, 6, 6, VIEW_W - 12, VIEW_H - 12, { frameW: 10, r: 20 });

      // drifting silhouettes behind everything
      ctx.save();
      roundRect(ctx, ix, iy, iw, ih, 10);
      ctx.clip();
      for (const d of drifters) {
        ctx.globalAlpha = 0.13;
        drawFossil(ctx, d.spec, d.x, d.y + Math.sin(time * 0.4 + d.x * 0.01) * 6, makeCanvas, 1.4);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // wordmark plate
      const pw = 520, phh = 150;
      const px = VIEW_W / 2 - pw / 2, py = 96;
      roundRect(ctx, px, py, pw, phh, 14);
      ctx.fillStyle = PALETTE.frameDark;
      ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.frameLight; ctx.stroke();
      text(ctx, 'DIGGG', VIEW_W / 2, py + 22, { size: 74, bold: true, align: 'center', color: PALETTE.amber });
      text(ctx, 'FIND FOSSILS · YEAR 102,025', VIEW_W / 2, py + 106, { size: 18, bold: true, align: 'center', color: PALETTE.cream });

      text(ctx, 'a probe. a planet. one legendary rex to bring home.', VIEW_W / 2, 276,
        { size: 13, align: 'center', color: PALETTE.creamDim });

      // era strip under the tagline (the reference's timeline bar, as decoration)
      const tlW = 300, tlX = VIEW_W / 2 - tlW / 2, tlY = 306;
      drawTimeline(tlX, tlY, tlW);

      // the probe idling on the plate
      drawProbe(ctx, VIEW_W / 2 + 232, py + phh - 22, -1, time, 0, 0.9, 0, 0);

      // buttons
      for (const b of buttons) {
        const over = hit(b);
        roundRect(ctx, b.x, b.y, b.w, b.h, 12);
        ctx.fillStyle = b.primary ? (over ? PALETTE.amberSoft : PALETTE.amber) : (over ? PALETTE.frameLight : PALETTE.frameDark);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = over ? PALETTE.cream : PALETTE.frameDark;
        ctx.stroke();
        text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, {
          size: 20, bold: true, align: 'center', baseline: 'middle',
          color: b.primary ? '#3B2F16' : PALETTE.cream,
        });
      }

      text(ctx, 'ENTER to dig', VIEW_W / 2, 448, { size: 11, align: 'center', color: PALETTE.creamDim });
    },
  };

  function drawTimeline(tlX, tlY, tlW) {
    STRATA.forEach((s, i) => {
      ctx.fillStyle = s.colors.base;
      ctx.fillRect(tlX + (i / STRATA.length) * tlW, tlY, tlW / STRATA.length - 1, 10);
    });
    ctx.strokeStyle = PALETTE.frameDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(tlX, tlY, tlW, 10);
    text(ctx, 'now', tlX - 6, tlY, { size: 9, align: 'right', color: PALETTE.creamDim });
    text(ctx, '4.6 bya', tlX + tlW + 6, tlY, { size: 9, color: PALETTE.creamDim });
  }
}

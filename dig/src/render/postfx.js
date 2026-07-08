// Signature post-process — the thing that makes it feel alive, like found
// footage from 102,025. Four cheap layered passes over the finished frame:
//   • scanlines      — faint 2px horizontal darkening
//   • vignette       — warm corner falloff
//   • film grain      — a small pre-baked noise tile, re-offset each frame
//   • light-breathing — a whole-frame ±1.5% brightness sine
// Overlays are cached; only the grain offset + breath phase change per frame.

import { VIEW_W, VIEW_H } from '../config.js';

export function makePostFx(makeCanvas) {
  // scanlines (cached)
  const scan = makeCanvas(4, VIEW_H);
  {
    const c = scan.getContext('2d');
    c.fillStyle = 'rgba(0,0,0,0.05)';
    for (let y = 0; y < VIEW_H; y += 2) c.fillRect(0, y, 4, 1);
  }
  // vignette (cached)
  const vig = makeCanvas(VIEW_W, VIEW_H);
  {
    const c = vig.getContext('2d');
    const g = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(30,18,8,0.28)');
    c.fillStyle = g;
    c.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  // grain tile (cached) — a small noise square we scroll around
  const GS = 128;
  const grain = makeCanvas(GS, GS);
  {
    const c = grain.getContext('2d');
    const img = c.createImageData(GS, GS);
    for (let i = 0; i < GS * GS; i++) {
      const v = (Math.random() * 255) | 0;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 12;   // very faint
    }
    c.putImageData(img, 0, 0);
  }

  let frame = 0;

  return {
    apply(ctx, time) {
      frame++;
      // light-breathing: a gentle brightness lift via a translucent warm wash
      const breath = Math.sin(time * 0.9) * 0.5 + 0.5;   // 0..1
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.04 + breath * 0.03;
      ctx.fillStyle = '#FFF4DC';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      // grain — offset by a per-frame pseudo-random amount, tiled
      const ox = (Math.imul(frame, 2654435761) >>> 0) % GS;
      const oy = (Math.imul(frame, 40503) >>> 0) % GS;
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let y = -oy; y < VIEW_H; y += GS)
        for (let x = -ox; x < VIEW_W; x += GS)
          ctx.drawImage(grain, x, y);
      ctx.restore();

      // scanlines (tiled horizontally)
      for (let x = 0; x < VIEW_W; x += 4) ctx.drawImage(scan, x, 0);

      // vignette
      ctx.drawImage(vig, 0, 0);
    },
  };
}

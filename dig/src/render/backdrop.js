// Biome backdrop - the painted horizon the sky wears. v4.8: back to the painted
// look the player liked, but SIMPLE + seamlessly repeating. Each biome has a
// low, horizontally-tiling silhouette band (assets/sprites/backdrops/<id>.png,
// generated with tile_x) drawn between the sky gradient and the sun/moon, so it
// repeats forever behind the ground and the celestial bodies ride over it. The
// painting's baked sky is faded to transparent up top so the game's own
// day/night sky shows through. Missing art falls back to procedural ridges, so
// the game never blocks on assets.

import { WIN_W, WIN_H, TILE, WORLD_W, SURFACE_BASE } from '../config.js';
import { BIOMES, biomeAtX } from '../content/biomes.js';
import { getSprite } from './sprites.js';

const FADE_T = 1.8;               // seconds, biome-border crossfade
const PARA = 0.35;                // horizontal parallax factor
const SCALE = 3;                  // 256-wide painting → ~768 on screen

function hx(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

/** @param {(w:number,h:number)=>HTMLCanvasElement} [makeCanvas]  enables the sky-fade mask */
export function makeBackdrop(makeCanvas = null) {
  let cur = null, prev = null, fade = 1;
  const masked = {};              // biomeId -> sky-faded canvas of the painting

  // fade the top ~45% of the painting to transparent so the real sky owns it
  function maskedImage(biomeId, img) {
    if (!makeCanvas) return img;
    if (masked[biomeId]) return masked[biomeId];
    const w = img.width || 256, h = img.height || 128;
    const cv = makeCanvas(w, h);
    const c = cv.getContext('2d');
    c.drawImage(img, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    const g = c.createLinearGradient(0, 0, 0, h * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h * 0.5);
    c.globalCompositeOperation = 'source-over';
    masked[biomeId] = cv;
    return cv;
  }

  /** procedural fallback: two seamless ridge silhouettes in the biome palette */
  function drawProcedural(ctx, cam, biomeId, bottomY) {
    const biome = BIOMES.find(b => b.id === biomeId) || BIOMES[0];
    const P = WORLD_W * TILE;
    const ridge = (rgb, amp, base, para, ph, alpha) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      ctx.beginPath(); ctx.moveTo(0, WIN_H);
      for (let sx = 0; sx <= WIN_W; sx += 8) {
        const wx = (sx + cam.x * para) / P * Math.PI * 2;
        const y = bottomY - base - (Math.sin(wx * 3 + ph) + Math.sin(wx * 7 + 1.3) * 0.5) * amp;
        ctx.lineTo(sx, y);
      }
      ctx.lineTo(WIN_W, WIN_H); ctx.closePath(); ctx.fill();
    };
    const haze = rgb => rgb.map((c, i) => Math.round(c * 0.5 + [150, 162, 178][i] * 0.5));
    ridge(haze(hx(biome.surfaceTint)), 22, 70, PARA * 0.6, 1.7, 0.5);
    ridge(haze(hx(biome.grass.deep)), 30, 26, PARA, 4.2, 0.55);
    ctx.globalAlpha = 1;
  }

  function drawBiome(ctx, cam, biomeId, alpha, bottomY) {
    if (alpha <= 0.01) return;
    const img = getSprite('backdrops', biomeId);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (img) {
      const src = maskedImage(biomeId, img);
      const iw = (img.width || 256) * SCALE, ih = (img.height || 128) * SCALE;
      const off = -(((cam.x * PARA) % iw) + iw) % iw;
      const prevSmooth = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
      for (let x = off; x < WIN_W; x += iw) ctx.drawImage(src, x, bottomY - ih, iw, ih);
      ctx.imageSmoothingEnabled = prevSmooth;
    } else {
      drawProcedural(ctx, cam, biomeId, bottomY);
    }
    ctx.restore();
  }

  return {
    update(dt, playerTx) {
      const id = biomeAtX(playerTx, WORLD_W).id;
      if (id !== cur) { prev = cur; cur = id; fade = prev ? 0 : 1; }
      fade = Math.min(1, fade + dt / FADE_T);
      if (fade >= 1) prev = null;
    },

    /** call between the sky gradient and the sun/moon (screen space) */
    draw(ctx, cam, env) {
      if (!cur) return;
      const vis = 1 - (env?.night01?.() ?? 0) * 0.7;
      if (vis <= 0.02) return;
      // horizon anchored to the surface, rising away as we dig down
      const bottomY = SURFACE_BASE * TILE * 0.7 + 170 - cam.y * 0.55;
      if (bottomY < -60) return;
      if (prev) drawBiome(ctx, cam, prev, vis * (1 - fade), bottomY);
      drawBiome(ctx, cam, cur, vis * (prev ? fade : 1), bottomY);
    },

    get _cur() { return cur; },
    get _prev() { return prev; },
    get _fade() { return fade; },
  };
}

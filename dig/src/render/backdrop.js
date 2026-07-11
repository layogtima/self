// Biome parallax backdrops - the horizon the sky wears. Each biome gets a wide
// painting (assets/sprites/backdrops/<biomeId>.png, generated) drawn between
// the sky gradient and the world: tiled horizontally with a slow parallax
// scroll, anchored so descending underground carries it up and out of view
// naturally (no depth-fade bookkeeping - the camera does it). Crossing a biome
// border CROSSFADES old→new over ~1.8s. Missing art falls back to procedural
// two-layer ridge silhouettes tinted from the biome palette, so the game never
// blocks on generation. Night and rain dim/haze the painting via env.
//
// (Underground gets no backdrop variant on purpose: every cave cell draws a
// back wall, so a cavern painting would never be visible.)

import { VIEW_W, VIEW_H, TILE, WORLD_W, SURFACE_BASE } from '../config.js';
import { BIOMES, biomeAtX } from '../content/biomes.js';
import { getSprite } from './sprites.js';

const FADE_T = 1.8;               // seconds, border crossfade
const PARA_X = 0.12;              // horizontal parallax factor
const PARA_Y = 0.25;              // vertical parallax factor
const SCALE = 2.5;                // 384x216 painting → 960x540 layer

/** @param {(w:number,h:number)=>HTMLCanvasElement} [makeCanvas]  enables the sky-fade mask */
export function makeBackdrop(makeCanvas = null) {
  let cur = null;                 // current biome id
  let prev = null;                // fading-out biome id
  let fade = 1;                   // 0..1, prev→cur
  const masked = {};              // biomeId -> canvas: painting w/ top faded out

  // the paintings arrive with baked skies; fading their top third to
  // transparent lets the game's own day/night sky own the upper screen while
  // the painted horizon keeps the ground
  function maskedImage(biomeId, img) {
    if (!makeCanvas) return img;
    if (masked[biomeId]) return masked[biomeId];
    const w = img.width || 384, h = img.height || 216;
    const cv = makeCanvas(w, h);
    const c = cv.getContext('2d');
    c.drawImage(img, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    const g = c.createLinearGradient(0, 0, 0, h * 0.42);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h * 0.42);
    c.globalCompositeOperation = 'source-over';
    masked[biomeId] = cv;
    return cv;
  }

  /** one painted (or procedural) layer at the given alpha */
  function drawLayer(ctx, cam, biomeId, alpha) {
    if (alpha <= 0.01) return;
    // bottom of the painting sits a touch below the surface line on screen,
    // rising away as the camera digs down (vertical parallax)
    const bottomY = SURFACE_BASE * TILE * (1 - PARA_Y) + 190 - cam.y * PARA_Y;
    if (bottomY < -20) return;    // fully scrolled out - deep underground
    ctx.save();
    ctx.globalAlpha = alpha;
    const img = getSprite('backdrops', biomeId);
    if (img) {
      const src = maskedImage(biomeId, img);
      const iw = (img.width || 384) * SCALE, ih = (img.height || 216) * SCALE;
      const off = -(((cam.x * PARA_X) % iw) + iw) % iw;
      const prevSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      for (let x = off; x < VIEW_W; x += iw) ctx.drawImage(src, x, bottomY - ih, iw, ih);
      ctx.imageSmoothingEnabled = prevSmooth;
    } else {
      drawProcedural(ctx, cam, biomeId, bottomY);
    }
    ctx.restore();
  }

  /** fallback: two ridge silhouettes from the biome palette (stable, seamless) */
  function drawProcedural(ctx, cam, biomeId, bottomY) {
    const biome = BIOMES.find(b => b.id === biomeId) || BIOMES[0];
    const ridge = (color, amp, base, para, ph) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, bottomY);
      for (let x = 0; x <= VIEW_W; x += 16) {
        const wx = (x + cam.x * para) * 0.008;
        const y = bottomY - base - (Math.sin(wx + ph) + Math.sin(wx * 2.3 + ph * 2) * 0.5 + Math.sin(wx * 0.31) * 1.2) * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(VIEW_W, bottomY);
      ctx.closePath(); ctx.fill();
    };
    ctx.globalAlpha *= 0.55;
    ridge(biome.surfaceTint, 26, 90, PARA_X * 0.6, 1.7);   // far, pale
    ctx.globalAlpha /= 0.55;
    ctx.globalAlpha *= 0.5;
    ridge(biome.grass.deep, 34, 34, PARA_X, 4.2);          // near, deep tone
  }

  return {
    /** track the player's biome; a border crossing starts the crossfade */
    update(dt, playerTx) {
      const id = biomeAtX(playerTx, WORLD_W).id;
      if (id !== cur) { prev = cur; cur = id; fade = prev ? 0 : 1; }
      fade = Math.min(1, fade + dt / FADE_T);
      if (fade >= 1) prev = null;
    },

    /** call right after drawSky (screen space, before the camera transform) */
    draw(ctx, cam, env) {
      if (!cur) return;
      // night swallows the horizon; rain hazes it
      const vis = (1 - (env?.night01?.() ?? 0) * 0.75) * (1 - (env?.precip01?.() ?? 0) * 0.5);
      if (vis <= 0.02) return;
      if (prev) drawLayer(ctx, cam, prev, vis * (1 - fade));
      drawLayer(ctx, cam, cur, vis * (prev ? fade : 1));
    },

    /** test hooks */
    get _cur() { return cur; },
    get _prev() { return prev; },
    get _fade() { return fade; },
  };
}

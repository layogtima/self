// Wall-clipped directional headlights v2 + SKY LIGHT v1. The cone AIMS WHERE
// THE MOUSE POINTS (full 360°), rays raymarch the tile grid and stop at solid
// walls. Darkness is depth- OR night-driven, so the same system lights caves
// and the surface after dusk. Extra static lights (deck lamps, beacon, glow
// mushrooms) punch soft holes in the dark.
//
// Sky light: per visible column, everything open to the sky is sunlit; light
// spills a few tiles sideways/down into cave mouths and skylight shafts
// (bounded neighbour-spread over the camera window only), so overhangs cast
// real shade and shallow grottoes glow by day. Scaled by daylight & weather.

import { VIEW_W, VIEW_H, TILE, WORLD_W, WORLD_H } from '../config.js';

const RAYS = 30;
const CONE_HALF = 0.62;         // ~71° cone
const RANGE = TILE * 10;
const STEP = TILE / 3;
const SKY_SPREAD = 3;           // neighbour-spread passes (≈ tiles of spill)
const SKY_DECAY = 0.68;         // per-spread falloff

export function makeLighting(makeCanvas) {
  const cv = makeCanvas(VIEW_W, VIEW_H);
  const c = cv.getContext('2d');
  const skyCv = makeCanvas(1, 1);              // 1px per tile; upscaled smooth
  const skyC = skyCv.getContext('2d');
  let lastSky = null;             // {x0,y0,w,h,grid} - test hook + shade pass
  let usedSkyBlit = false;        // test hook: seamless path exercised
  // reused scratch buffers (v5.0 phone perf): computeSky runs up to twice a
  // frame; allocating fresh typed arrays + ImageData each call was the main
  // GC churn on mobile. Reused buffers MUST be re-zeroed - the write loops
  // skip zero cells, so stale values would bleed yesterday's light.
  let gridBuf = new Float32Array(0);
  let openBuf = new Uint8Array(0), nextBuf = new Uint8Array(0);
  let imgBuf = null;

  /**
   * Paint per-tile alphas at 1px/tile and upscale in ONE smoothed drawImage.
   * Per-tile fillRects overlapped and double-punched their seams, which read
   * as a glowing grid at night - a single blit has no seams to show.
   * @param {(x:number,y:number,v:number)=>number} alphaAt  0..1 per tile
   * @param {[number,number,number]} rgb  pixel colour (alpha does the work)
   */
  function blitSkyGrid(target, sky, cam, alphaAt, rgb = [0, 0, 0]) {
    if (skyCv.width !== sky.w || skyCv.height !== sky.h) { skyCv.width = sky.w; skyCv.height = sky.h; }
    let img = imgBuf;
    if (!img || img.width !== sky.w || img.height !== sky.h) img = imgBuf = skyC.createImageData(sky.w, sky.h);
    else img.data.fill(0);
    for (let y = 0; y < sky.h; y++) {
      for (let x = 0; x < sky.w; x++) {
        const i = y * sky.w + x;
        const a = alphaAt(sky.x0 + x, sky.y0 + y, sky.grid[i]);
        if (a <= 0) continue;
        img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2];
        img.data[i * 4 + 3] = Math.min(255, a * 255) | 0;
      }
    }
    skyC.putImageData(img, 0, 0);
    const prev = target.imageSmoothingEnabled;
    target.imageSmoothingEnabled = true;
    target.drawImage(skyCv, 0, 0, sky.w, sky.h,
      sky.x0 * TILE - cam.x, sky.y0 * TILE - cam.y, sky.w * TILE, sky.h * TILE);
    target.imageSmoothingEnabled = prev;
    usedSkyBlit = true;
  }

  /**
   * per-tile sky illumination over the camera window (0..1).
   * @param {number} [shear]  horizontal drift of sunlight per row of descent -
   *   the sun's angle. 0 = noon (straight down); positive leans the rays right
   *   (morning sun in the east), negative left (evening). The seed pass walks
   *   top-down shifting a whole open-row by the accumulated shear (Bresenham),
   *   so god-rays genuinely FOLLOW the sun across the day.
   */
  function computeSky(world, bounds, shear = 0) {
    const x0 = Math.max(0, bounds.x0 - 2), x1 = Math.min(WORLD_W - 1, bounds.x1 + 2);
    const y0 = Math.max(0, bounds.y0 - 2), y1 = Math.min(WORLD_H - 1, bounds.y1 + 2);
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (gridBuf.length < w * h) gridBuf = new Float32Array(w * h);
    const grid = gridBuf.subarray(0, w * h);
    grid.fill(0);
    const at = (x, y) => grid[(y - y0) * w + (x - x0)];
    const set = (x, y, v) => { grid[(y - y0) * w + (x - x0)] = v; };

    // seed: every air cell with an unbroken SUN-ANGLED line to the sky is lit.
    // Start above the highest surface in reach; pad the scan on the upstream
    // side so slanted ancestry never leaves the window.
    let topSurf = Infinity;
    for (let x = Math.max(0, x0 - 60); x <= Math.min(WORLD_W - 1, x1 + 60); x++) {
      if (world.surface[x] < topSurf) topSurf = world.surface[x];
    }
    const yStart = Math.max(0, Math.min(topSurf - 9, y0));
    const drift = Math.ceil(Math.abs(shear) * (y1 - yStart + 1)) + 2;
    const ex0 = Math.max(0, x0 - (shear > 0 ? drift : 2));
    const ex1 = Math.min(WORLD_W - 1, x1 + (shear < 0 ? drift : 2));
    const ew = ex1 - ex0 + 1;
    if (openBuf.length < ew) { openBuf = new Uint8Array(ew); nextBuf = new Uint8Array(ew); }
    let open = openBuf.subarray(0, ew);      // the sky itself
    open.fill(1);
    let next = nextBuf.subarray(0, ew);      // fully overwritten row by row
    let prevOff = 0;
    for (let y = yStart; y <= y1; y++) {
      const off = Math.round((y - yStart) * shear);
      const step = off - prevOff;              // -1 | 0 | +1 per row
      prevOff = off;
      let anyOpen = 0;
      for (let x = ex0; x <= ex1; x++) {
        const src = x - step;
        const srcOpen = src < ex0 || src > ex1 ? 1 : open[src - ex0];
        const v = srcOpen && !world.solidAt(x, y) ? 1 : 0;
        next[x - ex0] = v;
        anyOpen |= v;
      }
      [open, next] = [next, open];
      if (y >= y0) for (let x = x0; x <= x1; x++) if (open[x - ex0]) set(x, y, 1);
      if (!anyOpen) break;                     // fully sealed: nothing below is sky-lit
    }
    // spread: light spills into adjacent air (cave mouths, shaft bottoms)
    for (let pass = 0; pass < SKY_SPREAD; pass++) {
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          if (world.solidAt(x, y)) continue;
          const cur = at(x, y);
          if (cur >= 1) continue;
          let best = 0;
          if (x > x0) best = Math.max(best, at(x - 1, y));
          if (x < x1) best = Math.max(best, at(x + 1, y));
          if (y > y0) best = Math.max(best, at(x, y - 1));
          if (y < y1) best = Math.max(best, at(x, y + 1));
          const v = best * SKY_DECAY;
          if (v > cur) set(x, y, v);
        }
      }
    }
    lastSky = { x0, y0, w, h, grid };
    return lastSky;
  }

  return {
    /** test hook: sky illumination 0..1 at a tile (after the last apply) */
    _skyAt(tx, ty) {
      if (!lastSky) return 0;
      const { x0, y0, w, h, grid } = lastSky;
      if (tx < x0 || tx >= x0 + w || ty < y0 || ty >= y0 + h) return 0;
      return grid[(ty - y0) * w + (tx - x0)];
    },
    /** direct compute for tests */
    _computeSky: computeSky,
    /** test hook: the seamless 1px-per-tile blit ran (no per-rect grid seams) */
    get _usedSkyBlit() { return usedSkyBlit; },

    /** March the cone around aimAngle; returns the light polygon (world coords). */
    castCone(world, ox, oy, aimAngle) {
      const pts = [{ x: ox, y: oy }];
      for (let i = 0; i <= RAYS; i++) {
        const ang = aimAngle - CONE_HALF + (i / RAYS) * CONE_HALF * 2;
        const dx = Math.cos(ang), dy = Math.sin(ang);
        let d = STEP;
        for (; d < RANGE; d += STEP) {
          const tx = Math.floor((ox + dx * d) / TILE);
          const ty = Math.floor((oy + dy * d) / TILE);
          if (world.solidAt(tx, ty)) { d += STEP * 0.7; break; }
        }
        pts.push({ x: ox + dx * Math.min(d, RANGE), y: oy + dy * Math.min(d, RANGE) });
      }
      return pts;
    },

    /**
     * @param {number} aimAngle  radians, where the cone points (mouse-driven)
     * @param {number} ambient   0..1 darkness (max of depth-dark and night-dark)
     * @param {Array<{x,y,r,warmth?}>} lights  extra static lights (world coords)
     * @param {{strength:number, warm:number}} [sun]  daylight 0..1 + dusk warmth
     */
    apply(ctx, world, cam, emitter, aimAngle, ambient, lights = [], sun = null) {
      // the stage can resize mid-session (v5.0 dynamic width) - the darkness
      // buffer follows lazily (assigning width also clears it)
      if (cv.width !== VIEW_W || cv.height !== VIEW_H) { cv.width = VIEW_W; cv.height = VIEW_H; }
      // daytime surface shade: even with no darkness mask, overhangs get a soft
      // shadow so the sun reads as directional light
      if (sun && sun.strength > 0.15 && ambient < 0.02) {
        const sky = computeSky(world, cam.bounds(), sun.shear || 0);
        blitSkyGrid(ctx, sky, cam, (x, y, v) => {
          if (world.solidAt(x, y)) return 0;
          const nearSurface = y - world.surface[Math.max(0, Math.min(WORLD_W - 1, x))] < 8;
          return (v < 0.35 && nearSurface) ? 0.15 * sun.strength : 0;
        }, [24, 18, 30]);
        return null;
      }
      if (ambient < 0.02) return null;
      c.clearRect(0, 0, VIEW_W, VIEW_H);
      c.fillStyle = `rgba(16,11,20,${Math.min(0.97, ambient)})`;
      c.fillRect(0, 0, VIEW_W, VIEW_H);

      const sx = emitter.x - cam.x, sy = emitter.y - cam.y;
      c.globalCompositeOperation = 'destination-out';

      // SKY LIGHT: the sun pours into everything open to it - cave mouths,
      // skylight shafts, the surface at dusk - and spills a few tiles in
      if (sun && sun.strength > 0.02) {
        const sky = computeSky(world, cam.bounds(), sun.shear || 0);
        blitSkyGrid(c, sky, cam, (x, y, v) => v < 0.06 ? 0 : v * sun.strength * 0.92);
      }

      // ambient bubble around the rover
      const bub = c.createRadialGradient(sx, sy, 0, sx, sy, TILE * 3.2);
      bub.addColorStop(0, 'rgba(0,0,0,0.95)');
      bub.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = bub;
      c.beginPath(); c.arc(sx, sy, TILE * 3.2, 0, Math.PI * 2); c.fill();

      // the aimed cone
      const poly = this.castCone(world, emitter.x, emitter.y, aimAngle);
      const cone = c.createRadialGradient(sx, sy, TILE, sx, sy, RANGE);
      cone.addColorStop(0, 'rgba(0,0,0,0.98)');
      cone.addColorStop(0.7, 'rgba(0,0,0,0.75)');
      cone.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = cone;
      c.beginPath();
      c.moveTo(poly[0].x - cam.x, poly[0].y - cam.y);
      for (let i = 1; i < poly.length; i++) c.lineTo(poly[i].x - cam.x, poly[i].y - cam.y);
      c.closePath();
      c.fill();

      // static lights (lamps, beacon, mushrooms)
      for (const L of lights) {
        const lx = L.x - cam.x, ly = L.y - cam.y;
        if (lx < -L.r || lx > VIEW_W + L.r || ly < -L.r || ly > VIEW_H + L.r) continue;
        const g = c.createRadialGradient(lx, ly, 0, lx, ly, L.r);
        g.addColorStop(0, 'rgba(0,0,0,0.9)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(lx, ly, L.r, 0, Math.PI * 2); c.fill();
      }

      c.globalCompositeOperation = 'source-over';
      ctx.drawImage(cv, 0, 0);

      // warm wash in the beam
      ctx.save();
      ctx.globalAlpha = 0.07 * ambient;
      ctx.fillStyle = '#FFE9B8';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x - cam.x, poly[i].y - cam.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // coloured glow on static warm lights (L.tint overrides the default amber:
      // bio-lamps pour green/blue/teal pools into the night)
      for (const L of lights) {
        if (!L.warmth) continue;
        const lx = L.x - cam.x, ly = L.y - cam.y;
        const tint = L.tint || '255,220,150';
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, L.r * 0.7);
        g.addColorStop(0, `rgba(${tint},${(L.tint ? 0.2 : 0.12) * ambient * L.warmth})`);
        g.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(lx, ly, L.r * 0.7, 0, Math.PI * 2); ctx.fill();
      }

      return poly;
    },
  };
}

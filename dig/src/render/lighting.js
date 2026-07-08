// Wall-clipped directional headlights v2. The cone AIMS WHERE THE MOUSE POINTS
// (full 360°), rays raymarch the tile grid and stop at solid walls. Darkness is
// depth- OR night-driven, so the same system lights caves and the surface after
// dusk. Extra static lights (deck lamps, beacon, glow mushrooms) punch soft
// holes in the dark.

import { VIEW_W, VIEW_H, TILE } from '../config.js';

const RAYS = 30;
const CONE_HALF = 0.62;         // ~71° cone
const RANGE = TILE * 10;
const STEP = TILE / 3;

export function makeLighting(makeCanvas) {
  const cv = makeCanvas(VIEW_W, VIEW_H);
  const c = cv.getContext('2d');

  return {
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
     */
    apply(ctx, world, cam, emitter, aimAngle, ambient, lights = []) {
      if (ambient < 0.02) return null;
      c.clearRect(0, 0, VIEW_W, VIEW_H);
      c.fillStyle = `rgba(16,11,20,${Math.min(0.94, ambient)})`;
      c.fillRect(0, 0, VIEW_W, VIEW_H);

      const sx = emitter.x - cam.x, sy = emitter.y - cam.y;
      c.globalCompositeOperation = 'destination-out';

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
      // warm glow on static warm lights
      for (const L of lights) {
        if (!L.warmth) continue;
        const lx = L.x - cam.x, ly = L.y - cam.y;
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, L.r * 0.7);
        g.addColorStop(0, `rgba(255,220,150,${0.12 * ambient * L.warmth})`);
        g.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(lx, ly, L.r * 0.7, 0, Math.PI * 2); ctx.fill();
      }

      return poly;
    },
  };
}

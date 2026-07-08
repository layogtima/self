// Lightweight particle pool for dig puffs and fossil sparkles.

export function makeParticles() {
  const list = [];

  return {
    list,
    /** @param {number} wx world px @param {number} wy @param {string} color */
    burst(wx, wy, color, n, speed = 160) {
      for (let k = 0; k < n; k++) {
        list.push({
          x: wx, y: wy,
          vx: (Math.random() - 0.5) * speed,
          vy: -Math.random() * speed - 40,
          life: 0.35 + Math.random() * 0.3,
          size: 2 + (Math.random() * 2 | 0),
          color,
        });
      }
    },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.vy += 900 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0) list.splice(i, 1);
      }
    },
    draw(ctx) {
      for (const p of list) {
        ctx.globalAlpha = Math.min(1, p.life * 3);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1;
    },
    clear() { list.length = 0; },
  };
}

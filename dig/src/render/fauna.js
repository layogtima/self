// Fauna art: one draw function per `draw` key in content/fauna.js. Unknown
// keys fall back to `generic` (palette-tinted critter) so a new registry entry
// never crashes the render - bespoke art can come later.

/** @type {Object<string, (ctx:CanvasRenderingContext2D, f:object, time:number)=>void>} */
export const FAUNA_ART = {
  grazer(ctx, f) {  // small deer-like herbivore
    ctx.fillStyle = '#8A7358';
    ctx.beginPath(); ctx.ellipse(0, -8, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
    // head dips while idle-grazing
    const step = gait(f);
    const headY = f.state === 'idle' ? -4 + Math.sin(f.t * 2) * 2 : -11;
    ctx.fillRect(5, headY, 4, 3.5);
    ctx.beginPath(); ctx.moveTo(7, headY); ctx.lineTo(9, headY - 4); ctx.moveTo(8, headY); ctx.lineTo(10, headY - 3); ctx.strokeStyle = '#8A7358'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillRect(-5 + step, -4, 1.6, 4);
    ctx.fillRect(3 - step, -4, 1.6, 4);
  },

  hopper(ctx, f) {  // frog-rabbit thing
    ctx.fillStyle = '#7A8A58';
    ctx.beginPath(); ctx.ellipse(0, -4, 4.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -7, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F2EBD7';
    ctx.fillRect(3.6, -7.8, 1.2, 1.2);
    ctx.fillStyle = '#7A8A58';
    ctx.fillRect(-4, -2, 3, 2);   // haunch
  },

  lizard(ctx, f) {
    ctx.fillStyle = '#6E8A72';
    ctx.fillRect(-6, -2.5, 10, 2.5);
    ctx.beginPath(); ctx.arc(5, -1.5, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, -1.2); ctx.quadraticCurveTo(-10, -1 + Math.sin(f.t * 8) * 1.5, -12, -2); ctx.strokeStyle = '#6E8A72'; ctx.lineWidth = 1.6; ctx.stroke();
  },

  salamander(ctx, f) {  // pale cave dweller
    ctx.fillStyle = '#D8C8CE';
    ctx.fillRect(-6, -2.2, 10, 2.2);
    ctx.beginPath(); ctx.arc(5, -1.2, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, -1); ctx.quadraticCurveTo(-9, -1 + Math.sin(f.t * 5) * 1.2, -11, -1.6); ctx.strokeStyle = '#D8C8CE'; ctx.lineWidth = 1.4; ctx.stroke();
  },

  spider(ctx, f) {
    ctx.fillStyle = '#2E2836';
    ctx.beginPath(); ctx.arc(0, -3, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2E2836'; ctx.lineWidth = 1;
    for (let l = 0; l < 4; l++) {
      const a = -0.6 + l * 0.4 + Math.sin(f.t * 12 + l) * 0.15;
      ctx.beginPath(); ctx.moveTo(0, -3);
      ctx.lineTo(Math.cos(a) * 5, -3 + Math.sin(a) * 4 + 2);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -3);
      ctx.lineTo(-Math.cos(a) * 5, -3 + Math.sin(a) * 4 + 2);
      ctx.stroke();
    }
  },

  wader(ctx, f) {   // wetland stilt-bird
    const step = gait(f);
    ctx.strokeStyle = '#B8C4CE'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-2 + step, 0); ctx.lineTo(-2, -8); ctx.moveTo(3 - step, 0); ctx.lineTo(2, -8); ctx.stroke();
    ctx.fillStyle = '#B8C4CE';
    ctx.beginPath(); ctx.ellipse(0, -11, 5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -15, 2, 0, Math.PI * 2); ctx.fill();
    // spear beak, dips when idle (fishing)
    const dip = f.state === 'idle' ? Math.max(0, Math.sin(f.t * 3)) * 4 : 0;
    ctx.strokeStyle = '#E0A24A'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(5, -15 + dip * 0.4); ctx.lineTo(10, -13 + dip); ctx.stroke();
  },

  cindercrab(ctx, f) {   // slow armoured ash-sifter
    const step = gait(f) * 0.6;
    ctx.fillStyle = '#8A6A62';
    ctx.beginPath(); ctx.ellipse(0, -4, 5, 3.2, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(-5, -4, 10, 2.4);
    ctx.strokeStyle = '#6E524C'; ctx.lineWidth = 1;
    for (const lx of [-4, -1.5, 1.5, 4]) {
      ctx.beginPath(); ctx.moveTo(lx, -2); ctx.lineTo(lx + (lx < 0 ? -1.5 : 1.5), 0.5 + (Math.abs(lx) < 2 ? step : -step)); ctx.stroke();
    }
    ctx.fillStyle = '#E8B23A';
    ctx.fillRect(3.4, -6, 1.4, 1.4);   // one ember eye
  },

  /** palette-tinted body + legs; keeps unknown registry entries alive on screen */
  generic(ctx, f) {
    const step = gait(f);
    const [w, h] = f.spec?.size || [12, 8];
    ctx.fillStyle = f.spec?.palette || '#8A7358';
    ctx.beginPath(); ctx.ellipse(0, -h / 2 - 2, w / 2, h / 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w / 2 - 1, -h + 1, h / 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-w / 4 + step, -2, 1.5, 2.5);
    ctx.fillRect(w / 5 - step, -2, 1.5, 2.5);
  },
};

function gait(f) { return Math.abs(Math.sin(f.t * (f.state === 'flee' ? 16 : 8))); }

/** draw one creature (world space, feet at f.y): juveniles small, elders fade */
export function drawFauna(ctx, f, time) {
  ctx.save();
  ctx.translate(f.x, f.y);
  const grow = 0.65 + Math.min(1, f.age ?? 1) * 0.45;   // 0.65x juvenile → 1.1x adult
  ctx.scale(f.dir * grow, grow);
  if (f.fade > 0) ctx.globalAlpha = Math.max(0, 1 - f.fade / 2);
  (FAUNA_ART[f.spec?.draw || f.kind] || FAUNA_ART.generic)(ctx, f, time);
  ctx.restore();
}

// Fauna art: a generated sprite when we have one, else one draw function per
// `draw` key in content/fauna.js (unknown keys fall back to `generic`). The
// procedural path always stands in when the PNG is missing - the game never
// blocks on assets.

import { getFaunaSprite } from './sprites.js';

/** @type {Object<string, (ctx:CanvasRenderingContext2D, f:object, time:number)=>void>} */
export const FAUNA_ART = {
  grazer(ctx, f) {  // small deer-like herbivore
    ctx.fillStyle = '#8A7358';
    ctx.beginPath(); ctx.ellipse(0, -8, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
    // head dips while idle-grazing
    const step = gait(f);
    const headY = (f.state === 'idle' || f.state === 'feed' || f.state === 'drink') ? -4 + Math.sin(f.t * 2) * 2 : -11;
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

  fish(ctx, f) {   // pond swimmer, drawn mid-water (no ground line assumed)
    ctx.fillStyle = f.spec?.palette || '#7FA8D0';
    ctx.beginPath(); ctx.ellipse(0, -3, 4, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    const flick = Math.sin(f.t * 9) * 1.6;
    ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(-6.5, -3 - 2 + flick); ctx.lineTo(-6.5, -3 + 2 + flick); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F2EBD7'; ctx.fillRect(2.4, -3.8, 1, 1);
  },

  mudskipper(ctx, f) {   // the fish that walks: blunt head, periscope eyes, prop fins
    ctx.fillStyle = f.spec?.palette || '#8A9070';
    ctx.beginPath(); ctx.ellipse(-1, -3, 5.5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -3.5, 2.2, 0, Math.PI * 2); ctx.fill();   // blunt head
    const flick = Math.sin(f.t * 7) * 1.4;
    ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(-8.5, -3 + flick); ctx.lineTo(-8, -1.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2A2620';                                             // eyes on top
    ctx.fillRect(3.4, -6.2, 1.2, 1.2); ctx.fillRect(5, -6, 1.2, 1.2);
    ctx.fillStyle = f.spec?.palette || '#8A9070';                          // pectoral props
    ctx.fillRect(1.4, -1.6, 1.4, 2); ctx.fillRect(-2.6, -1.4, 1.4, 1.8);
  },

  /** a resurrected fossil: spectral green-lit body sized from the specimen,
   *  a faint incubator-glow aura marking it as brought-back */
  revenant(ctx, f) {
    const step = gait(f);
    const [w, h] = f.spec?.size || [18, 12];
    // aura
    ctx.fillStyle = 'rgba(150,220,170,0.16)';
    ctx.beginPath(); ctx.ellipse(0, -h / 2 - 2, w / 2 + 3, h / 2 + 3, 0, 0, Math.PI * 2); ctx.fill();
    // body
    ctx.fillStyle = f.spec?.palette || '#8FBE9A';
    ctx.beginPath(); ctx.ellipse(0, -h / 2 - 2, w / 2, h / 2.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w / 2 - 1, -h + 1, h / 3.2, 0, Math.PI * 2); ctx.fill();   // head
    // legs
    ctx.fillRect(-w / 4 + step, -3, 2, 4); ctx.fillRect(w / 5 - step, -3, 2, 4);
    // eye spark
    ctx.fillStyle = '#E8FFF0'; ctx.fillRect(w / 2 - 1, -h + 0.5, 1.6, 1.6);
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
  stalker(ctx, f) {   // lean surface predator: low canid body, long sweeping tail
    const step = gait(f);
    ctx.fillStyle = f.spec?.palette || '#6E5A44';
    ctx.beginPath(); ctx.ellipse(0, -7, 8, 3.4, 0, 0, Math.PI * 2); ctx.fill();     // body
    ctx.beginPath(); ctx.arc(7, -9, 2.6, 0, Math.PI * 2); ctx.fill();               // head
    ctx.beginPath(); ctx.moveTo(9, -10); ctx.lineTo(11.5, -11); ctx.lineTo(9.6, -8.4); ctx.closePath(); ctx.fill();   // snout
    ctx.beginPath(); ctx.moveTo(6, -11); ctx.lineTo(6.6, -13); ctx.lineTo(7.6, -11); ctx.closePath(); ctx.fill();     // ear
    ctx.strokeStyle = f.spec?.palette || '#6E5A44'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -7); ctx.quadraticCurveTo(-12, -8 - Math.sin(f.t * 8) * 2, -13, -4); ctx.stroke();   // tail
    ctx.fillRect(-5 + step, -4, 1.6, 4); ctx.fillRect(4 - step, -4, 1.6, 4);        // legs
    ctx.fillRect(-2.5 - step, -4, 1.6, 4); ctx.fillRect(1.5 + step, -4, 1.6, 4);
    ctx.fillStyle = '#E8C24A'; ctx.fillRect(7.4, -9.6, 1.2, 1.2);                   // eye
  },

  lurker(ctx, f) {   // cave ambush predator: long low body, many legs, a cold eye
    ctx.fillStyle = f.spec?.palette || '#3A3040';
    ctx.beginPath(); ctx.ellipse(0, -3.5, 7, 2.8, 0, 0, Math.PI * 2); ctx.fill();   // body
    ctx.beginPath(); ctx.arc(6, -3.5, 2.2, 0, Math.PI * 2); ctx.fill();             // head
    ctx.strokeStyle = f.spec?.palette || '#3A3040'; ctx.lineWidth = 1;
    for (let l = 0; l < 4; l++) {
      const a = 0.5 + Math.sin(f.t * 10 + l) * 0.25, lx = -4 + l * 2.6;
      ctx.beginPath(); ctx.moveTo(lx, -3.5); ctx.lineTo(lx - 2, -3.5 + Math.sin(a) * 4 + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx, -3.5); ctx.lineTo(lx + 2, -3.5 + Math.sin(a) * 4 + 2); ctx.stroke();
    }
    ctx.fillStyle = '#B8D0C0'; ctx.fillRect(6.4, -4.2, 1.3, 1.3);                   // pale eye
  },

  moth(ctx, f, time) {   // luna moth: pale-green beating wings + a slim body
    const open = Math.abs(Math.sin((f.t + time) * 9));
    const rest = f.state === 'roost';
    const beat = rest ? 0.2 : open;
    ctx.fillStyle = '#BEEBB4';
    ctx.beginPath(); ctx.ellipse(-1.5 - beat * 1.6, -4, 2.8, 1.7, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(1.5 + beat * 1.6, -4, 2.8, 1.7, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5A6A50'; ctx.fillRect(-0.8, -5.6, 1.6, 3.6);
  },
};

function gait(f) { return Math.abs(Math.sin(f.t * (f.state === 'flee' ? 16 : 8))); }

// a tiny mood glyph floats over a creature so its state reads at a glance
const MOOD_GLYPH = {
  intimidate: '!', flee: '!', mate: '♥', sleep: 'z', roost: 'z', feed: '♪', eat: '♪', fight: '✦', drink: '♪',
};

/** draw one creature (world space, feet at f.y): juveniles small, elders fade */
export function drawFauna(ctx, f, time) {
  ctx.save();
  ctx.translate(f.x, f.y);
  const grow = 0.65 + Math.min(1, f.age ?? 1) * 0.45;   // 0.65x juvenile → 1.1x adult
  ctx.scale(f.dir * grow, grow);
  if (f.fade > 0) ctx.globalAlpha = Math.max(0, 1 - f.fade / 2);
  const spr = getFaunaSprite(f.spec?.draw || f.kind);
  if (spr && spr.animated) {
    // walk-cycle sheet: step through frames while moving, hold frame 0 at rest.
    // Frames are grounded (feet at the frame bottom), so the frame bottom = ground.
    ctx.imageSmoothingEnabled = false;
    const moving = f.state === 'walk' || f.state === 'flee' || f.state === 'seekShelter' || f.state === 'hunt';
    const fps = f.state === 'flee' ? 14 : 8;
    const idx = moving ? Math.floor((time * fps + (f.ph || 0) * 4)) % spr.frames : 0;
    const cx = (idx % spr.cols) * spr.frameW, cy = ((idx / spr.cols) | 0) * spr.frameH;
    const dh = (f.spec?.size?.[1] || 10) * 2.4;
    // sink the frame ~10% so the creature's feet (not the grass baked below them)
    // land on the ground; the grass tuft tucks into the dirt
    ctx.drawImage(spr.img, cx, cy, spr.frameW, spr.frameH, -dh / 2, -dh + dh * 0.1, dh, dh);
  } else if (spr) {
    // static single frame: alpha-trimmed to the body, feet on the ground, gentle bob
    const dh = (f.spec?.size?.[1] || 10) * 1.7;
    const dw = dh * (spr.box.sw / spr.box.sh);
    const bob = (f.state === 'walk' || f.state === 'flee' || f.state === 'seekShelter')
      ? Math.abs(Math.sin(f.t * (f.state === 'flee' ? 16 : 8))) * 1.6 : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr.img, spr.box.sx, spr.box.sy, spr.box.sw, spr.box.sh, -dw / 2, -dh - bob, dw, dh);
  } else {
    (FAUNA_ART[f.spec?.draw || f.kind] || FAUNA_ART.generic)(ctx, f, time);
  }
  ctx.restore();

  // reaction emoji, drawn UN-flipped above the head (skip juveniles + faders)
  const glyph = MOOD_GLYPH[f.state];
  if (glyph && f.fade <= 0 && (f.age ?? 1) > 0.2) {
    const bob = f.state === 'sleep' || f.state === 'roost' ? Math.sin(time * 2 + (f.ph || 0)) * 1.5 : 0;
    const h = (f.spec?.size?.[1] || 10) + 8;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = f.state === 'flee' || f.state === 'intimidate' ? '#E8A05A' : f.state === 'mate' ? '#E88AA0' : '#BFE0D8';
    ctx.font = 'bold 8px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(glyph, f.x, f.y - h + bob);
    ctx.restore();
  }
}

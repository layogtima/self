// The landing. Year 102,025. PROBE DG-3 falls from a starfield, unfurls a
// parachute through the atmosphere, and settles gently onto the camp — then the
// mission brief types out. Any key skips ahead; ~9s total.

import { VIEW_W, VIEW_H } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { text, blueprintPanel } from '../render/text.js';
import { drawProbe, softCloud } from '../render/sprites.js';
import { anyPressed } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { updateMusic, setMusicDepth } from '../core/music.js';

const BRIEF = [
  'YEAR 102,025',
  'PROBE DG-3 · SURFACE INSERTION COMPLETE',
  '',
  'MISSION: recover the legendary relic —',
  'a complete TYRANNOSAURUS REX fossil.',
  '',
  'dig well, little probe.',
];

// phase timings (seconds)
const T_STARS = 1.6;     // starfield + entry glow
const T_CHUTE = 2.4;     // parachute deploys
const T_LAND = 6.4;      // gentle touchdown
const T_BRIEF_DONE = 11;
const GROUND_Y = 452;

const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export function makeIntroScene(services) {
  const { ctx } = services;
  let t = 0, landed = false, shake = 0, chuteCut = 0;

  const stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 173.3) % VIEW_W, y: (i * 97.7) % (VIEW_H * 0.7), s: 1 + (i % 3) }));
  const clouds = Array.from({ length: 6 }, (_, i) => ({ x: (i * 241) % VIEW_W, y: 90 + (i * 71) % 220, v: 8 + (i % 3) * 6 }));

  function skip() { services.go('game'); }

  return {
    update(dt) {
      setMusicDepth(0);
      updateMusic(dt);
      t += dt;
      shake = Math.max(0, shake - dt * 8);
      if (t > T_STARS && t < T_CHUTE + 0.3) shake = 1.2;                 // atmospheric buffet
      if (!landed && t >= T_LAND) { landed = true; shake = 4; chuteCut = t; sfx.land(); }
      for (const c of clouds) { c.x += c.v * dt; if (c.x > VIEW_W + 80) c.x = -80; }
      if (t > 0.6 && anyPressed()) {
        if (t < T_LAND) { t = T_LAND; landed = true; shake = 4; chuteCut = T_LAND; }
        else skip();
      }
      if (t > T_BRIEF_DONE + 2) skip();
    },

    render(time) {
      const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
      ctx.save();
      ctx.translate(sx, sy);

      // sky: space → daylight blend as we enter the atmosphere
      const atmo = Math.min(1, Math.max(0, (t - T_STARS) / (T_CHUTE - T_STARS + 0.6)));
      const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      g.addColorStop(0, blend('#0B0E1A', PALETTE.sky, atmo));
      g.addColorStop(1, blend('#141A2E', PALETTE.skyDusk, atmo));
      ctx.fillStyle = g;
      ctx.fillRect(-8, -8, VIEW_W + 16, VIEW_H + 16);

      // stars fade with the atmosphere
      if (atmo < 1) {
        ctx.fillStyle = `rgba(244,239,223,${((1 - atmo) * 0.9).toFixed(2)})`;
        for (const s of stars) ctx.fillRect(s.x, s.y, s.s, s.s);
      }
      // soft clouds drift once we're in the air
      if (atmo > 0.3) { ctx.globalAlpha = Math.min(1, (atmo - 0.3) * 2); for (const c of clouds) softCloud(ctx, c.x, c.y, 0); ctx.globalAlpha = 1; }

      // ground eases up into frame near landing (no pop)
      const groundReveal = Math.min(1, Math.max(0, (t - (T_LAND - 2)) / 2));
      if (groundReveal > 0) {
        const gy = GROUND_Y + (1 - easeInOut(groundReveal)) * 60;
        ctx.fillStyle = '#8A7A5E';
        ctx.fillRect(-8, gy, VIEW_W + 16, VIEW_H - gy + 8);
        ctx.fillStyle = PALETTE.grass;
        ctx.fillRect(-8, gy, VIEW_W + 16, 5);
      }

      // the probe — eased descent, then rest on the ground
      const probeX = VIEW_W / 2;
      let probeY;
      const chuting = t >= T_CHUTE && t < T_LAND;
      if (t < T_LAND) {
        const p = easeInOut(Math.min(1, t / T_LAND));
        probeY = -30 + p * (GROUND_Y - 22 + 30);
        // entry heat glow before the chute
        if (t > T_STARS && t < T_CHUTE + 0.2) {
          const glow = ctx.createRadialGradient(probeX, probeY + 14, 2, probeX, probeY + 14, 30);
          glow.addColorStop(0, 'rgba(240,169,59,0.8)'); glow.addColorStop(1, 'rgba(240,169,59,0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(probeX, probeY + 14, 30, 0, Math.PI * 2); ctx.fill();
        }
        if (chuting) drawChute(ctx, probeX, probeY, time, Math.min(1, (t - T_CHUTE) / 0.4));
      } else {
        probeY = GROUND_Y - 22;
        // retro-burn puff + touchdown dust
        const dustT = t - T_LAND;
        if (dustT < 1) {
          ctx.fillStyle = `rgba(170,150,120,${((1 - dustT) * 0.55).toFixed(2)})`;
          for (let d = 0; d < 7; d++) {
            const dx = (d - 3) * (14 + dustT * 26);
            ctx.beginPath(); ctx.ellipse(probeX + dx, GROUND_Y - 2, 14 * (1 - dustT * 0.4), 6, 0, 0, Math.PI * 2); ctx.fill();
          }
        }
        // the cut parachute drifts away
        if (dustT < 1.6) { ctx.globalAlpha = Math.max(0, 1 - dustT / 1.6); drawChute(ctx, probeX + 30 + dustT * 40, probeY - 20 - dustT * 30, time, 1); ctx.globalAlpha = 1; }
      }
      drawProbe(ctx, probeX, probeY, 1, time, 0, 0.9, 0, 0);

      ctx.restore();

      // mission brief typewriter
      if (landed && t > T_LAND + 0.4) {
        const briefT = Math.max(0, t - T_LAND - 0.4);
        const chars = Math.floor(briefT * 34);
        let used = 0;
        const pw = 470, ph = BRIEF.length * 22 + 46, px = VIEW_W / 2 - pw / 2, py = 64;
        blueprintPanel(ctx, px, py, pw, ph, { frameW: 6, r: 12, deep: true });
        BRIEF.forEach((line, i) => {
          if (used >= chars) return;
          const take = Math.min(line.length, chars - used);
          used += line.length;
          const isMission = line.startsWith('MISSION') || line.includes('TYRANNOSAURUS');
          text(ctx, line.slice(0, take), VIEW_W / 2, py + 24 + i * 22, { size: 14, bold: isMission, align: 'center', color: isMission ? PALETTE.amberSoft : PALETTE.cream });
        });
        if (briefT * 34 > BRIEF.join('').length) {
          ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.4;
          text(ctx, 'press any key to dig', VIEW_W / 2, py + ph + 14, { size: 12, align: 'center', color: PALETTE.creamDim });
          ctx.globalAlpha = 1;
        }
      }
    },
  };
}

// canopy above the probe (unfurl 0..1)
function drawChute(ctx, cx, topY, time, unfurl) {
  const sway = Math.sin(time * 2) * 4;
  const aw = 30 * unfurl, ay = topY - 34;
  ctx.strokeStyle = 'rgba(60,45,35,0.8)'; ctx.lineWidth = 1.2;
  for (const s of [-1, -0.4, 0.4, 1]) { ctx.beginPath(); ctx.moveTo(cx + 3, topY + 4); ctx.lineTo(cx + s * aw * 0.9 + sway, ay + 5); ctx.stroke(); }
  ctx.fillStyle = '#E0A24A';
  ctx.beginPath();
  ctx.moveTo(cx - aw + sway, ay + 6);
  ctx.quadraticCurveTo(cx - aw * 0.5 + sway, ay - 16, cx + sway, ay - 3);
  ctx.quadraticCurveTo(cx + aw * 0.5 + sway, ay - 16, cx + aw + sway, ay + 6);
  ctx.quadraticCurveTo(cx + sway, ay + 14, cx - aw + sway, ay + 6);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,30,0.5)'; ctx.lineWidth = 1;
  for (const s of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(cx + s * aw + sway, ay - 8); ctx.lineTo(cx + s * aw * 0.7 + sway, ay + 8); ctx.stroke(); }
}

function blend(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

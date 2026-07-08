// The landing. Year 102,025. PROBE DG-3 falls out of a starfield, streaks
// through the atmosphere, retro-burns, and thumps down at the camp — then the
// mission brief types itself out. Any key skips ahead; ~9s total.

import { VIEW_W, VIEW_H } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { text, blueprintPanel, measure } from '../render/text.js';
import { drawProbe } from '../render/sprites.js';
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
const T_STARS = 2.0;     // starfield drift
const T_DESCENT = 4.4;   // atmosphere streak
const T_LAND = 5.0;      // touchdown
const T_BRIEF_DONE = 9.5;

export function makeIntroScene(services) {
  const { ctx } = services;
  let t = 0;
  let landed = false;
  let shake = 0;

  // deterministic starfield
  const stars = Array.from({ length: 90 }, (_, i) => ({
    x: (i * 173.3) % VIEW_W,
    y: (i * 97.7) % VIEW_H,
    s: 1 + (i % 3),
  }));

  function skip() { services.go('game'); }

  return {
    update(dt) {
      setMusicDepth(0);
      updateMusic(dt);
      t += dt;
      shake = Math.max(0, shake - dt * 8);
      if (t > T_DESCENT - 0.4 && t < T_LAND) shake = 2.5;      // rumble on entry
      if (!landed && t >= T_LAND) { landed = true; shake = 6; sfx.land(); sfx.discover(); }
      if (t > 0.6 && anyPressed()) {
        if (t < T_LAND) { t = T_LAND; landed = true; shake = 6; }   // first press: land now
        else skip();                                                // second: into the game
      }
      if (t > T_BRIEF_DONE + 2.5) skip();
    },

    render(time) {
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake;
      ctx.save();
      ctx.translate(sx, sy);

      // sky: space → atmosphere blend
      const atmo = Math.min(1, Math.max(0, (t - T_STARS) / (T_DESCENT - T_STARS)));
      ctx.fillStyle = blend('#0B0E1A', PALETTE.sky, atmo);
      ctx.fillRect(-8, -8, VIEW_W + 16, VIEW_H + 16);

      // stars fade out as atmosphere thickens
      if (atmo < 1) {
        ctx.fillStyle = `rgba(244,239,223,${(1 - atmo) * 0.9})`;
        for (const s of stars) ctx.fillRect(s.x, (s.y + t * 14 * (s.s)) % VIEW_H, s.s, s.s);
      }

      // rushing clouds during descent
      if (atmo > 0.25 && t < T_LAND) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let c = 0; c < 8; c++) {
          const cy = ((c * 173 + t * 560) % (VIEW_H + 200)) - 100;
          const cx = (c * 331) % VIEW_W;
          ctx.beginPath(); ctx.ellipse(cx, cy, 46, 12, 0, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ground strip appears near landing
      if (t > T_DESCENT - 0.6) {
        const gy = 430;
        ctx.fillStyle = '#8A7A5E';
        ctx.fillRect(-8, gy, VIEW_W + 16, VIEW_H - gy + 8);
        ctx.fillStyle = PALETTE.grass;
        ctx.fillRect(-8, gy, VIEW_W + 16, 5);
      }

      // the probe
      const probeX = VIEW_W / 2;
      let probeY;
      if (t < T_LAND) {
        const p = Math.min(1, t / T_LAND);
        probeY = -30 + p * p * (430 - 22 + 30);
        // heat glow during the streak
        if (atmo > 0.3) {
          const g = ctx.createRadialGradient(probeX, probeY + 14, 2, probeX, probeY + 14, 34);
          g.addColorStop(0, 'rgba(240,169,59,0.8)');
          g.addColorStop(1, 'rgba(240,169,59,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(probeX, probeY + 14, 34, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        probeY = 430 - 22;
        // touchdown dust
        const dustT = t - T_LAND;
        if (dustT < 1) {
          ctx.fillStyle = `rgba(170,150,120,${(1 - dustT) * 0.55})`;
          for (let d = 0; d < 7; d++) {
            const dx = (d - 3) * (14 + dustT * 26);
            ctx.beginPath();
            ctx.ellipse(probeX + dx, 428, 14 * (1 - dustT * 0.4), 6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      drawProbe(ctx, probeX, probeY, 1, time, 0, 0.9, 0, 0);

      ctx.restore();

      // mission brief typewriter
      if (landed) {
        const briefT = Math.max(0, t - T_LAND - 0.5);
        const chars = Math.floor(briefT * 34);
        let used = 0;
        const pw = 470, ph = BRIEF.length * 22 + 46;
        const px = VIEW_W / 2 - pw / 2, py = 70;
        blueprintPanel(ctx, px, py, pw, ph, { frameW: 6, r: 12, deep: true });
        BRIEF.forEach((line, i) => {
          if (used >= chars) return;
          const take = Math.min(line.length, chars - used);
          used += line.length;
          const isMission = line.startsWith('MISSION') || line.includes('TYRANNOSAURUS');
          text(ctx, line.slice(0, take), VIEW_W / 2, py + 24 + i * 22, {
            size: 14, bold: isMission, align: 'center',
            color: isMission ? PALETTE.amberSoft : PALETTE.cream,
          });
        });
        if (briefT * 34 > BRIEF.join('').length) {
          const pulse = 0.5 + Math.sin(time * 4) * 0.4;
          ctx.globalAlpha = pulse;
          text(ctx, 'press any key to dig', VIEW_W / 2, py + ph + 14, { size: 12, align: 'center', color: PALETTE.creamDim });
          ctx.globalAlpha = 1;
        }
      }
    },
  };
}

function blend(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

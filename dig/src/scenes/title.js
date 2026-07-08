// Title: a living diorama. The day-cycle sky, drifting clouds and birds, the
// landing platform in silhouette with the rover idling (blinking, sometimes
// zapping the ground), and a strata cutaway with glinting bone nubs below.

import { VIEW_W, VIEW_H, TILE } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { text, roundRect } from '../render/text.js';
import { drawProbe, softCloud } from '../render/sprites.js';
import { mouse, pressed } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { updateMusic, setMusicDepth } from '../core/music.js';
import { makeEnvironment, DAY_LENGTH } from '../game/environment.js';
import { STRATA } from '../content/strata.js';

export function makeTitleScene(services) {
  const { ctx } = services;
  const env = makeEnvironment(DAY_LENGTH * 0.5);   // start golden afternoon
  const buttons = [
    { id: 'start', label: 'DIG', x: VIEW_W / 2 - 150, y: VIEW_H - 108, w: 140, h: 48, primary: true },
    { id: 'settings', label: 'settings', x: VIEW_W / 2 + 10, y: VIEW_H - 108, w: 140, h: 48 },
  ];
  let t = 0, zapT = 0, zapCd = 5;
  const groundY = VIEW_H * 0.58;

  const hit = b => mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h;

  return {
    update(dt) {
      t += dt;
      env.update(dt * 6);                          // day passes quickly on the title
      setMusicDepth(0);
      updateMusic(dt);
      zapCd -= dt;
      zapT = Math.max(0, zapT - dt);
      if (zapCd <= 0) { zapT = 0.5; zapCd = 6 + Math.random() * 6; }
      if (pressed('Enter') || pressed('Space')) { sfx.ui(); services.go(services.save ? 'game' : 'intro'); return; }
      if (pressed('MouseLeft')) {
        for (const b of buttons) if (hit(b)) { sfx.ui(); services.go(b.id === 'start' ? (services.save ? 'game' : 'intro') : 'settings'); return; }
      }
    },

    render(time) {
      // ---- sky (live day cycle) ----
      const { top, bot } = env.skyColors();
      const g = ctx.createLinearGradient(0, 0, 0, groundY);
      g.addColorStop(0, top); g.addColorStop(1, bot);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, groundY);
      const sm = env.sunMoon();
      if (sm.stars > 0.05) {
        ctx.fillStyle = `rgba(240,240,255,${(sm.stars * 0.9).toFixed(2)})`;
        for (let i = 0; i < 50; i++) ctx.fillRect((i * 173.3 + 40) % VIEW_W, (i * 97.7) % (groundY * 0.8), 1.4, 1.4);
      }
      if (sm.sun && sm.sun.a > 0.05) {
        const sg = ctx.createRadialGradient(sm.sun.x, sm.sun.y * 0.8, 2, sm.sun.x, sm.sun.y * 0.8, 34);
        sg.addColorStop(0, `rgba(255,240,190,${sm.sun.a})`);
        sg.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(sm.sun.x, sm.sun.y * 0.8, 34, 0, Math.PI * 2); ctx.fill();
      }
      if (sm.moon && sm.moon.a > 0.05) {
        ctx.fillStyle = `rgba(230,232,240,${sm.moon.a})`;
        ctx.beginPath(); ctx.arc(sm.moon.x, sm.moon.y * 0.8, 10, 0, Math.PI * 2); ctx.fill();
      }
      // clouds
      for (let c = 0; c < 5; c++) {
        const cx = ((c * 311 + time * (6 + c * 2)) % (VIEW_W + 200)) - 100;
        const cy = 50 + (c * 53) % 130;
        softCloud(ctx, cx, cy, 0);
      }
      // birds
      ctx.strokeStyle = 'rgba(40,34,30,0.6)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        const bx = ((i * 397 + time * 22) % (VIEW_W + 100)) - 50;
        const by = 70 + (i * 61) % 90;
        const flap = Math.sin(time * 8 + i * 2) * 2.5;
        ctx.beginPath(); ctx.moveTo(bx - 4, by - flap); ctx.lineTo(bx, by); ctx.lineTo(bx + 4, by - flap); ctx.stroke();
      }

      // ---- ground + platform silhouette ----
      ctx.fillStyle = PALETTE.grass;
      ctx.fillRect(0, groundY - 4, VIEW_W, 4);
      // grass tufts
      ctx.strokeStyle = PALETTE.grassDeep;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 8; x < VIEW_W; x += 14) {
        const sway = Math.sin(time * 1.7 + x * 0.4) * 2;
        ctx.moveTo(x, groundY - 3);
        ctx.quadraticCurveTo(x + sway, groundY - 8, x + sway, groundY - 11);
      }
      ctx.stroke();

      // platform (simplified silhouette, right of centre)
      const px = VIEW_W * 0.6, py = groundY - 10;
      ctx.fillStyle = '#3A363F';
      ctx.fillRect(px - 130, py, 300, 8);
      // lander
      ctx.fillStyle = '#332F3A';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(px + 90, py - 52, 30, 52, 7); ctx.fill(); } else ctx.fillRect(px + 90, py - 52, 30, 52);
      ctx.strokeStyle = '#8E96A4'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px + 100, py - 58, 8, Math.PI * 0.85, Math.PI * 1.95); ctx.stroke();
      const blink = Math.sin(time * 3) > 0.6;
      ctx.fillStyle = blink ? '#E85B4A' : '#5A2A24';
      ctx.beginPath(); ctx.arc(px + 116, py - 56, 2.2, 0, Math.PI * 2); ctx.fill();
      // vitrine glass hint
      ctx.fillStyle = 'rgba(170,205,220,0.25)';
      ctx.fillRect(px - 120, py - 42, 90, 42);
      ctx.strokeStyle = '#4E4956'; ctx.lineWidth = 2;
      ctx.strokeRect(px - 120, py - 42, 90, 42);
      // deck lamp
      ctx.fillStyle = '#4E4956'; ctx.fillRect(px + 40, py - 16, 2, 16);
      ctx.fillStyle = '#FFE9B8'; ctx.beginPath(); ctx.arc(px + 41, py - 18, 2.4, 0, Math.PI * 2); ctx.fill();
      if (env.night01() > 0.3) {
        const lg = ctx.createRadialGradient(px + 41, py - 16, 0, px + 41, py - 16, 44);
        lg.addColorStop(0, `rgba(255,233,184,${env.night01() * 0.25})`);
        lg.addColorStop(1, 'rgba(255,233,184,0)');
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.arc(px + 41, py - 16, 44, 0, Math.PI * 2); ctx.fill();
      }

      // the rover, idling on the deck - blinks, sometimes zaps
      const roverX = px - 10;
      if (zapT > 0) {
        ctx.strokeStyle = 'rgba(255,243,208,0.8)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(roverX + 8, py - 6);
        ctx.lineTo(roverX + 40, py + 4);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,240,200,0.7)';
        ctx.beginPath(); ctx.arc(roverX + 40, py + 4, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      drawProbe(ctx, roverX, py - 22, 1, time, 0, 0.9, 0, 0, { mood: zapT > 0 ? 'laser' : 'idle' });

      // ---- strata cutaway below the surface ----
      const cut = groundY;
      let y = cut;
      STRATA.forEach((s, i) => {
        const h = i === 0 ? 26 : 34 - i;
        ctx.fillStyle = s.colors.base;
        ctx.fillRect(0, y, VIEW_W, h);
        ctx.fillStyle = s.colors.band;
        for (let x = (i * 37) % 60; x < VIEW_W; x += 60) ctx.fillRect(x, y + h * 0.5, 22, 2);
        y += h;
      });
      // buried bone glints in the cutaway
      for (let i = 0; i < 12; i++) {
        const bx = (i * 199 + 60) % VIEW_W;
        const by = cut + 24 + (i * 83) % (y - cut - 40);
        const tw = Math.sin(time * 2 + i * 1.9);
        ctx.save();
        ctx.globalAlpha = 0.5 + tw * 0.2;
        ctx.fillStyle = PALETTE.bone;
        ctx.translate(bx, by); ctx.rotate(i);
        ctx.fillRect(-4, -1.2, 8, 2.4);
        ctx.beginPath(); ctx.arc(-4, 0, 1.8, 0, 7); ctx.arc(4, 0, 1.8, 0, 7); ctx.fill();
        ctx.restore();
        if (tw > 0.85) { ctx.fillStyle = 'rgba(255,250,230,0.9)'; ctx.fillRect(bx + 3, by - 4, 1.5, 1.5); }
      }
      // darken the cutaway progressively
      const dg = ctx.createLinearGradient(0, cut, 0, VIEW_H);
      dg.addColorStop(0, 'rgba(20,14,10,0)');
      dg.addColorStop(1, 'rgba(20,14,10,0.55)');
      ctx.fillStyle = dg;
      ctx.fillRect(0, cut, VIEW_W, VIEW_H - cut);

      // ---- wordmark ----
      ctx.save();
      ctx.shadowColor = 'rgba(224,162,74,0.6)';
      ctx.shadowBlur = 24;
      text(ctx, 'DIGGG', VIEW_W / 2, 64, { size: 76, bold: true, align: 'center', color: '#F6E8C8' });
      ctx.restore();
      text(ctx, 'find fossils · year 102,025', VIEW_W / 2, 148, { size: 14, align: 'center', color: 'rgba(246,232,200,0.75)' });

      // buttons
      for (const b of buttons) {
        const over = hit(b);
        roundRect(ctx, b.x, b.y, b.w, b.h, 12);
        ctx.fillStyle = b.primary ? (over ? '#E0A24A' : '#C8791E') : (over ? 'rgba(58,54,63,0.95)' : 'rgba(43,39,51,0.9)');
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = over ? '#F6E8C8' : 'rgba(0,0,0,0.4)';
        ctx.stroke();
        text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, { size: 18, bold: b.primary, align: 'center', baseline: 'middle', color: b.primary ? '#2A1F10' : '#F6E8C8' });
      }
    },
  };
}

// Title: THE FIELD RECORD. The background is the real game engine playing an
// endless narrated loop of the mission (scenes/attract.js) - a living,
// fully-simulated trailer. The wordmark + buttons float over it. Pressing DIG
// on a new game fades the record into the awakening (scenes/awaken.js gets the
// last frame via the overlay snapshot); with a save it cuts straight in.
// `?trailer` in the URL hides all chrome for clean capture.

import { VIEW_W, VIEW_H } from '../config.js';
import { text, roundRect } from '../render/text.js';
import { mouse, userPressed, releaseAll } from '../core/input.js';
import { touch, toggleFullscreen, fsAvailable } from '../core/touch.js';
import { sfx } from '../core/audio.js';
import { updateMusic, setMusicDepth } from '../core/music.js';
import { makeAttractScene } from './attract.js';

export function makeTitleScene(services) {
  const { ctx } = services;
  const reel = makeAttractScene(services);
  const trailerMode = typeof location !== 'undefined' && /[?&]trailer/.test(location.search || '');
  const buttons = [
    { id: 'start', label: 'DIG', x: VIEW_W / 2 - 150, y: VIEW_H - 175, w: 140, h: 48, primary: true },
    { id: 'settings', label: 'settings', x: VIEW_W / 2 + 10, y: VIEW_H - 175, w: 140, h: 48 },
  ];
  let t = 0;
  let btnY = null;   // buttons ride just below the reel's ground line, clear of the caption
  const fsBtn = { x: VIEW_W - 46, y: 12, w: 34, h: 34 };   // x refreshed per frame (dynamic stage)

  const hit = b => mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h;
  const start = () => {
    sfx.ui();
    releaseAll();   // take the autopilot's hands off the controls before handover
    reel.dispose?.();   // free the reel's ~4MB demo world now, not at GC's whim
    // new game: the record fades into the awakening (last frame as backdrop);
    // returning player: straight in
    services.go(services.save ? 'game' : 'intro', services.save ? undefined : { overlay: true });
  };

  return {
    update(dt) {
      t += dt;
      setMusicDepth(0);
      updateMusic(dt);
      // park the buttons just below the reel's ground line (never over the
      // wordmark above or the storybook caption below), gliding across cuts.
      // x recomputed too - the stage width is dynamic on phones (v5.0)
      const target = Math.max(170, Math.min(VIEW_H - 175, (reel._groundY ?? VIEW_H - 175) + 26));
      btnY = btnY === null ? target : btnY + (target - btnY) * Math.min(1, dt * 3);
      buttons[0].x = VIEW_W / 2 - 150;
      buttons[1].x = VIEW_W / 2 + 10;
      fsBtn.x = VIEW_W - 46;
      for (const b of buttons) b.y = btnY;
      // HUMAN input only: the reel injects synthetic presses (card dismissals,
      // auto-hops) that must never start the game on their own. Check BEFORE
      // reel.update so this frame's injections can't be misread either.
      if (!trailerMode) {
        if (userPressed('Enter') || userPressed('Space')) { start(); return; }
        if (userPressed('MouseLeft')) {
          // fullscreen glyph, top-right (mouse path; the touch layer has its own chip)
          if (!touch.active && fsAvailable() && hit(fsBtn)) { sfx.ui(); toggleFullscreen(); return; }
          for (const b of buttons) {
            if (!hit(b)) continue;
            if (b.id === 'start') { start(); return; }
            sfx.ui(); releaseAll(); services.go('settings'); return;
          }
        }
      }
      reel.update(dt);
    },

    render(time) {
      // the reel IS the scenery - every frame live from the real engine
      reel.render(time);

      if (trailerMode) return;                    // clean frame for capture

      // soft top gradient so the wordmark always reads
      const g = ctx.createLinearGradient(0, 0, 0, 170);
      g.addColorStop(0, 'rgba(8,8,14,0.55)');
      g.addColorStop(1, 'rgba(8,8,14,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, 170);

      // wordmark
      ctx.save();
      ctx.shadowColor = 'rgba(224,162,74,0.6)';
      ctx.shadowBlur = 24;
      text(ctx, 'DIGGG', VIEW_W / 2, 40, { size: 64, bold: true, align: 'center', color: '#F6E8C8' });
      ctx.restore();
      text(ctx, 'find fossils · year 102,025', VIEW_W / 2, 112, { size: 13, align: 'center', color: 'rgba(246,232,200,0.75)' });

      // fullscreen glyph (mouse users; the touch layer draws its own chip)
      if (!touch.active && fsAvailable()) {
        const over = hit(fsBtn);
        ctx.fillStyle = over ? 'rgba(58,54,63,0.9)' : 'rgba(14,12,10,0.55)';
        roundRect(ctx, fsBtn.x, fsBtn.y, fsBtn.w, fsBtn.h, 8); ctx.fill();
        ctx.strokeStyle = over ? '#F6E8C8' : 'rgba(75,227,232,0.5)';
        ctx.lineWidth = 2;
        const m = 9, x0 = fsBtn.x + m, y0 = fsBtn.y + m, x1 = fsBtn.x + fsBtn.w - m, y1 = fsBtn.y + fsBtn.h - m;
        ctx.beginPath();
        ctx.moveTo(x0 + 5, y0); ctx.lineTo(x0, y0); ctx.lineTo(x0, y0 + 5);
        ctx.moveTo(x1 - 5, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + 5);
        ctx.moveTo(x0 + 5, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - 5);
        ctx.moveTo(x1 - 5, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - 5);
        ctx.stroke();
      }

      // a quiet record light: this is the mission, playing itself
      ctx.fillStyle = 'rgba(14,12,10,0.55)';
      roundRect(ctx, 12, 12, 172, 20); ctx.fill();
      ctx.fillStyle = `rgba(127,196,168,${Math.sin(time * 2) > 0 ? 0.9 : 0.5})`;
      ctx.beginPath(); ctx.arc(24, 22, 3, 0, Math.PI * 2); ctx.fill();
      text(ctx, 'FIELD RECORD · DG-3', 34, 17, { size: 9, bold: true, color: 'rgba(75,227,232,0.8)' });

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

/* body. — the generative range behind the garden.

   Layered ridgelines from Perlin noise, painted to a canvas and drifted
   slowly for parallax. Two things steer it:

     time of day  -> the palette (dawn, morning, noon, golden, dusk, night)
     body state   -> how far the range recedes, how jagged it is, how much
                     haze sits between the layers

   Written from scratch: Ken Perlin's improved-noise algorithm is public
   domain, but no third-party landscape code is used here. */

window.BODY_LANDSCAPE = (function () {
  'use strict';

  /* ---------- improved Perlin noise (Perlin, 2002) ---------- */

  function makeNoise(seed) {
    const p = new Uint8Array(512);
    const perm = [];
    for (let i = 0; i < 256; i++) perm[i] = i;
    // deterministic shuffle, so the same person always gets the same range
    let s = seed >>> 0;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
    }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

    const fade = function (t) { return t * t * t * (t * (t * 6 - 15) + 10); };
    const lerp = function (a, b, t) { return a + t * (b - a); };
    function grad(h, x) { return (h & 1) ? -x : x; }

    // 1-D is all a ridgeline needs
    return function (x) {
      const xi = Math.floor(x) & 255;
      const xf = x - Math.floor(x);
      const u = fade(xf);
      return lerp(grad(p[xi], xf), grad(p[xi + 1], xf - 1), u) * 2;
    };
  }

  /* ---------- palettes by time of day ----------
     Only the range is tinted; the app's reading tokens are untouched. */

  const SKIES = [
    { at: 0,    sky: ['#0d1b26', '#132a33'], ridge: '#0f2730', mist: '#16323b', sun: null },
    { at: 5.0,  sky: ['#1d2a3d', '#3d3a52'], ridge: '#2a3147', mist: '#3a3c55', sun: null },
    { at: 6.6,  sky: ['#e7d0c2', '#f2c49b'], ridge: '#8f7f92', mist: '#e0bfae', sun: '#ffdcae' },
    { at: 9.5,  sky: ['#eae6d6', '#efe4c6'], ridge: '#8e8a91', mist: '#e6dfc9', sun: '#fdf3d2' },
    { at: 13.0, sky: ['#e9e7dc', '#ece5cd'], ridge: '#8b8b8e', mist: '#e5e0cd', sun: '#fbf6de' },
    { at: 17.3, sky: ['#f0dcbb', '#f2c795'], ridge: '#8a7583', mist: '#e5cbaf', sun: '#ffd79b' },
    { at: 19.2, sky: ['#6a5570', '#b07a6a'], ridge: '#4a3f57', mist: '#7a6473', sun: '#f0a878' },
    { at: 21.0, sky: ['#16232e', '#1d3038'], ridge: '#182b34', mist: '#22333c', sun: null },
    { at: 24,   sky: ['#0d1b26', '#132a33'], ridge: '#0f2730', mist: '#16323b', sun: null }
  ];

  function hex2rgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' +
      Math.round(A[1] + (B[1] - A[1]) * t) + ',' +
      Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function skyAt(hour) {
    let i = 0;
    while (i < SKIES.length - 2 && hour >= SKIES[i + 1].at) i++;
    const a = SKIES[i], b = SKIES[i + 1];
    const t = Math.min(1, Math.max(0, (hour - a.at) / (b.at - a.at || 1)));
    return {
      sky: [mix(a.sky[0], b.sky[0], t), mix(a.sky[1], b.sky[1], t)],
      ridge: mix(a.ridge, b.ridge, t),
      mist: mix(a.mist, b.mist, t),
      sun: (a.sun && b.sun) ? mix(a.sun, b.sun, t) : (t < 0.5 ? a.sun : b.sun),
      night: !(a.sun || b.sun)
    };
  }

  /* ---------- the range ---------- */

  let cv, ctx, raf = 0, layers = [], state = null, W = 0, H = 0, dpr = 1;

  function ridgePath(g, noise, opts) {
    const { baseY, amp, rough, w, h, tint, mist } = opts;
    g.beginPath();
    g.moveTo(0, h);
    for (let x = 0; x <= w; x += 3) {
      const n = noise(x * rough) * 0.6 + noise(x * rough * 2.3) * 0.3 + noise(x * rough * 5.1) * 0.1;
      g.lineTo(x, baseY + n * amp);
    }
    g.lineTo(w, h);
    g.closePath();
    const grad = g.createLinearGradient(0, baseY - amp, 0, h);
    grad.addColorStop(0, tint);
    grad.addColorStop(1, mist);
    g.fillStyle = grad;
    g.fill();
  }

  function build() {
    if (!state) return;
    const pal = skyAt(state.hour);
    const health = Math.max(0, Math.min(1, state.health));

    // healthier record -> more layers receding into the distance, softer peaks
    const count = 3 + Math.round(health * 3);
    const rough = 0.010 - health * 0.004;          // calmer ridgelines when well
    const hazeAmt = 0.16 + (1 - health) * 0.26;    // murkier when things are off

    layers = [];
    for (let i = 0; i < count; i++) {
      const depth = i / Math.max(1, count - 1);     // 0 = far, 1 = near
      const lw = Math.ceil(W * 1.35);
      const off = document.createElement('canvas');
      off.width = lw * dpr;
      off.height = H * dpr;
      const g = off.getContext('2d');
      g.scale(dpr, dpr);

      const noise = makeNoise(state.seed + i * 977);
      ridgePath(g, noise, {
        baseY: H * (0.60 + depth * 0.20),
        amp: H * (0.055 + depth * 0.075),
        rough: rough * (1 + depth * 0.5),
        w: lw, h: H,
        // peaks stay pale — atmosphere thins them with distance
        tint: mix(pal.mist, pal.ridge, 0.18 + depth * 0.42),
        mist: mix(pal.mist, pal.ridge, 0.05 + depth * 0.3)
      });

      // haze sits in front of each layer, thicker toward the back
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = pal.mist;
      g.globalAlpha = hazeAmt * (1 - depth) * 1.15;
      g.fillRect(0, 0, lw, H);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';

      layers.push({ cv: off, w: lw, speed: 0.9 + depth * 3.4, x: 0 });
    }
    paint(0);
  }

  function paint(t) {
    if (!ctx || !state) return;
    const pal = skyAt(state.hour);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, pal.sky[0]);
    sky.addColorStop(1, pal.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // a low sun or moon, sitting behind the range
    const rise = 6.3, set = 19.0;
    const day = state.hour >= rise && state.hour < set;
    const span = day ? (state.hour - rise) / (set - rise)
      : ((state.hour >= set ? state.hour - set : state.hour + 24 - set) / (24 - set + rise));
    const cx = W * (0.12 + span * 0.76);
    const cy = H * (0.62 - Math.sin(Math.PI * span) * 0.44);
    const r = Math.min(W, H) * (day ? 0.085 : 0.055);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4.5);
    const core = pal.sun || '#cfe0ea';
    glow.addColorStop(0, core);
    glow.addColorStop(0.14, core);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = day ? 0.85 : 0.6;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    layers.forEach(function (L) {
      const drift = state.motion ? (t * 0.004 * L.speed) % L.w : 0;
      ctx.drawImage(L.cv, -drift, 0, L.w, H);
      ctx.drawImage(L.cv, L.w - drift, 0, L.w, H);
    });

    // melt the foot of the range into whatever sits below it
    const foot = ctx.createLinearGradient(0, H * 0.5, 0, H);
    foot.addColorStop(0, 'rgba(0,0,0,0)');
    foot.addColorStop(1, pal.mist);
    ctx.fillStyle = foot;
    ctx.fillRect(0, H * 0.5, W, H * 0.5);
  }

  function loop(t) {
    paint(t);
    raf = requestAnimationFrame(loop);
  }

  function resize() {
    if (!cv) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth;
    H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  return {
    mount: function (canvas) {
      cv = canvas;
      window.addEventListener('resize', resize);
      resize();
    },
    /* hour: 0-24 · health: 0-1 · seed: per person · motion: drift on/off */
    update: function (next) {
      const changed = !state ||
        Math.abs(next.hour - state.hour) > 0.02 ||
        next.health !== state.health ||
        next.seed !== state.seed;
      state = next;
      if (changed) build();
      cancelAnimationFrame(raf);
      if (next.motion) raf = requestAnimationFrame(loop);
      else paint(0);
    }
  };
})();

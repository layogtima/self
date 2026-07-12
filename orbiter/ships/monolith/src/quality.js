// Adaptive quality: 4 tiers, an initial device probe, and an FPS watchdog
// that steps down when the frame rate sags and back up when there's headroom.
// Everyone gets 60fps; effects are the currency.

const TIERS = [
  { name: 'potato', dpr: 0.85, shadows: false, shadowSize: 0, starFrac: 0.4, fx: false, post: 0 },
  { name: 'low', dpr: 1.0, shadows: true, shadowSize: 1024, starFrac: 0.7, fx: false, post: 1 },
  { name: 'medium', dpr: 1.25, shadows: true, shadowSize: 2048, starFrac: 1.0, fx: true, post: 2 },
  { name: 'high', dpr: 1.5, shadows: true, shadowSize: 2048, starFrac: 1.0, fx: true, post: 3 },
];

export function createQuality({ renderer, post, sun, atmosphere, space, toast, onResize, trimLights = [] }) {
  // --- probe ---
  const forced = new URLSearchParams(location.search).get('quality');
  const stored = localStorage.getItem('orbiter-tier');
  const mobile = /Mobi|Android/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const probeMax = mobile ? 1 : cores >= 8 ? 3 : cores >= 4 ? 2 : 1;

  let tier = forced !== null ? Math.max(0, Math.min(3, +forced))
    : stored !== null ? Math.max(0, Math.min(probeMax, +stored))
    : probeMax;
  let maxTier = forced !== null ? +forced : probeMax;

  function apply(t, announce = false) {
    tier = Math.max(0, Math.min(3, t));
    const q = TIERS[tier];
    renderer.setPixelRatio(Math.min(devicePixelRatio, q.dpr));
    // keep shadowMap.enabled true; toggling the LIGHT recompiles cleanly
    sun.castShadow = q.shadows;
    if (q.shadows && sun.shadow.mapSize.x !== q.shadowSize) {
      sun.shadow.mapSize.set(q.shadowSize, q.shadowSize);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
    space.setStarFraction(q.starFrac);
    atmosphere.setEffectsVisible(q.fx);
    for (const l of trimLights) l.visible = tier >= 1; // potato sheds accent lights
    post.setTier(q.post);
    onResize?.();
    if (forced === null) localStorage.setItem('orbiter-tier', String(tier));
    if (announce) toast(`NOVA rebalanced the photons — quality: ${q.name}`);
  }
  apply(tier);

  // --- watchdog ---
  let acc = 0, frames = 0, windowT = 0, goodT = 0;
  const locked = forced !== null;

  function update(dt) {
    if (locked) return;
    acc += dt; frames++; windowT += dt;
    if (windowT >= 2) {
      const fps = frames / acc;
      if (fps < 50 && tier > 0) {
        apply(tier - 1, true);
        goodT = 0;
      } else if (fps > 58) {
        goodT += windowT;
        if (goodT > 15 && tier < maxTier) {
          apply(tier + 1, true);
          goodT = 0;
        }
      } else {
        goodT = 0;
      }
      acc = 0; frames = 0; windowT = 0;
    }
  }

  return { update, apply, getTier: () => tier, tiers: TIERS };
}

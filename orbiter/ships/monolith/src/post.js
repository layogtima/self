import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass,
  BloomEffect, VignetteEffect, NoiseEffect, ChromaticAberrationEffect,
  BlendFunction,
} from 'postprocessing';

// Post chain on pmndrs/postprocessing: everything merges into ONE fullscreen
// EffectPass — far cheaper than chained ShaderPasses, potato-friendly.
// Exposes effect handles so Nova's powers and the quality tiers can reach in.

export function createPost(renderer, scene, camera) {
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
  });
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new BloomEffect({
    intensity: 0.75,
    luminanceThreshold: 0.72,
    luminanceSmoothing: 0.18,
    mipmapBlur: true,
    radius: 0.6,
  });
  const vignette = new VignetteEffect({ darkness: 0.52, offset: 0.28 });
  const noise = new NoiseEffect({ blendFunction: BlendFunction.COLOR_DODGE, premultiply: true });
  noise.blendMode.opacity.value = 0.04;
  const chroma = new ChromaticAberrationEffect({
    offset: new THREE.Vector2(0, 0), radialModulation: true, modulationOffset: 0.3,
  });

  let pass = null;
  let tier = 3;
  function rebuild() {
    if (pass) { composer.removePass(pass); pass.dispose(); }
    const effects =
      tier <= 0 ? [vignette]
      : tier === 1 ? [bloom, vignette]
      : [bloom, vignette, noise, chroma];
    pass = new EffectPass(camera, ...effects);
    composer.addPass(pass);
  }
  rebuild();

  return {
    composer,
    bloom, vignette, noise, chroma,
    render() { composer.render(); },
    resize(w, h) { composer.setSize(w, h); },
    setTier(t) { if (t !== tier) { tier = t; rebuild(); } },
    update() {},
  };
}

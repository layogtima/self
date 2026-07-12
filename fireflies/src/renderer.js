// renderer.js — WebGLRenderer + post FX (bloom is what makes the glow magical)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function makeRenderer(scene, camera) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  document.body.appendChild(renderer.domElement);

  // ---- post: render -> bloom -> ACES output ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // strength, radius, threshold — a restrained bloom: only the tiny bright
  // firefly cores get a soft halo. The environment is lit by real point lights,
  // NOT by bloom, so floors/walls read as surfaces instead of glowing washes.
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight),
    0.42,  // strength
    0.4,   // radius
    0.82,  // threshold (high -> almost nothing but the cores bloom)
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    bloom.setSize(innerWidth, innerHeight);
  });

  return { renderer, composer, bloom };
}

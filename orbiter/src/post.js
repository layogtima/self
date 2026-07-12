import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Post chain: render → bloom (half-res) → tone map/sRGB → grade.
// The grade pass runs after OutputPass so grain/vignette work in display space.

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.55 },
    uGrain: { value: 0.045 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + uTime * 43.7) * 43758.5453);
    }

    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;

      // gentle teal-shadow / warm-highlight split grade
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col += (1.0 - luma) * vec3(-0.012, 0.004, 0.022); // cool the shadows
      col += luma * vec3(0.012, 0.004, -0.01);          // warm the highlights

      // vignette
      vec2 q = vUv - 0.5;
      float vig = 1.0 - dot(q, q) * uVignette * 2.0;
      col *= clamp(vig, 0.0, 1.0);

      // film grain
      col += (hash(vUv * vec2(1920.0, 1080.0)) - 0.5) * uGrain * (0.4 + 0.6 * (1.0 - luma));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function createPost(renderer, scene, camera) {
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(size.x / 2, size.y / 2),
    0.55,  // strength
    0.5,   // radius
    0.82   // threshold — only true emissives and hot speculars bloom
  );
  composer.addPass(bloom);

  composer.addPass(new OutputPass());

  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  function resize(w, h) {
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
  }

  function update(dt, elapsed) {
    grade.uniforms.uTime.value = elapsed;
  }

  return { composer, resize, update, bloom };
}

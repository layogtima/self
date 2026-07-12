import * as THREE from 'three';

// Glass v2. Slice-2 feedback: the old fresnel went milky and read as fog from
// inside. Fixes: much lower base opacity, gentler fresnel, an animated
// specular sheen band that drifts across the pane, a faint star-sparkle
// twinkle — and PHYSICAL mullions (addMullions) so panes read as architecture.

export function makeGlassMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uOpacity: { value: 1.0 },
      uTint: { value: new THREE.Color(0.74, 0.84, 0.85) }, // warm porcelain-sky
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vNormalW; varying vec3 vPosW; varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uOpacity; uniform vec3 uTint; uniform float uTime;
      varying vec3 vNormalW; varying vec3 vPosW; varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float ndv = abs(dot(viewDir, normalize(vNormalW)));
        float fres = pow(1.0 - ndv, 2.5);

        // drifting diagonal sheen — the "there is a pane here" highlight
        float band = vUv.x * 1.4 + vUv.y * 0.6 - uTime * 0.03;
        float sheen = smoothstep(0.0, 0.5, sin(band * 6.2831) - 0.86) * 0.5;

        // faint sparkle twinkle
        float sp = hash(floor(vUv * 90.0));
        float sparkle = step(0.997, sp) * (0.5 + 0.5 * sin(uTime * 3.0 + sp * 40.0)) * 0.6;

        vec3 col = mix(uTint, vec3(0.92, 0.97, 1.0), fres) + sheen + sparkle;
        float alpha = (0.02 + fres * 0.28 + sheen * 0.5 + sparkle) * uOpacity;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

export const mullionMat = new THREE.MeshStandardMaterial({ color: 0x1e232a, roughness: 0.6, metalness: 0.5 });

// Structural bar GEOMETRIES for a rectangular pane, pre-transformed by the
// pane's world matrix — collect these across all panes and merge into ONE
// mesh (draw calls, not scene-graph nodes).
export function mullionGeometries(w, h, paneMatrix, { vEvery = 9, hEvery = 8, bar = 0.28 } = {}) {
  const geos = [];
  const local = new THREE.Matrix4();
  const nv = Math.max(0, Math.floor(w / vEvery));
  for (let i = 1; i <= nv; i++) {
    const g = new THREE.BoxGeometry(bar, h, bar * 2);
    local.makeTranslation(-w / 2 + (i * w) / (nv + 1), 0, 0);
    g.applyMatrix4(local).applyMatrix4(paneMatrix);
    geos.push(g);
  }
  const nh = Math.max(0, Math.floor(h / hEvery));
  for (let i = 1; i <= nh; i++) {
    const g = new THREE.BoxGeometry(w, bar, bar * 2);
    local.makeTranslation(0, -h / 2 + (i * h) / (nh + 1), 0);
    g.applyMatrix4(local).applyMatrix4(paneMatrix);
    geos.push(g);
  }
  return geos;
}

import * as THREE from 'three'
import { INTERNAL_RESOLUTION } from '../../game/constants'

/** Subtle CRT: faint scanlines + slight chromatic aberration toward edges. */
export const CrtShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(INTERNAL_RESOLUTION.width, INTERNAL_RESOLUTION.height) },
    uScanline: { value: 0.08 },   // 0 = off
    uAberration: { value: 0.0015 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uScanline;
    uniform float uAberration;
    varying vec2 vUv;

    void main() {
      vec2 centered = vUv - 0.5;
      float edge = dot(centered, centered);
      vec2 off = centered * edge * uAberration * 40.0;
      float r = texture2D(tDiffuse, vUv + off).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - off).b;
      vec3 c = vec3(r, g, b);
      float line = step(0.5, fract(vUv.y * uResolution.y * 0.5));
      c *= 1.0 - uScanline * line;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
}

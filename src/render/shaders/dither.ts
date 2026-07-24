import * as THREE from 'three'
import { INTERNAL_RESOLUTION } from '../../game/constants'

/** Bayer 4x4 ordered dithering + color quantization. */
export const DitherShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(INTERNAL_RESOLUTION.width, INTERNAL_RESOLUTION.height) },
    uLevels: { value: 32.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uLevels;
    varying vec2 vUv;

    float bayer(vec2 p) {
      int x = int(mod(p.x, 4.0));
      int y = int(mod(p.y, 4.0));
      int i = y * 4 + x;
      // 4x4 bayer matrix / 16
      float m[16];
      m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
      m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
      m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
      m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
      for (int k = 0; k < 16; k++) { if (k == i) return m[k] / 16.0; }
      return 0.0;
    }

    void main() {
      vec2 frag = vUv * uResolution;
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float d = bayer(floor(frag)) - 0.5;
      c = floor(c * uLevels + d + 0.5) / uLevels;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
}

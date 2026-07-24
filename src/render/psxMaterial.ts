import * as THREE from 'three'
import { INTERNAL_RESOLUTION } from '../game/constants'

/**
 * MeshLambertMaterial with PS1 vertex-snap: gl_Position is quantized to the
 * low-res pixel grid, producing authentic geometry wobble.
 * Update uniforms.uResolution at runtime if the drawing buffer size changes.
 */
export function makePSXMaterial(
  params: THREE.MeshLambertMaterialParameters = {},
): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial(params)
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uResolution = {
      value: new THREE.Vector2(INTERNAL_RESOLUTION.width, INTERNAL_RESOLUTION.height),
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec2 uResolution;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        {
          vec2 grid = uResolution * 0.5;
          gl_Position.xy = floor(gl_Position.xy / gl_Position.w * grid + 0.5) / grid * gl_Position.w;
        }`,
      )
  }
  // distinct program cache key per material so the injection compiles once
  mat.customProgramCacheKey = () => 'psx-lambert'
  return mat
}

import { EffectComposer } from '@react-three/postprocessing'
import { ShaderPass } from 'postprocessing'
import { useMemo } from 'react'
import * as THREE from 'three'
import { CrtShader } from './shaders/crt'
import { DitherShader } from './shaders/dither'

function makeShaderPass(shader: typeof DitherShader | typeof CrtShader) {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(shader.uniforms),
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
  })
  return new ShaderPass(material, 'tDiffuse')
}

/** Post chain: dither+quantize, then subtle CRT. Low-res comes from Canvas dpr + CSS pixelation. */
export default function PSXPipeline() {
  const passes = useMemo(
    () => [makeShaderPass(DitherShader), makeShaderPass(CrtShader)],
    [],
  )
  return (
    <EffectComposer multisampling={0}>
      {passes.map((p, i) => (
        <primitive key={i} object={p} />
      ))}
    </EffectComposer>
  )
}

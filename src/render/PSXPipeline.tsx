import { EffectComposer } from '@react-three/postprocessing'
import { ShaderPass } from 'postprocessing'
import { useMemo } from 'react'
import { CrtShader } from './shaders/crt'
import { DitherShader } from './shaders/dither'

/** Post chain: dither+quantize, then subtle CRT. Low-res comes from Canvas dpr + CSS pixelation. */
export default function PSXPipeline() {
  const passes = useMemo(
    () => [new ShaderPass(DitherShader as never), new ShaderPass(CrtShader as never)],
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

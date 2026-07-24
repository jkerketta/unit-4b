import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { makePSXMaterial } from './psxMaterial'

describe('makePSXMaterial', () => {
  it('returns a MeshLambertMaterial', () => {
    expect(makePSXMaterial()).toBeInstanceOf(THREE.MeshLambertMaterial)
  })
  it('injects vertex snap via onBeforeCompile', () => {
    const mat = makePSXMaterial({ color: '#fff' })
    const shader = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: '#include <common>\nvoid main() {\n#include <project_vertex>\n}',
      fragmentShader: '',
    }
    mat.onBeforeCompile(shader as never, {} as never)
    expect(shader.vertexShader).toContain('uResolution')
    expect(shader.vertexShader).toContain('floor(')
    expect((shader.uniforms as Record<string, { value: THREE.Vector2 }>).uResolution.value.x).toBeGreaterThan(0)
  })
  it('exposes setResolution to update the snap grid', () => {
    const mat = makePSXMaterial()
    const shader = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: '#include <common>\n#include <project_vertex>',
      fragmentShader: '',
    }
    mat.onBeforeCompile(shader as never, {} as never)
    const u = (shader.uniforms as Record<string, { value: THREE.Vector2 }>).uResolution
    u.value.set(320, 240)
    expect(u.value.y).toBe(240)
  })
})

import { describe, expect, it } from 'vitest'
import { DitherShader } from './dither'
import { CrtShader } from './crt'

describe('post shaders', () => {
  it('dither shader quantizes with a bayer matrix', () => {
    expect(DitherShader.fragmentShader).toContain('bayer')
    expect(DitherShader.fragmentShader).toContain('uLevels')
    expect(DitherShader.uniforms.uLevels.value).toBeGreaterThanOrEqual(16)
  })
  it('crt shader has scanline + aberration uniforms', () => {
    expect(CrtShader.fragmentShader).toContain('uScanline')
    expect(CrtShader.fragmentShader).toContain('uAberration')
  })
  it('both take tDiffuse and uResolution', () => {
    for (const s of [DitherShader, CrtShader]) {
      expect(s.fragmentShader).toContain('tDiffuse')
      expect(s.uniforms.uResolution).toBeDefined()
    }
  })
})

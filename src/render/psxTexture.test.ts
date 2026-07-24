import { vi, describe, expect, it } from 'vitest'
import * as THREE from 'three'

vi.hoisted(() => {
  // jsdom's getContext('2d') returns null; provide a minimal mock
  // so makeCanvasTexture can create textures under test
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    configurable: true,
    value(this: HTMLCanvasElement, _contextId: string) {
      if (_contextId === '2d') {
        return {
          canvas: this,
          fillStyle: '',
          fillRect: () => {},
        } as unknown as CanvasRenderingContext2D
      }
      return null
    },
  })
})

import { makeCanvasTexture } from './psxTexture'

describe('makeCanvasTexture', () => {
  it('uses NearestFilter and no mipmaps', () => {
    const tex = makeCanvasTexture(64, (ctx) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 64, 64) })
    expect(tex.minFilter).toBe(THREE.NearestFilter)
    expect(tex.magFilter).toBe(THREE.NearestFilter)
    expect(tex.generateMipmaps).toBe(false)
    expect(tex.colorSpace).toBe(THREE.SRGBColorSpace)
  })
})

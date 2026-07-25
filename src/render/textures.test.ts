import * as THREE from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { operations } = vi.hoisted(() => {
  const operations: unknown[][] = []
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value(this: HTMLCanvasElement, id: string) {
      if (id !== '2d') return null
      const record = (name: string) => (...args: unknown[]) => operations.push([name, ...args])
      return {
        canvas: this,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1,
        fillRect: record('fillRect'),
        beginPath: record('beginPath'),
        moveTo: record('moveTo'),
        lineTo: record('lineTo'),
        stroke: record('stroke'),
        createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
        putImageData: (image: ImageData) => operations.push(['image', ...image.data.slice(0, 64)]),
      } as unknown as CanvasRenderingContext2D
    },
  })
  return { operations }
})

import {
  carpetTexture,
  ceilingTexture,
  concreteTexture,
  entitySkinTexture,
  wallpaperTexture,
  woodFloorTexture,
} from './textures'

const makers = [woodFloorTexture, wallpaperTexture, carpetTexture, concreteTexture, ceilingTexture, entitySkinTexture]

beforeEach(() => operations.splice(0))

describe('procedural textures', () => {
  it.each(makers)('is a repeat-wrapped nearest-filtered 64px texture', (make) => {
    const texture = make()
    expect(texture.image.width).toBe(64)
    expect(texture.image.height).toBe(64)
    expect(texture.minFilter).toBe(THREE.NearestFilter)
    expect(texture.magFilter).toBe(THREE.NearestFilter)
    expect(texture.generateMipmaps).toBe(false)
    expect(texture.wrapS).toBe(THREE.RepeatWrapping)
    expect(texture.wrapT).toBe(THREE.RepeatWrapping)
  })

  it('draws deterministically for repeated calls', () => {
    concreteTexture()
    const first = JSON.stringify(operations)
    operations.splice(0)
    concreteTexture()
    expect(JSON.stringify(operations)).toBe(first)
  })
})

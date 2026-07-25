import * as THREE from 'three'
import { makeCanvasTexture } from './psxTexture'

const SIZE = 64

function random(seed: number) {
  return () => {
    seed |= 0
    seed = seed + 0x6d2b79f5 | 0
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed)
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }
}

function texture(seed: number, draw: (ctx: CanvasRenderingContext2D, rng: () => number) => void) {
  const output = makeCanvasTexture(SIZE, (ctx) => draw(ctx, random(seed)))
  output.repeat.set(2, 2)
  return output
}

export function woodFloorTexture(): THREE.CanvasTexture {
  return texture(4, (ctx, rng) => {
    ctx.fillStyle = '#60472e'
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (let y = 0; y < SIZE; y += 8) {
      ctx.fillStyle = `rgb(${88 + Math.floor(rng() * 20)},${62 + Math.floor(rng() * 14)},${37 + Math.floor(rng() * 10)})`
      ctx.fillRect(0, y + 1, SIZE, 7)
      ctx.fillStyle = '#33271d'
      ctx.fillRect(0, y, SIZE, 1)
      const joint = (Math.floor(rng() * 7) + 1) * 8
      ctx.fillRect(joint, y, 1, 8)
      if (rng() > 0.45) {
        ctx.fillStyle = '#49331f'
        ctx.fillRect(Math.floor(rng() * 58) + 3, y + 3, 3, 2)
      }
    }
  })
}

export function wallpaperTexture(): THREE.CanvasTexture {
  return texture(11, (ctx, rng) => {
    ctx.fillStyle = '#5c5648'
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (let x = 0; x < SIZE; x += 8) {
      ctx.fillStyle = '#4e493e'
      ctx.fillRect(x, 0, 1, SIZE)
      ctx.fillStyle = '#686052'
      ctx.fillRect(x + 4, 0, 1, SIZE)
    }
    ctx.globalAlpha = 0.2
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = '#292a25'
      ctx.fillRect(Math.floor(rng() * SIZE), Math.floor(rng() * 13), 3 + Math.floor(rng() * 8), 2 + Math.floor(rng() * 7))
    }
    ctx.globalAlpha = 1
  })
}

export function carpetTexture(): THREE.CanvasTexture {
  return texture(19, (ctx, rng) => {
    const image = ctx.createImageData(SIZE, SIZE)
    for (let i = 0; i < image.data.length; i += 4) {
      const n = Math.floor((rng() - 0.5) * 18)
      image.data[i] = 74 + n
      image.data[i + 1] = 63 + n
      image.data[i + 2] = 58 + n
      image.data[i + 3] = 255
    }
    ctx.putImageData(image, 0, 0)
  })
}

export function concreteTexture(): THREE.CanvasTexture {
  return texture(27, (ctx, rng) => {
    ctx.fillStyle = '#43464a'
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (let i = 0; i < 750; i++) {
      const shade = 52 + Math.floor(rng() * 35)
      ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 4})`
      ctx.fillRect(Math.floor(rng() * SIZE), Math.floor(rng() * SIZE), 1, 1)
    }
    ctx.strokeStyle = '#292c2f'
    ctx.lineWidth = 1
    for (let crack = 0; crack < 3; crack++) {
      let x = Math.floor(rng() * SIZE)
      let y = Math.floor(rng() * SIZE)
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let i = 0; i < 7; i++) {
        x = (x + Math.floor(rng() * 7) - 3 + SIZE) % SIZE
        y = (y + Math.floor(rng() * 7) - 3 + SIZE) % SIZE
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  })
}

export function ceilingTexture(): THREE.CanvasTexture {
  return texture(35, (ctx, rng) => {
    ctx.fillStyle = '#6e6a60'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.globalAlpha = 0.18
    for (let i = 0; i < 350; i++) {
      ctx.fillStyle = rng() > 0.5 ? '#817c70' : '#514f49'
      ctx.fillRect(Math.floor(rng() * SIZE), Math.floor(rng() * SIZE), 1, 1)
    }
    ctx.globalAlpha = 1
  })
}

export function entitySkinTexture(): THREE.CanvasTexture {
  return texture(49, (ctx, rng) => {
    ctx.fillStyle = '#c9c0b0'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.globalAlpha = 0.16
    for (let x = 0; x < SIZE; x += 4) {
      ctx.fillStyle = rng() > 0.5 ? '#978f84' : '#e1d8c9'
      ctx.fillRect(x, 0, 1, SIZE)
    }
    ctx.globalAlpha = 1
  })
}

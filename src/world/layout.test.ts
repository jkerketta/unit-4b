import { describe, expect, it } from 'vitest'
import { HATCH_POS, SPAWN, WALLS, WALL_MESHES } from './layout'
import { ROOMS } from '../systems/entity/roomGraph'

describe('layout', () => {
  it('has collision walls and matching visual meshes', () => {
    expect(WALLS.length).toBeGreaterThan(8)
    expect(WALL_MESHES.length).toBe(WALLS.length)
  })
  it('spawn is inside the living room', () => {
    const [x, , z] = SPAWN
    expect(x).toBeGreaterThan(ROOMS.living.bounds.min[0])
    expect(x).toBeLessThan(ROOMS.living.bounds.max[0])
    expect(z).toBeGreaterThan(ROOMS.living.bounds.min[2])
    expect(z).toBeLessThan(ROOMS.living.bounds.max[2])
  })
  it('hatch is inside the living room', () => {
    const [x, , z] = HATCH_POS
    expect(x).toBeGreaterThan(ROOMS.living.bounds.min[0])
    expect(z).toBeLessThan(ROOMS.living.bounds.max[2])
  })
  it('no wall AABB is degenerate (min < max on all axes)', () => {
    for (const w of WALLS) {
      for (let i = 0; i < 3; i++) expect(w.min[i]).toBeLessThan(w.max[i])
    }
  })
})

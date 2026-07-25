import { describe, expect, it } from 'vitest'
import {
  FURNITURE_COLLIDERS,
  getWorldColliders,
  HATCH_POS,
  INTERIOR_SPAWN,
  SPAWN,
  STATIC_COLLIDERS,
  WALLS,
  WALL_MESHES,
} from './layout'
import { DOORWAYS, ROOMS } from '../systems/entity/roomGraph'

describe('layout', () => {
  it('has collision walls and matching visual meshes', () => {
    expect(WALLS.length).toBeGreaterThan(8)
    expect(WALL_MESHES.length).toBe(WALLS.length)
  })
  it('spawns outside before entering and has a valid interior destination', () => {
    expect(SPAWN[2]).toBeGreaterThan(ROOMS.entry.bounds.max[2])
    const [x, , z] = INTERIOR_SPAWN
    expect(x).toBeGreaterThan(ROOMS.entry.bounds.min[0])
    expect(z).toBeLessThan(ROOMS.entry.bounds.max[2])
  })
  it('combines walls, solid furniture, moving box and optional front door', () => {
    expect(STATIC_COLLIDERS.length).toBeGreaterThanOrEqual(12)
    expect(getWorldColliders(false).length).toBe(WALLS.length + STATIC_COLLIDERS.length + 1)
    expect(getWorldColliders(false, true).length).toBe(getWorldColliders(false).length + 1)
    expect(getWorldColliders(true)).not.toEqual(getWorldColliders(false))
  })
  it('keeps every chase doorway clear of furniture', () => {
    for (const doorway of Object.values(DOORWAYS)) {
      for (const box of STATIC_COLLIDERS) {
        const blocked = doorway[0] >= box.min[0] - 0.3 && doorway[0] <= box.max[0] + 0.3 &&
          doorway[2] >= box.min[2] - 0.3 && doorway[2] <= box.max[2] + 0.3
        expect(blocked).toBe(false)
      }
    }
  })
  it('keeps model-aligned furniture colliders inside their intended rooms', () => {
    for (const { name, room, box } of FURNITURE_COLLIDERS) {
      const bounds = ROOMS[room].bounds
      expect(box.min[0], `${name} minimum x`).toBeGreaterThanOrEqual(bounds.min[0])
      expect(box.max[0], `${name} maximum x`).toBeLessThanOrEqual(bounds.max[0])
      expect(box.min[2], `${name} minimum z`).toBeGreaterThanOrEqual(bounds.min[2])
      expect(box.max[2], `${name} maximum z`).toBeLessThanOrEqual(bounds.max[2])
    }
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

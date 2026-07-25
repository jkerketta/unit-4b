import { describe, expect, it } from 'vitest'
import type { AABB } from '../player/collision'
import { canHear, hasLineOfSight, segmentIntersectsAABB } from './sensing'

const wall: AABB = { min: [2, 0, -1], max: [3, 3, 1] }

describe('entity sensing', () => {
  it('detects segment intersections and misses', () => {
    expect(segmentIntersectsAABB([0, 1, 0], [5, 1, 0], wall)).toBe(true)
    expect(segmentIntersectsAABB([0, 1, 5], [5, 1, 5], wall)).toBe(false)
  })

  it('blocks line of sight through walls', () => {
    expect(hasLineOfSight([0, 1.5, 0], [5, 1.5, 0], [wall])).toBe(false)
    expect(hasLineOfSight([0, 1.5, 5], [5, 1.5, 5], [wall])).toBe(true)
  })

  it('hears only sprinting players inside the radius', () => {
    expect(canHear([0, 0, 0], [4, 0, 0], true, 6)).toBe(true)
    expect(canHear([0, 0, 0], [4, 0, 0], false, 6)).toBe(false)
    expect(canHear([0, 0, 0], [10, 0, 0], true, 6)).toBe(false)
  })
})

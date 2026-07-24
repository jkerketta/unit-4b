import { describe, expect, it } from 'vitest'
import { resolveCapsule, capsuleHitsAABB, type AABB } from './collision'

const wall: AABB = { min: [2, 0, -1], max: [3, 3, 1] } // wall slab at x=2..3

describe('collision', () => {
  it('capsuleHitsAABB detects overlap', () => {
    expect(capsuleHitsAABB([1.8, 0, 0], 0.3, 1.7, wall)).toBe(true)
    expect(capsuleHitsAABB([1.0, 0, 0], 0.3, 1.7, wall)).toBe(false)
  })

  it('stops movement into a wall', () => {
    // at x=1.6 walking +x into wall face at x=2 (radius .3 -> contact at 1.7)
    const out = resolveCapsule([1.6, 0, 0], 0.3, 1.7, [wall], [2, 0, 0], 0.5)
    expect(out[0]).toBeLessThanOrEqual(1.7 + 1e-6)
    expect(out[0]).toBeGreaterThan(1.0)
  })

  it('slides along a wall (z motion preserved)', () => {
    const out = resolveCapsule([1.6, 0, 0], 0.3, 1.7, [wall], [1, 0, 2], 0.5)
    expect(out[0]).toBeLessThanOrEqual(1.7 + 1e-6)
    expect(out[2]).toBeGreaterThan(0.5) // slid forward in z
  })

  it('free movement with no nearby walls', () => {
    const out = resolveCapsule([0, 0, 0], 0.3, 1.7, [wall], [0, 0, 1], 1)
    expect(out[0]).toBe(0)
    expect(out[1]).toBe(0)
    expect(out[2]).toBeCloseTo(1, 5)
  })

  it('does not tunnel at low framerate (clamps per-pass)', () => {
    // huge dt: would move 10 units through the wall
    const out = resolveCapsule([0, 0, 0], 0.3, 1.7, [wall], [4, 0, 0], 3)
    expect(out[0]).toBeLessThanOrEqual(1.7 + 1e-6)
  })
})

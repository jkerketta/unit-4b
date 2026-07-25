import type { AABB } from '../player/collision'

type V3 = [number, number, number]

/** Slab-method segment/AABB intersection, including edge contact. */
export function segmentIntersectsAABB(start: V3, end: V3, box: AABB): boolean {
  let near = 0
  let far = 1
  for (let axis = 0; axis < 3; axis += 1) {
    const delta = end[axis] - start[axis]
    if (Math.abs(delta) < 1e-9) {
      if (start[axis] < box.min[axis] || start[axis] > box.max[axis]) return false
      continue
    }
    let a = (box.min[axis] - start[axis]) / delta
    let b = (box.max[axis] - start[axis]) / delta
    if (a > b) [a, b] = [b, a]
    near = Math.max(near, a)
    far = Math.min(far, b)
    if (near > far) return false
  }
  return true
}

export function hasLineOfSight(from: V3, to: V3, walls: AABB[]): boolean {
  return !walls.some((wall) => segmentIntersectsAABB(from, to, wall))
}

export function canHear(
  entityPosition: V3,
  playerPosition: V3,
  playerSprinting: boolean,
  hearingRadius: number,
): boolean {
  if (!playerSprinting) return false
  const dx = entityPosition[0] - playerPosition[0]
  const dz = entityPosition[2] - playerPosition[2]
  return dx * dx + dz * dz <= hearingRadius * hearingRadius
}

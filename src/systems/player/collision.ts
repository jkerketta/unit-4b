export interface AABB {
  min: [number, number, number]
  max: [number, number, number]
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/** True if a vertical capsule (feet at pos) overlaps the box. */
export function capsuleHitsAABB(
  pos: [number, number, number],
  radius: number,
  height: number,
  box: AABB,
): boolean {
  const segLo = pos[1] + radius
  const segHi = pos[1] + height - radius
  const cy = clamp(box.min[1], segLo, segHi)
  const px = clamp(pos[0], box.min[0], box.max[0])
  const py = clamp(cy, box.min[1], box.max[1])
  const pz = clamp(pos[2], box.min[2], box.max[2])
  const dx = pos[0] - px
  const dy = cy - py
  const dz = pos[2] - pz
  return dx * dx + dy * dy + dz * dz < radius * radius
}

/**
 * Move a capsule by velocity*dt, resolving against AABBs.
 * Returns corrected feet position. Horizontal resolution only (flat floors);
 * anti-tunnel: displacement is sub-stepped so no step exceeds radius/2.
 */
export function resolveCapsule(
  pos: [number, number, number],
  radius: number,
  height: number,
  boxes: AABB[],
  velocity: [number, number, number],
  dt: number,
): [number, number, number] {
  const maxStep = radius / 2
  const dist = Math.hypot(velocity[0], velocity[2]) * dt
  const steps = Math.max(1, Math.ceil(dist / maxStep))
  const sub: [number, number, number] = [
    (velocity[0] * dt) / steps,
    (velocity[1] * dt) / steps,
    (velocity[2] * dt) / steps,
  ]
  let p: [number, number, number] = [...pos]
  for (let s = 0; s < steps; s++) {
    p = [p[0] + sub[0], p[1] + sub[1], p[2] + sub[2]]
    for (let iter = 0; iter < 3; iter++) {
      for (const box of boxes) {
        if (!capsuleHitsAABB(p, radius, height, box)) continue
        // push out horizontally along smallest penetration axis
        const cx = (box.min[0] + box.max[0]) / 2
        const cz = (box.min[2] + box.max[2]) / 2
        const dxPos = p[0] - cx
        const dzPos = p[2] - cz
        const overlapX = (box.max[0] - box.min[0]) / 2 + radius - Math.abs(dxPos)
        const overlapZ = (box.max[2] - box.min[2]) / 2 + radius - Math.abs(dzPos)
        if (overlapX < overlapZ) {
          p[0] = cx + Math.sign(dxPos || 1) * ((box.max[0] - box.min[0]) / 2 + radius)
        } else {
          p[2] = cz + Math.sign(dzPos || 1) * ((box.max[2] - box.min[2]) / 2 + radius)
        }
      }
    }
  }
  return p
}

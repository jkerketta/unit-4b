import type { AABB } from '../player/collision'

export type RoomId = 'living' | 'entry' | 'hallway' | 'kitchen' | 'bedroom' | 'bathroom' | 'secret'

export interface RoomNode {
  id: RoomId
  center: [number, number, number]
  bounds: AABB // full-height bounds for point tests (y ignored by findRoomForPoint except secret)
}

function room(id: RoomId, x0: number, x1: number, z0: number, z1: number, y0 = 0, y1 = 3): RoomNode {
  return {
    id,
    center: [(x0 + x1) / 2, y0, (z0 + z1) / 2],
    bounds: { min: [x0, y0, z0], max: [x1, y1, z1] },
  }
}

export const ROOMS: Record<RoomId, RoomNode> = {
  living: room('living', -2.5, 2.0, 0.5, 4.5),
  entry: room('entry', 2.0, 8.5, 2.5, 4.5),
  hallway: room('hallway', 2.0, 3.5, -4.5, 0.5),
  kitchen: room('kitchen', 3.5, 8.5, -4.5, -1.5),
  bedroom: room('bedroom', -0.5, 2.0, -4.5, -1.0),
  bathroom: room('bathroom', -2.5, -0.5, -4.5, -2.0),
  secret: room('secret', -2.0, 1.0, 1.0, 4.0, -4, -0.2),
}

export const ADJACENCY: Record<RoomId, RoomId[]> = {
  living: ['entry', 'hallway'],
  entry: ['living'],
  hallway: ['living', 'kitchen', 'bedroom'],
  kitchen: ['hallway'],
  bedroom: ['hallway', 'bathroom'],
  bathroom: ['bedroom'],
  secret: [],
}

export const DOORWAYS: Record<string, [number, number, number]> = {
  'living|entry': [2.0, 0, 3.5],
  'hallway|living': [2.75, 0, 0.5],
  'hallway|kitchen': [3.5, 0, -3.0],
  'bedroom|hallway': [2.0, 0, -2.75],
  'bathroom|bedroom': [-0.5, 0, -3.25],
}

export function findRoomForPoint(p: [number, number, number]): RoomId | null {
  for (const r of Object.values(ROOMS)) {
    const yOk = r.id === 'secret' ? p[1] < -0.5 : p[1] >= -0.5
    if (
      yOk &&
      p[0] >= r.bounds.min[0] && p[0] <= r.bounds.max[0] &&
      p[2] >= r.bounds.min[2] && p[2] <= r.bounds.max[2]
    ) return r.id
  }
  return null
}

export function findPath(from: RoomId, to: RoomId): RoomId[] {
  if (from === to) return [from]
  const prev = new Map<RoomId, RoomId | null>([[from, null]])
  const queue: RoomId[] = [from]
  while (queue.length) {
    const cur = queue.shift()!
    for (const next of ADJACENCY[cur]) {
      if (prev.has(next)) continue
      prev.set(next, cur)
      if (next === to) {
        const path: RoomId[] = [to]
        let p: RoomId | null = cur
        while (p) { path.unshift(p); p = prev.get(p) ?? null }
        return path
      }
      queue.push(next)
    }
  }
  return [from] // unreachable (should not happen for above-ground rooms)
}

export function doorwayBetween(a: RoomId, b: RoomId): [number, number, number] {
  const d = DOORWAYS[`${a}|${b}`] ?? DOORWAYS[`${b}|${a}`]
  if (!d) throw new Error(`no doorway between ${a} and ${b}`)
  return d
}

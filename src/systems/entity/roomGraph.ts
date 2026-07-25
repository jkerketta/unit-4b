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
  living: room('living', -3.125, 5.0, 0.625, 5.625),
  entry: room('entry', 5.0, 10.625, 0.625, 5.625),
  hallway: room('hallway', -3.125, 3.125, -1.875, 0.625),
  kitchen: room('kitchen', 3.125, 10.625, -5.625, 0.625),
  bedroom: room('bedroom', -0.625, 3.125, -5.625, -1.875),
  bathroom: room('bathroom', -3.125, -0.625, -5.625, -1.875),
  secret: room('secret', -2.5, 1.25, 1.25, 5.0, -4, -0.2),
}

export const ADJACENCY: Record<RoomId, RoomId[]> = {
  living: ['hallway', 'entry'],
  hallway: ['living', 'bedroom', 'bathroom', 'kitchen'],
  bedroom: ['hallway', 'bathroom'],
  bathroom: ['bedroom', 'hallway'],
  kitchen: ['hallway', 'entry'],
  entry: ['living', 'kitchen'],
  secret: [],
}

export const DOORWAYS: Record<string, [number, number, number]> = {
  'bathroom|bedroom': [-0.625, 0, -3.75],
  'bathroom|hallway': [-1.875, 0, -1.875],
  'bedroom|hallway': [1.25, 0, -1.875],
  'hallway|kitchen': [3.125, 0, -0.625],
  'hallway|living': [0, 0, 0.625],
  'entry|living': [5.0, 0, 3.125],
  'entry|kitchen': [7.5, 0, 0.625],
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

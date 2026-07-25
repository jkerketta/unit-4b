import { describe, expect, it } from 'vitest'
import { ADJACENCY, DOORWAYS, ROOMS, doorwayBetween, findPath, findRoomForPoint } from './roomGraph'

describe('roomGraph', () => {
  it('finds the room containing a point', () => {
    expect(findRoomForPoint([0, 0, 3])).toBe('living')
    expect(findRoomForPoint([7, 0, -3])).toBe('kitchen')
    expect(findRoomForPoint([0, 0, 0])).toBe('hallway')
    expect(findRoomForPoint([7, 0, 3])).toBe('entry')
    expect(findRoomForPoint([50, 0, 50])).toBeNull()
  })

  it('BFS path between adjacent rooms', () => {
    expect(findPath('living', 'entry')).toEqual(['living', 'entry'])
  })

  it('BFS path across the apartment', () => {
    const path = findPath('kitchen', 'entry')
    expect(path[0]).toBe('kitchen')
    expect(path[path.length - 1]).toBe('entry')
    // every consecutive pair is adjacent
    for (let i = 0; i < path.length - 1; i++) {
      expect(ADJACENCY[path[i]]).toContain(path[i + 1])
    }
  })

  it('path to self is trivial', () => {
    expect(findPath('living', 'living')).toEqual(['living'])
  })

  it('every adjacency pair has a doorway point inside both rooms', () => {
    const inRoom = (p: [number, number, number], room: (typeof ROOMS)[keyof typeof ROOMS]) =>
      p[0] >= room.bounds.min[0] && p[0] <= room.bounds.max[0] &&
      p[2] >= room.bounds.min[2] && p[2] <= room.bounds.max[2]

    for (const [a, bs] of Object.entries(ADJACENCY) as [keyof typeof ROOMS, (keyof typeof ROOMS)[]][]) {
      for (const b of bs) {
        const d = doorwayBetween(a, b)
        expect(DOORWAYS[`${a}|${b}`] ?? DOORWAYS[`${b}|${a}`]).toEqual(d)
        expect(inRoom(d, ROOMS[a])).toBe(true)
        expect(inRoom(d, ROOMS[b])).toBe(true)
      }
    }
  })

  it('all room ids in adjacency exist in ROOMS', () => {
    for (const [a, bs] of Object.entries(ADJACENCY)) {
      expect(ROOMS[a as keyof typeof ROOMS]).toBeDefined()
      bs.forEach((b) => expect(ROOMS[b as keyof typeof ROOMS]).toBeDefined())
    }
  })
})

import { describe, expect, it } from 'vitest'
import { ADJACENCY, DOORWAYS, ROOMS, type RoomId, doorwayBetween, findPath, findRoomForPoint } from './roomGraph'

describe('roomGraph', () => {
  it('finds the room containing a point', () => {
    expect(findRoomForPoint([0, 0, 2.5])).toBe('living')
    expect(findRoomForPoint([6, 0, -3])).toBe('kitchen')
    expect(findRoomForPoint([2.75, 0, -2])).toBe('hallway')
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

  it('every adjacency pair has a doorway point inside both rooms’ shared wall region', () => {
    for (const [a, bs] of Object.entries(ADJACENCY)) {
      for (const b of bs) {
        const d = doorwayBetween(a as RoomId, b as RoomId)
        expect(d).toBeDefined()
        expect(DOORWAYS[`${a}|${b}`] ?? DOORWAYS[`${b}|${a}`]).toEqual(d)
      }
    }
  })

  it('all room ids in adjacency exist in ROOMS', () => {
    for (const [a, bs] of Object.entries(ADJACENCY)) {
      expect(ROOMS[a as RoomId]).toBeDefined()
      bs.forEach((b) => expect(ROOMS[b as RoomId]).toBeDefined())
    }
  })
})

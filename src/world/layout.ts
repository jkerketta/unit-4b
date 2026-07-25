import type { AABB } from '../systems/player/collision'
import { FURNITURE_PLACEMENTS } from './furniturePlacements'

const H = 3 // wall height
const T = 0.2 // wall thickness

function wall(x0: number, x1: number, z0: number, z1: number, y0 = 0, y1 = H): AABB {
  return { min: [x0, y0, z0], max: [x1, y1, z1] }
}

/** Expanded 13.75 x 11.25 apartment. Door gaps are 1.25m wide. */
export const WALLS: AABB[] = [
  wall(-3.125, 6.875, 5.625, 5.625 + T), wall(8.125, 10.625, 5.625, 5.625 + T),
  wall(-3.125, 10.625, -5.625 - T, -5.625),
  wall(-3.125 - T, -3.125, -5.625, 5.625), wall(10.625, 10.625 + T, -5.625, 5.625),
  // bathroom|bedroom divider
  wall(-0.625 - T, -0.625, -5.625, -4.375), wall(-0.625 - T, -0.625, -3.125, -1.875),
  // bathroom and bedroom doors to hallway
  wall(-3.125, -2.5, -1.875, -1.875 + T), wall(-1.25, -0.625, -1.875, -1.875 + T),
  wall(-0.625, 0.625, -1.875, -1.875 + T), wall(1.875, 3.125, -1.875, -1.875 + T),
  // bedroom east / kitchen west wall
  wall(3.125 - T, 3.125, -5.625, -1.875),
  wall(3.125 - T, 3.125, -1.875, -1.25), wall(3.125 - T, 3.125, 0, 0.625),
  wall(-3.125, -0.625, 0.625, 0.625 + T), wall(0.625, 3.125, 0.625, 0.625 + T),
  wall(3.125, 6.875, 0.625, 0.625 + T), wall(8.125, 10.625, 0.625, 0.625 + T),
  wall(5.0 - T, 5.0, 0.625, 2.5), wall(5.0 - T, 5.0, 3.75, 5.625),
  // secret room walls (y -4..-0.2)
  wall(-2.5 - T, -2.5, 1.25, 5.0, -4, -0.2), wall(1.25, 1.25 + T, 1.25, 5.0, -4, -0.2),
  wall(-2.5, 1.25, 1.25 - T, 1.25, -4, -0.2), wall(-2.5, 1.25, 5.0, 5.0 + T, -4, -0.2),
]

export const WALL_MESHES = WALLS.map((box) => ({ box }))

export const SPAWN: [number, number, number] = [7.5, 0, 7.4]
export const SPAWN_YAW = 0
export const INTERIOR_SPAWN: [number, number, number] = [7.5, 0, 4.55]
export const HATCH_POS: [number, number, number] = [-0.625, 0, 3.125]
export const HATCH_DROP_ZONE: AABB = {
  min: [HATCH_POS[0] - 0.6, -4, HATCH_POS[2] - 0.6],
  max: [HATCH_POS[0] + 0.6, 0.1, HATCH_POS[2] + 0.6],
}
export const FRONT_DOOR_POS: [number, number, number] = [7.5, 0, 5.625]
export const CEILING_Y = H

function furniture(x: number, z: number, width: number, depth: number, height = 2): AABB {
  return wall(x - width / 2, x + width / 2, z - depth / 2, z + depth / 2, 0, height)
}

export const FURNITURE_COLLIDERS = Object.entries(FURNITURE_PLACEMENTS).map(([name, placement]) => {
  const [width, depth, height] = placement.collider
  return {
    name,
    room: placement.room,
    box: furniture(placement.position[0], placement.position[2], width, depth, height),
  }
})

/** Shared solid props. Kept clear of every room-graph doorway. */
export const STATIC_COLLIDERS: AABB[] = [
  ...FURNITURE_COLLIDERS.map(({ box }) => box),
  furniture(-2.0, 4.45, 0.7, 0.7, 0.75), // moving box
  furniture(1.5, 4.35, 0.7, 0.7, 0.75),
  furniture(2.7, 1.75, 0.7, 0.7, 0.75),
]

export function getWorldColliders(boxMoved: boolean, frontDoorClosed = false): AABB[] {
  const heavyX = HATCH_POS[0] + (boxMoved ? 1.7 : 0.3)
  const door = frontDoorClosed ? [wall(6.875, 8.125, 5.55, 5.72, 0, 2.2)] : []
  return [...WALLS, ...STATIC_COLLIDERS, furniture(heavyX, HATCH_POS[2], 0.9, 0.9, 1), ...door]
}

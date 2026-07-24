import type { AABB } from '../systems/player/collision'

const H = 3 // wall height
const T = 0.2 // wall thickness

function wall(x0: number, x1: number, z0: number, z1: number, y0 = 0, y1 = H): AABB {
  return { min: [x0, y0, z0], max: [x1, y1, z1] }
}

/** Vertical wall segments. Doors are gaps 1.0 wide, 2.2 high (lintel above not modeled). */
export const WALLS: AABB[] = [
  // outer: south (z=4.5) with front-door gap at x 4.5..5.5
  wall(-2.5, 4.5, 4.5, 4.5 + T), wall(5.5, 8.5, 4.5, 4.5 + T),
  // outer: north (z=-4.5)
  wall(-2.5, 8.5, -4.5 - T, -4.5),
  // outer: west (x=-2.5) and east (x=8.5)
  wall(-2.5 - T, -2.5, -4.5, 4.5), wall(8.5, 8.5 + T, -4.5, 4.5),
  // living north wall (z=0.5, x -2.5..2.0)
  wall(-2.5, 2.0, 0.5, 0.5 + T),
  // hallway west wall x=2.0: z -4.5..0.5 with bedroom door gap z -3.25..-2.25; plus z 0.5..2.5 (living/entry divider segment)
  wall(2.0 - T, 2.0, -4.5, -3.25), wall(2.0 - T, 2.0, -2.25, 0.5),
  wall(2.0 - T, 2.0, 0.5, 2.5), // living|entry divider south of hallway
  // living|entry divider wall x=2.0 z 2.5..4.5 with door gap z 3.0..4.0
  wall(2.0 - T, 2.0, 2.5, 3.0), wall(2.0 - T, 2.0, 4.0, 4.5),
  // living↔hallway door: wall z=0.5 x 2.0..3.5 with gap x 2.25..3.25
  wall(2.0, 2.25, 0.5, 0.5 + T), wall(3.25, 3.5, 0.5, 0.5 + T),
  // hallway east wall x=3.5 z -4.5..0.5 with kitchen door gap z -3.5..-2.5
  wall(3.5, 3.5 + T, -4.5, -3.5), wall(3.5, 3.5 + T, -2.5, 0.5),
  // hallway east continues z 0.5..2.5 (entry west wall)
  wall(3.5, 3.5 + T, 0.5, 2.5),
  // kitchen south wall z=-1.5 x 3.5..8.5
  wall(3.5, 8.5, -1.5, -1.5 + T),
  // bedroom south wall z=-1.0 x -0.5..2.0
  wall(-0.5, 2.0, -1.0, -1.0 + T),
  // bedroom/bathroom divider x=-0.5 z -4.5..-2.0; door gap z -3.75..-2.75
  wall(-0.5 - T, -0.5, -4.5, -3.75), wall(-0.5 - T, -0.5, -2.75, -2.0),
  // bathroom south wall z=-2.0 x -2.5..-0.5
  wall(-2.5, -0.5, -2.0, -2.0 + T),
  // bedroom west wall x=-0.5 z -2.0..-1.0 (between bathroom south wall and bedroom south wall)
  wall(-0.5 - T, -0.5, -2.0, -1.0),
  // secret room walls (y -4..-0.2)
  wall(-2.0 - T, -2.0, 1.0, 4.0, -4, -0.2), wall(1.0, 1.0 + T, 1.0, 4.0, -4, -0.2),
  wall(-2.0, 1.0, 1.0 - T, 1.0, -4, -0.2), wall(-2.0, 1.0, 4.0, 4.0 + T, -4, -0.2),
]

export const WALL_MESHES = WALLS.map((box) => ({ box }))

export const SPAWN: [number, number, number] = [0, 0, 3.5]
export const SPAWN_YAW = Math.PI // face into the room
export const HATCH_POS: [number, number, number] = [-0.5, 0, 2.5]
export const FRONT_DOOR_POS: [number, number, number] = [5.0, 0, 4.5]
export const CEILING_Y = H

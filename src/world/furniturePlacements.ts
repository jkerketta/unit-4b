export type Vec3 = [number, number, number]

export interface FurniturePlacement {
  position: Vec3
  rotation: Vec3
  scale: number
  collider: [width: number, depth: number, height: number]
  room: 'living' | 'kitchen' | 'bedroom' | 'bathroom'
}

const placement = (
  position: Vec3,
  rotation: Vec3,
  scale: number,
  collider: FurniturePlacement['collider'],
  room: FurniturePlacement['room'],
): FurniturePlacement => ({ position, rotation, scale, collider, room })

export const FURNITURE_PLACEMENTS = {
  sofa: placement([-2.4, 0, 2.05], [0, Math.PI / 2, 0], 0.22, [0.95, 2.2, 1.1], 'living'),
  television: placement([1.9, 0, 2.1], [0, -Math.PI / 2, 0], 0.16, [0.75, 1.15, 1.45], 'living'),
  bookcase: placement([-2.78, 0, 4.55], [0, Math.PI / 2, 0], 0.17, [0.45, 1.7, 2.05], 'living'),
  floorLamp: placement([-1.5, 0, 3.65], [0, 0, 0], 0.18, [0.5, 0.5, 2.05], 'living'),
  plant: placement([4.3, 0, 4.75], [0, 0, 0], 0.16, [0.55, 0.55, 1.2], 'living'),

  fridge: placement([9.75, 0, -5.08], [0, 0, 0], 0.2, [1.05, 0.9, 2.15], 'kitchen'),
  northCounters: placement([5.85, 0, -5.16], [0, 0, 0], 1, [3.65, 0.9, 1.1], 'kitchen'),
  westCounters: placement([3.6, 0, -3.45], [0, Math.PI / 2, 0], 1, [0.9, 2.9, 1.1], 'kitchen'),
  diningTable: placement([7.25, 0, -1.1], [0, 0, 0], 0.2, [2.1, 1.3, 1], 'kitchen'),
  diningChairWest: placement([5.75, 0, -1.1], [0, -Math.PI / 2, 0], 0.18, [0.65, 0.7, 1.15], 'kitchen'),
  diningChairEast: placement([8.75, 0, -1.1], [0, Math.PI / 2, 0], 0.18, [0.65, 0.7, 1.15], 'kitchen'),

  bed: placement([1.25, 0, -4.35], [0, Math.PI / 2, 0], 0.17, [1.95, 1.65, 0.75], 'bedroom'),
  sideTable: placement([2.63, 0, -5.12], [0, 0, 0], 0.16, [0.75, 0.6, 1.05], 'bedroom'),

  toilet: placement([-2.35, 0, -4.55], [0, 0, 0], 0.16, [0.85, 1.25, 0.9], 'bathroom'),
  bathroomSink: placement([-1.08, 0, -5.1], [0, 0, 0], 0.15, [0.75, 0.65, 1.1], 'bathroom'),
} as const satisfies Record<string, FurniturePlacement>

export const KITCHEN_UNITS = [
  { model: 'cabinet', position: [4.2, 0, -5.16], rotation: [0, 0, 0] },
  { model: 'cabinet', position: [5.25, 0, -5.16], rotation: [0, 0, 0] },
  { model: 'sink', position: [6.3, 0, -5.16], rotation: [0, 0, 0] },
  { model: 'cabinet', position: [7.35, 0, -5.16], rotation: [0, 0, 0] },
  { model: 'cabinet', position: [3.6, 0, -4.48], rotation: [0, Math.PI / 2, 0] },
  { model: 'cabinet', position: [3.6, 0, -3.45], rotation: [0, Math.PI / 2, 0] },
  { model: 'cabinet', position: [3.6, 0, -2.42], rotation: [0, Math.PI / 2, 0] },
] as const

export const LEASE_POSITION: Vec3 = [3.6, 1.04, -3.45]

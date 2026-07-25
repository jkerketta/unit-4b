export type Vec3 = [number, number, number]

export interface FurniturePlacement {
  position: Vec3
  rotation: Vec3
  scale: number
  collider: [width: number, depth: number, height: number]
  room: 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'entry'
}

const placement = (
  position: Vec3,
  rotation: Vec3,
  scale: number,
  collider: FurniturePlacement['collider'],
  room: FurniturePlacement['room'],
): FurniturePlacement => ({ position, rotation, scale, collider, room })

export const FURNITURE_PLACEMENTS = {
  // Living — sofa on west wall facing the TV
  sofa: placement([-2.55, 0, 2.7], [0, -Math.PI / 2, 0], 0.22, [0.95, 2.2, 1.1], 'living'),
  television: placement([4.15, 0, 2.7], [0, Math.PI / 2, 0], 0.16, [0.7, 1.05, 1.35], 'living'),
  bookcase: placement([-2.85, 0, 4.55], [0, -Math.PI / 2, 0], 0.17, [0.45, 1.55, 1.9], 'living'),
  floorLamp: placement([-1.55, 0, 3.95], [0, 0.2, 0], 0.18, [0.45, 0.45, 2.0], 'living'),
  plant: placement([4.35, 0, 4.85], [0, 0.35, 0], 0.16, [0.5, 0.5, 1.15], 'living'),

  // Kitchen — fridge on east wall, counters flush to north/west
  fridge: placement([10.1, 0, -4.55], [0, Math.PI / 2, 0], 0.2, [0.7, 0.95, 2.0], 'kitchen'),
  northCounters: placement([6.0, 0, -5.18], [0, 0, 0], 1, [4.0, 0.88, 1.05], 'kitchen'),
  westCounters: placement([3.57, 0, -3.5], [0, -Math.PI / 2, 0], 1, [0.88, 2.8, 1.05], 'kitchen'),
  diningTable: placement([7.2, 0, -2.05], [0, 0, 0], 0.2, [1.85, 1.05, 0.95], 'kitchen'),
  diningChairWest: placement([6.05, 0, -2.05], [0, -Math.PI / 2, 0], 0.18, [0.55, 0.6, 1.1], 'kitchen'),
  diningChairEast: placement([8.35, 0, -2.05], [0, Math.PI / 2, 0], 0.18, [0.55, 0.6, 1.1], 'kitchen'),

  // Bedroom — bed against the south wall, headboard outward
  bed: placement([1.15, 0, -4.7], [0, Math.PI, 0], 0.17, [1.7, 1.85, 0.75], 'bedroom'),
  sideTable: placement([2.5, 0, -5.3], [0, 0, 0], 0.15, [0.7, 0.55, 0.95], 'bedroom'),

  // Bathroom — fixtures face into the room
  toilet: placement([-2.4, 0, -5.05], [0, Math.PI, 0], 0.16, [0.7, 1.0, 0.95], 'bathroom'),
  bathroomSink: placement([-1.1, 0, -5.3], [0, Math.PI, 0], 0.15, [0.7, 0.55, 1.05], 'bathroom'),

  // Entry — wardrobe closet facing into the foyer (hide + peep)
  closet: placement([9.95, 0, 3.55], [0, 0, 0], 1, [0.7, 1.2, 2.15], 'entry'),
} as const satisfies Record<string, FurniturePlacement>

/** Evenly spaced counter run: north wall faces into the kitchen, west wall faces east. */
export const KITCHEN_UNITS = [
  { model: 'cabinet', position: [4.15, 0, -5.18], rotation: [0, 0, 0] },
  { model: 'cabinet', position: [5.05, 0, -5.18], rotation: [0, 0, 0] },
  { model: 'sink', position: [5.95, 0, -5.18], rotation: [0, Math.PI, 0] },
  { model: 'cabinet', position: [6.85, 0, -5.18], rotation: [0, 0, 0] },
  { model: 'cabinet', position: [7.75, 0, -5.18], rotation: [0, 0, 0] },
  { model: 'cabinet', position: [3.57, 0, -4.4], rotation: [0, -Math.PI / 2, 0] },
  { model: 'cabinet', position: [3.57, 0, -3.5], rotation: [0, -Math.PI / 2, 0] },
  { model: 'cabinet', position: [3.57, 0, -2.6], rotation: [0, -Math.PI / 2, 0] },
] as const

export const LEASE_POSITION: Vec3 = [3.57, 0.92, -3.5]

/** Where unpacked box contents settle once arranged. */
export const BOX_DESTINATIONS: Record<'bedroom' | 'kitchen' | 'living', Vec3> = {
  bedroom: [1.15, 0.68, -4.2],
  kitchen: [5.95, 0.92, -4.9],
  living: [-2.7, 0.7, 4.55],
}

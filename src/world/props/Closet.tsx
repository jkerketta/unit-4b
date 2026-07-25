import { useRef } from 'react'
import * as THREE from 'three'
import { PLAYER } from '../../game/constants'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { hasLineOfSight } from '../../systems/entity/sensing'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { enterHideSpot } from '../../systems/player/hideSpots'
import { playerRig } from '../../systems/player/playerRig'
import { FURNITURE_PLACEMENTS } from '../furniturePlacements'
import { WALLS } from '../layout'

const CLOSET = FURNITURE_PLACEMENTS.closet
const WOOD = makePSXMaterial({ color: '#4a3a2c' })
const WOOD_DARK = makePSXMaterial({ color: '#2a211a' })
const WOOD_BLIND = makePSXMaterial({ color: '#2e241c', opacity: 0.72, transparent: true })
/** Inside the wardrobe cavity, looking west through the blinds into the entry. */
const HIDE: [number, number, number] = [CLOSET.position[0] - 0.02, 0, CLOSET.position[2]]
const EXIT: [number, number, number] = [CLOSET.position[0] - 1.05, 0, CLOSET.position[2]]
/** Horizontal wooden blind heights (local Y). */
const BLIND_Y = [0.28, 0.48, 0.68, 0.88, 1.08, 1.28, 1.48, 1.68, 1.88]

export default function Closet() {
  const ref = useRef<THREE.Group>(null)

  useInteractable({
    id: 'closet-hide',
    object: ref,
    label: () => 'Hide in the closet',
    enabled: () => {
      const state = useGameStore.getState()
      if (state.player.hideSpot) return false
      return state.phase === 'calm' || state.phase === 'chase'
    },
    onInteract: () => {
      const store = useGameStore.getState()
      const entity = store.entity.position
      const watched = store.phase === 'chase' && entity !== null &&
        Math.hypot(entity[0] - playerRig.position.x, entity[2] - playerRig.position.z) < 12 &&
        hasLineOfSight(
          [entity[0], entity[1] + 1.8, entity[2]],
          [playerRig.position.x, playerRig.position.y + PLAYER.eyeHeight, playerRig.position.z],
          WALLS,
        )
      enterHideSpot({
        id: 'closet',
        hidePosition: HIDE,
        exitPosition: EXIT,
        eyeHeight: 1.35,
        yaw: Math.PI / 2,
        peepYawLimit: 0.28,
        enterLine: 'Peep through the blinds. Stay quiet.',
        watchedLine: 'It saw the door shut. Don\'t breathe.',
        exitLabel: 'Leave the closet',
      }, watched)
    },
  })

  return (
    <group ref={ref} position={CLOSET.position}>
      {/* Back panel (east) */}
      <mesh position={[0.18, 1.05, 0]}>
        <boxGeometry args={[0.28, 2.1, 1.15]} />
        <primitive object={WOOD} attach="material" />
      </mesh>
      {/* Side panels — leave a cavity open toward the west blinds */}
      <mesh position={[0.02, 1.05, 0.56]}>
        <boxGeometry args={[0.55, 2.1, 0.08]} />
        <primitive object={WOOD_DARK} attach="material" />
      </mesh>
      <mesh position={[0.02, 1.05, -0.56]}>
        <boxGeometry args={[0.55, 2.1, 0.08]} />
        <primitive object={WOOD_DARK} attach="material" />
      </mesh>
      <mesh position={[0.05, 2.12, 0]}>
        <boxGeometry args={[0.56, 0.08, 1.18]} />
        <primitive object={WOOD_DARK} attach="material" />
      </mesh>
      <mesh position={[0.05, 0.04, 0]}>
        <boxGeometry args={[0.56, 0.08, 1.18]} />
        <primitive object={WOOD_DARK} attach="material" />
      </mesh>
      {/* Horizontal wooden blinds on the west face */}
      {BLIND_Y.map((y) => (
        <mesh key={y} position={[-0.26, y, 0]}>
          <boxGeometry args={[0.04, 0.055, 1.02]} />
          <primitive object={WOOD_BLIND} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

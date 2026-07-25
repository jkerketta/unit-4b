import { useRef } from 'react'
import * as THREE from 'three'
import { PLAYER } from '../../game/constants'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { hasLineOfSight } from '../../systems/entity/sensing'
import { enterHideSpot } from '../../systems/player/hideSpots'
import { playerRig } from '../../systems/player/playerRig'
import { FURNITURE_PLACEMENTS } from '../furniturePlacements'
import { WALLS } from '../layout'
import LowPolyModel from '../models/LowPolyModel'

const BED = FURNITURE_PLACEMENTS.bed
const UNDER: [number, number, number] = [BED.position[0], 0, BED.position[2]]
const EXIT: [number, number, number] = [1.15, 0, -2.55]
const WOOD = makePSXMaterial({ color: '#3b2d24' })
const MATTRESS = makePSXMaterial({ color: '#78736b' })
const BLANKET = makePSXMaterial({ color: '#3a4a5a' })
const METAL = makePSXMaterial({ color: '#595a56' })
const BED_MATERIALS = {
  _default: WOOD,
  wood: WOOD,
  metal: METAL,
  carpet: BLANKET,
  carpetWhite: MATTRESS,
}

export default function Bed() {
  const ref = useRef<THREE.Group>(null)
  const hideSpot = useGameStore((state) => state.player.hideSpot)

  useInteractable({
    id: 'bed-hide',
    object: ref,
    label: () => 'Hide under the bed',
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
        id: 'bed',
        hidePosition: UNDER,
        exitPosition: EXIT,
        eyeHeight: 0.18,
        enterLine: 'Stay quiet.',
        watchedLine: 'It saw me dive under. Stay still.',
        exitLabel: 'Get out from under the bed',
      }, watched)
    },
  })

  return (
    <group ref={ref} position={BED.position}>
      <LowPolyModel
        url="/models/kenney/bedDouble.obj"
        rotation={BED.rotation}
        scale={BED.scale}
        materials={BED_MATERIALS}
      />
      {hideSpot === 'bed' && (
        <mesh position={[0, 0.12, 0]} visible={false}>
          <boxGeometry args={[1.4, 0.2, 1.6]} />
          <meshBasicMaterial />
        </mesh>
      )}
    </group>
  )
}

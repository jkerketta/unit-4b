import { useRef } from 'react'
import * as THREE from 'three'
import { PLAYER } from '../../game/constants'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { hasLineOfSight } from '../../systems/entity/sensing'
import { playerRig } from '../../systems/player/playerRig'
import { say } from '../../ui/subtitles'
import { FURNITURE_PLACEMENTS } from '../furniturePlacements'
import { WALLS } from '../layout'
import LowPolyModel from '../models/LowPolyModel'

const CENTER: [number, number, number] = FURNITURE_PLACEMENTS.bed.position
const EXIT: [number, number, number] = [1.25, 0, -2.55]
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
  const hidden = useGameStore((state) => state.player.hidden)

  useInteractable({
    id: 'bed-hide',
    object: ref,
    label: () => useGameStore.getState().player.hidden ? 'Get out from under the bed' : 'Hide under the bed',
    enabled: () => {
      const phase = useGameStore.getState().phase
      return phase === 'calm' || phase === 'chase'
    },
    onInteract: () => {
      const store = useGameStore.getState()
      if (store.player.hidden) {
        store.setHidden(false)
        playerRig.forcedEyeHeight = undefined
        playerRig.position.set(...EXIT)
        store.setPlayerPosition(EXIT)
        return
      }

      const entity = store.entity.position
      const seen = store.phase === 'chase' && entity !== null &&
        Math.hypot(entity[0] - playerRig.position.x, entity[2] - playerRig.position.z) < 12 &&
        hasLineOfSight(
          [entity[0], entity[1] + 1.8, entity[2]],
          [playerRig.position.x, playerRig.position.y + PLAYER.eyeHeight, playerRig.position.z],
          WALLS,
        )
      store.setHidden(true, seen)
      playerRig.position.set(...CENTER)
      playerRig.forcedEyeHeight = 0.25
      store.setPlayerPosition(CENTER)
      say(seen ? 'It saw me.' : 'Stay quiet.')
    },
  })

  return (
    <group ref={ref} position={CENTER}>
      <LowPolyModel
        url="/models/kenney/bedDouble.obj"
        rotation={FURNITURE_PLACEMENTS.bed.rotation}
        scale={FURNITURE_PLACEMENTS.bed.scale}
        materials={BED_MATERIALS}
      />
      {hidden && (
        <mesh position={[0, 0.16, 0.7]} visible={false}>
          <boxGeometry args={[1.8, 0.3, 0.2]} />
          <meshBasicMaterial />
        </mesh>
      )}
    </group>
  )
}

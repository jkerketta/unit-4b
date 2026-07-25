import { useRef } from 'react'
import * as THREE from 'three'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { audio } from '../../systems/audio/AudioManager'
import type { AABB } from '../../systems/player/collision'
import { playerRig } from '../../systems/player/playerRig'
import { HATCH_POS } from '../layout'
import { LADDER_TOP, travelPlayer } from './Hatch'

const WOOD = makePSXMaterial({ color: '#4b4035' })

export const ladderVolumes: AABB[] = [{
  min: [HATCH_POS[0] - 0.5, -4, HATCH_POS[2] - 0.5],
  max: [HATCH_POS[0] + 0.5, 0, HATCH_POS[2] + 0.9],
}]

export default function Ladder() {
  const ref = useRef<THREE.Group>(null)
  useInteractable({
    id: 'ladder-up',
    object: ref,
    label: () => 'Climb up',
    enabled: () => playerRig.position.y < -1,
    onInteract: () => {
      audio.play('ladder', { rate: 1.08 })
      travelPlayer(LADDER_TOP)
    },
  })
  return (
    <group ref={ref}>
      {[-0.35, 0.35].map((offset) => (
        <mesh key={offset} position={[HATCH_POS[0] + offset, -2.1, HATCH_POS[2]]}>
          <boxGeometry args={[0.08, 3.8, 0.08]} />
          <primitive object={WOOD} attach="material" />
        </mesh>
      ))}
      {[-3.6, -2.85, -2.1, -1.35, -0.6].map((y) => (
        <mesh key={y} position={[HATCH_POS[0], y, HATCH_POS[2]]}>
          <boxGeometry args={[0.78, 0.07, 0.07]} />
          <primitive object={WOOD} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

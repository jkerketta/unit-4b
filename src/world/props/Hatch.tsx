import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { advanceObjective } from '../../systems/objectives/objectiveChain'
import { audio } from '../../systems/audio/AudioManager'
import { playerRig } from '../../systems/player/playerRig'
import { fadeTransition, say } from '../../ui/subtitles'
import { HATCH_POS } from '../layout'

const WOOD = makePSXMaterial({ color: '#49382a', side: THREE.DoubleSide })
const METAL = makePSXMaterial({ color: '#292724' })

export const LADDER_BOTTOM: [number, number, number] = [HATCH_POS[0], -4, HATCH_POS[2] + 0.7]
export const LADDER_TOP: [number, number, number] = [HATCH_POS[0], 0, HATCH_POS[2] - 0.85]

export function travelPlayer(position: [number, number, number]): void {
  fadeTransition(() => {
    playerRig.position.set(...position)
    useGameStore.getState().setPlayerPosition(position)
  })
}

export default function Hatch() {
  const ref = useRef<THREE.Group>(null)
  const open = useGameStore((state) => state.flags.hatchOpen)
  useInteractable({
    id: 'hatch',
    object: ref,
    label: () => useGameStore.getState().flags.hatchOpen ? 'Climb down' : 'Open the hatch',
    enabled: () => useGameStore.getState().flags.rugPulled,
    onInteract: () => {
      const store = useGameStore.getState()
      if (store.flags.hatchOpen) {
        audio.play('ladder')
        travelPlayer(LADDER_BOTTOM)
        return
      }
      store.setFlag('hatchOpen', true)
      audio.play('hatch')
      advanceObjective('hatch')
      store.setPlayerPosition([playerRig.position.x, playerRig.position.y, playerRig.position.z])
      store.saveCheckpoint(playerRig.yaw)
      say("Cold air. There's a room down there.")
    },
  })
  useFrame((_, dt) => {
    if (useGameStore.getState().paused) return
    if (ref.current) {
      ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, open ? -Math.PI * 0.48 : 0, 6, dt)
    }
  })
  return (
    <group position={[HATCH_POS[0] - 0.58, -0.075, HATCH_POS[2]]}>
      <group ref={ref} position={[0.58, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.16, 0.06, 1.16]} />
          <primitive object={WOOD} attach="material" />
        </mesh>
        <mesh position={[0.32, 0.07, 0]}>
          <torusGeometry args={[0.09, 0.018, 5, 10]} />
          <primitive object={METAL} attach="material" />
        </mesh>
      </group>
    </group>
  )
}

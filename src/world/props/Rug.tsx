import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { playerRig } from '../../systems/player/playerRig'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { advanceObjective } from '../../systems/objectives/objectiveChain'
import { audio } from '../../systems/audio/AudioManager'
import { say } from '../../ui/subtitles'
import { HATCH_POS } from '../layout'

const RUG = makePSXMaterial({ color: '#5a3437', side: THREE.DoubleSide })

export default function Rug() {
  const ref = useRef<THREE.Mesh>(null)
  const triggered = useRef(false)
  const rugPulled = useGameStore((state) => state.flags.rugPulled)
  useInteractable({
    id: 'rug',
    object: ref,
    label: () => 'Pull back the rug',
    enabled: () => {
      const state = useGameStore.getState()
      return state.activeObjectiveId === 'rug' && state.flags.boxMoved && !state.flags.rugPulled
    },
    onInteract: () => {
      useGameStore.getState().setFlag('rugPulled', true)
      audio.play('rug')
      say("A hatch. This isn't on the floor plan.")
      advanceObjective('rug')
    },
  })
  useFrame((_, dt) => {
    const state = useGameStore.getState()
    if (state.paused) return
    const dx = playerRig.position.x - HATCH_POS[0]
    const dz = playerRig.position.z - HATCH_POS[2]
    if (!triggered.current && state.activeObjectiveId === 'rug' && !state.flags.boxMoved && Math.abs(dx) < 0.9 && Math.abs(dz) < 0.8) {
      triggered.current = true
      state.setFlag('rugNoticed', true)
      say('The floor sounds... hollow.')
    }
    if (ref.current) {
      ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, HATCH_POS[2] + (rugPulled ? 1.8 : 0), 6, dt)
    }
  })
  return (
    <mesh ref={ref} position={[HATCH_POS[0], 0.025, HATCH_POS[2]]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[2.05, 1.8]} />
      <primitive object={RUG} attach="material" />
    </mesh>
  )
}

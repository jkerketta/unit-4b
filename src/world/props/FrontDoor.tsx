import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { advanceObjective } from '../../systems/objectives/objectiveChain'
import { audio } from '../../systems/audio/AudioManager'
import { say, useUIStore } from '../../ui/subtitles'
import { FRONT_DOOR_POS, INTERIOR_SPAWN } from '../layout'
import { playerRig } from '../../systems/player/playerRig'

const DOOR = makePSXMaterial({ color: '#4a3628' })
const METAL = makePSXMaterial({ color: '#9b8b68' })

export default function FrontDoor() {
  const ref = useRef<THREE.Group>(null)
  const phase = useGameStore((state) => state.phase)
  const [entering, setEntering] = useState(false)

  useInteractable({
    id: 'front-door',
    object: ref,
    label: () => {
      const current = useGameStore.getState().phase
      return current === 'chase' ? 'Work the deadbolt — HOLD E' : current === 'intro' ? 'Unlock Unit 4B' : 'Front door'
    },
    enabled: () => {
      const current = useGameStore.getState().phase
      return current === 'intro' || current === 'calm' || current === 'chase'
    },
    holdSeconds: phase === 'chase' ? 2 : undefined,
    onInteract: () => {
      const store = useGameStore.getState()
      if (store.phase === 'intro') {
        setEntering(true)
        audio.play('deadbolt')
        playerRig.position.set(...INTERIOR_SPAWN)
        store.setPlayerPosition(INTERIOR_SPAWN)
        advanceObjective('enter')
        store.setPhase('calm')
        say('Home. The boxes are already inside... I never told him which room.')
        window.setTimeout(() => setEntering(false), 1000)
        return
      }
      if (store.phase === 'calm') {
        say('I just got here. Unpack first. Running already would be ridiculous.')
        return
      }
      if (store.phase !== 'chase') return
      audio.play('deadbolt')
      advanceObjective('escape')
      useUIStore.getState().setFadeColor('white')
      useUIStore.getState().setFadeOpacity(1)
      store.setPhase('win')
    },
  })

  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y = THREE.MathUtils.damp(
        ref.current.rotation.y,
        phase === 'win' || entering ? -Math.PI * 0.56 : 0,
        4,
        dt,
      )
    }
  })

  return (
    <group position={[FRONT_DOOR_POS[0] - 0.625, 0, FRONT_DOOR_POS[2]]}>
      <group ref={ref} position={[0.625, 0, 0]}>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[1.25, 2.2, 0.12]} />
          <primitive object={DOOR} attach="material" />
        </mesh>
        <mesh position={[-0.34, 1.08, -0.1]}>
          <sphereGeometry args={[0.055, 7, 5]} />
          <primitive object={METAL} attach="material" />
        </mesh>
        <mesh position={[-0.34, 1.48, -0.1]}>
          <boxGeometry args={[0.1, 0.07, 0.04]} />
          <primitive object={METAL} attach="material" />
        </mesh>
      </group>
    </group>
  )
}

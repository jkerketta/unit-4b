import { useRef } from 'react'
import type * as THREE from 'three'
import { useGameStore } from '../game/store'
import { makePSXMaterial } from '../render/psxMaterial'
import { useInteractable } from '../systems/interact/InteractSystem'
import { useUIStore } from '../ui/subtitles'
import { EXTERIOR, FRONT_DOOR_POS } from './layout'

const FLOOR = makePSXMaterial({ color: '#4f4e49' })
const WALL = makePSXMaterial({ color: '#3c3b37' })
const CEILING = makePSXMaterial({ color: '#2f2e2b' })
const TRIM = makePSXMaterial({ color: '#232422' })
const COAT = makePSXMaterial({ color: '#1a1816' })
const SKIN = makePSXMaterial({ color: '#8a7a68' })

const WIDTH = EXTERIOR.maxX - EXTERIOR.minX
const DEPTH = EXTERIOR.maxZ - EXTERIOR.minZ
const CENTER_X = (EXTERIOR.minX + EXTERIOR.maxX) / 2
const CENTER_Z = (EXTERIOR.minZ + EXTERIOR.maxZ) / 2
const WALL_H = EXTERIOR.ceilingY

function Landlord() {
  const ref = useRef<THREE.Group>(null)
  useInteractable({
    id: 'landlord',
    object: ref,
    label: () => 'Talk to the landlord',
    enabled: () => {
      const phase = useGameStore.getState().phase
      const ui = useUIStore.getState()
      // After the handoff chat ends, he stays in the hall until you enter 4B.
      return phase === 'intro' && ui.introStep === null
    },
    onInteract: () => {
      useUIStore.getState().startIntroDialogue('followup')
    },
  })

  return (
    <group ref={ref} position={[6.05, 0, 6.7]}>
      <mesh position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.22, 1.25, 3, 6]} />
        <primitive object={COAT} attach="material" />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.23, 7, 5]} />
        <primitive object={SKIN} attach="material" />
      </mesh>
    </group>
  )
}

export default function ExteriorLanding() {
  return (
    <group>
      <mesh position={[CENTER_X, -0.06, CENTER_Z]}>
        <boxGeometry args={[WIDTH, 0.12, DEPTH]} />
        <primitive object={FLOOR} attach="material" />
      </mesh>
      <mesh position={[CENTER_X, WALL_H + 0.05, CENTER_Z]}>
        <boxGeometry args={[WIDTH, 0.1, DEPTH]} />
        <primitive object={CEILING} attach="material" />
      </mesh>

      <mesh position={[EXTERIOR.minX - 0.1, WALL_H / 2, CENTER_Z]}>
        <boxGeometry args={[0.2, WALL_H, DEPTH]} />
        <primitive object={WALL} attach="material" />
      </mesh>
      <mesh position={[EXTERIOR.maxX + 0.1, WALL_H / 2, CENTER_Z]}>
        <boxGeometry args={[0.2, WALL_H, DEPTH]} />
        <primitive object={WALL} attach="material" />
      </mesh>
      <mesh position={[CENTER_X, WALL_H / 2, EXTERIOR.maxZ + 0.1]}>
        <boxGeometry args={[WIDTH, WALL_H, 0.2]} />
        <primitive object={WALL} attach="material" />
      </mesh>

      {/* Fill the building face around the door so the vestibule reads as a closed room. */}
      <mesh position={[6.05, WALL_H / 2, FRONT_DOOR_POS[2] + 0.08]}>
        <boxGeometry args={[1.55, WALL_H, 0.16]} />
        <primitive object={WALL} attach="material" />
      </mesh>
      <mesh position={[8.95, WALL_H / 2, FRONT_DOOR_POS[2] + 0.08]}>
        <boxGeometry args={[1.55, WALL_H, 0.16]} />
        <primitive object={WALL} attach="material" />
      </mesh>
      <mesh position={[FRONT_DOOR_POS[0], 2.45, FRONT_DOOR_POS[2] + 0.08]}>
        <boxGeometry args={[1.25, 0.5, 0.16]} />
        <primitive object={TRIM} attach="material" />
      </mesh>

      <Landlord />
      <pointLight position={[7.5, 2.2, 7.1]} intensity={3.2} distance={5.5} color="#d4b983" />
    </group>
  )
}

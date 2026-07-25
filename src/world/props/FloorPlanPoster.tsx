import { useRef } from 'react'
import * as THREE from 'three'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { useUIStore } from '../../ui/subtitles'
import { useGameStore } from '../../game/store'

const PAPER = makePSXMaterial({ color: '#d6cfb6', side: THREE.DoubleSide })
const INK = makePSXMaterial({ color: '#34322d' })

export default function FloorPlanPoster() {
  const ref = useRef<THREE.Group>(null)
  useInteractable({
    id: 'floor-plan-poster',
    object: ref,
    label: () => 'Study supplied floor plan',
    enabled: () => {
      const phase = useGameStore.getState().phase
      return phase === 'calm' || phase === 'chase'
    },
    onInteract: () => useUIStore.getState().openDocument('floorplan'),
  })
  return (
    <group ref={ref} position={[8.75, 1.45, 5.49]}>
      <mesh><planeGeometry args={[0.72, 0.92]} /><primitive object={PAPER} attach="material" /></mesh>
      <mesh position={[0, 0, -0.008]}>
        <boxGeometry args={[0.48, 0.025, 0.01]} /><primitive object={INK} attach="material" />
      </mesh>
    </group>
  )
}

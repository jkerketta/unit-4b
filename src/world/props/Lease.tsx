import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../game/store'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { useUIStore } from '../../ui/subtitles'
import { LEASE_POSITION } from '../furniturePlacements'

const PAPER = new THREE.MeshBasicMaterial({ color: '#fff4bd', side: THREE.DoubleSide })

export default function Lease() {
  const ref = useRef<THREE.Mesh>(null)
  const read = useGameStore((state) => state.flags.leaseRead)
  const active = useGameStore((state) => state.activeObjectiveId === 'lease')
  useInteractable({
    id: 'lease',
    object: ref,
    label: () => useGameStore.getState().flags.leaseRead ? 'Read the lease again' : 'Read the lease',
    enabled: () => {
      const state = useGameStore.getState()
      return state.activeObjectiveId === 'lease' || state.flags.leaseRead
    },
    onInteract: () => {
      useUIStore.getState().openDocument('lease')
    },
  })
  return (
    <group position={LEASE_POSITION}>
      <mesh ref={ref} rotation-x={-Math.PI / 2} rotation-z={0.08}>
        <planeGeometry args={[0.48, 0.62]} />
        <primitive object={PAPER} attach="material" />
      </mesh>
      {active && !read && (
        <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.055, 0]} />
          <meshBasicMaterial color="#ffe36b" />
        </mesh>
      )}
    </group>
  )
}

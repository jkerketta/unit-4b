import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { useUIStore } from '../../ui/subtitles'

const COVER = makePSXMaterial({ color: '#211d1b', side: THREE.DoubleSide })

export default function Notebook() {
  const ref = useRef<THREE.Mesh>(null)
  const unread = useGameStore((state) => !state.flags.scare1Done)
  useInteractable({
    id: 'notebook',
    object: ref,
    label: () => 'Read the notebook',
    enabled: () => !useGameStore.getState().flags.scare1Done,
    onInteract: () => {
      useUIStore.getState().openDocument('notebook')
    },
  })
  return (
    <group position={[-0.55, -3.47, 1.85]}>
      <mesh ref={ref} rotation-x={-Math.PI / 2} rotation-z={-0.15}>
        <boxGeometry args={[0.38, 0.5, 0.035]} />
        <primitive object={COVER} attach="material" />
      </mesh>
      {unread && (
        <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.055, 0]} />
          <meshBasicMaterial color="#ffe36b" />
        </mesh>
      )}
    </group>
  )
}

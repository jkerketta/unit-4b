import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { useUIStore } from '../../ui/subtitles'

const COVER = makePSXMaterial({ color: '#211d1b', side: THREE.DoubleSide })

export default function Notebook() {
  const ref = useRef<THREE.Mesh>(null)
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
    <mesh ref={ref} position={[-0.55, -3.47, 1.85]} rotation-x={-Math.PI / 2} rotation-z={-0.15}>
      <boxGeometry args={[0.38, 0.5, 0.035]} />
      <primitive object={COVER} attach="material" />
    </mesh>
  )
}

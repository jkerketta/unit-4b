import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useScareStore } from '../../systems/scares/ScareManager'
import { useGameStore } from '../../game/store'

const WAX = makePSXMaterial({ color: '#c8b77e' })
const positions: [number, number, number][] = [
  [-1.7, -3.72, 3.9],
  [-1.35, -3.76, 4.1],
  [-1.52, -3.7, 4.35],
]

function Candle({ position, index }: { position: [number, number, number]; index: number }) {
  const light = useRef<THREE.PointLight>(null)
  const level = useScareStore((state) => state.candleLevel)
  useFrame(({ clock }) => {
    if (useGameStore.getState().paused) return
    if (light.current) light.current.intensity = level * (1.8 + Math.sin(clock.elapsedTime * 43 + index) * 0.35)
  })
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.035, 0.045, 0.23, 7]} />
        <primitive object={WAX} attach="material" />
      </mesh>
      <pointLight ref={light} position={[0, 0.18, 0]} color="#ff9a3c" distance={4} decay={2} />
    </group>
  )
}

export default function Candles() {
  return <>{positions.map((position, index) => <Candle key={index} position={position} index={index} />)}</>
}

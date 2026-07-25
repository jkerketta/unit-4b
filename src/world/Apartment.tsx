import * as THREE from 'three'
import { makePSXMaterial } from '../render/psxMaterial'
import { carpetTexture, ceilingTexture, concreteTexture, wallpaperTexture, woodFloorTexture } from '../render/textures'
import { CEILING_Y, WALL_MESHES } from './layout'
import { useGameStore } from '../game/store'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

const WALL_MATERIAL = makePSXMaterial({ map: wallpaperTexture() })
const FLOOR_MATERIAL = makePSXMaterial({ map: woodFloorTexture(), side: THREE.DoubleSide })
const CONCRETE_FLOOR = makePSXMaterial({ map: concreteTexture(), color: '#858585', side: THREE.DoubleSide })
const CARPET_FLOOR = makePSXMaterial({ map: carpetTexture(), color: '#858079', side: THREE.DoubleSide })
const CEILING_MATERIAL = makePSXMaterial({ map: ceilingTexture(), side: THREE.DoubleSide })

const FLOOR_STRIPS: {
  position: [number, number, number]
  size: [number, number]
}[] = [
  { position: [3.75, 0, -1.625], size: [13.75, 8] },
  { position: [3.75, 0, 4.75], size: [13.75, 1.75] },
  { position: [-2.3, 0, 3.125], size: [1.65, 1.5] },
  { position: [5.325, 0, 3.125], size: [10.6, 1.5] },
]

export default function Apartment() {
  const phase = useGameStore((state) => state.phase)
  return (
    <>
      {WALL_MESHES.filter(({ box }) => box.min[1] >= 0).map(({ box }, index) => {
        const size: [number, number, number] = [
          box.max[0] - box.min[0],
          box.max[1] - box.min[1],
          box.max[2] - box.min[2],
        ]
        const position: [number, number, number] = [
          (box.min[0] + box.max[0]) / 2,
          (box.min[1] + box.max[1]) / 2,
          (box.min[2] + box.max[2]) / 2,
        ]
        return (
          <mesh key={index} position={position}>
            <boxGeometry args={size} />
            <primitive object={WALL_MATERIAL} attach="material" />
          </mesh>
        )
      })}

      {FLOOR_STRIPS.map((strip, index) => (
        <mesh
          key={index}
          position={strip.position}
          rotation-x={-Math.PI / 2}
        >
          <planeGeometry args={strip.size} />
            <primitive object={index === 0 ? FLOOR_MATERIAL : index === 1 ? CONCRETE_FLOOR : FLOOR_MATERIAL} attach="material" />
        </mesh>
      ))}
      <mesh position={[1.25, 0.008, -3.75]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.75, 3.75]} />
        <primitive object={CARPET_FLOOR} attach="material" />
      </mesh>
      <mesh position={[-1.875, 0.01, -3.75]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.5, 3.75]} />
        <primitive object={CONCRETE_FLOOR} attach="material" />
      </mesh>
      <mesh position={[6.875, 0.01, -2.5]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[7.5, 6.25]} />
        <primitive object={CONCRETE_FLOOR} attach="material" />
      </mesh>

      <mesh position={[3.75, CEILING_Y, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[13.75, 11.25]} />
        <primitive object={CEILING_MATERIAL} attach="material" />
      </mesh>

      <ambientLight intensity={phase === 'title' ? 0.1 : phase === 'chase' ? 0.12 : 0.48} color="#b8aa94" />
      <pointLight
        position={[0, 2.5, 3.1]}
        intensity={phase === 'chase' ? 0 : phase === 'title' ? 0.8 : 7}
        distance={12}
        decay={2}
        color="#ffd9a0"
      />
      <pointLight position={[7.5, 2.55, -2.6]} intensity={phase === 'chase' ? 0.7 : 4.5} distance={9} decay={2} color="#b9d2e5" />
      <pointLight position={[1.25, 2.2, -4]} intensity={phase === 'chase' ? 0.35 : 3.2} distance={7} decay={2} color="#e7bd91" />
      <pointLight position={[-2, 1.7, 3.8]} intensity={phase === 'chase' ? 0 : 2.4} distance={5} color="#ffc77d" />
      <BathroomLight enabled={phase === 'calm'} />
    </>
  )
}

function BathroomLight({ enabled }: { enabled: boolean }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (useGameStore.getState().paused) return
    if (!light.current) return
    light.current.intensity = enabled
      ? 1.7 + Math.sin(clock.elapsedTime * 61) * 0.12 + Math.sin(clock.elapsedTime * 7) * 0.06
      : 0.25
  })
  return <pointLight ref={light} position={[-1.875, 2.55, -3.75]} distance={5.5} decay={2} color="#b9d5dc" />
}

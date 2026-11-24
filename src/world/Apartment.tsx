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
  // Main apartment floor south of the hatch band
  { position: [3.75, 0, -1.525], size: [13.75, 8.2] },
  // Entry/living floor north of the hatch band
  { position: [3.75, 0, 4.65], size: [13.75, 1.95] },
  // Fillers around the hatch opening (hole ~1.1 x 1.1 at HATCH_POS)
  { position: [-2.15, 0, 3.125], size: [1.95, 1.1] },
  { position: [5.275, 0, 3.125], size: [10.7, 1.1] },
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

      <ambientLight intensity={phase === 'title' ? 0.1 : 0.48} color="#b8aa94" />
      <MainLight base={phase === 'title' ? 0.8 : 7} />
      <pointLight position={[7.5, 2.55, -2.6]} intensity={phase === 'title' ? 0.8 : 4.5} distance={9} decay={2} color="#b9d2e5" />
      <pointLight position={[1.25, 2.2, -4]} intensity={phase === 'title' ? 0.5 : 3.2} distance={7} decay={2} color="#e7bd91" />
      <pointLight position={[-2, 1.7, 3.8]} intensity={phase === 'title' ? 0.4 : 2.4} distance={5} color="#ffc77d" />
      <pointLight position={[7.8, 2.3, 3.1]} intensity={phase === 'title' ? 0.35 : 2.2} distance={6} decay={2} color="#e8c9a0" />
      <BathroomLight enabled={phase === 'calm' || phase === 'chase' || phase === 'intro'} />
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

const CALM_COLOR = new THREE.Color('#ffd9a0')
const CHASE_COLOR = new THREE.Color('#ff7a5c')

/** Living-room light: steady normally, stutters and reddens during the chase. */
function MainLight({ base }: { base: number }) {
  const light = useRef<THREE.PointLight>(null)
  const dropout = useRef(0)
  useFrame(({ clock }, delta) => {
    const state = useGameStore.getState()
    if (state.paused || !light.current) return
    if (state.phase !== 'chase') {
      light.current.intensity = base
      light.current.color.copy(CALM_COLOR)
      return
    }
    const t = clock.elapsedTime
    if (dropout.current > 0) dropout.current -= delta
    else if (Math.random() < delta * 0.9) dropout.current = 0.05 + Math.random() * 0.18
    const buzz = 0.82 + Math.sin(t * 47) * 0.08 + Math.sin(t * 3.1) * 0.1
    light.current.intensity = dropout.current > 0 ? base * 0.08 : base * buzz
    light.current.color.copy(CALM_COLOR).lerp(CHASE_COLOR, 0.45 + Math.sin(t * 1.7) * 0.15)
  })
  return <pointLight ref={light} position={[0, 2.5, 3.1]} intensity={base} distance={12} decay={2} color="#ffd9a0" />
}

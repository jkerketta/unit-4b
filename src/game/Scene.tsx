import { useMemo } from 'react'
import { type AABB } from '../systems/player/collision'
import PlayerController from '../systems/player/PlayerController'
import { FOG } from './constants'
import { makePSXMaterial } from '../render/psxMaterial'
import PSXPipeline from '../render/PSXPipeline'

const WALL_AABBS: AABB[] = [
  { min: [-5.2, 0, -5], max: [-5, 3, 5] },
  { min: [5, 0, -5], max: [5.2, 3, 5] },
  { min: [-5, 0, -5.2], max: [5, 3, -5] },
  { min: [-5, 0, 5], max: [5, 3, 5.2] },
]

// Shared PSX materials (module-level — created once)
const FLOOR_MATERIAL = makePSXMaterial({ color: '#555' })
const WALL_MATERIAL = makePSXMaterial({ color: '#666' })

export default function Scene() {
  const testBoxes = useMemo(() => {
    const darkColors = ['#221111', '#112211', '#111122', '#222200']
    return darkColors.map((c) => ({
      mat: makePSXMaterial({ color: c }),
      pos: [0, 0, 0] as [number, number, number],
      scale: [0.3, 3, 0.3] as [number, number, number],
    })).map((b, i) => {
      const positions: [number, number, number][] = [
        [-2, 1.5, -2],
        [2, 1.5, -2],
        [-2, 1.5, 2],
        [2, 1.5, 2],
      ]
      return { ...b, pos: positions[i] }
    })
  }, [])

  return (
    <>
      <fogExp2 attach="fog" args={[FOG.color, FOG.density]} />
      <color attach="background" args={[FOG.color]} />

      <ambientLight intensity={0.6} />

      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[10, 10]} />
        <primitive object={FLOOR_MATERIAL} attach="material" />
      </mesh>

      {/* Boundary walls */}
      <mesh position={[-5.1, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 10]} />
        <primitive object={WALL_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[5.1, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 10]} />
        <primitive object={WALL_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 1.5, -5.1]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <primitive object={WALL_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 1.5, 5.1]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <primitive object={WALL_MATERIAL} attach="material" />
      </mesh>

      {/* Test boxes — tall thin dark shapes to make wobble/dithering visible */}
      {testBoxes.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <boxGeometry args={b.scale} />
          <primitive object={b.mat} attach="material" />
        </mesh>
      ))}

      <PSXPipeline />

      <PlayerController walls={WALL_AABBS} />
    </>
  )
}

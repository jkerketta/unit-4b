import { type AABB } from '../systems/player/collision'
import PlayerController from '../systems/player/PlayerController'

const WALL_AABBS: AABB[] = [
  { min: [-5.2, 0, -5], max: [-5, 3, 5] },
  { min: [5, 0, -5], max: [5.2, 3, 5] },
  { min: [-5, 0, -5.2], max: [5, 3, -5] },
  { min: [-5, 0, 5], max: [5, 3, 5.2] },
]

export default function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[10, 10]} />
        <meshLambertMaterial color="#555" />
      </mesh>

      {/* Boundary walls */}
      <mesh position={[-5.1, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 10]} />
        <meshLambertMaterial color="#666" />
      </mesh>
      <mesh position={[5.1, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 10]} />
        <meshLambertMaterial color="#666" />
      </mesh>
      <mesh position={[0, 1.5, -5.1]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshLambertMaterial color="#666" />
      </mesh>
      <mesh position={[0, 1.5, 5.1]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshLambertMaterial color="#666" />
      </mesh>

      <PlayerController walls={WALL_AABBS} />
    </>
  )
}

import * as THREE from 'three'
import { makePSXMaterial } from '../render/psxMaterial'
import { carpetTexture, concreteTexture } from '../render/textures'
import { WALL_MESHES } from './layout'
import Candles from './props/Candles'
import Cot from './props/Cot'
import Ladder from './props/Ladder'
import Notebook from './props/Notebook'

const CONCRETE_MATERIAL = makePSXMaterial({ map: concreteTexture(), color: '#898989', side: THREE.DoubleSide })
const DIRT_MATERIAL = makePSXMaterial({ map: carpetTexture(), color: '#514438', side: THREE.DoubleSide })

const CEILING_STRIPS: {
  position: [number, number, number]
  size: [number, number]
}[] = [
  { position: [-0.625, -0.2, 1.81], size: [3.75, 1.12] },
  { position: [-0.625, -0.2, 4.44], size: [3.75, 1.12] },
  { position: [-1.94, -0.2, 3.125], size: [1.12, 1.5] },
  { position: [0.69, -0.2, 3.125], size: [1.12, 1.5] },
]

export default function SecretRoom() {
  return (
    <>
      {WALL_MESHES.filter(({ box }) => box.min[1] < 0).map(({ box }, index) => {
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
            <primitive object={CONCRETE_MATERIAL} attach="material" />
          </mesh>
        )
      })}

      <mesh position={[-0.625, -4, 3.125]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.75, 3.75]} />
        <primitive object={DIRT_MATERIAL} attach="material" />
      </mesh>

      {CEILING_STRIPS.map((strip, index) => (
        <mesh key={index} position={strip.position} rotation-x={Math.PI / 2}>
          <planeGeometry args={strip.size} />
          <primitive object={CONCRETE_MATERIAL} attach="material" />
        </mesh>
      ))}

      <Ladder />
      <Cot />
      <Candles />
      <Notebook />

    </>
  )
}

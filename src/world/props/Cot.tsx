import { makePSXMaterial } from '../../render/psxMaterial'

const FRAME = makePSXMaterial({ color: '#302c29' })
const MATTRESS = makePSXMaterial({ color: '#4a4440' })

export default function Cot() {
  return (
    <group position={[-0.55, -3.72, 1.85]}>
      <mesh>
        <boxGeometry args={[1.65, 0.12, 0.68]} />
        <primitive object={FRAME} attach="material" />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[1.55, 0.14, 0.62]} />
        <primitive object={MATTRESS} attach="material" />
      </mesh>
    </group>
  )
}

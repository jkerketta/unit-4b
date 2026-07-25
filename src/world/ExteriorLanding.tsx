import { makePSXMaterial } from '../render/psxMaterial'
import { FRONT_DOOR_POS } from './layout'

const CONCRETE = makePSXMaterial({ color: '#555552' })
const RAIL = makePSXMaterial({ color: '#252728' })
const SHADOW = makePSXMaterial({ color: '#171715' })

export default function ExteriorLanding() {
  return (
    <group>
      <mesh position={[FRONT_DOOR_POS[0], -0.08, 7.25]}>
        <boxGeometry args={[4.2, 0.15, 3.25]} /><primitive object={CONCRETE} attach="material" />
      </mesh>
      <mesh position={[5.45, 1.1, 7.25]}>
        <boxGeometry args={[0.12, 2.2, 3.25]} /><primitive object={CONCRETE} attach="material" />
      </mesh>
      <mesh position={[9.55, 0.65, 7.9]}>
        <boxGeometry args={[0.1, 1.3, 2]} /><primitive object={RAIL} attach="material" />
      </mesh>
      <group position={[6.05, 0, 6.7]}>
        <mesh position={[0, 0.9, 0]}><capsuleGeometry args={[0.22, 1.25, 3, 6]} /><primitive object={SHADOW} attach="material" /></mesh>
        <mesh position={[0, 1.75, 0]}><sphereGeometry args={[0.23, 7, 5]} /><primitive object={SHADOW} attach="material" /></mesh>
      </group>
      <pointLight position={[7.5, 2.6, 7]} intensity={3.5} distance={6} color="#d4b983" />
    </group>
  )
}

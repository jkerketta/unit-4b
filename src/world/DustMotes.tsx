import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../game/store'

const COUNT = 320
const BOUNDS = { minX: -4, maxX: 10, minY: 0.15, maxY: 2.6, minZ: -6, maxZ: 5.5 }

/** Slow-drifting dust motes that catch the apartment lights. */
export default function DustMotes() {
  const points = useRef<THREE.Points>(null)
  const { base, phases } = useMemo(() => {
    const b = new Float32Array(COUNT * 3)
    const p = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      b[i * 3] = THREE.MathUtils.lerp(BOUNDS.minX, BOUNDS.maxX, Math.random())
      b[i * 3 + 1] = THREE.MathUtils.lerp(BOUNDS.minY, BOUNDS.maxY, Math.random())
      b[i * 3 + 2] = THREE.MathUtils.lerp(BOUNDS.minZ, BOUNDS.maxZ, Math.random())
      p[i] = Math.random() * Math.PI * 2
    }
    return { base: b, phases: p }
  }, [])
  const positions = useMemo(() => base.slice(), [base])

  useFrame(({ clock }) => {
    const geo = points.current?.geometry
    if (!geo) return
    const chase = useGameStore.getState().phase === 'chase'
    const t = clock.elapsedTime * (chase ? 0.55 : 0.18)
    const attr = geo.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < COUNT; i++) {
      const ph = phases[i]
      attr.array[i * 3] = base[i * 3] + Math.sin(t + ph) * 0.18
      let y = base[i * 3 + 1] - ((clock.elapsedTime * 0.012 + ph) % 1) * 0.35
      if (y < BOUNDS.minY) y += BOUNDS.maxY - BOUNDS.minY
      attr.array[i * 3 + 1] = y
      attr.array[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.8 + ph) * 0.18
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d8c9a6" size={0.03} sizeAttenuation transparent opacity={0.55} depthWrite={false} fog />
    </points>
  )
}

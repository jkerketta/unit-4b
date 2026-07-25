import { useLoader, type ThreeElements } from '@react-three/fiber'
import { Suspense, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { makePSXMaterial } from '../../render/psxMaterial'

const DEFAULT_MATERIAL = makePSXMaterial({ color: '#77736a' })

interface ModelProps {
  url: string
  material?: THREE.MeshLambertMaterial
  materials?: Record<string, THREE.MeshLambertMaterial>
  position?: ThreeElements['group']['position']
  rotation?: ThreeElements['group']['rotation']
  scale?: ThreeElements['group']['scale']
}

interface LowPolyModelProps extends ModelProps {
  fallback?: ReactNode
}

function LoadedModel({ url, material, materials, position, rotation, scale }: ModelProps) {
  const source = useLoader(OBJLoader, url)
  const model = useMemo(() => {
    const instance = source.clone(true)
    const bounds = new THREE.Box3().setFromObject(instance)
    const center = bounds.getCenter(new THREE.Vector3())

    instance.position.set(-center.x, -bounds.min.y, -center.z)
    instance.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = false
      child.receiveShadow = false

      const replace = (original: THREE.Material) =>
        materials?.[original.name] ?? material ?? materials?._default ?? DEFAULT_MATERIAL
      child.material = Array.isArray(child.material)
        ? child.material.map(replace)
        : replace(child.material)
    })
    return instance
  }, [material, materials, source])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={model} />
    </group>
  )
}

/** A locally suspended, floor-aligned instance of a cached Kenney OBJ. */
export default function LowPolyModel({ fallback = null, ...props }: LowPolyModelProps) {
  return (
    <Suspense fallback={fallback}>
      <LoadedModel {...props} />
    </Suspense>
  )
}

export function preloadLowPolyModel(url: string) {
  useLoader.preload(OBJLoader, url)
}

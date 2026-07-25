import { Canvas } from '@react-three/fiber'
import Scene from './game/Scene'
import AudioRuntime from './systems/audio/AudioRuntime'
import HUD from './ui/HUD'

export default function App() {
  return (
    <>
      <AudioRuntime />
      <Canvas
        dpr={0.25}
        gl={{ antialias: false }}
        camera={{ fov: 70, near: 0.1, far: 40 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>
      <HUD />
    </>
  )
}

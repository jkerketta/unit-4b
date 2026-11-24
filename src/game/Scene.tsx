import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import PlayerController from '../systems/player/PlayerController'
import InteractSystem from '../systems/interact/InteractSystem'
import ScareManager from '../systems/scares/ScareManager'
import Entity from '../systems/entity/Entity'
import Heartbeat from '../systems/audio/Heartbeat'
import { FOG } from './constants'
import { useGameStore } from './store'
import Apartment from '../world/Apartment'
import SecretRoom from '../world/SecretRoom'
import { getWorldColliders, SPAWN, SPAWN_YAW } from '../world/layout'
import Hatch from '../world/props/Hatch'
import Lease from '../world/props/Lease'
import MovingBoxes from '../world/props/MovingBoxes'
import Rug from '../world/props/Rug'
import Bed from '../world/props/Bed'
import Closet from '../world/props/Closet'
import FrontDoor from '../world/props/FrontDoor'
import Phone from '../world/props/Phone'
import Furnishings from '../world/props/Furnishings'
import FloorPlanPoster from '../world/props/FloorPlanPoster'
import ExteriorLanding from '../world/ExteriorLanding'
import DustMotes from '../world/DustMotes'

function TitleDrift() {
  const { camera } = useThree()
  const target = new THREE.Vector3(0.25, 0.85, 1.55)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.085
    camera.position.set(0.2 + Math.cos(t) * 1.35, 1.42 + Math.sin(t * 0.7) * 0.08, 2.35 + Math.sin(t) * 0.82)
    camera.lookAt(target)
  })
  return null
}

export default function Scene() {
  const sessionId = useGameStore((state) => state.sessionId)
  const phase = useGameStore((state) => state.phase)
  const fogDensity = phase === 'title' ? FOG.density * 1.35 : FOG.density
  return (
    <>
      <fogExp2 attach="fog" args={[FOG.color, fogDensity]} />
      <color attach="background" args={[FOG.color]} />

      <Apartment />
      <Furnishings />
      <DustMotes />
      {phase === 'intro' && <ExteriorLanding />}
      {phase === 'title' ? <TitleDrift /> : <Runtime key={sessionId} />}
    </>
  )
}

function Runtime() {
  const phase = useGameStore((state) => state.phase)
  const boxMoved = useGameStore((state) => state.flags.boxMoved)
  return (
    <>
      <SecretRoom />
      <MovingBoxes />
      <Lease />
      <Rug />
      <Hatch />
      <Bed />
      <Closet />
      <FrontDoor />
      <Phone />
      <FloorPlanPoster />
      <InteractSystem />
      <ScareManager />
      {phase === 'chase' && <Entity />}
      <Heartbeat />
      {(phase === 'intro' || phase === 'calm' || phase === 'chase') && (
        <PlayerController walls={getWorldColliders(boxMoved, phase === 'intro')} spawn={SPAWN} spawnYaw={SPAWN_YAW} />
      )}
    </>
  )
}

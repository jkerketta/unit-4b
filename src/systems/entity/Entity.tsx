import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ENTITY, PLAYER } from '../../game/constants'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { entitySkinTexture } from '../../render/textures'
import { WALLS } from '../../world/layout'
import { playerRig } from '../player/playerRig'
import { audio } from '../audio/AudioManager'
import { advancePatrol, aiReducer, initialAIContext, type AIContext } from './aiMachine'
import { doorwayBetween, findPath, findRoomForPoint, ROOMS, type RoomId } from './roomGraph'
import { canHear, hasLineOfSight } from './sensing'

const SPAWN = new THREE.Vector3(9.55, 0, -4.15)
const tuple = (vector: THREE.Vector3): [number, number, number] => [vector.x, vector.y, vector.z]

export default function Entity() {
  const phase = useGameStore((state) => state.phase)
  const body = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Mesh>(null)
  const rightArm = useRef<THREE.Mesh>(null)
  const position = useRef(SPAWN.clone())
  const ai = useRef<AIContext>(initialAIContext())
  const logicalRoom = useRef<RoomId>('kitchen')
  const syncTimer = useRef(0)
  const caught = useRef(false)
  const stepElapsed = useRef(0)
  const grace = useRef(1.6)
  const skin = useMemo(() => makePSXMaterial({ map: entitySkinTexture(), color: '#e2ddd2' }), [])
  const dark = useMemo(() => makePSXMaterial({ color: '#161413' }), [])

  useEffect(() => {
    if (phase !== 'chase') return
    position.current.copy(SPAWN)
    logicalRoom.current = 'kitchen'
    syncTimer.current = 0
    caught.current = false
    grace.current = 1.6
    ai.current = aiReducer(initialAIContext(), { type: 'WAKE' })
    const store = useGameStore.getState()
    store.setEntityState(ai.current.state)
    store.setEntityRoom('kitchen', ai.current.targetRoom)
    store.setEntityPosition(tuple(SPAWN))
  }, [phase])

  useEffect(() => () => {
    const store = useGameStore.getState()
    store.setEntityPosition(null)
    store.setEntityState('dormant')
    store.setEntityRoom(null)
  }, [])

  useFrame(({ clock }, rawDt) => {
    if (phase !== 'chase' || useGameStore.getState().paused) return
    const dt = Math.min(rawDt, 0.05)
    if (grace.current > 0) grace.current = Math.max(0, grace.current - dt)
    const player = useGameStore.getState().player
    const playerPosition = playerRig.position
    const distance = position.current.distanceTo(playerPosition)
    const playerRoom = findRoomForPoint(tuple(playerPosition))
    const sameFloor = Math.abs(position.current.y - playerPosition.y) < 1
    const sensing = grace.current <= 0
    // Fully invisible while hidden — no LOS or hearing.
    const geometricSight = sensing && !player.hidden && sameFloor && distance < 12 && hasLineOfSight(
      [position.current.x, position.current.y + 1.8, position.current.z],
      [playerPosition.x, playerPosition.y + (playerRig.forcedEyeHeight ?? PLAYER.eyeHeight), playerPosition.z],
      WALLS,
    )
    const visible = geometricSight
    const heard = sensing && !player.hidden && canHear(
      tuple(position.current),
      tuple(playerPosition),
      playerRig.sprinting,
      ENTITY.hearingRadius,
    )

    const before = ai.current
    ai.current = aiReducer(before, {
      type: 'TICK',
      dt,
      playerVisible: visible,
      playerHeard: heard,
      playerRoom,
      playerHidden: player.hidden,
      distanceToPlayer: sensing ? distance : 99,
    })

    if (ai.current.state !== before.state) {
      useGameStore.getState().setEntityState(ai.current.state)
      if (ai.current.state === 'alert') {
        playerRig.shake = Math.max(playerRig.shake, 0.2)
        audio.play('scareStinger', { volume: 0.9 })
      }
    }

    if (ai.current.state === 'attack') {
      if (!caught.current) {
        caught.current = true
        audio.play('shriek')
        useGameStore.getState().setPhase('gameover')
      }
      return
    }

    if (ai.current.state === 'chase' || ai.current.state === 'search') {
      let targetRoom = ai.current.targetRoom
      if (!targetRoom || targetRoom === 'secret') targetRoom = logicalRoom.current
      let target = new THREE.Vector3()

      if (logicalRoom.current !== targetRoom) {
        const path = findPath(logicalRoom.current, targetRoom)
        const nextRoom = path[1]
        if (nextRoom) {
          target.fromArray(doorwayBetween(logicalRoom.current, nextRoom))
          if (position.current.distanceTo(target) < 0.16) {
            logicalRoom.current = nextRoom
            const intoRoom = new THREE.Vector3(...ROOMS[nextRoom].center).sub(target).setY(0).normalize()
            position.current.addScaledVector(intoRoom, 0.22)
          }
        }
      } else if (ai.current.state === 'chase' && (visible || heard)) {
        target.copy(playerPosition).setY(0)
      } else {
        target.fromArray(ROOMS[targetRoom].center)
        if (ai.current.state === 'search' && position.current.distanceTo(target) < 0.35) {
          ai.current = advancePatrol(ai.current)
          const nextTarget = ai.current.targetRoom ?? logicalRoom.current
          if (nextTarget !== logicalRoom.current) {
            const path = findPath(logicalRoom.current, nextTarget)
            const hop = path[1]
            if (hop) target.fromArray(doorwayBetween(logicalRoom.current, hop))
          }
        }
      }

      const direction = target.sub(position.current).setY(0)
      if (direction.lengthSq() > 0.001) {
        direction.normalize()
        const speed = ai.current.state === 'chase' ? ENTITY.chaseSpeed : ENTITY.searchSpeed
        position.current.addScaledVector(direction, speed * dt)
        if (body.current) body.current.rotation.y = Math.atan2(direction.x, direction.z)
        stepElapsed.current += dt
        const cadence = ai.current.state === 'chase' ? 0.32 : 0.52
        if (stepElapsed.current >= cadence) {
          stepElapsed.current = 0
          const relative: [number, number, number] = [
            position.current.x - playerRig.position.x,
            0,
            position.current.z - playerRig.position.z,
          ]
          audio.play('entityStep', { position: relative, rate: 0.9 + Math.random() * 0.12 })
        }
      }
    }

    if (body.current) {
      body.current.position.copy(position.current)
      body.current.rotation.z = Math.sin(clock.elapsedTime * (ai.current.state === 'chase' ? 7 : 2)) * 0.018
      const gait = ai.current.state === 'chase' ? Math.sin(clock.elapsedTime * 8) * 0.42 : Math.sin(clock.elapsedTime * 2) * 0.05
      if (leftArm.current) leftArm.current.rotation.x = gait
      if (rightArm.current) rightArm.current.rotation.x = -gait
    }
    syncTimer.current += dt
    if (syncTimer.current >= 0.1) {
      syncTimer.current = 0
      const store = useGameStore.getState()
      store.setEntityPosition(tuple(position.current))
      store.setEntityRoom(logicalRoom.current, ai.current.targetRoom)
    }
  })

  if (phase !== 'chase') return null
  return (
    <group ref={body} position={tuple(SPAWN)}>
      <mesh position={[0, 1.42, 0]} rotation-x={0.08}>
        <capsuleGeometry args={[0.21, 1.55, 3, 7]} />
        <primitive object={skin} attach="material" />
      </mesh>
      <mesh position={[0, 2.48, 0.035]} scale={[0.82, 1.16, 0.86]}>
        <sphereGeometry args={[0.24, 10, 7]} />
        <primitive object={skin} attach="material" />
      </mesh>
      <mesh ref={leftArm} position={[-0.34, 1.32, 0.02]} rotation-z={-0.05}>
        <capsuleGeometry args={[0.065, 1.28, 2, 5]} />
        <primitive object={skin} attach="material" />
      </mesh>
      <mesh ref={rightArm} position={[0.34, 1.32, 0.02]} rotation-z={0.05}>
        <capsuleGeometry args={[0.065, 1.28, 2, 5]} />
        <primitive object={skin} attach="material" />
      </mesh>
      {[-0.13, 0.13].map((x) => (
        <mesh key={`leg-${x}`} position={[x, 0.42, 0]}>
          <capsuleGeometry args={[0.09, 0.65, 2, 5]} />
          <primitive object={dark} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, 0.015, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.43, 10]} />
        <meshBasicMaterial color="#050505" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  )
}

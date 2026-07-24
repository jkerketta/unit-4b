import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { PLAYER } from '../../game/constants'
import { useGameStore } from '../../game/store'
import { resolveCapsule, type AABB } from './collision'
import { playerRig } from './playerRig'

const KEYS = { forward: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'] }

export default function PlayerController({
  walls,
  spawn = [0, 0, 0],
  spawnYaw = 0,
}: {
  walls: AABB[]
  spawn?: [number, number, number]
  spawnYaw?: number
}) {
  const { camera } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const stamina = useRef<number>(PLAYER.staminaMax)
  const regenWait = useRef(0)
  const lastStoreSync = useRef(0)
  const phase = useGameStore((s) => s.phase)
  const hidden = useGameStore((s) => s.player.hidden)
  const setStamina = useGameStore((s) => s.setStamina)
  const locked = useRef(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true }
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    playerRig.position.set(...spawn)
    playerRig.yaw = spawnYaw
    camera.position.set(spawn[0], spawn[1] + PLAYER.eyeHeight, spawn[2])
    camera.rotation.set(0, spawnYaw, 0, 'YXZ')
  }, [spawn, spawnYaw, camera])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const canMove = locked.current && (phase === 'calm' || phase === 'chase') && !hidden
    const k = keys.current
    const f = (canMove && KEYS.forward.some((c) => k[c]) ? 1 : 0) - (canMove && KEYS.back.some((c) => k[c]) ? 1 : 0)
    const r = (canMove && KEYS.right.some((c) => k[c]) ? 1 : 0) - (canMove && KEYS.left.some((c) => k[c]) ? 1 : 0)
    const wantSprint = canMove && (k['ShiftLeft'] || k['ShiftRight']) && f > 0 && stamina.current > 0
    const speed = wantSprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed

    // stamina
    if (wantSprint && (f !== 0 || r !== 0)) {
      stamina.current = Math.max(0, stamina.current - PLAYER.staminaDrainPerSec * dt)
      regenWait.current = PLAYER.staminaRegenDelaySec
    } else {
      regenWait.current -= dt
      if (regenWait.current <= 0) stamina.current = Math.min(PLAYER.staminaMax, stamina.current + PLAYER.staminaRegenPerSec * dt)
    }

    // movement in camera-yaw space
    const yaw = camera.rotation.y
    const dir = new THREE.Vector3(-Math.sin(yaw) * f + Math.cos(yaw) * r, 0, -Math.cos(yaw) * f - Math.sin(yaw) * r)
    if (dir.lengthSq() > 0) dir.normalize().multiplyScalar(speed)
    const next = resolveCapsule(
      [playerRig.position.x, playerRig.position.y, playerRig.position.z],
      PLAYER.radius, PLAYER.height, walls, [dir.x, 0, dir.z], dt,
    )
    playerRig.position.set(...next)
    playerRig.yaw = yaw
    playerRig.moving = dir.lengthSq() > 0
    playerRig.sprinting = wantSprint && playerRig.moving
    camera.position.set(next[0], next[1] + PLAYER.eyeHeight, next[2])

    // sync discrete state to store at ~10Hz (stamina bar, AI reads rig directly)
    lastStoreSync.current += dt
    if (lastStoreSync.current > 0.1) {
      lastStoreSync.current = 0
      setStamina(Math.round(stamina.current))
      useGameStore.getState().setPlayerPosition([next[0], next[1], next[2]])
    }
  })

  return (
    <PointerLockControls
      onLock={() => { locked.current = true }}
      onUnlock={() => { locked.current = false }}
    />
  )
}

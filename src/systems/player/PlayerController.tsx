import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { PLAYER } from '../../game/constants'
import { useGameStore } from '../../game/store'
import { audio } from '../audio/AudioManager'
import { resolveCapsule, type AABB } from './collision'
import { playerRig } from './playerRig'
import { useUIStore } from '../../ui/subtitles'

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
  const sessionId = useGameStore((s) => s.sessionId)
  const hidden = useGameStore((s) => s.player.hidden)
  const setStamina = useGameStore((s) => s.setStamina)
  const locked = useRef(false)
  const hiddenYaw = useRef(0)
  const stepElapsed = useRef(0)

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true }
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false }
    const onBlur = () => { keys.current = {} }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', onBlur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', onBlur) }
  }, [])

  useEffect(() => {
    const state = useGameStore.getState()
    const position = state.player.position ?? spawn
    const yaw = state.player.yaw ?? spawnYaw
    playerRig.position.set(...position)
    playerRig.yaw = yaw
    playerRig.moving = false
    playerRig.sprinting = false
    playerRig.shake = 0
    playerRig.forcedEyeHeight = undefined
    stamina.current = PLAYER.staminaMax
    regenWait.current = 0
    keys.current = {}
    camera.position.set(position[0], position[1] + PLAYER.eyeHeight, position[2])
    camera.rotation.set(0, yaw, 0, 'YXZ')
  }, [sessionId, spawn, spawnYaw, camera])

  useEffect(() => {
    if (hidden) hiddenYaw.current = camera.rotation.y
  }, [hidden, camera])

  useFrame((_, rawDt) => {
    const ui = useUIStore.getState()
    if (useGameStore.getState().paused || ui.document || ui.introStep !== null) {
      playerRig.moving = false
      playerRig.sprinting = false
      return
    }
    const dt = Math.min(rawDt, 0.05)
    const canMove = locked.current && (phase === 'intro' || phase === 'calm' || phase === 'chase') && !hidden
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
    if (hidden) {
      camera.rotation.y = THREE.MathUtils.clamp(
        camera.rotation.y,
        hiddenYaw.current - Math.PI / 3,
        hiddenYaw.current + Math.PI / 3,
      )
    }
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
    if (playerRig.moving) {
      stepElapsed.current += dt
      const cadence = playerRig.sprinting ? 0.28 : 0.46
      if (stepElapsed.current >= cadence) {
        stepElapsed.current = 0
        audio.play('playerStep', { volume: playerRig.sprinting ? 0.34 : 0.24, rate: 0.92 + Math.random() * 0.16 })
      }
    } else {
      stepElapsed.current = 0
    }
    playerRig.shake = Math.max(0, playerRig.shake - dt * 2.5)
    const shakeX = (Math.random() - 0.5) * playerRig.shake * 0.3
    const shakeY = (Math.random() - 0.5) * playerRig.shake * 0.3
    const eyeHeight = playerRig.forcedEyeHeight ?? PLAYER.eyeHeight
    camera.position.set(next[0] + shakeX, next[1] + eyeHeight + shakeY, next[2])
    camera.rotation.z = (Math.random() - 0.5) * playerRig.shake * 0.04

    // sync discrete state to store at ~10Hz (stamina bar, AI reads rig directly)
    lastStoreSync.current += dt
    if (lastStoreSync.current >= 0.1) {
      lastStoreSync.current = 0
      setStamina(Math.round(stamina.current))
      useGameStore.getState().setPlayerPosition([next[0], next[1], next[2]])
    }
  })

  return (
    <PointerLockControls
      onLock={() => { locked.current = true }}
      onUnlock={() => {
        locked.current = false
        keys.current = {}
        const state = useGameStore.getState()
        const ui = useUIStore.getState()
        if ((state.phase === 'intro' || state.phase === 'calm' || state.phase === 'chase') && !state.paused && !ui.document && ui.introStep === null) state.pause()
      }}
    />
  )
}

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { create } from 'zustand'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { say, useUIStore } from '../../ui/subtitles'
import { advanceObjective } from '../objectives/objectiveChain'
import { playerRig } from '../player/playerRig'
import { audio } from '../audio/AudioManager'
import { suppressUnlockPause } from '../player/pauseGate'
import { shouldFireWakeGlimpse, shouldRunCatchScare } from './scareGuards'
import { advanceTimeline, type TimelineState, type TimelineStep } from './timelines'

interface ScareState {
  trigger: number
  candleLevel: number
  silhouette: boolean
  glimpse: boolean
  wakeCutscene: boolean
  cinematicEntity: boolean
  cinematicPos: [number, number, number]
  triggerScare1: () => void
  setCandleLevel: (level: number) => void
  setSilhouette: (visible: boolean) => void
  setGlimpse: (visible: boolean) => void
  setWakeCutscene: (active: boolean) => void
  setCinematicEntity: (visible: boolean, pos?: [number, number, number]) => void
  resetVisuals: () => void
}

export const useScareStore = create<ScareState>((set) => ({
  trigger: 0,
  candleLevel: 1,
  silhouette: false,
  glimpse: false,
  wakeCutscene: false,
  cinematicEntity: false,
  cinematicPos: [9.6, 0, -4.4],
  triggerScare1: () => set((state) => ({ trigger: state.trigger + 1 })),
  setCandleLevel: (candleLevel) => set({ candleLevel }),
  setSilhouette: (silhouette) => set({ silhouette }),
  setGlimpse: (glimpse) => set({ glimpse }),
  setWakeCutscene: (wakeCutscene) => set({ wakeCutscene }),
  setCinematicEntity: (cinematicEntity, cinematicPos) => set((state) => ({
    cinematicEntity,
    cinematicPos: cinematicPos ?? state.cinematicPos,
  })),
  resetVisuals: () => set({
    candleLevel: 1,
    silhouette: false,
    glimpse: false,
    wakeCutscene: false,
    cinematicEntity: false,
  }),
}))

export function triggerScare1(): void {
  useScareStore.getState().triggerScare1()
}

const SHADOW = makePSXMaterial({ color: '#050505' })
const SKIN = makePSXMaterial({ color: '#d8d2c6' })

/** Kitchen fridge corner camera and wall-phase path. */
const CAM_POS = new THREE.Vector3(8.6, 1.55, -3.35)
const CAM_LOOK = new THREE.Vector3(10.1, 1.4, -4.55)
const ENTITY_START: [number, number, number] = [10.55, 0, -4.55]
const ENTITY_MID: [number, number, number] = [9.3, 0, -4.2]
const ENTITY_END: [number, number, number] = [8.4, 0, -3.4]

function setCutsceneCamera(active: boolean, pos?: THREE.Vector3, look?: THREE.Vector3) {
  playerRig.cutsceneActive = active
  playerRig.cutsceneCamPos = active && pos ? pos.clone() : null
  playerRig.cutsceneLookAt = active && look ? look.clone() : null
}

export default function ScareManager() {
  const trigger = useScareStore((state) => state.trigger)
  const silhouette = useScareStore((state) => state.silhouette)
  const glimpse = useScareStore((state) => state.glimpse)
  const cinematicEntity = useScareStore((state) => state.cinematicEntity)
  const cinematicPos = useScareStore((state) => state.cinematicPos)
  const phase = useGameStore((state) => state.phase)
  const sessionId = useGameStore((state) => state.sessionId)
  const seenTrigger = useRef(0)
  const startedAt = useRef(0)
  const timeline = useRef<TimelineState | null>(null)
  const activeSteps = useRef<TimelineStep[]>([])
  const wasBelow = useRef(false)
  const wakeStarted = useRef(false)
  const deathTimer = useRef<number | null>(null)
  const cinematicRef = useRef<THREE.Group>(null)
  const steps = useMemo<TimelineStep[]>(() => [
    { at: 0, do: () => {
      useScareStore.getState().setCandleLevel(0)
      audio.play('scareStinger')
    } },
    { at: 0.1, do: () => { playerRig.shake = Math.max(playerRig.shake, 0.15) } },
    { at: 0.2, do: () => useScareStore.getState().setSilhouette(true) },
    { at: 0.7, do: () => useScareStore.getState().setSilhouette(false) },
    { at: 0.9, do: () => useScareStore.getState().setCandleLevel(0.3) },
    { at: 1.5, do: () => useScareStore.getState().setCandleLevel(1) },
  ], [])

  useEffect(() => {
    seenTrigger.current = useScareStore.getState().trigger
    timeline.current = null
    activeSteps.current = []
    wasBelow.current = false
    wakeStarted.current = false
    if (deathTimer.current !== null) window.clearTimeout(deathTimer.current)
    deathTimer.current = null
    setCutsceneCamera(false)
    useScareStore.getState().resetVisuals()
  }, [sessionId])

  useEffect(() => {
    if (!shouldRunCatchScare(phase)) return
    const ui = useUIStore.getState()
    ui.setCatchFlash(true)
    playerRig.shake = Math.max(playerRig.shake, 0.4)
    deathTimer.current = window.setTimeout(() => {
      useUIStore.getState().setCatchFlash(false)
      useUIStore.getState().setFadeColor('black')
      useUIStore.getState().setFadeOpacity(1)
      useUIStore.getState().setDeathScreenVisible(true)
    }, 1100)
    return () => {
      if (deathTimer.current !== null) window.clearTimeout(deathTimer.current)
    }
  }, [phase])

  useFrame((_, rawDt) => {
    if (useGameStore.getState().paused) return
    const dt = Math.min(rawDt, 0.05)
    if (playerRig.position.y < -1) wasBelow.current = true
    const state = useGameStore.getState()

    if (!wakeStarted.current && shouldFireWakeGlimpse(
      state.phase,
      state.flags.scare1Done,
      wasBelow.current,
      playerRig.position.y >= -0.05,
    )) {
      wakeStarted.current = true
      suppressUnlockPause(800)
      useScareStore.getState().setWakeCutscene(true)
      useUIStore.getState().setFadeOpacity(0.85)
      activeSteps.current = [
        { at: 0.25, do: () => {
          useUIStore.getState().setFadeOpacity(0)
          setCutsceneCamera(true, CAM_POS, CAM_LOOK)
          useScareStore.getState().setCinematicEntity(true, ENTITY_START)
          audio.play('churchBell', { volume: 0.78, rate: 0.92 })
          audio.play('static', { volume: 0.28, rate: 0.95 })
        } },
        { at: 1.1, do: () => {
          useScareStore.getState().setCinematicEntity(true, ENTITY_MID)
          audio.play('static', { volume: 0.48, rate: 1.05 })
        } },
        { at: 2.0, do: () => {
          useScareStore.getState().setCinematicEntity(true, ENTITY_END)
          audio.play('static', { volume: 0.62, rate: 0.88 })
          audio.play('churchBell', { volume: 0.45, rate: 0.7 })
          playerRig.shake = Math.max(playerRig.shake, 0.2)
        } },
        { at: 2.7, do: () => {
          audio.play('scareStinger', { volume: 1.0, rate: 1.0 })
          useUIStore.getState().setFadeOpacity(1)
        } },
        { at: 3.05, do: () => {
          useScareStore.getState().setCinematicEntity(false)
          setCutsceneCamera(false)
          useUIStore.getState().setFadeOpacity(0)
          playerRig.shake = Math.max(playerRig.shake, 0.32)
        } },
        { at: 3.4, do: () => {
          advanceObjective('hatch')
          useGameStore.getState().setPhase('chase')
          say("It's in the walls. Hide — or go back under.")
        } },
        { at: 4.0, do: () => {
          useScareStore.getState().setWakeCutscene(false)
          suppressUnlockPause(400)
        } },
      ]
      startedAt.current = 0
      timeline.current = { elapsed: 0, fired: new Set() }
    }

    if (trigger !== seenTrigger.current) {
      seenTrigger.current = trigger
      startedAt.current = 0
      timeline.current = { elapsed: 0, fired: new Set() }
      activeSteps.current = steps
    }
    if (timeline.current) {
      startedAt.current += dt
      timeline.current = advanceTimeline(timeline.current, activeSteps.current, startedAt.current)
      if (timeline.current.fired.size === activeSteps.current.length) timeline.current = null
    }

    if (cinematicRef.current && cinematicEntity) {
      cinematicRef.current.position.lerp(
        new THREE.Vector3(...cinematicPos),
        Math.min(1, dt * 3.2),
      )
      cinematicRef.current.lookAt(CAM_POS.x, 1.2, CAM_POS.z)
    }
  })

  return (
    <>
      {(silhouette || glimpse) && (
        <group position={glimpse ? [0, 1.25, 0.56] : [-0.625, -2.75, 1.55]}>
          <mesh>
            <capsuleGeometry args={[0.22, 1.7, 3, 6]} />
            <primitive object={SHADOW} attach="material" />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.25, 8, 6]} />
            <primitive object={SHADOW} attach="material" />
          </mesh>
        </group>
      )}
      {cinematicEntity && (
        <group ref={cinematicRef} position={cinematicPos}>
          <mesh position={[0, 1.45, 0]}>
            <capsuleGeometry args={[0.2, 1.65, 3, 6]} />
            <primitive object={SKIN} attach="material" />
          </mesh>
          <mesh position={[0, 2.55, 0.02]} scale={[0.85, 1.2, 0.9]}>
            <sphereGeometry args={[0.24, 8, 6]} />
            <primitive object={SKIN} attach="material" />
          </mesh>
          <mesh position={[-0.38, 1.35, 0]} rotation-z={-0.2}>
            <capsuleGeometry args={[0.06, 1.35, 2, 5]} />
            <primitive object={SKIN} attach="material" />
          </mesh>
          <mesh position={[0.38, 1.35, 0]} rotation-z={0.2}>
            <capsuleGeometry args={[0.06, 1.35, 2, 5]} />
            <primitive object={SKIN} attach="material" />
          </mesh>
        </group>
      )}
    </>
  )
}

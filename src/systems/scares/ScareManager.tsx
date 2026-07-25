import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { create } from 'zustand'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { say, useUIStore } from '../../ui/subtitles'
import { advanceObjective } from '../objectives/objectiveChain'
import { playerRig } from '../player/playerRig'
import { audio } from '../audio/AudioManager'
import { shouldFireWakeGlimpse, shouldRunCatchScare } from './scareGuards'
import { advanceTimeline, type TimelineState, type TimelineStep } from './timelines'

interface ScareState {
  trigger: number
  candleLevel: number
  silhouette: boolean
  glimpse: boolean
  triggerScare1: () => void
  setCandleLevel: (level: number) => void
  setSilhouette: (visible: boolean) => void
  setGlimpse: (visible: boolean) => void
  resetVisuals: () => void
}

export const useScareStore = create<ScareState>((set) => ({
  trigger: 0,
  candleLevel: 1,
  silhouette: false,
  glimpse: false,
  triggerScare1: () => set((state) => ({ trigger: state.trigger + 1 })),
  setCandleLevel: (candleLevel) => set({ candleLevel }),
  setSilhouette: (silhouette) => set({ silhouette }),
  setGlimpse: (glimpse) => set({ glimpse }),
  resetVisuals: () => set({ candleLevel: 1, silhouette: false, glimpse: false }),
}))

export function triggerScare1(): void {
  useScareStore.getState().triggerScare1()
}

const SHADOW = makePSXMaterial({ color: '#050505' })

export default function ScareManager() {
  const trigger = useScareStore((state) => state.trigger)
  const silhouette = useScareStore((state) => state.silhouette)
  const glimpse = useScareStore((state) => state.glimpse)
  const phase = useGameStore((state) => state.phase)
  const sessionId = useGameStore((state) => state.sessionId)
  const seenTrigger = useRef(0)
  const startedAt = useRef(0)
  const timeline = useRef<TimelineState | null>(null)
  const activeSteps = useRef<TimelineStep[]>([])
  const wasBelow = useRef(false)
  const wakeStarted = useRef(false)
  const deathTimer = useRef<number | null>(null)
  const steps = useMemo<TimelineStep[]>(() => [
    { at: 0, do: () => {
      useScareStore.getState().setCandleLevel(0)
      audio.play('scareStinger')
    } },
    { at: 0.1, do: () => playerRig.shake = Math.max(playerRig.shake, 0.15) },
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
      useScareStore.getState().setGlimpse(true)
      audio.play('scareStinger', { volume: 0.9, rate: 0.86 })
      playerRig.shake = Math.max(playerRig.shake, 0.28)
      activeSteps.current = [
        { at: 0.6, do: () => useScareStore.getState().setGlimpse(false) },
        { at: 0.7, do: () => {
          advanceObjective('hatch')
          useGameStore.getState().setPhase('chase')
          say("It's in the walls. IT'S IN THE WALLS.")
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
  })

  if (!silhouette && !glimpse) return null
  return (
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
  )
}

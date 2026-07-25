import { useEffect, useRef } from 'react'
import { useGameStore } from '../../game/store'
import { audio } from './AudioManager'
import { playTenantVoicemail } from './voicemail'

export default function AudioRuntime() {
  const phase = useGameStore((state) => state.phase)
  const sessionId = useGameStore((state) => state.sessionId)
  const paused = useGameStore((state) => state.paused)
  const previousSession = useRef(sessionId)

  useEffect(() => {
    audio.arm()
    return () => audio.cleanup()
  }, [])

  useEffect(() => {
    if (previousSession.current !== sessionId) {
      previousSession.current = sessionId
      audio.cleanup()
    }
    audio.setPhase(phase)
  }, [phase, sessionId])

  useEffect(() => {
    audio.setPaused(paused)
  }, [paused])

  useEffect(() => {
    if (phase !== 'gameover') return
    const timer = window.setTimeout(() => playTenantVoicemail(), 1500)
    return () => window.clearTimeout(timer)
  }, [phase, sessionId])

  return null
}

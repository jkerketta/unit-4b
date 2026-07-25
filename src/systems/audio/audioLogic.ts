import type { Phase } from '../../game/store'

export type PhaseLoop = 'calmAmbience' | null

export function phaseLoopFor(phase: Phase): PhaseLoop {
  if (phase === 'intro' || phase === 'calm') return 'calmAmbience'
  // Chase: no looping bed — discrete heartbeat + footsteps only (avoids rustle drone).
  return null
}

export interface HeartbeatParams {
  bpm: number
  volume: number
}

export function heartbeatParams(distance: number): HeartbeatParams {
  const proximity = Math.max(0, Math.min(1, (16 - distance) / 15))
  return {
    bpm: Math.round(60 + proximity * 80),
    volume: proximity * 0.9,
  }
}

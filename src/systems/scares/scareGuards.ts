import type { Phase } from '../../game/store'

export function shouldFireWakeGlimpse(
  phase: Phase,
  scare1Done: boolean,
  wasBelow: boolean,
  nowAbove: boolean,
): boolean {
  return phase === 'calm' && scare1Done && wasBelow && nowAbove
}

export function shouldRunCatchScare(phase: Phase): boolean {
  return phase === 'gameover'
}

import * as THREE from 'three'
import { useGameStore, type HideSpotId } from '../../game/store'
import { playerRig } from './playerRig'
import { say } from '../../ui/subtitles'

export interface HideSpotConfig {
  id: HideSpotId
  hidePosition: [number, number, number]
  exitPosition: [number, number, number]
  eyeHeight: number
  enterLine: string
  watchedLine: string
  /** Prompt shown while hidden — E exits from anywhere. */
  exitLabel: string
  /** Optional look yaw while entering (radians). */
  yaw?: number
  /** Narrow peep cone half-angle for closet blinds. */
  peepYawLimit?: number
}

let activeExit: [number, number, number] | null = null
let activeExitLabel: string | null = null

export function enterHideSpot(config: HideSpotConfig, watched: boolean): void {
  const store = useGameStore.getState()
  store.setHidden(true, false)
  store.setHideSpot(config.id)
  activeExit = [...config.exitPosition]
  activeExitLabel = config.exitLabel
  playerRig.forcedPosition = new THREE.Vector3(...config.hidePosition)
  playerRig.position.set(...config.hidePosition)
  playerRig.forcedEyeHeight = config.eyeHeight
  playerRig.peepYawLimit = config.peepYawLimit
  if (config.yaw !== undefined) {
    playerRig.yaw = config.yaw
    playerRig.forcedYaw = config.yaw
  } else {
    playerRig.forcedYaw = undefined
  }
  store.setPlayerPosition(config.hidePosition)
  say(watched ? config.watchedLine : config.enterLine)
}

export function exitHideSpot(exitPosition: [number, number, number]): void {
  const store = useGameStore.getState()
  store.setHidden(false)
  store.setHideSpot(null)
  activeExit = null
  activeExitLabel = null
  playerRig.forcedPosition = undefined
  playerRig.forcedEyeHeight = undefined
  playerRig.forcedYaw = undefined
  playerRig.peepYawLimit = undefined
  playerRig.position.set(...exitPosition)
  store.setPlayerPosition(exitPosition)
}

/** Exit the current hide spot if any. Returns true when E was consumed. */
export function tryExitHideSpot(): boolean {
  if (!useGameStore.getState().player.hideSpot || !activeExit) return false
  exitHideSpot(activeExit)
  return true
}

export function hideExitPrompt(): string | null {
  if (!useGameStore.getState().player.hideSpot) return null
  return activeExitLabel
}

export function clearHideState(): void {
  activeExit = null
  activeExitLabel = null
  playerRig.forcedPosition = undefined
  playerRig.forcedEyeHeight = undefined
  playerRig.forcedYaw = undefined
  playerRig.peepYawLimit = undefined
  useGameStore.getState().setHideSpot(null)
  useGameStore.getState().setHidden(false)
}

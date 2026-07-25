import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useGameStore } from '../../game/store'
import { playerRig } from '../player/playerRig'
import { audio } from './AudioManager'
import { heartbeatParams, type HeartbeatParams } from './audioLogic'

export { heartbeatParams } from './audioLogic'

/** Placeholder runtime values consumed by the HUD until the audio asset pass. */
export const heartbeatRuntime: HeartbeatParams = { bpm: 60, volume: 0 }

export default function Heartbeat() {
  const phase = useGameStore((state) => state.phase)
  const elapsed = useRef(0)

  useEffect(() => () => audio.setHeartbeat(0, 60), [])

  useFrame((_, dt) => {
    if (useGameStore.getState().paused) return
    elapsed.current += dt
    if (elapsed.current < 0.1) return
    elapsed.current = 0
    const entity = useGameStore.getState().entity.position
    if (phase !== 'chase' || !entity) {
      Object.assign(heartbeatRuntime, { bpm: 60, volume: 0 })
      audio.setHeartbeat(0, 60)
      return
    }
    const params = heartbeatParams(Math.hypot(entity[0] - playerRig.position.x, entity[2] - playerRig.position.z))
    Object.assign(heartbeatRuntime, params)
    audio.setHeartbeat(params.volume, params.bpm)
  })

  return null
}

import { ENTITY } from '../../game/constants'
import type { RoomId } from './roomGraph'

export type AIState = 'dormant' | 'alert' | 'search' | 'chase' | 'attack'

export interface AIContext {
  state: AIState
  lastKnownPlayerRoom: RoomId | null
  targetRoom: RoomId | null
  alertTimer: number
  sawPlayerHide: boolean
}

export function initialAIContext(): AIContext {
  return {
    state: 'dormant',
    lastKnownPlayerRoom: null,
    targetRoom: null,
    alertTimer: 0,
    sawPlayerHide: false,
  }
}

export type AIEvent =
  | { type: 'WAKE' }
  | {
      type: 'TICK'
      dt: number
      playerVisible: boolean
      playerHeard: boolean
      playerRoom: RoomId | null
      playerHidden: boolean
      distanceToPlayer: number
    }

export function aiReducer(ctx: AIContext, event: AIEvent): AIContext {
  if (ctx.state === 'attack') return ctx
  if (event.type === 'WAKE') {
    return ctx.state === 'dormant'
      ? { ...ctx, state: 'alert', alertTimer: ENTITY.alertDurationSec }
      : ctx
  }

  const { dt, playerVisible, playerHeard, playerRoom, playerHidden, distanceToPlayer } = event
  switch (ctx.state) {
    case 'dormant':
      return ctx
    case 'alert': {
      const alertTimer = Math.max(0, ctx.alertTimer - dt)
      const lastKnownPlayerRoom = playerRoom ?? ctx.lastKnownPlayerRoom
      return alertTimer === 0
        ? { ...ctx, state: 'chase', alertTimer, lastKnownPlayerRoom, targetRoom: lastKnownPlayerRoom }
        : { ...ctx, alertTimer, lastKnownPlayerRoom }
    }
    case 'chase':
      if (distanceToPlayer <= ENTITY.catchRadius && (playerVisible || ctx.sawPlayerHide)) {
        return { ...ctx, state: 'attack' }
      }
      if ((playerVisible || playerHeard) && playerRoom) {
        return {
          ...ctx,
          lastKnownPlayerRoom: playerRoom,
          targetRoom: playerRoom,
          sawPlayerHide: ctx.sawPlayerHide || playerHidden,
        }
      }
      return { ...ctx, state: 'search', targetRoom: ctx.lastKnownPlayerRoom }
    case 'search':
      if ((playerVisible || playerHeard) && !playerHidden && playerRoom) {
        return { ...ctx, state: 'chase', lastKnownPlayerRoom: playerRoom, targetRoom: playerRoom }
      }
      return ctx
  }
}

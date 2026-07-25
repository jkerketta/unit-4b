import { ENTITY } from '../../game/constants'
import type { RoomId } from './roomGraph'

export type AIState = 'dormant' | 'alert' | 'search' | 'chase' | 'attack'

/** Full-apartment loop used while searching after the entity wakes. */
export const HOUSE_PATROL: RoomId[] = [
  'living',
  'entry',
  'kitchen',
  'hallway',
  'bedroom',
  'bathroom',
  'hallway',
  'living',
]

export interface AIContext {
  state: AIState
  lastKnownPlayerRoom: RoomId | null
  targetRoom: RoomId | null
  alertTimer: number
  sawPlayerHide: boolean
  patrolIndex: number
}

export function initialAIContext(): AIContext {
  return {
    state: 'dormant',
    lastKnownPlayerRoom: null,
    targetRoom: null,
    alertTimer: 0,
    sawPlayerHide: false,
    patrolIndex: 0,
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
    const kitchenIndex = HOUSE_PATROL.indexOf('kitchen')
    return ctx.state === 'dormant'
      ? {
          ...ctx,
          state: 'alert',
          alertTimer: ENTITY.alertDurationSec,
          targetRoom: 'kitchen',
          patrolIndex: kitchenIndex >= 0 ? kitchenIndex : 0,
        }
      : ctx
  }

  const { dt, playerVisible, playerHeard, playerRoom, playerHidden, distanceToPlayer } = event
  const detected = (playerVisible || playerHeard) && !playerHidden

  switch (ctx.state) {
    case 'dormant':
      return ctx
    case 'alert': {
      const alertTimer = Math.max(0, ctx.alertTimer - dt)
      const lastKnownPlayerRoom = playerRoom ?? ctx.lastKnownPlayerRoom
      if (alertTimer > 0) return { ...ctx, alertTimer, lastKnownPlayerRoom }
      // After the wake stinger, begin house-wide patrol unless the player is already detected.
      if (detected && playerRoom) {
        return {
          ...ctx,
          state: 'chase',
          alertTimer,
          lastKnownPlayerRoom: playerRoom,
          targetRoom: playerRoom,
        }
      }
      return {
        ...ctx,
        state: 'search',
        alertTimer,
        lastKnownPlayerRoom,
        targetRoom: HOUSE_PATROL[ctx.patrolIndex % HOUSE_PATROL.length],
      }
    }
    case 'chase':
      // Hidden players are fully concealed — never catch or reacquire while under the bed.
      if (playerHidden) {
        return {
          ...ctx,
          state: 'search',
          targetRoom: ctx.lastKnownPlayerRoom ?? HOUSE_PATROL[ctx.patrolIndex % HOUSE_PATROL.length],
          sawPlayerHide: true,
        }
      }
      if (distanceToPlayer <= ENTITY.catchRadius && (playerVisible || ctx.sawPlayerHide)) {
        return { ...ctx, state: 'attack' }
      }
      if (detected && playerRoom) {
        return {
          ...ctx,
          lastKnownPlayerRoom: playerRoom,
          targetRoom: playerRoom,
          sawPlayerHide: ctx.sawPlayerHide,
        }
      }
      return {
        ...ctx,
        state: 'search',
        targetRoom: ctx.lastKnownPlayerRoom ?? HOUSE_PATROL[ctx.patrolIndex % HOUSE_PATROL.length],
      }
    case 'search':
      if (detected && playerRoom) {
        return {
          ...ctx,
          state: 'chase',
          lastKnownPlayerRoom: playerRoom,
          targetRoom: playerRoom,
          sawPlayerHide: false,
        }
      }
      return ctx
  }
}

export function advancePatrol(ctx: AIContext): AIContext {
  const patrolIndex = (ctx.patrolIndex + 1) % HOUSE_PATROL.length
  return {
    ...ctx,
    patrolIndex,
    targetRoom: HOUSE_PATROL[patrolIndex],
  }
}


import { describe, expect, it } from 'vitest'
import { aiReducer, initialAIContext, type AIContext, type AIEvent } from './aiMachine'

const tick = (over: Partial<Extract<AIEvent, { type: 'TICK' }>> = {}): AIEvent => ({
  type: 'TICK',
  dt: 0.1,
  playerVisible: false,
  playerHeard: false,
  playerRoom: null,
  playerHidden: false,
  distanceToPlayer: 99,
  ...over,
})

describe('aiReducer', () => {
  it('wakes dormant AI into alert', () => {
    const state = aiReducer(initialAIContext(), { type: 'WAKE' })
    expect(state.state).toBe('alert')
    expect(state.alertTimer).toBeGreaterThan(0)
  })

  it('counts alert down into chase and remembers the room', () => {
    let state: AIContext = { ...initialAIContext(), state: 'alert', alertTimer: 0.15 }
    state = aiReducer(state, tick({ playerRoom: 'living', playerVisible: true }))
    state = aiReducer(state, tick({ playerRoom: 'living', playerVisible: true }))
    expect(state.state).toBe('chase')
    expect(state.lastKnownPlayerRoom).toBe('living')
  })

  it('attacks a nearby visible player', () => {
    const state: AIContext = { ...initialAIContext(), state: 'chase' }
    expect(aiReducer(state, tick({ distanceToPlayer: 1, playerVisible: true })).state).toBe('attack')
  })

  it('tracks but does not catch a nearby player heard through a wall', () => {
    const state: AIContext = { ...initialAIContext(), state: 'chase' }
    const next = aiReducer(state, tick({
      distanceToPlayer: 1,
      playerHeard: true,
      playerRoom: 'kitchen',
    }))
    expect(next.state).toBe('chase')
    expect(next.targetRoom).toBe('kitchen')
  })

  it('catches a player it watched hide', () => {
    const state: AIContext = {
      ...initialAIContext(),
      state: 'chase',
      lastKnownPlayerRoom: 'bedroom',
      sawPlayerHide: true,
    }
    expect(aiReducer(state, tick({ distanceToPlayer: 1, playerHidden: true })).state).toBe('attack')
  })

  it('loses an unseen player and searches the last known room', () => {
    const state: AIContext = {
      ...initialAIContext(),
      state: 'chase',
      lastKnownPlayerRoom: 'kitchen',
      targetRoom: 'kitchen',
    }
    const next = aiReducer(state, tick())
    expect(next.state).toBe('search')
    expect(next.targetRoom).toBe('kitchen')
  })

  it('search returns to chase on sight but ignores an unseen hidden player', () => {
    const state: AIContext = { ...initialAIContext(), state: 'search', targetRoom: 'bedroom' }
    expect(aiReducer(state, tick({ playerVisible: true, playerRoom: 'hallway' })).state).toBe('chase')
    expect(aiReducer(state, tick({ playerHidden: true, playerRoom: 'bedroom' })).state).toBe('search')
  })

  it('records a witnessed hide and keeps that knowledge', () => {
    const state: AIContext = { ...initialAIContext(), state: 'chase', lastKnownPlayerRoom: 'bedroom' }
    const seen = aiReducer(state, tick({ playerVisible: true, playerHidden: true, playerRoom: 'bedroom' }))
    expect(seen.sawPlayerHide).toBe(true)
    expect(aiReducer(seen, tick({ playerVisible: true, playerHidden: false, playerRoom: 'bedroom' })).sawPlayerHide).toBe(true)
  })

  it('keeps attack terminal', () => {
    const state: AIContext = { ...initialAIContext(), state: 'attack' }
    expect(aiReducer(state, tick())).toBe(state)
  })
})

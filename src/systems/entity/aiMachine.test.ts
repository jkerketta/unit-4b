import { describe, expect, it } from 'vitest'
import { advancePatrol, aiReducer, HOUSE_PATROL, initialAIContext, type AIContext, type AIEvent } from './aiMachine'

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
  it('wakes dormant AI into alert ready to patrol from the kitchen', () => {
    const state = aiReducer(initialAIContext(), { type: 'WAKE' })
    expect(state.state).toBe('alert')
    expect(state.alertTimer).toBeGreaterThan(0)
    expect(state.targetRoom).toBe('kitchen')
    expect(state.patrolIndex).toBe(HOUSE_PATROL.indexOf('kitchen'))
  })

  it('counts alert down into house patrol search', () => {
    let state: AIContext = { ...initialAIContext(), state: 'alert', alertTimer: 0.15, patrolIndex: 0 }
    state = aiReducer(state, tick({ playerRoom: 'living' }))
    state = aiReducer(state, tick({ playerRoom: 'living' }))
    expect(state.state).toBe('search')
    expect(state.targetRoom).toBe(HOUSE_PATROL[0])
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

  it('cannot catch a player while they are hidden under the bed', () => {
    const state: AIContext = {
      ...initialAIContext(),
      state: 'chase',
      lastKnownPlayerRoom: 'bedroom',
      sawPlayerHide: true,
    }
    const next = aiReducer(state, tick({ distanceToPlayer: 1, playerHidden: true, playerRoom: 'bedroom' }))
    expect(next.state).toBe('search')
    expect(next.sawPlayerHide).toBe(true)
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

  it('search returns to chase on sight but ignores a hidden player', () => {
    const state: AIContext = { ...initialAIContext(), state: 'search', targetRoom: 'bedroom' }
    expect(aiReducer(state, tick({ playerVisible: true, playerRoom: 'hallway' })).state).toBe('chase')
    expect(aiReducer(state, tick({ playerHidden: true, playerVisible: true, playerRoom: 'bedroom' })).state).toBe('search')
  })

  it('records a witnessed hide when the player slips under the bed during chase', () => {
    const state: AIContext = { ...initialAIContext(), state: 'chase', lastKnownPlayerRoom: 'bedroom' }
    const hidden = aiReducer(state, tick({ playerHidden: true, playerRoom: 'bedroom' }))
    expect(hidden.sawPlayerHide).toBe(true)
    expect(hidden.state).toBe('search')
  })

  it('advances house patrol through every room', () => {
    let state = initialAIContext()
    const visited = new Set<string>()
    for (let i = 0; i < HOUSE_PATROL.length; i += 1) {
      state = advancePatrol(state)
      visited.add(state.targetRoom!)
    }
    expect(visited.has('living')).toBe(true)
    expect(visited.has('kitchen')).toBe(true)
    expect(visited.has('bedroom')).toBe(true)
    expect(visited.has('bathroom')).toBe(true)
    expect(visited.has('entry')).toBe(true)
    expect(visited.has('hallway')).toBe(true)
  })

  it('keeps attack terminal', () => {
    const state: AIContext = { ...initialAIContext(), state: 'attack' }
    expect(aiReducer(state, tick())).toBe(state)
  })
})

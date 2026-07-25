import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../game/store'
import { advanceObjective, OBJECTIVE_FLOW, startObjectives } from './objectiveChain'

const initial = useGameStore.getState()
beforeEach(() => useGameStore.setState(initial, true))

describe('objective chain', () => {
  it('defines the complete Act 1 flow', () => {
    expect(OBJECTIVE_FLOW).toEqual({
      enter: 'unpack',
      unpack: 'lease',
      lease: 'rug',
      rug: 'hatch',
      hatch: 'escape',
      escape: null,
    })
  })

  it('starts, advances, and completes the chain', () => {
    startObjectives()
    expect(useGameStore.getState().activeObjectiveId).toBe('enter')
    for (const id of ['enter', 'unpack', 'lease', 'rug', 'hatch', 'escape']) advanceObjective(id)
    const state = useGameStore.getState()
    expect(state.activeObjectiveId).toBeNull()
    expect(state.objectives.every((objective) => objective.complete)).toBe(true)
  })
})

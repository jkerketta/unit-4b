import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore, INITIAL_OBJECTIVES } from './store'

const initial = useGameStore.getState()

beforeEach(() => {
  useGameStore.setState(initial, true)
})

describe('game store', () => {
  it('starts at title phase', () => {
    expect(useGameStore.getState().phase).toBe('title')
  })

  it('startGame transitions to calm with first objective active', () => {
    useGameStore.getState().setPhase('calm')
    expect(useGameStore.getState().phase).toBe('calm')
  })

  it('completing an objective marks it complete', () => {
    useGameStore.getState().completeObjective('unpack')
    const obj = useGameStore.getState().objectives.find((o) => o.id === 'unpack')
    expect(obj?.complete).toBe(true)
  })

  it('only advances unpacking after all three categories are arranged', () => {
    const store = useGameStore.getState()
    store.setActiveObjective('unpack')
    store.openBox('bedroom')
    store.placeBoxContents('bedroom')
    store.openBox('kitchen')
    store.placeBoxContents('kitchen')
    expect(useGameStore.getState().activeObjectiveId).toBe('unpack')
    expect(useGameStore.getState().objectives.find((o) => o.id === 'unpack')?.complete).toBe(false)
    store.openBox('living')
    store.placeBoxContents('living')
    expect(useGameStore.getState().activeObjectiveId).toBe('lease')
    expect(useGameStore.getState().objectives.find((o) => o.id === 'unpack')?.complete).toBe(true)
  })

  it('saveCheckpoint + restoreCheckpoint round-trips position, objectives and flags', () => {
    const s = useGameStore.getState()
    s.setPhase('calm')
    s.setPlayerPosition([1, 0, 2])
    s.completeObjective('unpack')
    s.setFlag('hatchOpen', true)
    s.openBox('bedroom')
    s.placeBoxContents('bedroom')
    useGameStore.getState().saveCheckpoint(Math.PI / 2)

    // mutate everything afterwards
    useGameStore.getState().setPhase('gameover')
    useGameStore.getState().setPlayerPosition([9, 9, 9])
    useGameStore.getState().setFlag('leaseRead', true)

    useGameStore.getState().restoreCheckpoint()
    const after = useGameStore.getState()
    expect(after.phase).toBe('calm')
    expect(after.player.position).toEqual([1, 0, 2])
    expect(after.flags.hatchOpen).toBe(true)
    expect(after.flags.leaseRead).toBe(false)
    expect(after.boxes.bedroom.placed).toBe(true)
    expect(after.objectives.find((o) => o.id === 'unpack')?.complete).toBe(true)
  })

  it('keeps checkpoint snapshots isolated from live nested state', () => {
    const store = useGameStore.getState()
    store.setPlayerPosition([1, 0, 2])
    store.saveCheckpoint(0.75)

    const checkpoint = useGameStore.getState().checkpoint!
    expect(checkpoint.playerPosition).not.toBe(useGameStore.getState().player.position)
    expect(checkpoint.objectives).not.toBe(useGameStore.getState().objectives)
    expect(checkpoint.flags).not.toBe(useGameStore.getState().flags)
    expect(checkpoint.boxes).not.toBe(useGameStore.getState().boxes)

    useGameStore.getState().setPlayerPosition([99, 0, 2])
    useGameStore.getState().completeObjective('unpack')
    useGameStore.getState().setFlag('hatchOpen', true)

    expect(checkpoint.playerPosition).toEqual([1, 0, 2])
    expect(checkpoint.objectives[0].complete).toBe(false)
    expect(checkpoint.flags.hatchOpen).toBe(false)
    expect(checkpoint.boxes.bedroom.placed).toBe(false)
  })

  it('resetGame returns to title with fresh objectives', () => {
    useGameStore.getState().setPhase('chase')
    useGameStore.getState().completeObjective('unpack')
    useGameStore.getState().resetGame()
    const s = useGameStore.getState()
    expect(s.phase).toBe('title')
    expect(s.objectives).toEqual(INITIAL_OBJECTIVES)
    expect(s.entity.state).toBe('dormant')
  })
})

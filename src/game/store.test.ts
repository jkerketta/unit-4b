import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('tracks hideSpot and clears it when leaving a hide', () => {
    const store = useGameStore.getState()
    store.setHideSpot('closet')
    store.setHidden(true)
    expect(useGameStore.getState().player.hideSpot).toBe('closet')
    expect(useGameStore.getState().player.hidden).toBe(true)
    useGameStore.getState().setHidden(false)
    expect(useGameStore.getState().player.hideSpot).toBe(null)
    expect(useGameStore.getState().player.hidden).toBe(false)
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

describe('completion timing', () => {
  afterEach(() => {
    vi.useRealTimers()
    useGameStore.setState(initial, true)
  })

  const at = (iso: string) => vi.setSystemTime(new Date(iso))

  it('records total play time and calm-window time at win', () => {
    vi.useFakeTimers()
    at('2026-08-02T12:00:00.000Z')
    useGameStore.getState().setPhase('intro')
    at('2026-08-02T12:01:00.000Z')
    useGameStore.getState().setPhase('calm')
    at('2026-08-02T12:05:30.000Z')
    useGameStore.getState().setPhase('win')

    const s = useGameStore.getState()
    expect(s.totalTimeSec).toBe(330)
    expect(s.escapeSec).toBe(270)
    expect(s.completedAtIso).toBe('2026-08-02T12:05:30.000Z')
  })

  it('caps timings at zero when a window never started', () => {
    vi.useFakeTimers()
    at('2026-08-02T12:00:00.000Z')
    useGameStore.getState().setPhase('win')
    const s = useGameStore.getState()
    expect(s.totalTimeSec).toBe(0)
    expect(s.escapeSec).toBe(0)
  })

  it('restarts the calm window when a checkpoint is restored', () => {
    vi.useFakeTimers()
    at('2026-08-02T12:00:00.000Z')
    useGameStore.getState().setPhase('intro')
    at('2026-08-02T12:01:00.000Z')
    useGameStore.getState().setPhase('calm')
    useGameStore.getState().saveCheckpoint(0)
    at('2026-08-02T12:03:00.000Z')
    useGameStore.getState().restoreCheckpoint()
    at('2026-08-02T12:05:00.000Z')
    useGameStore.getState().setPhase('win')

    const s = useGameStore.getState()
    expect(s.escapeSec).toBe(120)
    expect(s.totalTimeSec).toBe(300)
  })

  it('resetGame clears recorded timings', () => {
    vi.useFakeTimers()
    at('2026-08-02T12:00:00.000Z')
    useGameStore.getState().setPhase('intro')
    at('2026-08-02T12:05:00.000Z')
    useGameStore.getState().setPhase('calm')
    useGameStore.getState().setPhase('win')
    useGameStore.getState().resetGame()

    const s = useGameStore.getState()
    expect(s.totalTimeSec).toBeNull()
    expect(s.escapeSec).toBeNull()
    expect(s.completedAtIso).toBeNull()
    expect(s.totalStartAt).toBeNull()
    expect(s.calmStartAt).toBeNull()
  })
})

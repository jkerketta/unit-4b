import { describe, expect, it, vi } from 'vitest'
import { advanceTimeline, runTimeline, type TimelineState } from './timelines'

describe('timeline helpers', () => {
  it('fires elapsed steps in order exactly once', () => {
    const calls: string[] = []
    const steps = [
      { at: 0, do: () => calls.push('a') },
      { at: 0.5, do: () => calls.push('b') },
      { at: 1, do: () => calls.push('c') },
    ]
    let state: TimelineState = { elapsed: 0, fired: new Set() }
    state = advanceTimeline(state, steps, 0.4)
    state = advanceTimeline(state, steps, 0.6)
    state = advanceTimeline(state, steps, 2)
    advanceTimeline(state, steps, 3)
    expect(calls).toEqual(['a', 'b', 'c'])
  })

  it('runTimeline creates initial state and fires due steps', () => {
    const action = vi.fn()
    const state = runTimeline([{ at: 0, do: action }])
    expect(action).toHaveBeenCalledOnce()
    expect(state.fired.size).toBe(1)
  })
})

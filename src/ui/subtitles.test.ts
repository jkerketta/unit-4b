import { afterEach, describe, expect, it, vi } from 'vitest'
import { fadeTransition, useUIStore } from './subtitles'

afterEach(() => {
  vi.useRealTimers()
  useUIStore.getState().resetTransient()
})

describe('fade transitions', () => {
  it('runs an uninterrupted transition and clears its fade', () => {
    vi.useFakeTimers()
    const action = vi.fn()

    fadeTransition(action, 100)
    expect(useUIStore.getState().fadeOpacity).toBe(1)
    vi.advanceTimersByTime(100)
    expect(action).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(100)
    expect(useUIStore.getState().fadeOpacity).toBe(0)
  })

  it('does not mutate a reset session from a stale callback', () => {
    vi.useFakeTimers()
    const action = vi.fn()

    fadeTransition(action, 100)
    useUIStore.getState().resetTransient()
    vi.runAllTimers()

    expect(action).not.toHaveBeenCalled()
    expect(useUIStore.getState().fadeOpacity).toBe(0)
  })
})

describe('modal UI state', () => {
  it('opens and resets documents and intro dialogue', () => {
    useUIStore.getState().openDocument('lease')
    useUIStore.getState().setIntroStep(3)
    expect(useUIStore.getState().document).toBe('lease')
    expect(useUIStore.getState().introStep).toBe(3)
    useUIStore.getState().resetTransient()
    expect(useUIStore.getState().document).toBeNull()
    expect(useUIStore.getState().introStep).toBeNull()
  })
})

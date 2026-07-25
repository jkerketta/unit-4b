import { afterEach, describe, expect, it, vi } from 'vitest'
import { fadeTransition, useUIStore } from './subtitles'

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(document, 'exitPointerLock')
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
  it('marks a document open before releasing pointer lock', () => {
    const exitPointerLock = vi.fn(() => {
      expect(useUIStore.getState().document).toBe('floorplan')
    })
    Object.defineProperty(document, 'exitPointerLock', {
      configurable: true,
      value: exitPointerLock,
    })

    useUIStore.getState().openDocument('floorplan')

    expect(exitPointerLock).toHaveBeenCalledOnce()
  })

  it('opens and resets documents and intro dialogue', () => {
    useUIStore.getState().openDocument('lease')
    useUIStore.getState().startIntroDialogue('followup')
    expect(useUIStore.getState().document).toBe('lease')
    expect(useUIStore.getState().introStep).toBe(0)
    expect(useUIStore.getState().introScript).toBe('followup')
    useUIStore.getState().resetTransient()
    expect(useUIStore.getState().document).toBeNull()
    expect(useUIStore.getState().introStep).toBeNull()
    expect(useUIStore.getState().introScript).toBeNull()
  })
})

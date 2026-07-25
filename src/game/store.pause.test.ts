import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './store'

beforeEach(() => useGameStore.getState().resetGame())

describe('pause state', () => {
  it('pauses only active play without changing phase', () => {
    useGameStore.getState().pause()
    expect(useGameStore.getState().paused).toBe(false)
    useGameStore.getState().setPhase('chase')
    useGameStore.getState().pause()
    expect(useGameStore.getState().paused).toBe(true)
    expect(useGameStore.getState().phase).toBe('chase')
    useGameStore.getState().resume()
    expect(useGameStore.getState().paused).toBe(false)
  })

  it('reset and checkpoint restore always resume cleanly', () => {
    const store = useGameStore.getState()
    store.setPhase('calm')
    store.saveCheckpoint(0)
    store.pause()
    store.restoreCheckpoint()
    expect(useGameStore.getState().paused).toBe(false)
    useGameStore.getState().pause()
    useGameStore.getState().resetGame()
    expect(useGameStore.getState().phase).toBe('title')
    expect(useGameStore.getState().paused).toBe(false)
  })
})

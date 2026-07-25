import { describe, expect, it } from 'vitest'
import { shouldFireWakeGlimpse, shouldRunCatchScare } from './scareGuards'

describe('scare guards', () => {
  it('fires the wake glimpse only after returning from below', () => {
    expect(shouldFireWakeGlimpse('calm', true, true, true)).toBe(true)
    expect(shouldFireWakeGlimpse('calm', false, true, true)).toBe(false)
    expect(shouldFireWakeGlimpse('chase', true, true, true)).toBe(false)
    expect(shouldFireWakeGlimpse('calm', true, false, true)).toBe(false)
  })

  it('runs the catch scare only on game over', () => {
    expect(shouldRunCatchScare('gameover')).toBe(true)
    expect(shouldRunCatchScare('chase')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { heartbeatParams, phaseLoopFor } from './audioLogic'

describe('heartbeatParams', () => {
  it('gets faster and louder as the entity approaches', () => {
    const near = heartbeatParams(1)
    const far = heartbeatParams(12)
    expect(near.bpm).toBeGreaterThan(far.bpm)
    expect(near.volume).toBeGreaterThan(far.volume)
    expect(heartbeatParams(20).volume).toBe(0)
  })

  it('clamps distance and rate at both ends', () => {
    expect(heartbeatParams(-10)).toEqual({ bpm: 140, volume: 0.9 })
    expect(heartbeatParams(100)).toEqual({ bpm: 60, volume: 0 })
  })
})

describe('phaseLoopFor', () => {
  it('maps playable phases to exactly one ambience loop', () => {
    expect(phaseLoopFor('calm')).toBe('calmAmbience')
    expect(phaseLoopFor('chase')).toBe('chaseDrone')
  })

  it.each(['title', 'win', 'gameover'] as const)('maps %s to silence', (phase) => {
    expect(phaseLoopFor(phase)).toBeNull()
  })
})

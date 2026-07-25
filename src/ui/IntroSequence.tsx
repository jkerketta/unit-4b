import { useEffect } from 'react'
import { useGameStore } from '../game/store'
import { useUIStore } from './subtitles'

const LINES = [
  ['LANDLORD', 'Paperwork is done. I had your boxes moved in already.'],
  ['LANDLORD', 'Here. Unit 4B. Your key.'],
  ['YOU', 'The price is unusually good for this much space.'],
  ['LANDLORD', 'Old building. Settles strangely. That keeps people away.'],
  ['YOU', 'Is there anything else I should know?'],
  ['LANDLORD', 'The supplied floor plan is all you need. Nothing beyond it concerns you.'],
] as const

export default function IntroSequence() {
  const step = useUIStore((state) => state.introStep)
  const phase = useGameStore((state) => state.phase)
  const finish = () => useUIStore.getState().setIntroStep(null)
  const next = () => {
    const current = useUIStore.getState().introStep
    if (current === null) return
    if (current >= LINES.length - 1) finish()
    else useUIStore.getState().setIntroStep(current + 1)
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.code === 'KeyE' || event.code === 'Space') && useUIStore.getState().introStep !== null) next()
      if (event.code === 'Escape' && useUIStore.getState().introStep !== null) finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (phase !== 'intro' || step === null) return null
  return (
    <div className="intro-dialogue">
      <div>
        <strong>{LINES[step][0]}</strong>
        <p>{LINES[step][1]}</p>
        <button autoFocus onClick={next}>{step === LINES.length - 1 ? 'Take the key' : 'Continue'}</button>
        <button onClick={finish}>Skip conversation</button>
      </div>
    </div>
  )
}

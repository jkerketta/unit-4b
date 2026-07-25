import { useEffect } from 'react'
import { useGameStore } from '../game/store'
import { audio } from '../systems/audio/AudioManager'
import { suppressUnlockPause } from '../systems/player/pauseGate'
import { useUIStore } from './subtitles'

const SCRIPTS = {
  initial: [
    ['LANDLORD', 'Paperwork is done. I had your boxes moved in already.'],
    ['LANDLORD', 'Here. Unit 4B. Your key.'],
    ['YOU', 'The price is unusually good for this much space.'],
    ['LANDLORD', 'Old building. Settles strangely. That keeps people away.'],
    ['YOU', 'Is there anything else I should know?'],
    ['LANDLORD', 'The supplied floor plan is all you need. Nothing beyond it concerns you.'],
  ],
  followup: [
    ['YOU', 'Before I go in — how long has 4B been empty?'],
    ['LANDLORD', 'Long enough. Last tenant left in a hurry. Didn\'t even finish unpacking.'],
    ['YOU', 'Why the rush?'],
    ['LANDLORD', 'People hear the pipes and invent stories. I don\'t rent to inventers.'],
    ['YOU', 'And if something isn\'t on that floor plan?'],
    ['LANDLORD', 'Then it isn\'t your apartment. Stick to what I gave you, unlock the door, and settle in.'],
    ['LANDLORD', 'I\'ll wait out here. Key sticks sometimes. Don\'t go looking for extra rooms.'],
  ],
} as const

function playUiClick(): void {
  audio.play('uiClick', { volume: 0.55, rate: 0.96 + Math.random() * 0.08 })
}

function endDialogue(): void {
  suppressUnlockPause(600)
  useUIStore.getState().setIntroStep(null)
  useUIStore.getState().setIntroScript(null)
}

export default function IntroSequence() {
  const step = useUIStore((state) => state.introStep)
  const script = useUIStore((state) => state.introScript)
  const phase = useGameStore((state) => state.phase)
  const lines = script ? SCRIPTS[script] : null

  const finish = () => {
    playUiClick()
    endDialogue()
  }
  const next = () => {
    const current = useUIStore.getState().introStep
    const active = useUIStore.getState().introScript
    if (current === null || !active) return
    playUiClick()
    if (current >= SCRIPTS[active].length - 1) {
      endDialogue()
      return
    }
    useUIStore.getState().setIntroStep(current + 1)
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (useUIStore.getState().introStep === null || event.repeat) return
      if (event.code === 'Escape') {
        // Swallow Esc so PauseMenu cannot toggle on the same keypress.
        event.preventDefault()
        event.stopImmediatePropagation()
        finish()
        return
      }
      if (event.code === 'KeyE' || event.code === 'Space') {
        event.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  if (phase !== 'intro' || step === null || !lines) return null
  const last = step === lines.length - 1
  const continueLabel = script === 'initial' && last
    ? 'Take the key'
    : last
      ? 'Thanks'
      : 'Continue'

  return (
    <div className="intro-dialogue">
      <div>
        <strong>{lines[step][0]}</strong>
        <p>{lines[step][1]}</p>
        <button autoFocus onClick={next}>{continueLabel}</button>
        <button onClick={finish}>Skip conversation</button>
      </div>
    </div>
  )
}

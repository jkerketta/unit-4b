import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../game/store'
import { audio } from '../systems/audio/AudioManager'
import { sfxBlip } from '../systems/audio/uiSfx'
import { suppressUnlockPause } from '../systems/player/pauseGate'
import { useUIStore } from './subtitles'

const SCRIPTS = {
  initial: [
    ['LANDLORD', 'Paperwork is signed. I had your boxes carried up already.'],
    ['LANDLORD', 'Here. Unit 4B. Your key... it runs a little cold. Old brass.'],
    ['YOU', 'The rent is unusually good for this much space.'],
    ['LANDLORD', 'Old building. Settles strangely at night. That keeps people away.'],
    ['YOU', 'Is there anything else I should know?'],
    ['LANDLORD', 'The supplied floor plan is all you need. Nothing beyond it concerns you.'],
    ['LANDLORD', 'And keep the rug where it is. It came with the unit.'],
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

const CHAR_MS = 26

export default function IntroSequence() {
  const step = useUIStore((state) => state.introStep)
  const script = useUIStore((state) => state.introScript)
  const phase = useGameStore((state) => state.phase)
  const lines = script ? SCRIPTS[script] : null
  const [shown, setShown] = useState(0)
  const typingRef = useRef(false)
  const fullLine = lines && step !== null ? lines[step][1] : ''
  const speaker = lines && step !== null ? lines[step][0] : ''

  // Typewriter reveal with per-speaker voice blips.
  useEffect(() => {
    setShown(0)
    if (!fullLine) return
    typingRef.current = true
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setShown(i)
      const ch = fullLine[i - 1]
      if (ch && /[a-z0-9]/i.test(ch) && i % 2 === 0) sfxBlip(speaker)
      if (i >= fullLine.length) {
        typingRef.current = false
        window.clearInterval(id)
      }
    }, CHAR_MS)
    return () => {
      window.clearInterval(id)
      typingRef.current = false
    }
  }, [fullLine, speaker, step])

  const finish = () => {
    playUiClick()
    endDialogue()
  }
  const next = () => {
    const current = useUIStore.getState().introStep
    const active = useUIStore.getState().introScript
    if (current === null || !active) return
    if (typingRef.current) {
      // First press completes the line instead of skipping it.
      typingRef.current = false
      setShown(Number.MAX_SAFE_INTEGER)
      return
    }
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

  const done = shown >= fullLine.length
  return (
    <div className="intro-dialogue">
      <div className={`dialogue-box speaker-${speaker.toLowerCase()}`}>
        <div className="dialogue-head">
          <strong>{speaker}</strong>
          <span className="dialogue-progress">
            {lines.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}
          </span>
        </div>
        <p>
          {fullLine.slice(0, shown)}
          <span className={`dialogue-caret${done ? ' idle' : ''}`}>▍</span>
        </p>
        <button autoFocus onClick={next}>{done ? continueLabel : '…'}</button>
        <button onClick={finish}>Skip conversation</button>
        <span className="dialogue-hint">[E] / [SPACE] continue · [ESC] skip</span>
      </div>
    </div>
  )
}

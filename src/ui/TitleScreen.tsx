import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { startObjectives } from '../systems/objectives/objectiveChain'
import { sfxBack, sfxHover, sfxSelect, sfxStartBoom } from '../systems/audio/uiSfx'
import { useUIStore } from './subtitles'

type Panel = 'menu' | 'controls' | 'credits'

const TAGLINES = [
  'NO ROOM BEYOND THE PLAN IS RECOGNIZED BY THE OWNER.',
  'THE LAST TENANT NEVER FINISHED UNPACKING.',
  'MANAGEMENT ASSUMES NO RESPONSIBILITY AFTER 02:13.',
  'REPORT HOLLOW SOUNDS TO MANAGEMENT.',
]

function useClock(): string {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])
  // The clock is stuck just before 02:13 and occasionally skips.
  const seconds = 40 + (tick % 20)
  return `02:12:${String(seconds).padStart(2, '0')}`
}

export default function TitleScreen() {
  const phase = useGameStore((state) => state.phase)
  const [panel, setPanel] = useState<Panel>('menu')
  const [tagline, setTagline] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const clock = useClock()

  useEffect(() => {
    if (phase !== 'title') return
    setLeaving(false)
    const id = window.setInterval(() => setTagline((t) => (t + 1) % TAGLINES.length), 4200)
    return () => window.clearInterval(id)
  }, [phase])

  if (phase !== 'title') return null

  const start = () => {
    if (leaving) return
    sfxSelect()
    sfxStartBoom()
    setLeaving(true)
    window.setTimeout(() => {
      useUIStore.getState().resetTransient()
      const store = useGameStore.getState()
      store.setPhase('intro')
      startObjectives()
      useUIStore.getState().startIntroDialogue('initial')
    }, 650)
  }

  const open = (next: Panel) => {
    if (next === 'menu') sfxBack()
    else sfxSelect()
    setPanel(next)
  }

  const hover = { onMouseEnter: sfxHover, onFocus: sfxHover }

  return (
    <div className={`title-screen menu-screen${leaving ? ' leaving' : ''}`}>
      <div className="title-vignette" />
      <div className="title-scanlines" />
      <div className="title-grain" />
      <div className="title-rec"><span className="rec-dot" /> REC {clock}</div>
      <div className="title-unit-tag">BRAMBLE PROPERTY MGMT · LISTING #0413</div>
      <section>
        <p className="eyebrow">A TENANT IS EXPECTED</p>
        <h1 data-text="UNIT 4B">UNIT 4B</h1>
        <p key={tagline} className="title-tagline">{TAGLINES[tagline]}</p>
        {panel === 'menu' && (
          <nav>
            <button autoFocus onClick={start} {...hover}>Move In</button>
            <button onClick={() => open('controls')} {...hover}>Controls</button>
            <button onClick={() => open('credits')} {...hover}>Credits</button>
          </nav>
        )}
        {panel === 'controls' && (
          <div className="menu-copy controls-grid">
            <span className="keycap">W A S D</span><span>Move</span>
            <span className="keycap">MOUSE</span><span>Look</span>
            <span className="keycap">SHIFT</span><span>Run</span>
            <span className="keycap">E</span><span>Interact / Hold</span>
            <span className="keycap">ESC</span><span>Pause</span>
            <p className="controls-tip">Headphones recommended. It listens as much as it looks.</p>
            <button onClick={() => open('menu')} {...hover}>Back</button>
          </div>
        )}
        {panel === 'credits' && (
          <div className="menu-copy credits-copy">
            <p>A game by Jose Kerketta</p>
            <p className="credits-small">Furniture models: Kenney · Phone model: Poly Pizza<br />Audio: see ATTRIBUTION.md</p>
            <button onClick={() => open('menu')} {...hover}>Back</button>
          </div>
        )}
      </section>
      <p className="title-hint">CLICK THE APARTMENT AFTER STARTING TO LOOK AROUND · BEST WITH HEADPHONES</p>
    </div>
  )
}

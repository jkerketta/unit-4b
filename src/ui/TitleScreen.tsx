import { useState } from 'react'
import { useGameStore } from '../game/store'
import { startObjectives } from '../systems/objectives/objectiveChain'
import { useUIStore } from './subtitles'

type Panel = 'menu' | 'controls' | 'credits'

export default function TitleScreen() {
  const phase = useGameStore((state) => state.phase)
  const [panel, setPanel] = useState<Panel>('menu')
  if (phase !== 'title') return null

  const start = () => {
    useUIStore.getState().resetTransient()
    const store = useGameStore.getState()
    store.setPhase('intro')
    startObjectives()
    useUIStore.getState().setIntroStep(0)
  }

  return (
    <div className="title-screen menu-screen">
      <div className="title-vignette" />
      <section>
        <p className="eyebrow">A TENANT IS EXPECTED</p>
        <h1>UNIT 4B</h1>
        {panel === 'menu' && (
          <nav>
            <button autoFocus onClick={start}>Start</button>
            <button onClick={() => setPanel('controls')}>Controls</button>
            <button onClick={() => setPanel('credits')}>Credits</button>
          </nav>
        )}
        {panel === 'controls' && (
          <div className="menu-copy">
            <p>WASD — MOVE</p><p>MOUSE — LOOK</p><p>SHIFT — RUN</p>
            <p>E — INTERACT</p><p>ESC — PAUSE</p>
            <button onClick={() => setPanel('menu')}>Back</button>
          </div>
        )}
        {panel === 'credits' && (
          <div className="menu-copy credits-copy">
            <p>Created by: Jose Kerketta</p>
            <button onClick={() => setPanel('menu')}>Back</button>
          </div>
        )}
      </section>
      <p className="title-hint">CLICK THE APARTMENT AFTER STARTING TO LOOK AROUND</p>
    </div>
  )
}

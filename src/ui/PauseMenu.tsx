import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { suppressUnlockPause } from '../systems/player/pauseGate'
import { useScareStore } from '../systems/scares/ScareManager'
import { useUIStore } from './subtitles'

const PLAYABLE = new Set(['intro', 'calm', 'chase'])

export default function PauseMenu() {
  const paused = useGameStore((state) => state.paused)
  const [controls, setControls] = useState(false)
  const resume = () => {
    setControls(false)
    suppressUnlockPause()
    useGameStore.getState().resume()
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || event.repeat) return
      // Documents own Esc while open (they swallow it); never pause over a reader.
      if (useUIStore.getState().document || useUIStore.getState().introStep !== null) return
      if (useScareStore.getState().wakeCutscene) return
      const state = useGameStore.getState()
      if (!PLAYABLE.has(state.phase)) return

      event.preventDefault()
      if (state.paused) {
        setControls(false)
        suppressUnlockPause()
        state.resume()
      } else {
        suppressUnlockPause()
        state.pause()
        if (document.pointerLockElement) document.exitPointerLock()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!paused) return null
  const restart = () => {
    setControls(false)
    useUIStore.getState().resetTransient()
    const store = useGameStore.getState()
    if (store.checkpoint) store.restoreCheckpoint()
    else {
      store.resetGame()
    }
  }

  return (
    <div className="pause-screen menu-screen">
      <section>
        <p className="eyebrow">GAME SUSPENDED</p>
        <h2>{controls ? 'CONTROLS' : 'PAUSED'}</h2>
        {controls ? (
          <div className="menu-copy">
            <p>WASD / MOUSE — MOVE / LOOK</p>
            <p>SHIFT — RUN · E — INTERACT</p>
            <p>ESC — PAUSE / RESUME</p>
            <button onClick={() => setControls(false)}>Back</button>
          </div>
        ) : (
          <nav>
            <button autoFocus onClick={resume}>Resume</button>
            <button onClick={() => setControls(true)}>Controls</button>
            {useGameStore.getState().checkpoint && <button onClick={restart}>Restart checkpoint</button>}
            <button onClick={() => {
              setControls(false)
              useUIStore.getState().resetTransient()
              useGameStore.getState().resetGame()
            }}>Quit to title</button>
          </nav>
        )}
      </section>
    </div>
  )
}

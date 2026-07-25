import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { useUIStore } from './subtitles'

export default function PauseMenu() {
  const paused = useGameStore((state) => state.paused)
  const [controls, setControls] = useState(false)
  const resume = () => {
    setControls(false)
    useGameStore.getState().resume()
    document.querySelector('canvas')?.requestPointerLock()
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || event.repeat) return
      if (useUIStore.getState().document || useUIStore.getState().introStep !== null) return
      const state = useGameStore.getState()
      if (state.paused) {
        state.resume()
        document.querySelector('canvas')?.requestPointerLock()
      } else if ((state.phase === 'intro' || state.phase === 'calm' || state.phase === 'chase') && !document.pointerLockElement) {
        state.pause()
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
            <p>ESC — PAUSE</p>
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

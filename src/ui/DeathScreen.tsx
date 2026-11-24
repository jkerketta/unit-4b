import { sfxHover, sfxSelect } from '../systems/audio/uiSfx'
import { useGameStore } from '../game/store'
import { useUIStore } from './subtitles'

export default function DeathScreen() {
  const phase = useGameStore((state) => state.phase)
  const visible = useUIStore((state) => state.deathScreenVisible)
  if (phase !== 'gameover' || !visible) return null

  return (
    <div className="end-screen death-screen">
      <p className="end-kicker">TENANCY TERMINATED · 02:13</p>
      <h1 data-text="IT FOUND YOU">IT FOUND YOU</h1>
      <p>It heard you long before it saw you.</p>
      <p className="end-tip">Tip: walking is quieter than running. Hide where it can't follow.</p>
      <div>
        <button onMouseEnter={sfxHover} onMouseDown={sfxSelect} onClick={() => {
          useUIStore.getState().resetTransient()
          useGameStore.getState().restoreCheckpoint()
        }}>Retry</button>
        <button onMouseEnter={sfxHover} onMouseDown={sfxSelect} onClick={() => {
          useUIStore.getState().resetTransient()
          useGameStore.getState().resetGame()
        }}>Title</button>
      </div>
    </div>
  )
}

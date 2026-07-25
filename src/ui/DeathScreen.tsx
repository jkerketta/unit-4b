import { useGameStore } from '../game/store'
import { useUIStore } from './subtitles'

export default function DeathScreen() {
  const phase = useGameStore((state) => state.phase)
  const visible = useUIStore((state) => state.deathScreenVisible)
  if (phase !== 'gameover' || !visible) return null

  return (
    <div className="end-screen death-screen">
      <h1>IT FOUND YOU</h1>
      <p>You should have stayed beneath the floor.</p>
      <div>
        <button onClick={() => {
          useUIStore.getState().resetTransient()
          useGameStore.getState().restoreCheckpoint()
        }}>Retry</button>
        <button onClick={() => {
          useUIStore.getState().resetTransient()
          useGameStore.getState().resetGame()
        }}>Title</button>
      </div>
    </div>
  )
}

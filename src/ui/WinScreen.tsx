import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../game/store'
import { useUIStore } from './subtitles'

export default function WinScreen() {
  const phase = useGameStore((state) => state.phase)
  const startedAt = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (phase === 'calm') startedAt.current = Date.now()
    if (phase === 'win') setElapsed(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)))
  }, [phase])

  if (phase !== 'win') return null
  return (
    <div className="end-screen win-screen">
      <h1>YOU MADE IT OUT.</h1>
      <p>Unit 4B — thanks for playing</p>
      <p>{elapsed}s</p>
      <button onClick={() => {
        const store = useGameStore.getState()
        store.resetGame()
        useUIStore.getState().resetTransient()
      }}>Play again</button>
    </div>
  )
}

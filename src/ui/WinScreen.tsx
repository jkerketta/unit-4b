import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../game/store'
import { useUIStore } from './subtitles'
import { formatTime } from '../lib/feedback'
import FeedbackForm from './FeedbackForm'

export default function WinScreen() {
  const phase = useGameStore((state) => state.phase)
  const startedAt = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (phase === 'calm') startedAt.current = Date.now()
    if (phase === 'win') setElapsed(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)))
  }, [phase])

  if (phase !== 'win') return null

  const store = useGameStore.getState()
  const totalTimeSec = store.totalTimeSec ?? 0
  const escapeSec = store.escapeSec ?? 0
  const completedAtIso = store.completedAtIso ?? new Date().toISOString()

  return (
    <div className="end-screen win-screen">
      <h1>YOU MADE IT OUT.</h1>
      <p>Unit 4B — thanks for playing</p>
      <p>{elapsed}s</p>
      <p className="feedback-times">
        <span>Total time {formatTime(totalTimeSec)}</span>
        <span>Escape {formatTime(escapeSec)}</span>
      </p>
      <FeedbackForm totalTimeSec={totalTimeSec} escapeSec={escapeSec} completedAtIso={completedAtIso} />
      <button onClick={() => {
        const s = useGameStore.getState()
        s.resetGame()
        useUIStore.getState().resetTransient()
      }}>Play again</button>
    </div>
  )
}

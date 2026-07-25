import { useUIStore } from './subtitles'

export default function InteractPrompt() {
  const prompt = useUIStore((state) => state.currentPrompt)
  const progress = useUIStore((state) => state.holdProgress)
  if (!prompt) return null

  return (
    <div className="interact-prompt">
      <span className="keycap">E</span> {prompt}
      {progress > 0 && (
        <span className="hold-track">
          <span style={{ width: `${progress * 100}%` }} />
        </span>
      )}
    </div>
  )
}

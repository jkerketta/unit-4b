import { useEffect, useState } from 'react'
import { useUIStore } from './subtitles'

export default function Subtitles() {
  const subtitle = useUIStore((state) => state.subtitle)
  const [, tick] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => tick((value) => value + 1), 200)
    return () => window.clearInterval(timer)
  }, [])

  if (!subtitle || Date.now() >= subtitle.until) return null
  return <div className="subtitles">{subtitle.line}</div>
}

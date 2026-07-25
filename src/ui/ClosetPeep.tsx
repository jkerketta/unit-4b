import { useGameStore } from '../game/store'

/** Horizontal blinds overlay while peeping from the entry closet. */
export default function ClosetPeep() {
  const hideSpot = useGameStore((state) => state.player.hideSpot)
  if (hideSpot !== 'closet') return null
  return (
    <div className="closet-peep" aria-hidden>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="closet-peep-slat" style={{ top: `${6 + i * 9}%` }} />
      ))}
      <div className="closet-peep-vignette" />
    </div>
  )
}

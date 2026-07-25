import { useGameStore } from '../game/store'

export default function StaminaBar() {
  const stamina = useGameStore((state) => state.player.stamina)
  return (
    <div className={`stamina ${stamina >= 100 ? 'stamina-hidden' : ''}`}>
      <span style={{ width: `${stamina}%` }} />
    </div>
  )
}

import { useGameStore } from '../game/store'

export default function ObjectiveCard() {
  const phase = useGameStore((state) => state.phase)
  const activeId = useGameStore((state) => state.activeObjectiveId)
  const objective = useGameStore((state) => state.objectives.find((item) => item.id === activeId))

  if (phase !== 'calm' && phase !== 'chase') return null
  if (phase === 'chase') return <div className="objective-card chase-objective">GET OUT</div>
  if (!objective) return null
  return <div className="objective-card">✎ {objective.label}</div>
}

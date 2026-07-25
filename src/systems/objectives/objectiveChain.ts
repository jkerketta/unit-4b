import { useGameStore } from '../../game/store'

export const OBJECTIVE_FLOW: Record<string, string | null> = {
  enter: 'unpack',
  unpack: 'lease',
  lease: 'rug',
  rug: 'hatch',
  hatch: 'escape',
  escape: null,
}

export function startObjectives(): void {
  useGameStore.getState().setActiveObjective('enter')
}

export function advanceObjective(completedId: string): string | null {
  const store = useGameStore.getState()
  store.completeObjective(completedId)
  const next = OBJECTIVE_FLOW[completedId] ?? null
  store.setActiveObjective(next)
  return next
}

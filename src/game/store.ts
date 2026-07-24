import { create } from 'zustand'

export type Phase = 'title' | 'calm' | 'chase' | 'win' | 'gameover'
export type EntityState = 'dormant' | 'alert' | 'search' | 'chase' | 'attack'

export interface Objective {
  id: string
  label: string
  complete: boolean
}

export interface GameFlags {
  leaseRead: boolean
  rugNoticed: boolean
  hatchOpen: boolean
  voicemailPlayed: boolean
}

export interface Checkpoint {
  playerPosition: [number, number, number]
  playerYaw: number
  objectives: Objective[]
  activeObjectiveId: string | null
  flags: GameFlags
}

export const INITIAL_OBJECTIVES: Objective[] = [
  { id: 'unpack', label: 'Unpack your boxes', complete: false },
  { id: 'lease', label: 'Look over the lease', complete: false },
  { id: 'rug', label: 'Check under the rug', complete: false },
  { id: 'hatch', label: "See what's down there", complete: false },
  { id: 'escape', label: 'GET OUT', complete: false },
]

const INITIAL_FLAGS: GameFlags = {
  leaseRead: false,
  rugNoticed: false,
  hatchOpen: false,
  voicemailPlayed: false,
}

interface GameState {
  phase: Phase
  objectives: Objective[]
  activeObjectiveId: string | null
  player: { position: [number, number, number]; stamina: number; hidden: boolean }
  entity: { state: EntityState; room: string | null; targetRoom: string | null }
  flags: GameFlags
  checkpoint: Checkpoint | null
  setPhase: (phase: Phase) => void
  completeObjective: (id: string) => void
  setActiveObjective: (id: string | null) => void
  setPlayerPosition: (p: [number, number, number]) => void
  setStamina: (v: number) => void
  setHidden: (hidden: boolean) => void
  setEntityState: (state: EntityState) => void
  setEntityRoom: (room: string | null, targetRoom?: string | null) => void
  setFlag: <K extends keyof GameFlags>(key: K, value: GameFlags[K]) => void
  saveCheckpoint: (playerYaw: number) => void
  restoreCheckpoint: () => void
  resetGame: () => void
}

function freshState() {
  return {
    phase: 'title' as Phase,
    objectives: INITIAL_OBJECTIVES.map((o) => ({ ...o })),
    activeObjectiveId: null as string | null,
    player: { position: [0, 0, 0] as [number, number, number], stamina: 100, hidden: false },
    entity: { state: 'dormant' as EntityState, room: null as string | null, targetRoom: null as string | null },
    flags: { ...INITIAL_FLAGS },
    checkpoint: null as Checkpoint | null,
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  ...freshState(),
  setPhase: (phase) => set({ phase }),
  completeObjective: (id) =>
    set((s) => ({
      objectives: s.objectives.map((o) => (o.id === id ? { ...o, complete: true } : o)),
    })),
  setActiveObjective: (id) => set({ activeObjectiveId: id }),
  setPlayerPosition: (p) => set((s) => ({ player: { ...s.player, position: p } })),
  setStamina: (v) => set((s) => ({ player: { ...s.player, stamina: v } })),
  setHidden: (hidden) => set((s) => ({ player: { ...s.player, hidden } })),
  setEntityState: (state) => set((s) => ({ entity: { ...s.entity, state } })),
  setEntityRoom: (room, targetRoom = null) =>
    set((s) => ({ entity: { ...s.entity, room, targetRoom } })),
  setFlag: (key, value) => set((s) => ({ flags: { ...s.flags, [key]: value } })),
  saveCheckpoint: (playerYaw) => {
    const s = get()
    set({
      checkpoint: {
        playerPosition: [...s.player.position],
        playerYaw,
        objectives: s.objectives.map((o) => ({ ...o })),
        activeObjectiveId: s.activeObjectiveId,
        flags: { ...s.flags },
      },
    })
  },
  restoreCheckpoint: () => {
    const cp = get().checkpoint
    if (!cp) return
    set({
      phase: 'calm',
      player: { position: [...cp.playerPosition], stamina: 100, hidden: false },
      entity: { state: 'dormant', room: null, targetRoom: null },
      objectives: cp.objectives.map((o) => ({ ...o })),
      activeObjectiveId: cp.activeObjectiveId,
      flags: { ...cp.flags },
    })
  },
  resetGame: () => set(freshState()),
}))

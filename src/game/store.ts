import { create } from 'zustand'

export type Phase = 'title' | 'intro' | 'calm' | 'chase' | 'win' | 'gameover'
export type EntityState = 'dormant' | 'alert' | 'search' | 'chase' | 'attack'
export type BoxCategory = 'bedroom' | 'kitchen' | 'living'
export type BoxProgress = Record<BoxCategory, { opened: boolean; placed: boolean }>

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
  boxMoved: boolean
  rugPulled: boolean
  scare1Done: boolean
}

export interface Checkpoint {
  playerPosition: [number, number, number]
  playerYaw: number
  objectives: Objective[]
  activeObjectiveId: string | null
  flags: GameFlags
  boxes: BoxProgress
}

export const INITIAL_OBJECTIVES: Objective[] = [
  { id: 'enter', label: 'Enter Unit 4B', complete: false },
  { id: 'unpack', label: 'Unpack and arrange your boxes', complete: false },
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
  boxMoved: false,
  rugPulled: false,
  scare1Done: false,
}

export const INITIAL_BOXES: BoxProgress = {
  bedroom: { opened: false, placed: false },
  kitchen: { opened: false, placed: false },
  living: { opened: false, placed: false },
}

const cloneBoxes = (boxes: BoxProgress): BoxProgress => ({
  bedroom: { ...boxes.bedroom },
  kitchen: { ...boxes.kitchen },
  living: { ...boxes.living },
})

interface GameState {
  sessionId: number
  phase: Phase
  paused: boolean
  objectives: Objective[]
  activeObjectiveId: string | null
  player: { position: [number, number, number]; yaw: number; stamina: number; hidden: boolean; hiddenSeen: boolean }
  entity: { state: EntityState; room: string | null; targetRoom: string | null; position: [number, number, number] | null }
  flags: GameFlags
  boxes: BoxProgress
  checkpoint: Checkpoint | null
  setPhase: (phase: Phase) => void
  pause: () => void
  resume: () => void
  completeObjective: (id: string) => void
  setActiveObjective: (id: string | null) => void
  setPlayerPosition: (p: [number, number, number]) => void
  setStamina: (v: number) => void
  setHidden: (hidden: boolean, seen?: boolean) => void
  setEntityState: (state: EntityState) => void
  setEntityRoom: (room: string | null, targetRoom?: string | null) => void
  setEntityPosition: (position: [number, number, number] | null) => void
  setFlag: <K extends keyof GameFlags>(key: K, value: GameFlags[K]) => void
  openBox: (category: BoxCategory) => void
  placeBoxContents: (category: BoxCategory) => void
  saveCheckpoint: (playerYaw: number) => void
  restoreCheckpoint: () => void
  resetGame: () => void
}

function freshState() {
  return {
    sessionId: 0,
    phase: 'title' as Phase,
    paused: false,
    objectives: INITIAL_OBJECTIVES.map((o) => ({ ...o })),
    activeObjectiveId: null as string | null,
    player: { position: [7.5, 0, 7.4] as [number, number, number], yaw: 0, stamina: 100, hidden: false, hiddenSeen: false },
    entity: { state: 'dormant' as EntityState, room: null as string | null, targetRoom: null as string | null, position: null as [number, number, number] | null },
    flags: { ...INITIAL_FLAGS },
    boxes: cloneBoxes(INITIAL_BOXES),
    checkpoint: null as Checkpoint | null,
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  ...freshState(),
  setPhase: (phase) => set((state) => ({
    phase,
    paused: phase === 'intro' || phase === 'calm' || phase === 'chase' ? state.paused : false,
  })),
  pause: () => set((state) => (
    state.phase === 'intro' || state.phase === 'calm' || state.phase === 'chase' ? { paused: true } : {}
  )),
  resume: () => set({ paused: false }),
  completeObjective: (id) =>
    set((s) => ({
      objectives: s.objectives.map((o) => (o.id === id ? { ...o, complete: true } : o)),
    })),
  setActiveObjective: (id) => set({ activeObjectiveId: id }),
  setPlayerPosition: (p) => set((s) => ({ player: { ...s.player, position: p } })),
  setStamina: (v) => set((s) => ({ player: { ...s.player, stamina: v } })),
  setHidden: (hidden, seen = false) => set((s) => ({ player: { ...s.player, hidden, hiddenSeen: hidden && seen } })),
  setEntityState: (state) => set((s) => ({ entity: { ...s.entity, state } })),
  setEntityRoom: (room, targetRoom = null) =>
    set((s) => ({ entity: { ...s.entity, room, targetRoom } })),
  setEntityPosition: (position) => set((s) => ({ entity: { ...s.entity, position } })),
  setFlag: (key, value) => set((s) => ({ flags: { ...s.flags, [key]: value } })),
  openBox: (category) => set((s) => ({
    boxes: { ...s.boxes, [category]: { ...s.boxes[category], opened: true } },
  })),
  placeBoxContents: (category) => set((s) => {
    const boxes = {
      ...s.boxes,
      [category]: { ...s.boxes[category], opened: true, placed: true },
    }
    const allPlaced = Object.values(boxes).every((box) => box.placed)
    return {
      boxes,
      objectives: allPlaced
        ? s.objectives.map((objective) => objective.id === 'unpack' ? { ...objective, complete: true } : objective)
        : s.objectives,
      activeObjectiveId: allPlaced && s.activeObjectiveId === 'unpack' ? 'lease' : s.activeObjectiveId,
    }
  }),
  saveCheckpoint: (playerYaw) => {
    const s = get()
    set({
      checkpoint: {
        playerPosition: [...s.player.position],
        playerYaw,
        objectives: s.objectives.map((o) => ({ ...o })),
        activeObjectiveId: s.activeObjectiveId,
        flags: { ...s.flags },
        boxes: cloneBoxes(s.boxes),
      },
    })
  },
  restoreCheckpoint: () => {
    const cp = get().checkpoint
    if (!cp) return
    set({
      sessionId: get().sessionId + 1,
      phase: 'calm',
      paused: false,
      player: { position: [...cp.playerPosition], yaw: cp.playerYaw, stamina: 100, hidden: false, hiddenSeen: false },
      entity: { state: 'dormant', room: null, targetRoom: null, position: null },
      objectives: cp.objectives.map((o) => ({ ...o })),
      activeObjectiveId: cp.activeObjectiveId,
      flags: { ...cp.flags },
      boxes: cloneBoxes(cp.boxes),
    })
  },
  resetGame: () => set((s) => ({ ...freshState(), sessionId: s.sessionId + 1 })),
}))

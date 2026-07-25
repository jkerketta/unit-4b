import { create } from 'zustand'

let transitionGeneration = 0

interface UIState {
  currentPrompt: string | null
  holdProgress: number
  subtitle: { line: string; until: number } | null
  fadeOpacity: number
  fadeColor: 'black' | 'white'
  catchFlash: boolean
  deathScreenVisible: boolean
  document: 'lease' | 'notebook' | 'floorplan' | null
  introStep: number | null
  setPrompt: (prompt: string | null) => void
  setHoldProgress: (progress: number) => void
  say: (line: string, ms?: number) => void
  setFadeOpacity: (opacity: number) => void
  setFadeColor: (color: 'black' | 'white') => void
  setCatchFlash: (visible: boolean) => void
  setDeathScreenVisible: (visible: boolean) => void
  openDocument: (document: NonNullable<UIState['document']>) => void
  closeDocument: () => void
  setIntroStep: (step: number | null) => void
  resetTransient: () => void
}

export const useUIStore = create<UIState>((set) => ({
  currentPrompt: null,
  holdProgress: 0,
  subtitle: null,
  fadeOpacity: 0,
  fadeColor: 'black',
  catchFlash: false,
  deathScreenVisible: false,
  document: null,
  introStep: null,
  setPrompt: (currentPrompt) => set({ currentPrompt }),
  setHoldProgress: (holdProgress) => set({ holdProgress }),
  say: (line, ms = 4000) => set({ subtitle: { line, until: Date.now() + ms } }),
  setFadeOpacity: (fadeOpacity) => set({ fadeOpacity }),
  setFadeColor: (fadeColor) => set({ fadeColor }),
  setCatchFlash: (catchFlash) => set({ catchFlash }),
  setDeathScreenVisible: (deathScreenVisible) => set({ deathScreenVisible }),
  openDocument: (doc) => {
    globalThis.document?.exitPointerLock?.()
    set({ document: doc, currentPrompt: null })
  },
  closeDocument: () => set({ document: null }),
  setIntroStep: (introStep) => set({ introStep }),
  resetTransient: () => {
    transitionGeneration += 1
    set({
      currentPrompt: null,
      holdProgress: 0,
      subtitle: null,
      fadeOpacity: 0,
      fadeColor: 'black',
      catchFlash: false,
      deathScreenVisible: false,
      document: null,
      introStep: null,
    })
  },
}))

export function say(line: string, ms?: number): void {
  useUIStore.getState().say(line, ms)
}

export function fadeTransition(action: () => void, ms = 300): void {
  const generation = ++transitionGeneration
  useUIStore.getState().setFadeOpacity(1)
  window.setTimeout(() => {
    if (generation !== transitionGeneration) return
    action()
    window.setTimeout(() => {
      if (generation === transitionGeneration) useUIStore.getState().setFadeOpacity(0)
    }, ms)
  }, ms)
}

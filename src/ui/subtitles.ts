import { create } from 'zustand'
import { audio } from '../systems/audio/AudioManager'
import { suppressUnlockPause } from '../systems/player/pauseGate'

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
  introScript: 'initial' | 'followup' | null
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
  setIntroScript: (script: UIState['introScript']) => void
  startIntroDialogue: (script: NonNullable<UIState['introScript']>) => void
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
  introScript: null,
  setPrompt: (currentPrompt) => set({ currentPrompt }),
  setHoldProgress: (holdProgress) => set({ holdProgress }),
  say: (line, ms = 4000) => set({ subtitle: { line, until: Date.now() + ms } }),
  setFadeOpacity: (fadeOpacity) => set({ fadeOpacity }),
  setFadeColor: (fadeColor) => set({ fadeColor }),
  setCatchFlash: (catchFlash) => set({ catchFlash }),
  setDeathScreenVisible: (deathScreenVisible) => set({ deathScreenVisible }),
  openDocument: (doc) => {
    set({ document: doc, currentPrompt: null })
    if (doc === 'lease' || doc === 'notebook') {
      audio.play('paper', { volume: 0.58, rate: 0.94 + Math.random() * 0.12 })
    }
    suppressUnlockPause()
    globalThis.document?.exitPointerLock?.()
  },
  closeDocument: () => {
    suppressUnlockPause(600)
    set({ document: null })
  },
  setIntroStep: (introStep) => set({ introStep }),
  setIntroScript: (introScript) => set({ introScript }),
  startIntroDialogue: (script) => {
    set({ introScript: script, introStep: 0, currentPrompt: null })
    suppressUnlockPause()
    globalThis.document?.exitPointerLock?.()
  },
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
      introScript: null,
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

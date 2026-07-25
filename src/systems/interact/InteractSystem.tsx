import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useUIStore } from '../../ui/subtitles'
import { useGameStore } from '../../game/store'
import { useScareStore } from '../scares/ScareManager'
import { hideExitPrompt, tryExitHideSpot } from '../player/hideSpots'
import { getInteractables, registerInteractable, type Interactable } from './interactables'

export type InteractableRegistration = Omit<Interactable, 'object'> & {
  object: RefObject<THREE.Object3D | null>
}

export function useInteractable(interactable: InteractableRegistration): void {
  const latest = useRef(interactable)
  latest.current = interactable

  useEffect(() => {
    const object = interactable.object.current
    if (!object) return
    return registerInteractable({
      id: interactable.id,
      object,
      label: () => latest.current.label(),
      enabled: () => latest.current.enabled(),
      onInteract: () => latest.current.onInteract(),
      holdSeconds: interactable.holdSeconds,
    })
  }, [interactable.id, interactable.object, interactable.holdSeconds])
}

export default function InteractSystem() {
  const { camera } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const target = useRef<Interactable | null>(null)
  const eHeld = useRef(false)
  const holdElapsed = useRef(0)
  const firedForHold = useRef(false)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' || event.repeat) return
      const ui = useUIStore.getState()
      if (
        useGameStore.getState().paused ||
        ui.document ||
        ui.introStep !== null ||
        useScareStore.getState().wakeCutscene
      ) return
      eHeld.current = true
      firedForHold.current = false
      // While hidden, E always exits — no need to look at the bed/closet.
      if (tryExitHideSpot()) return
      const current = target.current
      if (current && !current.holdSeconds) current.onInteract()
    }
    const up = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE') return
      eHeld.current = false
      holdElapsed.current = 0
      firedForHold.current = false
      useUIStore.getState().setHoldProgress(0)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((_, dt) => {
    const ui = useUIStore.getState()
    if (
      useGameStore.getState().paused ||
      ui.document ||
      ui.introStep !== null ||
      useScareStore.getState().wakeCutscene
    ) {
      target.current = null
      eHeld.current = false
      holdElapsed.current = 0
      useUIStore.getState().setPrompt(null)
      useUIStore.getState().setHoldProgress(0)
      return
    }

    // Always show leave prompt while hidden; skip world raycasts.
    const exitPrompt = hideExitPrompt()
    if (exitPrompt) {
      target.current = null
      eHeld.current = false
      holdElapsed.current = 0
      useUIStore.getState().setHoldProgress(0)
      if (useUIStore.getState().currentPrompt !== exitPrompt) {
        useUIStore.getState().setPrompt(exitPrompt)
      }
      return
    }

    const enabled = getInteractables().filter((item) => item.enabled())
    const roots = new Map(enabled.map((item) => [item.object.uuid, item]))
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera)
    raycaster.current.far = 2
    const hit = raycaster.current.intersectObjects(enabled.map((item) => item.object), true)[0]
    let object: THREE.Object3D | null = hit?.object ?? null
    let next: Interactable | null = null
    while (object && !next) {
      next = roots.get(object.uuid) ?? null
      object = object.parent
    }

    if (target.current?.id !== next?.id) {
      target.current = next
      holdElapsed.current = 0
      firedForHold.current = false
      useUIStore.getState().setHoldProgress(0)
    }
    const prompt = next?.label() ?? null
    if (useUIStore.getState().currentPrompt !== prompt) useUIStore.getState().setPrompt(prompt)

    if (next?.holdSeconds && eHeld.current && !firedForHold.current) {
      holdElapsed.current += dt
      const progress = Math.min(1, holdElapsed.current / next.holdSeconds)
      useUIStore.getState().setHoldProgress(progress)
      if (progress >= 1) {
        firedForHold.current = true
        next.onInteract()
      }
    } else if (!next?.holdSeconds && useUIStore.getState().holdProgress !== 0) {
      useUIStore.getState().setHoldProgress(0)
    }
  })

  return null
}

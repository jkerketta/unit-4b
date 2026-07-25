import type * as THREE from 'three'

export interface Interactable {
  id: string
  object: THREE.Object3D
  label: () => string
  enabled: () => boolean
  onInteract: () => void
  holdSeconds?: number
}

const registry = new Map<string, Interactable>()

export function registerInteractable(interactable: Interactable): () => void {
  registry.set(interactable.id, interactable)
  return () => {
    if (registry.get(interactable.id) === interactable) registry.delete(interactable.id)
  }
}

export function getInteractables(): Interactable[] {
  return [...registry.values()]
}

export function _clearRegistry(): void {
  registry.clear()
}

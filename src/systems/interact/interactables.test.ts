import * as THREE from 'three'
import { beforeEach, describe, expect, it } from 'vitest'
import { _clearRegistry, getInteractables, registerInteractable, type Interactable } from './interactables'

function stub(id: string): Interactable {
  return {
    id,
    object: new THREE.Object3D(),
    label: () => `Use ${id}`,
    enabled: () => true,
    onInteract: () => undefined,
  }
}

beforeEach(_clearRegistry)

describe('interactable registry', () => {
  it('registers and unregisters typed entries', () => {
    const unregister = registerInteractable(stub('box'))
    expect(getInteractables().map((item) => item.id)).toEqual(['box'])
    unregister()
    expect(getInteractables()).toEqual([])
  })

  it('supports tap interactions by default', () => {
    registerInteractable(stub('lease'))
    expect(getInteractables()[0].holdSeconds).toBeUndefined()
  })
})

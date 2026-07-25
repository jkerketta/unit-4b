import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { type BoxCategory, useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { useInteractable } from '../../systems/interact/InteractSystem'
import { audio } from '../../systems/audio/AudioManager'
import { say } from '../../ui/subtitles'
import { HATCH_POS } from '../layout'
import { BOX_DESTINATIONS } from '../furniturePlacements'
import LowPolyModel from '../models/LowPolyModel'

const CARDBOARD = makePSXMaterial({ color: '#8a6f4d' })
const TAPE = makePSXMaterial({ color: '#b89a6a' })
const GHOST = makePSXMaterial({ color: '#d8c88b', transparent: true, opacity: 0.28 })
const ITEM_DARK = makePSXMaterial({ color: '#303534' })
const ITEM_METAL = makePSXMaterial({ color: '#85877f' })
const ITEM_LIGHT = makePSXMaterial({ color: '#bbb4a5' })
const ITEM_BLUE = makePSXMaterial({ color: '#59657a' })
const ITEM_RED = makePSXMaterial({ color: '#6f423b' })
const ITEM_GREEN = makePSXMaterial({ color: '#596248' })
const ITEM_PALETTE = {
  _default: ITEM_DARK,
  metal: ITEM_METAL,
  metalLight: ITEM_METAL,
  metalMedium: ITEM_METAL,
  metalDark: ITEM_DARK,
  glass: ITEM_BLUE,
  carpet: ITEM_BLUE,
  carpetDarker: ITEM_RED,
  carpetWhite: ITEM_LIGHT,
  plant: ITEM_GREEN,
}

const BOXES: { category: BoxCategory; position: [number, number, number]; copy: string }[] = [
  { category: 'bedroom', position: [-2, 0.31, 4.45], copy: 'Clothes. These belong in the bedroom.' },
  { category: 'kitchen', position: [1.5, 0.31, 4.35], copy: 'Kitchenware. Better put it by the counters.' },
  { category: 'living', position: [2.7, 0.31, 1.75], copy: 'Books. The living-room shelf is empty.' },
]

const DESTINATIONS: Record<BoxCategory, [number, number, number]> = BOX_DESTINATIONS

function MovingBox({ category, position, copy }: (typeof BOXES)[number]) {
  const ref = useRef<THREE.Group>(null)
  const leftLid = useRef<THREE.Mesh>(null)
  const rightLid = useRef<THREE.Mesh>(null)
  const progress = useGameStore((state) => state.boxes[category])
  useInteractable({
    id: `moving-box-${category}`,
    object: ref,
    label: () => `Open ${category} box`,
    enabled: () => {
      const state = useGameStore.getState()
      return state.activeObjectiveId === 'unpack' && !state.boxes[category].opened
    },
    onInteract: () => {
      useGameStore.getState().openBox(category)
      audio.play('box', { rate: 1.02 })
      say(copy)
    },
  })
  useFrame((_, dt) => {
    if (useGameStore.getState().paused) return
    const angle = progress.opened ? Math.PI * 0.56 : 0
    if (leftLid.current) leftLid.current.rotation.z = THREE.MathUtils.damp(leftLid.current.rotation.z, angle, 7, dt)
    if (rightLid.current) rightLid.current.rotation.z = THREE.MathUtils.damp(rightLid.current.rotation.z, -angle, 7, dt)
  })
  return (
    <group ref={ref} position={position}>
      <mesh><boxGeometry args={[0.7, 0.62, 0.7]} /><primitive object={CARDBOARD} attach="material" /></mesh>
      <mesh ref={leftLid} position={[-0.175, 0.325, 0]}><boxGeometry args={[0.35, 0.025, 0.72]} /><primitive object={TAPE} attach="material" /></mesh>
      <mesh ref={rightLid} position={[0.175, 0.325, 0]}><boxGeometry args={[0.35, 0.025, 0.72]} /><primitive object={TAPE} attach="material" /></mesh>
      {progress.opened && !progress.placed && <Contents category={category} position={[0, 0.36, 0]} />}
    </group>
  )
}

function Contents({
  category,
  position,
  placed = false,
}: {
  category: BoxCategory
  position: [number, number, number]
  placed?: boolean
}) {
  const scale = placed ? (category === 'living' ? 0.11 : category === 'kitchen' ? 0.075 : 0.085) : 0.045
  return (
    <group position={position} rotation-y={placed && category === 'living' ? Math.PI / 2 : 0}>
      {category === 'living' && (
        <LowPolyModel url="/models/kenney/books.obj" scale={scale} materials={ITEM_PALETTE} />
      )}
      {category === 'kitchen' && (
        <>
          <LowPolyModel
            url="/models/kenney/kitchenBlender.obj"
            position={placed ? [-0.38, 0, 0.02] : [-0.14, 0, 0]}
            scale={scale}
            materials={ITEM_PALETTE}
          />
          <LowPolyModel
            url="/models/kenney/kitchenCoffeeMachine.obj"
            position={placed ? [0.4, 0, 0.02] : [0.14, 0, 0]}
            scale={scale}
            materials={ITEM_PALETTE}
          />
        </>
      )}
      {category === 'bedroom' && (
        <>
          <LowPolyModel
            url="/models/kenney/pillow.obj"
            position={placed ? [-0.35, 0.02, -0.35] : [-0.12, 0, 0]}
            rotation={[0, -0.2, 0]}
            scale={scale}
            materials={ITEM_PALETTE}
          />
          <LowPolyModel
            url="/models/kenney/pillow.obj"
            position={placed ? [0.35, 0.04, -0.3] : [0.12, 0.025, 0]}
            rotation={[0, 0.25, 0]}
            scale={scale}
            materials={ITEM_PALETTE}
          />
        </>
      )}
    </group>
  )
}

function ArrangementSpot({ category }: { category: BoxCategory }) {
  const ref = useRef<THREE.Group>(null)
  const progress = useGameStore((state) => state.boxes[category])
  useInteractable({
    id: `arrange-${category}`,
    object: ref,
    label: () => `Arrange ${category === 'living' ? 'books' : category === 'kitchen' ? 'kitchenware' : 'clothes'} here`,
    enabled: () => {
      const state = useGameStore.getState()
      const box = state.boxes[category]
      return state.activeObjectiveId === 'unpack' && box.opened && !box.placed
    },
    onInteract: () => {
      useGameStore.getState().placeBoxContents(category)
      audio.play('box', { volume: 0.5, rate: 1.2 })
      say(category === 'living' ? 'Books shelved.' : category === 'kitchen' ? 'Kitchenware arranged.' : 'Clothes put away.')
    },
  })
  return (
    <group ref={ref} position={DESTINATIONS[category]}>
      {!progress.placed && progress.opened && <mesh><boxGeometry args={[0.75, 0.08, 0.5]} /><primitive object={GHOST} attach="material" /></mesh>}
      {progress.placed && <Contents category={category} position={[0, 0, 0]} placed />}
    </group>
  )
}

function HeavyBox() {
  const ref = useRef<THREE.Group>(null)
  const boxMoved = useGameStore((state) => state.flags.boxMoved)
  useInteractable({
    id: 'heavy-box',
    object: ref,
    label: () => 'Shove the heavy box',
    enabled: () => useGameStore.getState().activeObjectiveId === 'rug' && !useGameStore.getState().flags.boxMoved,
    onInteract: () => {
      useGameStore.getState().setFlag('boxMoved', true)
      audio.play('box', { volume: 0.75, rate: 0.78 })
      say('Heavy. What was it covering?')
    },
  })
  useFrame((_, dt) => {
    if (!useGameStore.getState().paused && ref.current) {
      ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, HATCH_POS[0] + (boxMoved ? 1.7 : 0.3), 7, dt)
    }
  })
  return (
    <group ref={ref} position={[HATCH_POS[0] + 0.3, 0.45, HATCH_POS[2]]}>
      <mesh><boxGeometry args={[0.9, 0.9, 0.9]} /><primitive object={CARDBOARD} attach="material" /></mesh>
      <mesh position={[0, 0.455, 0]}><boxGeometry args={[0.14, 0.012, 0.92]} /><primitive object={TAPE} attach="material" /></mesh>
    </group>
  )
}

export default function MovingBoxes() {
  return <>
    {BOXES.map((box) => <MovingBox key={box.category} {...box} />)}
    {(Object.keys(DESTINATIONS) as BoxCategory[]).map((category) => <ArrangementSpot key={category} category={category} />)}
    <HeavyBox />
  </>
}

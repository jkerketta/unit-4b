import { makePSXMaterial } from '../../render/psxMaterial'
import { FURNITURE_PLACEMENTS as P, KITCHEN_UNITS, type Vec3 } from '../furniturePlacements'
import LowPolyModel from '../models/LowPolyModel'

const MODEL_ROOT = '/models/kenney'
const WOOD = makePSXMaterial({ color: '#65503b' })
const WOOD_DARK = makePSXMaterial({ color: '#342a24' })
const FABRIC = makePSXMaterial({ color: '#474b46' })
const FABRIC_LIGHT = makePSXMaterial({ color: '#aaa391' })
const METAL = makePSXMaterial({ color: '#777872' })
const METAL_DARK = makePSXMaterial({ color: '#242827' })
const PORCELAIN = makePSXMaterial({ color: '#bbb9ac' })
const GLASS = makePSXMaterial({ color: '#263335', transparent: true, opacity: 0.78 })
const GREEN = makePSXMaterial({ color: '#45553b' })
const LAMP = makePSXMaterial({ color: '#d4b77a', emissive: '#5a4520', emissiveIntensity: 0.55 })

const PALETTE = {
  _default: WOOD,
  _defaultMat: WOOD_DARK,
  wood: WOOD,
  woodDark: WOOD_DARK,
  carpet: FABRIC,
  carpetDarker: FABRIC,
  carpetWhite: FABRIC_LIGHT,
  metal: METAL,
  metalLight: METAL,
  metalMedium: METAL,
  metalDark: METAL_DARK,
  glass: GLASS,
  plant: GREEN,
  lamp: LAMP,
}

function Model({
  name,
  placement,
  material,
}: {
  name: string
  placement: { position: Vec3; rotation: Vec3; scale: number }
  material?: typeof WOOD
}) {
  return (
    <LowPolyModel
      url={`${MODEL_ROOT}/${name}.obj`}
      position={placement.position}
      rotation={placement.rotation}
      scale={placement.scale}
      material={material}
      materials={material ? undefined : PALETTE}
    />
  )
}

export default function Furnishings() {
  return (
    <>
      <Model name="loungeSofa" placement={P.sofa} />
      <Model name="televisionVintage" placement={P.television} />
      <Model name="bookcaseOpen" placement={P.bookcase} />
      <Model name="lampRoundFloor" placement={P.floorLamp} />
      <pointLight position={[-1.5, 1.75, 3.65]} intensity={1.8} distance={4} color="#ffd39a" />
      <Model name="pottedPlant" placement={P.plant} />

      <Model name="kitchenFridge" placement={P.fridge} />
      {KITCHEN_UNITS.map((unit, index) => (
        <LowPolyModel
          key={`${unit.model}-${index}`}
          url={`${MODEL_ROOT}/kitchen${unit.model === 'sink' ? 'Sink' : 'Cabinet'}.obj`}
          position={[...unit.position]}
          rotation={[...unit.rotation]}
          scale={0.2}
          materials={PALETTE}
        />
      ))}
      <Model name="tableCross" placement={P.diningTable} />
      <Model name="chair" placement={P.diningChairWest} />
      <Model name="chair" placement={P.diningChairEast} />

      <Model name="sideTableDrawers" placement={P.sideTable} />
      <Model name="toilet" placement={P.toilet} material={PORCELAIN} />
      <Model name="bathroomSink" placement={P.bathroomSink} material={PORCELAIN} />
    </>
  )
}

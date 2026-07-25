import { useEffect } from 'react'
import { useGameStore } from '../game/store'
import { advanceObjective } from '../systems/objectives/objectiveChain'
import { suppressUnlockPause } from '../systems/player/pauseGate'
import { triggerScare1 } from '../systems/scares/ScareManager'
import { useUIStore } from './subtitles'

export default function DocumentReader() {
  const document = useUIStore((state) => state.document)

  const close = () => {
    const kind = useUIStore.getState().document
    if (!kind) return
    suppressUnlockPause(600)
    useUIStore.getState().closeDocument()
    const game = useGameStore.getState()
    if (kind === 'lease' && !game.flags.leaseRead) {
      game.setFlag('leaseRead', true)
      if (game.activeObjectiveId === 'lease') advanceObjective('lease')
    }
    if (kind === 'notebook' && !game.flags.scare1Done) {
      game.setFlag('scare1Done', true)
      triggerScare1()
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!useUIStore.getState().document || event.repeat) return
      // Esc must not close or fall through to the pause toggle.
      if (event.code === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }
      if (event.code === 'KeyE') {
        event.preventDefault()
        event.stopImmediatePropagation()
        close()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  if (!document) return null
  return (
    <div className={`document-reader ${document}`}>
      <article>
        {document === 'lease' && <LeaseCopy />}
        {document === 'notebook' && <NotebookCopy />}
        {document === 'floorplan' && <FloorPlan />}
        <button autoFocus onClick={close}>Close [E]</button>
      </article>
    </div>
  )
}

function LeaseCopy() {
  return <>
    <p className="document-kicker">BRAMBLE PROPERTY MANAGEMENT</p>
    <h2>RESIDENTIAL LEASE — UNIT 4B</h2>
    <p>Tenant: <span className="redacted">PREVIOUS TENANT NAME</span></p>
    <p>Premises are accepted in their present condition. Keys and three moving boxes have been delivered.</p>
    <hr />
    <h3>CLAUSE 12 — PLAN OF PREMISES</h3>
    <p>The tenant agrees that the unit floor plan is exactly as provided. No room, void, accessway, or space beyond that plan is recognized by the owner.</p>
    <p className="fine-print">Do not alter floor coverings. Report hollow sounds to management. Management assumes no responsibility for sounds occurring after 02:13.</p>
  </>
}

function NotebookCopy() {
  return <>
    <p className="document-kicker">FOUND NOTEBOOK — NO NAME</p>
    <h2>Pages 17–19</h2>
    <p>Every wall is thinner at night. I can hear it learning where the doors are.</p>
    <p className="scribble">IT HEARS THROUGH THE WALLS.</p>
    <p>I covered the hatch. Then the rug moved back by itself.</p>
    <p className="scribble">it is under the floor it is under the floor it is under the—</p>
  </>
}

function FloorPlan() {
  return <>
    <p className="document-kicker">SUPPLIED FLOOR PLAN — UNIT 4B</p>
    <h2>Approved arrangement</h2>
    <div className="floor-plan">
      <span className="bath">BATH</span><span className="bed">BEDROOM</span><span className="kitchen">KITCHEN</span>
      <span className="hall">HALL</span><span className="living">LIVING ROOM</span><span className="entry">ENTRY</span>
    </div>
    <p className="fine-print">Six rooms and connecting hall. No additional space is included in this plan.</p>
  </>
}

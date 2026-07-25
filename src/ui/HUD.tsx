import InteractPrompt from './InteractPrompt'
import ObjectiveCard from './ObjectiveCard'
import StaminaBar from './StaminaBar'
import Subtitles from './Subtitles'
import DeathScreen from './DeathScreen'
import WinScreen from './WinScreen'
import { useUIStore } from './subtitles'
import { useGameStore } from '../game/store'
import { useScareStore } from '../systems/scares/ScareManager'
import TitleScreen from './TitleScreen'
import PauseMenu from './PauseMenu'
import DocumentReader from './DocumentReader'
import IntroSequence from './IntroSequence'
import ClosetPeep from './ClosetPeep'

export default function HUD() {
  const fadeOpacity = useUIStore((state) => state.fadeOpacity)
  const fadeColor = useUIStore((state) => state.fadeColor)
  const catchFlash = useUIStore((state) => state.catchFlash)
  const phase = useGameStore((state) => state.phase)
  const paused = useGameStore((state) => state.paused)
  const document = useUIStore((state) => state.document)
  const introStep = useUIStore((state) => state.introStep)
  const wakeCutscene = useScareStore((state) => state.wakeCutscene)
  const hideSpot = useGameStore((state) => state.player.hideSpot)
  const playing = phase === 'intro' || phase === 'calm' || phase === 'chase'
  const unobstructed = !paused && !document && introStep === null && !wakeCutscene
  return (
    <div className="hud">
      {playing && unobstructed && <ObjectiveCard />}
      {playing && unobstructed && <InteractPrompt />}
      {playing && !paused && !document && introStep === null && <Subtitles />}
      {playing && unobstructed && phase !== 'intro' && <StaminaBar />}
      {playing && unobstructed && hideSpot === 'closet' && <ClosetPeep />}
      {catchFlash && <div className="catch-flash"><span /></div>}
      <div className="screen-fade" style={{ opacity: fadeOpacity, background: fadeColor }} />
      {playing && unobstructed && hideSpot !== 'closet' && <div className="crosshair">·</div>}
      <DocumentReader />
      <IntroSequence />
      <TitleScreen />
      <PauseMenu />
      <DeathScreen />
      <WinScreen />
    </div>
  )
}

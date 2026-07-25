import InteractPrompt from './InteractPrompt'
import ObjectiveCard from './ObjectiveCard'
import StaminaBar from './StaminaBar'
import Subtitles from './Subtitles'
import DeathScreen from './DeathScreen'
import WinScreen from './WinScreen'
import { useUIStore } from './subtitles'
import { useGameStore } from '../game/store'
import TitleScreen from './TitleScreen'
import PauseMenu from './PauseMenu'
import DocumentReader from './DocumentReader'
import IntroSequence from './IntroSequence'

export default function HUD() {
  const fadeOpacity = useUIStore((state) => state.fadeOpacity)
  const fadeColor = useUIStore((state) => state.fadeColor)
  const catchFlash = useUIStore((state) => state.catchFlash)
  const phase = useGameStore((state) => state.phase)
  const paused = useGameStore((state) => state.paused)
  const document = useUIStore((state) => state.document)
  const introStep = useUIStore((state) => state.introStep)
  const playing = phase === 'intro' || phase === 'calm' || phase === 'chase'
  const unobstructed = !paused && !document && introStep === null
  return (
    <div className="hud">
      {playing && unobstructed && <ObjectiveCard />}
      {playing && unobstructed && <InteractPrompt />}
      {playing && unobstructed && <Subtitles />}
      {playing && unobstructed && phase !== 'intro' && <StaminaBar />}
      {catchFlash && <div className="catch-flash"><span /></div>}
      <div className="screen-fade" style={{ opacity: fadeOpacity, background: fadeColor }} />
      {playing && unobstructed && <div className="crosshair">·</div>}
      <DocumentReader />
      <IntroSequence />
      <TitleScreen />
      <PauseMenu />
      <DeathScreen />
      <WinScreen />
    </div>
  )
}

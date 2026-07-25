import { useGameStore } from '../../game/store'
import { say } from '../../ui/subtitles'
import { audio } from './AudioManager'

export const LANDLORD_VOICEMAIL = [
  'Hey, it is Mr. Vale, your landlord.',
  'If you hear anything under the kitchen, do not open that hatch.',
  'Call me back. And whatever you do, do not let it see you leave.',
]

export function playLandlordVoicemail(): boolean {
  const store = useGameStore.getState()
  if (store.flags.voicemailPlayed) return false
  store.setFlag('voicemailPlayed', true)
  audio.playVoicemail(LANDLORD_VOICEMAIL, (line) => say(`[LANDLORD] ${line}`, 4800))
  return true
}

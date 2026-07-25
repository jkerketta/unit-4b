import { useGameStore } from '../../game/store'
import { say } from '../../ui/subtitles'
import { audio } from './AudioManager'

export const PREVIOUS_TENANT_VOICEMAIL = [
  'This is from the previous tenant.',
  'I heard there was a new tenant coming to this apartment — so I\'m leaving this for you.',
  'If you hear anything under the living room, do not open that hatch.',
  'Whatever you do, do not let it see you leave.',
]

export function playTenantVoicemail(): boolean {
  const store = useGameStore.getState()
  if (store.flags.voicemailPlayed) return false
  store.setFlag('voicemailPlayed', true)
  audio.playVoicemail(PREVIOUS_TENANT_VOICEMAIL, (line) => say(`[PREVIOUS TENANT] ${line}`, 4800))
  return true
}

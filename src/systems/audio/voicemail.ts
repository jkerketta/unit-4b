import { useGameStore } from '../../game/store'
import { say } from '../../ui/subtitles'
import { audio } from './AudioManager'

export const PREVIOUS_TENANT_VOICEMAIL = [
  'Hi... you don\'t know me. I lived in 4B before you.',
  'They told me someone new was moving in, so I\'m leaving this while I still can.',
  'If you hear scratching under the living room, do not move the rug. Do not open the hatch.',
  'It doesn\'t see well. It listens. Walk slow, and keep the doors between you.',
  'And whatever you do... do not let it see you leave.',
]

export function playTenantVoicemail(): boolean {
  const store = useGameStore.getState()
  if (store.flags.voicemailPlayed) return false
  store.setFlag('voicemailPlayed', true)
  audio.playVoicemail(PREVIOUS_TENANT_VOICEMAIL, (line) => say(`[PREVIOUS TENANT] ${line}`, 4800))
  return true
}

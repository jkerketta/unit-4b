import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { audio } from '../../systems/audio/AudioManager'
import { playLandlordVoicemail } from '../../systems/audio/voicemail'
import { useInteractable } from '../../systems/interact/InteractSystem'

const PHONE = makePSXMaterial({ color: '#28251f' })
const DIAL = makePSXMaterial({ color: '#a99b7c' })

export default function Phone() {
  const ref = useRef<THREE.Group>(null)
  const phase = useGameStore((state) => state.phase)
  const voicemailPlayed = useGameStore((state) => state.flags.voicemailPlayed)
  const [ringing, setRinging] = useState(false)

  useEffect(() => {
    if (phase !== 'chase' || voicemailPlayed) {
      setRinging(false)
      audio.stopPhoneRing()
      return
    }
    let elapsed = 0
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const state = useGameStore.getState()
      if (!state.paused) elapsed += now - last
      last = now
      if (elapsed < 30_000 || state.phase !== 'chase' || state.flags.voicemailPlayed) return
      window.clearInterval(timer)
      setRinging(true)
      audio.startPhoneRing()
    }, 100)
    return () => window.clearInterval(timer)
  }, [phase, voicemailPlayed])

  useEffect(() => () => audio.stopPhoneRing(), [])

  useInteractable({
    id: 'kitchen-phone',
    object: ref,
    label: () => 'Answer the phone',
    enabled: () => ringing && useGameStore.getState().phase === 'chase' && !useGameStore.getState().flags.voicemailPlayed,
    onInteract: () => {
      setRinging(false)
      playLandlordVoicemail()
    },
  })

  return (
    <group ref={ref} position={[7.8, 1.12, -4.65]} rotation-y={-Math.PI / 2}>
      <mesh>
        <boxGeometry args={[0.62, 0.22, 0.42]} />
        <primitive object={PHONE} attach="material" />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <capsuleGeometry args={[0.075, 0.42, 3, 7]} />
        <primitive object={PHONE} attach="material" />
      </mesh>
      <mesh position={[0, 0.12, -0.215]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.1, 0.025, 5, 10]} />
        <primitive object={DIAL} attach="material" />
      </mesh>
      {ringing && <pointLight position={[0, 0.25, 0]} intensity={1.5} distance={1.2} color="#b33a24" />}
    </group>
  )
}

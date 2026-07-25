import { useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../game/store'
import { makePSXMaterial } from '../../render/psxMaterial'
import { audio } from '../../systems/audio/AudioManager'
import { playTenantVoicemail } from '../../systems/audio/voicemail'
import { useInteractable } from '../../systems/interact/InteractSystem'

const PHONE_URL = '/models/poly-pizza/office-phone.glb'
/** Counter-top landline on the north kitchen run, facing into the room. */
const PHONE_POS: [number, number, number] = [7.55, 0.92, -4.72]
const PHONE_SCALE = 19

const BODY = makePSXMaterial({ color: '#2c2823' })
const HANDSET = makePSXMaterial({ color: '#6a6358' })
const FALLBACK = makePSXMaterial({ color: '#3a3530' })

function PhoneMesh() {
  const { scene } = useGLTF(PHONE_URL)
  const model = useMemo(() => {
    const instance = scene.clone(true)
    const bounds = new THREE.Box3().setFromObject(instance)
    const center = bounds.getCenter(new THREE.Vector3())
    instance.position.set(-center.x, -bounds.min.y, -center.z)
    instance.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = false
      child.receiveShadow = false
      const name = (child.name || child.parent?.name || '').toLowerCase()
      child.material = name.includes('handle') || name.includes('hand') ? HANDSET : BODY
    })
    return instance
  }, [scene])

  return <primitive object={model} />
}

function PhoneFallback() {
  return (
    <group>
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[0.028, 0.012, 0.022]} />
        <primitive object={FALLBACK} attach="material" />
      </mesh>
      <mesh position={[0, 0.014, 0]}>
        <capsuleGeometry args={[0.004, 0.018, 3, 6]} />
        <primitive object={HANDSET} attach="material" />
      </mesh>
    </group>
  )
}

export default function Phone() {
  const ref = useRef<THREE.Group>(null)
  const phase = useGameStore((state) => state.phase)
  const voicemailPlayed = useGameStore((state) => state.flags.voicemailPlayed)
  const [ringing, setRinging] = useState(false)
  const autoAnswerStarted = useRef(false)

  const answer = () => {
    if (useGameStore.getState().flags.voicemailPlayed) return
    setRinging(false)
    audio.stopPhoneRing()
    playTenantVoicemail()
  }

  useEffect(() => {
    if (phase !== 'chase' || voicemailPlayed) {
      setRinging(false)
      audio.stopPhoneRing()
      autoAnswerStarted.current = false
      return
    }
    let elapsed = 0
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const state = useGameStore.getState()
      if (!state.paused) elapsed += now - last
      last = now
      if (elapsed < 10_000 || state.phase !== 'chase' || state.flags.voicemailPlayed) return
      window.clearInterval(timer)
      setRinging(true)
      audio.startPhoneRing()
    }, 100)
    return () => window.clearInterval(timer)
  }, [phase, voicemailPlayed])

  // After 7s of ringing, auto-play the voicemail.
  useEffect(() => {
    if (!ringing || voicemailPlayed || autoAnswerStarted.current) return
    autoAnswerStarted.current = true
    let elapsed = 0
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const state = useGameStore.getState()
      if (!state.paused) elapsed += now - last
      last = now
      if (elapsed < 7_000 || state.flags.voicemailPlayed) return
      window.clearInterval(timer)
      answer()
    }, 100)
    return () => window.clearInterval(timer)
  }, [ringing, voicemailPlayed])

  useEffect(() => () => audio.stopPhoneRing(), [])

  useInteractable({
    id: 'kitchen-phone',
    object: ref,
    label: () => 'Answer the phone',
    enabled: () => ringing && useGameStore.getState().phase === 'chase' && !useGameStore.getState().flags.voicemailPlayed,
    onInteract: () => answer(),
  })

  return (
    <group ref={ref} position={PHONE_POS}>
      <group rotation-y={Math.PI} scale={PHONE_SCALE}>
        <Suspense fallback={<PhoneFallback />}>
          <PhoneMesh />
        </Suspense>
      </group>
      {ringing && <pointLight position={[0, 0.22, 0]} intensity={1.6} distance={1.3} color="#b33a24" />}
    </group>
  )
}

useGLTF.preload(PHONE_URL)

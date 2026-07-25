import { Howl, Howler } from 'howler'
import type { Phase } from '../../game/store'
import { phaseLoopFor } from './audioLogic'

export type SoundName =
  | 'calmAmbience'
  | 'chaseDrone'
  | 'playerStep'
  | 'entityStep'
  | 'heartbeat'
  | 'box'
  | 'rug'
  | 'hatch'
  | 'ladder'
  | 'deadbolt'
  | 'scareStinger'
  | 'shriek'
  | 'phoneRing'
  | 'voicemailBed'

interface PlayOptions {
  volume?: number
  rate?: number
  position?: [number, number, number]
}

interface ActiveLoop {
  howl: Howl
  id: number
  sound: SoundName
}

interface ActiveShot {
  howl: Howl
  id: number
}

const SOURCES: Record<SoundName, string> = {
  calmAmbience: '/audio/calm-ambience.wav',
  chaseDrone: '/audio/chase-drone.wav',
  playerStep: '/audio/player-step.wav',
  entityStep: '/audio/entity-step.wav',
  heartbeat: '/audio/heartbeat.wav',
  box: '/audio/box.wav',
  rug: '/audio/rug.wav',
  hatch: '/audio/hatch.wav',
  ladder: '/audio/ladder.wav',
  deadbolt: '/audio/deadbolt.wav',
  scareStinger: '/audio/scare-stinger.wav',
  shriek: '/audio/shriek.wav',
  phoneRing: '/audio/phone-ring.wav',
  voicemailBed: '/audio/voicemail-bed.wav',
}

const BASE_VOLUME: Record<SoundName, number> = {
  calmAmbience: 0.3,
  chaseDrone: 0.48,
  playerStep: 0.25,
  entityStep: 0.38,
  heartbeat: 0.5,
  box: 0.6,
  rug: 0.5,
  hatch: 0.7,
  ladder: 0.55,
  deadbolt: 0.75,
  scareStinger: 0.8,
  shriek: 0.85,
  phoneRing: 0.65,
  voicemailBed: 0.28,
}

class AudioManager {
  private sounds = new Map<SoundName, Howl>()
  private loops = new Map<string, ActiveLoop>()
  private armed = false
  private initialized = false
  private desiredPhase: Phase = 'title'
  private speech: SpeechSynthesisUtterance | null = null
  private voicemailTimers: number[] = []
  private paused = false
  private activeShots: ActiveShot[] = []
  private unlockHandler: (() => void) | null = null

  arm(): void {
    if (this.armed || typeof window === 'undefined') return
    this.armed = true
    const unlock = () => {
      this.unlockHandler = null
      void this.initialize()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    this.unlockHandler = unlock
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true
    for (const name of Object.keys(SOURCES) as SoundName[]) {
      this.sounds.set(name, new Howl({
        src: [SOURCES[name]],
        preload: true,
        volume: BASE_VOLUME[name],
      }))
    }
    if (Howler.ctx?.state === 'suspended') await Howler.ctx.resume()
    this.applyPhase(this.desiredPhase)
  }

  setPhase(phase: Phase): void {
    this.desiredPhase = phase
    if (!this.initialized) return
    this.applyPhase(phase)
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return
    this.paused = paused
    for (const active of this.loops.values()) {
      if (paused) active.howl.pause(active.id)
      else active.howl.play(active.id)
    }
    for (const active of this.activeShots) {
      if (paused) active.howl.pause(active.id)
      else active.howl.play(active.id)
    }
    const synth = typeof window === 'undefined'
      ? undefined
      : (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis
    if (paused) synth?.pause()
    else synth?.resume()
  }

  private applyPhase(phase: Phase): void {
    const next = phaseLoopFor(phase)
    if (!next) {
      this.stopLoop('phase', 450)
      this.stopLoop('heartbeat', 150)
      this.stopLoop('phone', 150)
      this.stopVoicemail()
      return
    }
    this.startLoop('phase', next, BASE_VOLUME[next], 900)
    if (phase !== 'chase') {
      this.stopLoop('heartbeat', 150)
      this.stopLoop('phone', 150)
    }
  }

  play(name: SoundName, options: PlayOptions = {}): number | null {
    if (!this.initialized || this.paused) return null
    const howl = this.sounds.get(name)
    if (!howl) return null
    const id = howl.play()
    howl.volume(options.volume ?? BASE_VOLUME[name], id)
    if (options.rate !== undefined) howl.rate(options.rate, id)
    if (options.position) howl.pos(...options.position, id)
    const shot = { howl, id }
    this.activeShots.push(shot)
    howl.once('end', () => {
      this.activeShots = this.activeShots.filter((active) => active !== shot)
    }, id)
    return id
  }

  startLoop(key: string, sound: SoundName, volume = BASE_VOLUME[sound], fadeMs = 180): void {
    if (!this.initialized) return
    const current = this.loops.get(key)
    if (current?.sound === sound) {
      current.howl.fade(current.howl.volume(current.id) as number, volume, fadeMs, current.id)
      return
    }
    if (current) this.stopLoop(key, fadeMs)
    const howl = this.sounds.get(sound)
    if (!howl) return
    const id = howl.play()
    howl.loop(true, id)
    howl.volume(0, id)
    howl.fade(0, volume, fadeMs, id)
    this.loops.set(key, { howl, id, sound })
  }

  updateLoop(key: string, volume: number, rate = 1): void {
    const active = this.loops.get(key)
    if (!active) return
    active.howl.volume(Math.max(0, Math.min(1, volume)), active.id)
    active.howl.rate(rate, active.id)
  }

  stopLoop(key: string, fadeMs = 180): void {
    const active = this.loops.get(key)
    if (!active) return
    this.loops.delete(key)
    const from = active.howl.volume(active.id) as number
    active.howl.fade(from, 0, fadeMs, active.id)
    window.setTimeout(() => active.howl.stop(active.id), fadeMs + 20)
  }

  setHeartbeat(volume: number, bpm: number): void {
    if (volume <= 0.01) {
      this.stopLoop('heartbeat', 120)
      return
    }
    this.startLoop('heartbeat', 'heartbeat', volume, 100)
    this.updateLoop('heartbeat', volume, bpm / 60)
  }

  startPhoneRing(): void {
    this.startLoop('phone', 'phoneRing', BASE_VOLUME.phoneRing, 80)
  }

  stopPhoneRing(): void {
    this.stopLoop('phone', 100)
  }

  playVoicemail(lines: string[], onLine: (line: string) => void, onDone?: () => void): void {
    if (this.speech || typeof window === 'undefined') return
    this.stopPhoneRing()
    this.startLoop('voicemail', 'voicemailBed', BASE_VOLUME.voicemailBed, 100)
    const text = lines.join(' ')
    const totalMs = Math.max(6500, text.length * 55)
    lines.forEach((line, index) => {
      const timer = window.setTimeout(() => onLine(line), index * totalMs / lines.length)
      this.voicemailTimers.push(timer)
    })
    const synth = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis
    if (synth && typeof SpeechSynthesisUtterance !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.82
      utterance.pitch = 0.72
      utterance.volume = 0.82
      utterance.onend = () => this.finishVoicemail(onDone)
      utterance.onerror = () => this.finishVoicemail(onDone)
      this.speech = utterance
      synth.speak(utterance)
    } else {
      const timer = window.setTimeout(() => this.finishVoicemail(onDone), totalMs)
      this.voicemailTimers.push(timer)
    }
  }

  private finishVoicemail(onDone?: () => void): void {
    this.speech = null
    this.stopLoop('voicemail', 250)
    onDone?.()
  }

  stopVoicemail(): void {
    this.voicemailTimers.forEach((timer) => window.clearTimeout(timer))
    this.voicemailTimers = []
    if (typeof window !== 'undefined') {
      const synth = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis
      synth?.cancel()
    }
    this.speech = null
    this.stopLoop('voicemail', 100)
  }

  cleanup(): void {
    if (this.unlockHandler && typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', this.unlockHandler)
      window.removeEventListener('keydown', this.unlockHandler)
      this.unlockHandler = null
      this.armed = false
    }
    this.voicemailTimers.forEach((timer) => window.clearTimeout(timer))
    this.voicemailTimers = []
    if (typeof window !== 'undefined') {
      const synth = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis
      synth?.cancel()
    }
    this.speech = null
    this.loops.clear()
    this.activeShots = []
    for (const howl of this.sounds.values()) howl.stop()
  }
}

export const audio = new AudioManager()

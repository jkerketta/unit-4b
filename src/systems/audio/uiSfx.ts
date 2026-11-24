// Procedural UI sounds synthesized with WebAudio so menus and dialogue
// get tactile feedback without shipping extra audio files.

let ctx: AudioContext | null = null
let lastBlip = 0

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number): void {
  const ac = getCtx()
  if (!ac) return
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2400
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.006)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(filter).connect(amp).connect(ac.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noiseBurst(dur: number, gain: number, cutoff: number): void {
  const ac = getCtx()
  if (!ac) return
  const t = ac.currentTime
  const buffer = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = cutoff
  filter.Q.value = 0.8
  const amp = ac.createGain()
  amp.gain.value = gain
  src.connect(filter).connect(amp).connect(ac.destination)
  src.start(t)
}

/** Soft analog tick when hovering or moving focus between menu items. */
export function sfxHover(): void {
  tone(1850 + Math.random() * 120, 0.035, 'square', 0.018)
  noiseBurst(0.02, 0.05, 3200)
}

/** Heavier relay-click thump for confirming a menu choice. */
export function sfxSelect(): void {
  tone(180, 0.18, 'triangle', 0.12, 70)
  noiseBurst(0.06, 0.12, 900)
}

/** Low descending sting for going back / closing panels. */
export function sfxBack(): void {
  tone(420, 0.12, 'sine', 0.05, 220)
}

/** Typewriter-ish voice blip; pitch differs per speaker. Rate-limited. */
export function sfxBlip(speaker: 'LANDLORD' | 'YOU' | string): void {
  const now = performance.now()
  if (now - lastBlip < 45) return
  lastBlip = now
  const base = speaker === 'LANDLORD' ? 118 : speaker === 'YOU' ? 210 : 160
  tone(base + Math.random() * 18, 0.05, 'triangle', 0.035)
  noiseBurst(0.015, 0.02, 2400)
}

/** Deep sub-boom used when the game begins. */
export function sfxStartBoom(): void {
  tone(90, 1.4, 'sine', 0.22, 32)
  tone(46, 1.8, 'sine', 0.18, 28)
  noiseBurst(0.9, 0.08, 300)
}

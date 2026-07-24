export const RESOLUTION_SCALE = 0.25
export const INTERNAL_RESOLUTION = { width: 480, height: 270 } // reference only; real size = canvas * RESOLUTION_SCALE
export const PLAYER = {
  radius: 0.3,
  height: 1.7,
  eyeHeight: 1.6,
  walkSpeed: 2.6,
  sprintSpeed: 4.5,
  staminaMax: 100,
  staminaDrainPerSec: 20,
  staminaRegenPerSec: 10,
  staminaRegenDelaySec: 1,
} as const
export const ENTITY = {
  searchSpeed: 1.6,
  chaseSpeed: 3.4,
  catchRadius: 1.2,
  alertDurationSec: 2,
  hearingRadius: 6,
} as const
export const FOG = { color: '#050505', density: 0.16 } as const

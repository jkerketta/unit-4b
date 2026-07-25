/** Suppress auto-pause from PointerLock unlock after an intentional Esc toggle. */
let suppressUntil = 0

export function suppressUnlockPause(ms = 400) {
  suppressUntil = Math.max(suppressUntil, performance.now() + ms)
}

export function shouldPauseOnUnlock() {
  return performance.now() >= suppressUntil
}

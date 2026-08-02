export interface FeedbackPayload {
  name: string
  email: string
  feedback: string
  device: string
  total_time_sec: number
  escape_sec: number
  completed_at_iso: string
  submitted_at_iso: string
}

export interface FeedbackFormValues {
  name: string
  email: string
  feedback: string
  device: string
}

export interface FeedbackFieldErrors {
  name?: string
  email?: string
  feedback?: string
}

export interface FeedbackSubmitResult {
  ok: boolean
  error?: string
}

// The game has no backend of its own. The win-screen feedback form POSTs JSON
// to a Google Apps Script web app, which writes the row to a spreadsheet.
//
// The deployed web app URL is baked in below so every build (Vercel, local,
// preview) can send feedback. A `VITE_FEEDBACK_ENDPOINT` env var still takes
// precedence if you ever need to point at a different script (see
// resolveEndpoint).
export const DEFAULT_FEEDBACK_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbwCJ49-Iuslvi1m7qmkfQH1JSIOwrkpun0drRQngLsv20s344tSx242NV1-_U96mRoMjQ/exec'

function resolveEndpoint(): string {
  const fromEnv = import.meta.env.VITE_FEEDBACK_ENDPOINT
  return typeof fromEnv === 'string' && fromEnv.trim() ? fromEnv.trim() : DEFAULT_FEEDBACK_ENDPOINT
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateFeedback(values: FeedbackFormValues): FeedbackFieldErrors {
  const errors: FeedbackFieldErrors = {}
  if (!values.name.trim()) errors.name = 'Name is required.'
  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (!values.feedback.trim()) errors.feedback = 'Feedback is required.'
  return errors
}

export function captureDevice(): string {
  const nav = typeof navigator !== 'undefined' ? navigator : null
  const ua = nav?.userAgent ?? 'unknown'
  const hints: string[] = []
  if (nav && typeof nav.maxTouchPoints === 'number' && nav.maxTouchPoints > 0) hints.push('touch')
  if (nav && typeof nav.platform === 'string' && /iPhone|iPod|iPad|Android/i.test(nav.platform)) hints.push('mobile')
  const compact = hints.length ? `${ua} | ${hints.join(', ')}` : ua
  return compact.length > 240 ? `${compact.slice(0, 237)}...` : compact
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Apps Script web apps answer a POST with a 302 redirect to
// script.googleusercontent.com; the browser follows it automatically and the
// final response is 2xx when the script returns ContentService output.
// `text/plain` keeps the request from triggering a CORS preflight.
export async function submitFeedback(payload: FeedbackPayload, endpoint = resolveEndpoint()): Promise<FeedbackSubmitResult> {
  if (!endpoint) {
    return { ok: false, error: 'Feedback is not configured yet.' }
  }
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { ok: false, error: `Submission failed (HTTP ${res.status}).` }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Network error — could not reach the feedback server.' }
  }
}

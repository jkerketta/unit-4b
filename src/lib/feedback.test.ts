import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  captureDevice,
  DEFAULT_FEEDBACK_ENDPOINT,
  formatTime,
  submitFeedback,
  validateFeedback,
  type FeedbackPayload,
} from './feedback'

const validPayload: FeedbackPayload = {
  name: 'Test',
  email: 'test@example.com',
  feedback: 'Loved it',
  device: 'browser',
  total_time_sec: 330,
  escape_sec: 270,
  completed_at_iso: '2026-08-02T12:05:30.000Z',
  submitted_at_iso: '2026-08-02T12:30:00.000Z',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('validateFeedback', () => {
  it('requires name, email, and feedback', () => {
    const errors = validateFeedback({ name: '', email: '', feedback: '', device: 'x' })
    expect(errors.name).toBe('Name is required.')
    expect(errors.email).toBe('Email is required.')
    expect(errors.feedback).toBe('Feedback is required.')
  })

  it('rejects a malformed email', () => {
    const errors = validateFeedback({ name: 'A', email: 'not-an-email', feedback: 'B', device: 'x' })
    expect(errors.email).toBe('Enter a valid email address.')
    expect(errors.name).toBeUndefined()
    expect(errors.feedback).toBeUndefined()
  })

  it('accepts a fully valid form', () => {
    expect(validateFeedback({ name: 'A', email: 'a@b.com', feedback: 'B', device: 'x' })).toEqual({})
  })
})

describe('captureDevice', () => {
  it('returns a sane string as jsdom provides', () => {
    const device = captureDevice()
    expect(typeof device).toBe('string')
    expect(device.length).toBeGreaterThan(0)
    expect(device).toContain(navigator.userAgent)
  })

  it('appends a touch hint when the navigator reports touch points', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 })
    expect(captureDevice()).toContain('touch')
    Reflect.deleteProperty(navigator, 'maxTouchPoints')
    expect(captureDevice()).not.toContain('touch')
  })

  it('caps the device string at a compact length', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get: () => 'x'.repeat(1000),
    })
    const device = captureDevice()
    expect(device.length).toBeLessThanOrEqual(240)
    Reflect.deleteProperty(navigator, 'userAgent')
  })
})

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(59)).toBe('0:59')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(603)).toBe('10:03')
    expect(formatTime(-5)).toBe('0:00')
  })
})

describe('submitFeedback', () => {
  it('POSTs the payload as JSON to the Apps Script endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitFeedback(validPayload, 'https://script.google.com/macros/s/TEST/exec')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://script.google.com/macros/s/TEST/exec')
    expect(options.method).toBe('POST')
    expect(options.redirect).toBe('follow')
    expect(options.headers).toMatchObject({ 'Content-Type': 'text/plain;charset=utf-8' })
    expect(options.body).toBe(JSON.stringify(validPayload))
  })

  it('falls back to the baked-in default endpoint when no env var is set', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', '')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitFeedback(validPayload)

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(DEFAULT_FEEDBACK_ENDPOINT)
    expect(DEFAULT_FEEDBACK_ENDPOINT).toContain('script.google.com')
  })

  it('does not POST when no endpoint is configured', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitFeedback(validPayload, '')

    expect(result.ok).toBe(false)
    expect(result.error).toContain('not configured')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces a non-2xx response as an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const result = await submitFeedback(validPayload, 'https://x/exec')

    expect(result.ok).toBe(false)
    expect(result.error).toContain('500')
  })

  it('surfaces a network failure as an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const result = await submitFeedback(validPayload, 'https://x/exec')

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Network error')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import FeedbackForm from './FeedbackForm'
import { captureDevice, DEFAULT_FEEDBACK_ENDPOINT } from '../lib/feedback'

const props = {
  totalTimeSec: 330,
  escapeSec: 270,
  completedAtIso: '2026-08-02T12:05:30.000Z',
}

let container: HTMLDivElement
let root: Root

function renderForm() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<FeedbackForm {...props} />)
  })
}

function cleanup() {
  act(() => {
    root?.unmount()
  })
  container?.remove()
}

function setValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  act(() => {
    setter?.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function field(name: string): HTMLInputElement | HTMLTextAreaElement {
  return container.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement
}

async function submit() {
  const button = container.querySelector('button[type="submit"]') as HTMLButtonElement
  await act(async () => {
    button.click()
  })
}

function fillValidForm() {
  setValue(field('name'), 'Ada Lovelace')
  setValue(field('email'), 'ada@example.com')
  setValue(field('feedback'), 'The hatch scare got me.')
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('FeedbackForm', () => {
  it('blocks submit and shows inline errors until all required fields are valid', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderForm()

    await submit()

    expect(fetchMock).not.toHaveBeenCalled()
    const alerts = container.querySelectorAll('[role="alert"]')
    expect(alerts.length).toBe(3)
  })

  it('captures the device into the payload without displaying it', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', 'https://script.google.com/macros/s/TEST/exec')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    renderForm()

    expect(container.querySelector('.feedback-device')).toBeNull()

    fillValidForm()
    await submit()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(options.body as string)
    expect(body.device).toBe(captureDevice())
  })

  it('submits the expected payload and shows a success state', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', 'https://script.google.com/macros/s/TEST/exec')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const toISOStringSpy = vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-08-02T12:30:00.000Z')
    renderForm()

    fillValidForm()
    await submit()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://script.google.com/macros/s/TEST/exec')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body as string)).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      feedback: 'The hatch scare got me.',
      device: captureDevice(),
      total_time_sec: 330,
      escape_sec: 270,
      completed_at_iso: '2026-08-02T12:05:30.000Z',
      submitted_at_iso: '2026-08-02T12:30:00.000Z',
    })
    expect(toISOStringSpy).toHaveBeenCalled()
    expect(container.textContent).toContain('THANK YOU')
  })

  it('shows an error state when submission fails', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', 'https://script.google.com/macros/s/TEST/exec')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    renderForm()

    fillValidForm()
    await submit()

    expect(container.textContent).toContain('Network error')
  })

  it('submits to the baked-in default endpoint when no env var is set', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', '')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    renderForm()

    fillValidForm()
    await submit()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(DEFAULT_FEEDBACK_ENDPOINT)
    expect(container.textContent).toContain('THANK YOU')
  })
})

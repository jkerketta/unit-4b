import { useMemo, useState, type FormEvent } from 'react'
import {
  captureDevice,
  submitFeedback,
  validateFeedback,
  type FeedbackFieldErrors,
  type FeedbackPayload,
} from '../lib/feedback'

type Status = 'idle' | 'sending' | 'success' | 'error'

interface FeedbackFormProps {
  totalTimeSec: number
  escapeSec: number
  completedAtIso: string
}

export default function FeedbackForm({ totalTimeSec, escapeSec, completedAtIso }: FeedbackFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [errors, setErrors] = useState<FeedbackFieldErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const device = useMemo(captureDevice, [])

  if (status === 'success') {
    return (
      <div className="feedback-form" role="status" aria-live="polite">
        <h2>THANK YOU</h2>
        <p>Feedback received. Thanks for playing Unit 4B.</p>
      </div>
    )
  }

  const buildPayload = (): FeedbackPayload => ({
    name: name.trim(),
    email: email.trim(),
    feedback: feedback.trim(),
    device,
    total_time_sec: totalTimeSec,
    escape_sec: escapeSec,
    completed_at_iso: completedAtIso,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAttempted(true)
    const nextErrors = validateFeedback({ name, email, feedback, device })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus('idle')
      setErrorMessage(null)
      return
    }
    setStatus('sending')
    setErrorMessage(null)
    const result = await submitFeedback(buildPayload())
    if (result.ok) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMessage(result.error ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <form className="feedback-form" noValidate onSubmit={handleSubmit}>
      <h2>LEAVE FEEDBACK</h2>
      <label className={attempted && errors.name ? 'field field-invalid' : 'field'}>
        <span>Name</span>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={attempted && Boolean(errors.name)}
        />
        {attempted && errors.name && <em role="alert">{errors.name}</em>}
      </label>
      <label className={attempted && errors.email ? 'field field-invalid' : 'field'}>
        <span>Email</span>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={attempted && Boolean(errors.email)}
        />
        {attempted && errors.email && <em role="alert">{errors.email}</em>}
      </label>
      <label className={attempted && errors.feedback ? 'field field-invalid' : 'field'}>
        <span>Feedback</span>
        <textarea
          name="feedback"
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          aria-invalid={attempted && Boolean(errors.feedback)}
        />
        {attempted && errors.feedback && <em role="alert">{errors.feedback}</em>}
      </label>
      <p className="feedback-device">
        <span>Device</span>
        <output>{device}</output>
      </p>
      {status === 'error' && (
        <p className="feedback-error" role="alert">{errorMessage}</p>
      )}
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Submit feedback'}
      </button>
    </form>
  )
}

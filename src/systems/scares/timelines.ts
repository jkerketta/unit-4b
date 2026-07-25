export interface TimelineStep {
  at: number
  do: () => void
}

export interface TimelineState {
  elapsed: number
  fired: Set<number>
}

export function advanceTimeline(state: TimelineState, steps: TimelineStep[], elapsed: number): TimelineState {
  const fired = new Set(state.fired)
  steps.forEach((step, index) => {
    if (elapsed >= step.at && !fired.has(index)) {
      fired.add(index)
      step.do()
    }
  })
  return { elapsed, fired }
}

export function runTimeline(steps: TimelineStep[], now = 0): TimelineState {
  return advanceTimeline({ elapsed: 0, fired: new Set<number>() }, steps, now)
}

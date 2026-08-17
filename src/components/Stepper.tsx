import type { Step } from '../types'
import { FLOW, flowIndex } from '../state/flow'

export function Stepper({
  current,
  reachable,
  onNavigate,
}: {
  current: Step
  reachable: Step[]
  onNavigate: (step: Step) => void
}) {
  const currentIndex = flowIndex(current)
  if (currentIndex < 0) return null

  return (
    <nav className="stepper" aria-label="Progress">
      {FLOW.map((entry, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'todo'
        const canGo = reachable.includes(entry.step) && entry.step !== current
        return (
          <div key={entry.step} style={{ display: 'contents' }}>
            {i > 0 && (
              <span className="stepper__sep" aria-hidden="true">
                ›
              </span>
            )}
            {canGo ? (
              <button
                type="button"
                className="stepper__item"
                data-state={state}
                onClick={() => onNavigate(entry.step)}
                style={{ cursor: 'pointer' }}
              >
                <span className="stepper__num" aria-hidden="true">
                  {state === 'done' ? '✓' : i + 1}
                </span>
                {entry.short}
              </button>
            ) : (
              <span
                className="stepper__item"
                data-state={state}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <span className="stepper__num" aria-hidden="true">
                  {state === 'done' ? '✓' : i + 1}
                </span>
                {entry.short}
                {state === 'current' && <span className="sr-only"> (current step)</span>}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

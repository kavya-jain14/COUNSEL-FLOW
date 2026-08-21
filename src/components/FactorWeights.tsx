import type { FactorKey, FactorWeights as Weights } from '../types'
import { FACTORS, WEIGHT_WORDS } from '../data/reference'

export function FactorWeightSliders({
  weights,
  error,
  onChange,
}: {
  weights: Weights
  error?: string
  onChange: (next: Weights) => void
}) {
  return (
    <div className="stack stack--sm">
      <div className="row row--between">
        <div>
          <h3>What should tip the balance?</h3>
          <p className="field__hint">
            These are soft preferences. They move options up or down and shape the reason
            shown next to each row: they never remove a college from your list.
          </p>
        </div>
      </div>

      {FACTORS.map((factor) => {
        const id = `weight-${factor.key}`
        const value = weights[factor.key]
        return (
          <div className="field" key={factor.key}>
            <label className="field__label" htmlFor={id}>
              {factor.label}
            </label>
            <span className="field__hint">{factor.hint}</span>
            <div className="slider-row">
              <input
                id={id}
                type="range"
                min={0}
                max={5}
                step={1}
                value={value}
                aria-valuetext={`${WEIGHT_WORDS[value]} (${value} of 5)`}
                onChange={(e) =>
                  onChange({ ...weights, [factor.key as FactorKey]: Number(e.target.value) })
                }
              />
              <output className="slider-value" htmlFor={id}>
                {WEIGHT_WORDS[value]}
              </output>
            </div>
          </div>
        )
      })}

      <div className="weight-ticks" aria-hidden="true">
        <span>0 · ignore</span>
        <span>5 · decisive</span>
      </div>

      {error && (
        <span className="field__error" role="alert">
          <span aria-hidden="true">Field</span>
          {error}
        </span>
      )}
    </div>
  )
}

import { useId } from 'react'
import type { ConstraintSetting } from '../types'
import { HardSoftBadge } from './ui'

export function ConstraintControl({
  label,
  hint,
  setting,
  min,
  max,
  step,
  format,
  error,
  hardBehaviour,
  softBehaviour,
  onChange,
}: {
  label: string
  hint: string
  setting: ConstraintSetting
  min: number
  max: number
  step: number
  format: (value: number) => string
  error?: string
  hardBehaviour: string
  softBehaviour: string
  onChange: (next: ConstraintSetting) => void
}) {
  const id = useId()
  const groupName = `${id}-mode`

  return (
    <div className="constraint" data-mode={setting.mode}>
      <div className="stack stack--sm">
        <div className="row row--between">
          <label className="field__label" htmlFor={id}>
            {label}
            <HardSoftBadge mode={setting.mode} />
          </label>
        </div>

        <span className="field__hint">{hint}</span>

        <div className="slider-row">
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={setting.value}
            aria-describedby={`${id}-behaviour`}
            onChange={(e) => onChange({ ...setting, value: Number(e.target.value) })}
          />
          <output className="slider-value" htmlFor={id}>
            {format(setting.value)}
          </output>
        </div>

        <div className="row">
          <span className="section-label" id={`${id}-mode-label`}>
            Treat as
          </span>
          <div className="segmented" role="radiogroup" aria-labelledby={`${id}-mode-label`}>
            <label className="segmented__opt">
              <input
                type="radio"
                name={groupName}
                checked={setting.mode === 'hard'}
                onChange={() => onChange({ ...setting, mode: 'hard' })}
              />
              <span>Hard limit</span>
            </label>
            <label className="segmented__opt">
              <input
                type="radio"
                name={groupName}
                checked={setting.mode === 'soft'}
                onChange={() => onChange({ ...setting, mode: 'soft' })}
              />
              <span>Soft preference</span>
            </label>
          </div>
        </div>

        <p className="constraint__behaviour" id={`${id}-behaviour`}>
          <span aria-hidden="true">{setting.mode === 'hard' ? '⛔' : '◇'}</span>
          {setting.mode === 'hard' ? hardBehaviour : softBehaviour}
        </p>

        {error && (
          <span className="field__error" role="alert">
            <span aria-hidden="true">✕</span>
            {error}
          </span>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { HardExclusion, HardExclusionKind } from '../types'
import {
  BRANCHES,
  BRANCH_LABELS,
  CITIES,
  INSTITUTE_TYPE_LABELS,
} from '../data/reference'
import { Field } from './ui'

const KINDS: Array<{ kind: HardExclusionKind; label: string }> = [
  { kind: 'branch', label: 'A branch' },
  { kind: 'instituteType', label: 'An institute type' },
  { kind: 'location', label: 'A city' },
  { kind: 'noHostel', label: 'Colleges without a hostel' },
]

function optionsFor(kind: HardExclusionKind): Array<{ value: string; label: string }> {
  switch (kind) {
    case 'branch':
      return BRANCHES.map((b) => ({ value: b, label: `${b}: ${BRANCH_LABELS[b]}` }))
    case 'instituteType':
      return Object.entries(INSTITUTE_TYPE_LABELS).map(([value, label]) => ({ value, label }))
    case 'location':
      return CITIES.map((c) => ({ value: c, label: c }))
    case 'noHostel':
      return []
  }
}

function labelFor(kind: HardExclusionKind, value: string): string {
  switch (kind) {
    case 'branch':
      return `Never accept ${value}`
    case 'instituteType':
      return `Never accept ${INSTITUTE_TYPE_LABELS[value as keyof typeof INSTITUTE_TYPE_LABELS] ?? value} colleges`
    case 'location':
      return `Never accept colleges in ${value}`
    case 'noHostel':
      return 'Never accept a college without a hostel'
  }
}

export function ExclusionPicker({
  value,
  error,
  onChange,
}: {
  value: HardExclusion[]
  error?: string
  onChange: (next: HardExclusion[]) => void
}) {
  const [kind, setKind] = useState<HardExclusionKind>('branch')
  const [pick, setPick] = useState('')

  const options = optionsFor(kind).filter(
    (o) => !value.some((ex) => ex.kind === kind && ex.value === o.value),
  )
  const canAdd = kind === 'noHostel' ? !value.some((ex) => ex.kind === 'noHostel') : Boolean(pick)

  function add() {
    const resolvedValue = kind === 'noHostel' ? 'true' : pick
    if (!resolvedValue) return
    const exclusion: HardExclusion = {
      id: `${kind}:${resolvedValue}`,
      kind,
      value: resolvedValue,
      label: labelFor(kind, resolvedValue),
    }
    if (value.some((ex) => ex.id === exclusion.id)) return
    onChange([...value, exclusion])
    setPick('')
  }

  return (
    <Field
      label="Never accept"
      hint="Hard exclusions remove every matching option and mark the breach critical. They never act as ranking weights."
      error={error}
    >
      {value.length > 0 && (
        <div className="chips">
          {value.map((ex) => (
            <span className="chip chip--hard" key={ex.id}>
              <span className="mono" aria-hidden="true">H</span>
              {ex.label}
              <button
                type="button"
                className="chip__remove"
                aria-label={`Remove exclusion: ${ex.label}`}
                onClick={() => onChange(value.filter((e) => e.id !== ex.id))}
              >
                Remove
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: value.length ? 10 : 0 }}>
        <label className="sr-only" htmlFor="exclusion-kind">
          Type of exclusion
        </label>
        <select
          id="exclusion-kind"
          className="select"
          style={{ maxWidth: 210 }}
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as HardExclusionKind)
            setPick('')
          }}
        >
          {KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>
              {k.label}
            </option>
          ))}
        </select>

        {kind !== 'noHostel' && (
          <>
            <label className="sr-only" htmlFor="exclusion-value">
              Value to exclude
            </label>
            <select
              id="exclusion-value"
              className="select"
              style={{ maxWidth: 280 }}
              value={pick}
              onChange={(e) => setPick(e.target.value)}
            >
              <option value="">Choose…</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        )}

        <button type="button" className="btn btn--sm" disabled={!canAdd} onClick={add}>
          Add exclusion
        </button>
      </div>
    </Field>
  )
}

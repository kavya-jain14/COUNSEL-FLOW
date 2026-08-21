import { useMemo, useState } from 'react'
import type { CandidateProfile, StrategyItem } from '../types'
import type { EngineContext } from '../mock/engine'
import { BRANCHES, BRANCH_LABELS } from '../data/reference'
import { MAX_BUDGET, MAX_DISTANCE, MIN_BUDGET, MIN_DISTANCE } from '../lib/validation'
import { formatINR, formatKm } from '../lib/format'
import { applyLever, describeLever, runWhatIf, type LeverId } from '../lib/whatif'
import { Dialog } from './ui'

const LEVERS: Array<{ id: LeverId; label: string; blurb: string }> = [
  { id: 'distance', label: 'Distance limit', blurb: 'How far you would go' },
  { id: 'budget', label: 'Annual budget', blurb: 'What you can pay per year' },
  { id: 'placements', label: 'Placement weight', blurb: 'How much placements matter' },
  { id: 'branchTop', label: 'Top branch', blurb: 'Which branch you want most' },
  { id: 'budgetMode', label: 'Budget hard/soft', blurb: 'Blocks options, or only ranks them' },
  { id: 'distanceMode', label: 'Distance hard/soft', blurb: 'Blocks options, or only ranks them' },
]

function initialValue(profile: CandidateProfile, lever: LeverId): number | string {
  switch (lever) {
    case 'distance':
      return profile.distance.value
    case 'budget':
      return profile.budget.value
    case 'placements':
      return profile.factorWeights.placements
    case 'branchTop':
      return profile.branchPriority[0] ?? 'CSE'
    case 'budgetMode':
      return profile.budget.mode
    case 'distanceMode':
      return profile.distance.mode
  }
}

function rowLabel(item: StrategyItem): string {
  return `${item.option.collegeShort} · ${item.option.branch}`
}

export function WhatIfPanel({
  profile,
  items,
  context,
  onClose,
  onApply,
}: {
  profile: CandidateProfile
  items: StrategyItem[]
  context: EngineContext
  onClose: () => void
  onApply: (next: CandidateProfile) => void
}) {
  const [lever, setLever] = useState<LeverId>('distance')
  const [value, setValue] = useState<number | string>(() => initialValue(profile, 'distance'))

  const result = useMemo(
    () => runWhatIf(profile, items, lever, value, context),
    [profile, items, lever, value, context],
  )
  const change = describeLever(lever, profile, value)
  const touched = change.from !== change.to
  const delta = result.after.length - result.before.length

  function pick(next: LeverId) {
    setLever(next)
    setValue(initialValue(profile, next))
  }

  return (
    <Dialog title="What if you changed one thing?" onClose={onClose}>
      <p className="card__hint">
        Nothing here touches your saved profile until you apply it. The same engine that built
        your list rebuilds it here.
      </p>

      <div className="whatif__levers" role="tablist" aria-label="Preference to test">
        {LEVERS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={lever === l.id}
            className="whatif__lever"
            data-active={lever === l.id}
            onClick={() => pick(l.id)}
          >
            <b>{l.label}</b>
            <small>{l.blurb}</small>
          </button>
        ))}
      </div>

      <div className="whatif__control">
        {lever === 'distance' && (
          <label className="field">
            <span className="field__label">Distance limit: {formatKm(Number(value))}</span>
            <input
              type="range"
              min={MIN_DISTANCE}
              max={MAX_DISTANCE}
              step={10}
              value={Number(value)}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </label>
        )}
        {lever === 'budget' && (
          <label className="field">
            <span className="field__label">Annual budget: {formatINR(Number(value))}</span>
            <input
              type="range"
              min={MIN_BUDGET}
              max={MAX_BUDGET}
              step={5000}
              value={Number(value)}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </label>
        )}
        {lever === 'placements' && (
          <label className="field">
            <span className="field__label">Placement weight: {value} of 5</span>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={Number(value)}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </label>
        )}
        {lever === 'branchTop' && (
          <label className="field">
            <span className="field__label">Put this branch first</span>
            <select
              className="select"
              value={String(value)}
              onChange={(e) => setValue(e.target.value)}
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}: {BRANCH_LABELS[b]}
                </option>
              ))}
            </select>
          </label>
        )}
        {(lever === 'budgetMode' || lever === 'distanceMode') && (
          <div className="segmented" role="radiogroup" aria-label="Treat as">
            {(['hard', 'soft'] as const).map((m) => (
              <label className="segmented__opt" key={m}>
                <input
                  type="radio"
                  name="whatif-mode"
                  checked={value === m}
                  onChange={() => setValue(m)}
                />
                <span>{m === 'hard' ? 'Hard limit' : 'Soft preference'}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="whatif__grid">
        <section className="whatif__col">
          <span className="section-label">Before</span>
          <p className="whatif__val">{change.from}</p>
          <p className="whatif__count">
            <b>{result.before.length}</b> feasible options
          </p>
          <ol className="whatif__list">
            {result.before.slice(0, 4).map((i) => (
              <li key={i.itemId}>{rowLabel(i)}</li>
            ))}
          </ol>
        </section>

        <section className="whatif__col" data-after="true">
          <span className="section-label">After</span>
          <p className="whatif__val">{change.to}</p>
          <p className="whatif__count">
            <b>{result.after.length}</b> feasible options
            {delta !== 0 && (
              <span className="whatif__delta" data-dir={delta > 0 ? 'up' : 'down'}>
                {delta > 0 ? '+' : ''}
                {delta}
              </span>
            )}
          </p>
          <ol className="whatif__list">
            {result.after.slice(0, 4).map((i) => (
              <li key={i.itemId}>{rowLabel(i)}</li>
            ))}
          </ol>
        </section>
      </div>

      <p className="whatif__explain">{result.explanation}</p>

      {touched && (result.entered.length > 0 || result.dropped.length > 0 || result.moved.length > 0) && (
        <div className="whatif__diffs">
          {result.entered.length > 0 && (
            <div className="whatif__diff" data-kind="in">
              <span className="section-label">Entered · {result.entered.length}</span>
              <ul>
                {result.entered.slice(0, 5).map((i) => (
                  <li key={i.itemId}>{rowLabel(i)}</li>
                ))}
              </ul>
            </div>
          )}
          {result.dropped.length > 0 && (
            <div className="whatif__diff" data-kind="out">
              <span className="section-label">Dropped · {result.dropped.length}</span>
              <ul>
                {result.dropped.slice(0, 5).map((i) => (
                  <li key={i.itemId}>{rowLabel(i)}</li>
                ))}
              </ul>
            </div>
          )}
          {result.moved.length > 0 && (
            <div className="whatif__diff" data-kind="move">
              <span className="section-label">Reordered · {result.moved.length}</span>
              <ul>
                {result.moved.slice(0, 5).map((m) => (
                  <li key={m.item.itemId}>
                    {rowLabel(m.item)} <span className="mono">#{m.from} to #{m.to}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="row row--between" style={{ marginTop: 4 }}>
        <button type="button" className="btn" onClick={onClose}>
          Keep current preferences
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!touched}
          onClick={() => onApply(applyLever(profile, lever, value))}
        >
          Apply this change
        </button>
      </div>
    </Dialog>
  )
}

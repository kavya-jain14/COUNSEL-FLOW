import { useState } from 'react'
import type { BranchCode } from '../types'
import { BRANCHES, BRANCH_LABELS } from '../data/reference'
import { Field } from './ui'

export function BranchPriority({
  value,
  error,
  onChange,
}: {
  value: BranchCode[]
  error?: string
  onChange: (next: BranchCode[]) => void
}) {
  const [toAdd, setToAdd] = useState<BranchCode | ''>('')
  const available = BRANCHES.filter((b) => !value.includes(b))

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <Field
      label="Branch priority"
      hint="Rank the branches in your real order of preference. Position 1 is what you want most — the audit checks your list against this order."
      error={error}
    >
      {value.length === 0 ? (
        <p className="empty" style={{ padding: '16px 0' }}>
          No branches yet. Add at least one below.
        </p>
      ) : (
        <ol className="branch-list">
          {value.map((branch, i) => (
            <li className="branch-item" key={branch} data-top={i === 0}>
              <span className="branch-rank" aria-hidden="true">
                {i + 1}
              </span>
              <span className="branch-name">
                <b>{branch}</b>
                <small>{BRANCH_LABELS[branch] ?? branch}</small>
              </span>
              <span className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={
                    i === 0
                      ? `${branch} is already your first priority`
                      : `Move ${branch} up to priority ${i}`
                  }
                >
                  <span aria-hidden="true">↑</span>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label={
                    i === value.length - 1
                      ? `${branch} is already your last priority`
                      : `Move ${branch} down to priority ${i + 2}`
                  }
                >
                  <span aria-hidden="true">↓</span>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onChange(value.filter((b) => b !== branch))}
                  aria-label={`Remove ${branch} from your branch order`}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </span>
              <span className="sr-only">
                {branch} is priority {i + 1} of {value.length}.
              </span>
            </li>
          ))}
        </ol>
      )}

      {available.length > 0 && (
        <div className="row" style={{ marginTop: 4 }}>
          <label className="sr-only" htmlFor="branch-add">
            Add a branch to your priority order
          </label>
          <select
            id="branch-add"
            className="select"
            style={{ maxWidth: 280 }}
            value={toAdd}
            onChange={(e) => setToAdd(e.target.value as BranchCode | '')}
          >
            <option value="">Add a branch…</option>
            {available.map((b) => (
              <option key={b} value={b}>
                {b} — {BRANCH_LABELS[b]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn--sm"
            disabled={!toAdd}
            onClick={() => {
              if (!toAdd) return
              onChange([...value, toAdd])
              setToAdd('')
            }}
          >
            Add to bottom
          </button>
        </div>
      )}
    </Field>
  )
}

import { useState } from 'react'
import type { Conflict, StrategyItem } from '../types'
import { formatINRExact, formatKm } from '../lib/format'
import { SeverityBadge, TierBadge } from './ui'

const REASON_GLYPH = { positive: '+', negative: '−', neutral: '·' } as const

const CONFIDENCE_LABEL = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
} as const

export function StrategyRow({
  item,
  conflicts,
  isFirst,
  isLast,
  disabled,
  onMove,
  onRemove,
}: {
  item: StrategyItem
  conflicts: Conflict[]
  isFirst: boolean
  isLast: boolean
  disabled?: boolean
  onMove: (itemId: string, direction: -1 | 1) => void
  onRemove: (itemId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const worst = conflicts.find((c) => c.severity === 'CRITICAL') ?? conflicts[0]
  const { option } = item

  return (
    <li className="srow" data-flagged={worst?.severity}>
      <span className="srow__pos" aria-hidden="true">
        {item.position}
      </span>

      <div className="srow__body">
        <div className="row" style={{ gap: 8 }}>
          <span className="srow__title">
            <span className="sr-only">Position {item.position}: </span>
            {option.collegeShort} · {option.branch}
          </span>
          <TierBadge tier={item.tier} />
          {item.manuallyPlaced && <span className="badge badge--neutral">Moved by you</span>}
          {item.confidence !== 'high' && (
            <span className="badge badge--neutral">{CONFIDENCE_LABEL[item.confidence]}</span>
          )}
        </div>

        <div className="srow__meta">
          <span>{option.city}</span>
          <span>
            {option.annualFee == null ? 'Fee not on record' : `${formatINRExact(option.annualFee)}/yr`}
          </span>
          <span>{option.distanceKm == null ? 'Distance unknown' : formatKm(option.distanceKm)}</span>
          <span>{option.hostelAvailable ? 'Hostel available' : 'No hostel listed'}</span>
          <span className="mono">
            {option.sourceLabel} {option.sourceYear}
          </span>
        </div>

        {conflicts.length > 0 && (
          <div className="row" style={{ gap: 6 }}>
            {conflicts.map((c) => (
              <span className="row" key={c.id} style={{ gap: 5 }}>
                <SeverityBadge severity={c.severity} />
                <span className="field__hint">
                  {c.code} · {c.title}
                </span>
              </span>
            ))}
          </div>
        )}

        <div>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Hide why it is here' : 'Why is it here?'}
          </button>
        </div>

        {open && (
          <div className="why-panel">
            <span className="section-label">
              Why {option.collegeShort} · {option.branch} sits at #{item.position}
            </span>
            {item.reasons.map((reason) => (
              <div className="reason" key={reason.code} data-polarity={reason.polarity}>
                <span className="reason__glyph" aria-hidden="true">
                  {REASON_GLYPH[reason.polarity]}
                </span>
                <span>
                  <b>{reason.label}</b> <span>{reason.detail}</span>
                </span>
              </div>
            ))}
            {option.missingFacts.length > 0 && (
              <p className="field__hint">
                Not scored: {option.missingFacts.join(', ')} — missing from the dataset, so we
                excluded it rather than guessing.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="srow__controls">
        <button
          type="button"
          className="icon-btn"
          disabled={isFirst || disabled}
          onClick={() => onMove(item.itemId, -1)}
          aria-label={
            isFirst
              ? `${option.collegeShort} ${option.branch} is already your first choice`
              : `Move ${option.collegeShort} ${option.branch} up to position ${item.position - 1}`
          }
        >
          <span aria-hidden="true">↑</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={isLast || disabled}
          onClick={() => onMove(item.itemId, 1)}
          aria-label={
            isLast
              ? `${option.collegeShort} ${option.branch} is already your last choice`
              : `Move ${option.collegeShort} ${option.branch} down to position ${item.position + 1}`
          }
        >
          <span aria-hidden="true">↓</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={disabled}
          onClick={() => onRemove(item.itemId)}
          aria-label={`Remove ${option.collegeShort} ${option.branch} from the list`}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </li>
  )
}

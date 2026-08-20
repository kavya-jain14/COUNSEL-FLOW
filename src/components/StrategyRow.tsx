import type { Conflict, StrategyItem } from '../types'
import { formatINRExact, formatKm } from '../lib/format'
import { TierBadge } from './ui'

const SEVERITY_RANK = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const

export function StrategyRow({
  item,
  conflicts,
  selected,
  isFirst,
  isLast,
  disabled,
  onSelect,
  onMove,
  onRemove,
}: {
  item: StrategyItem
  conflicts: Conflict[]
  selected: boolean
  isFirst: boolean
  isLast: boolean
  disabled?: boolean
  onSelect: (itemId: string) => void
  onMove: (itemId: string, direction: -1 | 1) => void
  onRemove: (itemId: string) => void
}) {
  const { option } = item
  const worst = [...conflicts].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  )[0]
  const name = `${option.collegeShort} · ${option.branch}`

  return (
    <li className="lrow-wrap" data-flagged={worst?.severity}>
      <button
        type="button"
        className="lrow"
        aria-current={selected}
        onClick={() => onSelect(item.itemId)}
      >
        <span className="lrow__pos" aria-hidden="true">
          {String(item.position).padStart(2, '0')}
        </span>

        <span className="lrow__main">
          <span className="lrow__name">
            <span className="sr-only">Choice {item.position}: </span>
            {name}
          </span>
          <span className="lrow__where">
            <span>{option.city}</span>
            <span>
              {option.annualFee == null
                ? 'Fee not on record'
                : `${formatINRExact(option.annualFee)}/yr`}
            </span>
            <span>{option.distanceKm == null ? 'Distance unknown' : formatKm(option.distanceKm)}</span>
          </span>
          {(item.manuallyPlaced || item.confidence !== 'high') && (
            <span className="lrow__flags">
              {item.manuallyPlaced && <span className="badge badge--neutral">Moved by you</span>}
              {item.confidence !== 'high' && (
                <span className="badge badge--neutral">{item.confidence} confidence</span>
              )}
            </span>
          )}
        </span>

        <span className="lrow__tier">
          <TierBadge tier={item.tier} />
        </span>

        <span className="lrow__status">
          {worst ? (
            <span className="lrow__flag" data-severity={worst.severity}>
              <span className="lrow__dot" aria-hidden="true" />
              {conflicts.length} {conflicts.length > 1 ? 'issues' : 'issue'}
            </span>
          ) : (
            <span className="lrow__clear">
              <span aria-hidden="true">✓</span> Clear
            </span>
          )}
        </span>
      </button>

      <span className="lrow-tools">
        <button
          type="button"
          className="icon-btn"
          disabled={isFirst || disabled}
          onClick={() => onMove(item.itemId, -1)}
          aria-label={
            isFirst
              ? `${name} is already your first choice`
              : `Move ${name} up to position ${item.position - 1}`
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
              ? `${name} is already your last choice`
              : `Move ${name} down to position ${item.position + 1}`
          }
        >
          <span aria-hidden="true">↓</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={disabled}
          onClick={() => onRemove(item.itemId)}
          aria-label={`Remove ${name} from the list`}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </span>
    </li>
  )
}

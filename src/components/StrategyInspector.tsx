import type { CandidateProfile, Conflict, StrategyItem, Tier } from '../types'
import { INSTITUTE_TYPE_LABELS } from '../data/reference'
import { formatINRExact, formatKm, formatRank } from '../lib/format'
import { Meter, SeverityBadge } from './ui'

const TIER_LEDE: Record<Tier, string> = {
  DREAM: 'Closed ≥10% above your rank last cycle (closing rank < 90% of yours). A stretch — worth keeping near the top, because a good year costs you nothing to try.',
  TARGET: 'Closed within the ±40% band around your rank last cycle. This is the realistic band where your list does most of its work.',
  SAFE: 'Closed ≥40% below your rank last cycle (closing rank ≥ 140% of yours). Likely to still be open when your turn comes.',
  UNKNOWN: 'No closing-rank evidence on record, so reachability was not estimated. Nothing was guessed in its place.',
}

const REASON_GLYPH = { positive: '+', negative: '−', neutral: '·' } as const

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function scorePolarity(score: number): 'positive' | 'negative' | 'neutral' {
  if (score >= 75) return 'positive'
  if (score <= 50) return 'negative'
  return 'neutral'
}

export function StrategyInspector({
  item,
  conflicts,
  profile,
  total,
  disabled,
  onMove,
  onRemove,
  onOpenConflicts,
  onExplain,
}: {
  item: StrategyItem | null
  conflicts: Conflict[]
  profile: CandidateProfile
  total: number
  disabled?: boolean
  onMove: (itemId: string, direction: -1 | 1) => void
  onRemove: (itemId: string) => void
  onOpenConflicts: () => void
  onExplain?: (itemId: string) => void
}) {
  if (!item) {
    return (
      <aside className="rail" aria-label="Option inspector">
        <span className="rail__kicker">Inspector</span>
        <h2 className="rail__title">Pick a row</h2>
        <p className="rail__empty">
          Select any option on the left and this panel explains why it landed at that
          position, how much room it leaves under your limits, and what you can do about it.
        </p>
      </aside>
    )
  }

  const { option } = item
  const name = `${option.collegeShort} · ${option.branch}`

  const feeHeadroom =
    option.annualFee == null ? null : profile.budget.value - option.annualFee
  const distanceHeadroom =
    option.distanceKm == null ? null : profile.distance.value - option.distanceKm

  return (
    <aside className="rail" aria-label={`Why ${name} is at position ${item.position}`}>
      <span className="rail__kicker">
        Inspector
        <span aria-hidden="true">·</span>
        <span className="mono">
          {String(item.position).padStart(2, '0')}/{String(total).padStart(2, '0')}
        </span>
      </span>

      <h2 className="rail__title">
        Why {name} is #{item.position}
      </h2>

      <p className="rail__lede">{TIER_LEDE[item.tier]}</p>

      {onExplain && (
        <button
          type="button"
          className="btn btn--primary btn--sm"
          aria-haspopup="dialog"
          onClick={() => onExplain(item.itemId)}
        >
          What choosing this means for you →
        </button>
      )}

      {conflicts.length > 0 && (
        <div className="rail__alert">
          {conflicts.map((c) => (
            <div className="rail__alert-row" key={c.id}>
              <SeverityBadge severity={c.severity} />
              <span>{c.title}</span>
            </div>
          ))}
          <button type="button" className="btn--link" onClick={onOpenConflicts}>
            Fix this in the inspector →
          </button>
        </div>
      )}

      <div className="rail__group">
        <span className="section-label">Room under your limits</span>

        {feeHeadroom != null && (
          <Meter
            label="Annual fee"
            value={
              feeHeadroom >= 0
                ? `${formatINRExact(feeHeadroom)} spare`
                : `${formatINRExact(Math.abs(feeHeadroom))} over`
            }
            detail={`${formatINRExact(option.annualFee ?? 0)} against your ${formatINRExact(
              profile.budget.value,
            )} ${profile.budget.mode === 'hard' ? 'ceiling' : 'preference'}.`}
            polarity={feeHeadroom < 0 ? 'negative' : feeHeadroom > profile.budget.value * 0.15 ? 'positive' : 'neutral'}
            fill={clamp01(feeHeadroom / profile.budget.value)}
          />
        )}

        {distanceHeadroom != null && (
          <Meter
            label="Distance from home"
            value={
              distanceHeadroom >= 0
                ? `${formatKm(distanceHeadroom)} inside`
                : `${formatKm(Math.abs(distanceHeadroom))} beyond`
            }
            detail={`${formatKm(option.distanceKm ?? 0)} against your ${formatKm(
              profile.distance.value,
            )} ${profile.distance.mode === 'hard' ? 'limit' : 'preference'}.`}
            polarity={distanceHeadroom < 0 ? 'negative' : 'positive'}
            fill={clamp01(distanceHeadroom / profile.distance.value)}
          />
        )}

        {option.placementScore != null && (
          <Meter
            label="Placement record"
            value={`${option.placementScore}/100`}
            polarity={scorePolarity(option.placementScore)}
            fill={option.placementScore / 100}
          />
        )}

        {option.campusScore != null && (
          <Meter
            label="Campus & facilities"
            value={`${option.campusScore}/100`}
            polarity={scorePolarity(option.campusScore)}
            fill={option.campusScore / 100}
          />
        )}
      </div>

      <div className="rail__group">
        <span className="section-label">What moved it here</span>
        <div className="why-panel">
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
        </div>
      </div>

      <div className="rail__group">
        <span className="section-label">On record</span>
        <dl className="factlist">
          <dt>Institute</dt>
          <dd>{INSTITUTE_TYPE_LABELS[option.instituteType]}</dd>
          <dt>Hostel</dt>
          <dd>{option.hostelAvailable ? 'Available' : 'Not listed'}</dd>
          <dt>Closing rank</dt>
          <dd>{option.closingRank == null ? 'Not on record' : formatRank(option.closingRank)}</dd>
          <dt>Source</dt>
          <dd>
            {option.sourceLabel} {option.sourceYear}
          </dd>
        </dl>
        {option.missingFacts.length > 0 && (
          <p className="band__note" style={{ marginTop: 10 }}>
            Not scored: {option.missingFacts.join(', ')} — missing from the dataset, so it was
            excluded rather than guessed.
          </p>
        )}
      </div>

      <div className="rail__actions">
        <button
          type="button"
          className="btn btn--sm"
          disabled={item.position === 1 || disabled}
          onClick={() => onMove(item.itemId, -1)}
        >
          ↑ Move up
        </button>
        <button
          type="button"
          className="btn btn--sm"
          disabled={item.position === total || disabled}
          onClick={() => onMove(item.itemId, 1)}
        >
          ↓ Move down
        </button>
        <button
          type="button"
          className="btn btn--sm btn--danger"
          disabled={disabled}
          onClick={() => onRemove(item.itemId)}
        >
          Remove
        </button>
      </div>
    </aside>
  )
}

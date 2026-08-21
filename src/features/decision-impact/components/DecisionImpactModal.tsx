import { useEffect, useId, useMemo, useRef } from 'react'
import type { CandidateProfile, Conflict, StrategyItem } from '../../../types'
import type { AuthorityId } from '../../../data/authorities'
import { TierBadge } from '../../../components/ui'
import { evaluateDecisionImpact } from '../lib/evaluate'
import { narrateImpact, type NarratedFinding, type NarratedImpact } from '../lib/narrate'
import type { FitBand, ImpactLabel } from '../lib/types'

const LABEL_TEXT: Record<ImpactLabel, string> = {
  HARD_CONSTRAINT_VIOLATION: 'Hard constraint violation',
  CONTRADICTION: 'Contradiction',
  SOFT_COMPROMISE: 'Soft compromise',
  POTENTIAL_RISK: 'Potential risk',
  STRONG_MATCH: 'Strong match',
  EVIDENCE_GAP: 'Evidence gap',
}

const BAND_TEXT: Record<FitBand, { word: string; note: string }> = {
  BLOCKED: {
    word: 'Blocked by your own limits',
    note: 'This option contradicts something you declared absolute, so the fit number below is academic until you resolve it.',
  },
  STRONG: {
    word: 'Strong fit',
    note: 'Most of what you weighted is satisfied here.',
  },
  WORKABLE: {
    word: 'Workable fit',
    note: 'It satisfies more of your profile than it costs you.',
  },
  STRAINED: {
    word: 'Strained fit',
    note: 'You are giving up as much as you get on the things you said matter.',
  },
  POOR: {
    word: 'Poor fit',
    note: 'Little of what you weighted is satisfied by this option.',
  },
}

function FindingCard({ finding }: { finding: NarratedFinding }) {
  return (
    <article className="di-card" data-label={finding.label}>
      <span className="di-card__label">{LABEL_TEXT[finding.label]}</span>
      <p className="di-card__headline">{finding.headline}</p>
      <p className="di-card__detail">{finding.detail}</p>
      {finding.yourWords && (
        <p className="di-card__ref">
          <span aria-hidden="true">↳</span> Your profile: {finding.yourWords}
        </p>
      )}
    </article>
  )
}

function Section({
  title,
  note,
  findings,
  empty,
  tone,
}: {
  title: string
  note: string
  findings: NarratedFinding[]
  empty: string
  tone: 'works' | 'compromises' | 'risks'
}) {
  return (
    <section className="di-section" data-tone={tone}>
      <h3 className="di-section__title">
        {title}
        <span className="di-section__count">{findings.length}</span>
      </h3>
      <p className="di-section__note">{note}</p>
      {findings.length === 0 ? (
        <p className="di-section__empty">{empty}</p>
      ) : (
        findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)
      )}
    </section>
  )
}

function FitPanel({ narrated }: { narrated: NarratedImpact }) {
  const { fit } = narrated.impact
  const band = BAND_TEXT[fit.band]
  return (
    <div className="di-fit" data-band={fit.band}>
      <div className="di-fit__score">
        <span className="di-fit__value">{fit.score}</span>
        <span className="di-fit__outof">/100</span>
      </div>
      <div className="di-fit__text">
        <span className="di-fit__band">{band.word}</span>
        <span className="di-fit__note">{band.note}</span>
        {fit.coverage < 1 && (
          <span className="di-fit__partial">
            Measured on {Math.round(fit.coverage * 100)}% of what you weighted —{' '}
            {fit.unmeasured.join(' and ').toLowerCase()}{' '}
            {fit.unmeasured.length === 1 ? 'is' : 'are'} not on record for this option, so
            the number above is built from the rest.
          </span>
        )}
        <span className="di-fit__counts">
          {fit.satisfied} satisfied · {fit.partial} partly met · {fit.violated} not met ·{' '}
          {fit.unknown} unverifiable
        </span>
      </div>
    </div>
  )
}

function FitBreakdown({ narrated }: { narrated: NarratedImpact }) {
  const { contributions } = narrated.impact.fit
  const active = contributions.filter((entry) => entry.weight > 0)
  return (
    <details className="di-breakdown">
      <summary>How that number was reached</summary>
      <p className="di-breakdown__note">
        Each row is one thing you declared, weighted the way you weighted it, scored against
        this option alone. Fit measures how well the option matches your profile — it is not
        a chance of getting a seat.
      </p>
      <ul className="di-breakdown__list">
        {active.map((entry) => (
          <li className="di-breakdown__row" key={entry.key}>
            <span className="di-breakdown__label">
              {entry.label}
              <small>{entry.weightWord}</small>
            </span>
            <span className="di-breakdown__bar" aria-hidden="true">
              <span
                className="di-breakdown__fill"
                data-empty={entry.satisfaction == null}
                style={{ width: `${Math.round((entry.satisfaction ?? 0) * 100)}%` }}
              />
            </span>
            <span className="di-breakdown__value">
              {entry.satisfaction == null
                ? 'no data'
                : `${Math.round(entry.satisfaction * 100)}%`}
            </span>
            <span className="di-breakdown__evidence">{entry.evidence}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function DecisionImpactModal({
  item,
  profile,
  items,
  conflicts,
  authority,
  onClose,
  onMove,
  onRemove,
  onOpenConflicts,
  disabled,
}: {
  item: StrategyItem
  profile: CandidateProfile
  items: StrategyItem[]
  conflicts?: Conflict[]
  authority?: AuthorityId
  onClose: () => void
  onMove?: (itemId: string, direction: -1 | 1) => void
  onRemove?: (itemId: string) => void
  onOpenConflicts?: () => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const narrated = useMemo(
    () =>
      narrateImpact(
        evaluateDecisionImpact(item, { profile, items, conflicts, authority }),
      ),
    [item, profile, items, conflicts, authority],
  )

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current
      ?.querySelector<HTMLElement>('button, [tabindex]:not([tabindex="-1"])')
      ?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !ref.current) return
      const focusables = Array.from(
        ref.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), summary, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  const { impact } = narrated
  const relevant = impact.declared.filter((entry) => entry.mode !== 'hard' || entry.relevant)

  return (
    <div
      className="di-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="di"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
      >
        <header className="di__head">
          <div className="di__headtext">
            <span className="di__kicker">
              Decision impact
              <span aria-hidden="true">·</span>
              If you choose this
            </span>
            <h2 id={titleId} className="di__title">
              {impact.name}
            </h2>
            <p className="di__sub">
              <span className="mono">
                #{String(impact.position).padStart(2, '0')} of{' '}
                {String(impact.total).padStart(2, '0')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{impact.branchLabel}</span>
              <span aria-hidden="true">·</span>
              <span>
                {impact.instituteType}, {impact.city}
              </span>
              <TierBadge tier={impact.tier} />
            </p>
          </div>
          <button
            type="button"
            className="di__close"
            onClick={onClose}
            aria-label="Close decision impact"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <p className="di__frame">
          Everything below is measured against <b>your</b> profile, not against this
          college's reputation. Nothing here is a review — it is what this choice costs and
          gains <b>you</b>.
        </p>

        <div className="di__declared">
          {relevant.map((entry) => (
            <span className="di-chip" key={entry.key} data-mode={entry.mode}>
              <span className="di-chip__label">{entry.label}</span>
              <span className="di-chip__value">{entry.value}</span>
            </span>
          ))}
        </div>

        <FitPanel narrated={narrated} />

        {narrated.blocking.length > 0 && (
          <section className="di-alarm" role="alert">
            <h3 className="di-alarm__title">
              <span aria-hidden="true">⛔</span>
              {narrated.blocking.length} hard{' '}
              {narrated.blocking.length === 1 ? 'constraint' : 'constraints'} you set are
              broken by this option
            </h3>
            <p className="di-alarm__note">
              These are not preferences that ranked it lower. You declared them absolute, so
              choosing this option means changing your profile — or dropping the option.
            </p>
            {narrated.blocking.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
            {onOpenConflicts && (
              <button type="button" className="btn--link" onClick={onOpenConflicts}>
                Resolve this in the conflict inspector →
              </button>
            )}
          </section>
        )}

        {narrated.consequences.length > 0 && (
          <section className="di-commit">
            <h3 className="di-commit__title">
              What sitting at #{impact.position} commits you to
            </h3>
            <div className="di-commit__grid">
              {narrated.consequences.map((finding) => (
                <div className="di-commit__cell" key={finding.id}>
                  <b>{finding.headline}</b>
                  <span>{finding.detail}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="di__cols">
          <Section
            tone="works"
            title="Why this works for you"
            note="Advantages that exist only because of what you declared."
            findings={narrated.works}
            empty="Nothing on this option matches a preference you weighted."
          />
          <Section
            tone="compromises"
            title="What you're compromising"
            note="Preferences you keep, but do not get here."
            findings={narrated.compromises}
            empty="Nothing you declared is given up by choosing this."
          />
          <Section
            tone="risks"
            title="Potential risks"
            note="Things that could turn against you, and contradictions with your own order."
            findings={narrated.risks}
            empty="No risk in your profile attaches to this option."
          />
        </div>

        <section className="di-bottom">
          <h3 className="di-bottom__title">Bottom line</h3>
          {narrated.bottomLine.map((line) => (
            <p className="di-bottom__line" key={line}>
              {line}
            </p>
          ))}
        </section>

        <FitBreakdown narrated={narrated} />

        {narrated.unknowns.length > 0 && (
          <section className="di-gaps">
            <h3 className="di-gaps__title">What could not be checked for you</h3>
            <ul>
              {narrated.unknowns.map((finding) => (
                <li key={finding.id}>
                  <b>{finding.headline}</b> {finding.detail}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="di__foot">
          <span className="di__source">
            Generated from your saved profile by the deterministic evaluator. Same profile,
            same list, same words every time.
          </span>
          <div className="di__actions">
            {onMove && (
              <button
                type="button"
                className="btn btn--sm"
                disabled={disabled || impact.position === 1}
                onClick={() => onMove(item.itemId, -1)}
              >
                ↑ Move up
              </button>
            )}
            {onMove && (
              <button
                type="button"
                className="btn btn--sm"
                disabled={disabled || impact.position === impact.total}
                onClick={() => onMove(item.itemId, 1)}
              >
                ↓ Move down
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                className="btn btn--sm btn--danger"
                disabled={disabled}
                onClick={() => {
                  onRemove(item.itemId)
                  onClose()
                }}
              >
                Remove from list
              </button>
            )}
            <button type="button" className="btn btn--sm btn--primary" onClick={onClose}>
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

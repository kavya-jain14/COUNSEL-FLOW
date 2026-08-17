import { useState } from 'react'
import type { Conflict, ConflictAction, Resolution, StrategyItem } from '../types'
import { Dialog, SeverityBadge, SEVERITY_META } from './ui'

const MIN_REASON = 8

export function ConflictCard({
  conflict,
  resolution,
  items,
  disabled,
  onApply,
}: {
  conflict: Conflict
  resolution?: Resolution
  items: StrategyItem[]
  disabled?: boolean
  onApply: (conflict: Conflict, action: ConflictAction, reason?: string) => void
}) {
  const [pending, setPending] = useState<ConflictAction | null>(null)
  const [reason, setReason] = useState('')
  const [reasonTouched, setReasonTouched] = useState(false)
  const [reopened, setReopened] = useState(false)

  const meta = SEVERITY_META[conflict.severity]
  const resolved = Boolean(resolution) && !reopened

  function start(action: ConflictAction) {
    if (action.kind === 'SWAP' || action.requiresReason) {
      setPending(action)
      setReason('')
      setReasonTouched(false)
      return
    }
    onApply(conflict, action)
  }

  function commit() {
    if (!pending) return
    if (pending.requiresReason && reason.trim().length < MIN_REASON) {
      setReasonTouched(true)
      return
    }
    onApply(conflict, pending, pending.requiresReason ? reason.trim() : undefined)
    setPending(null)
    setReopened(false)
  }

  const swapPreview =
    pending?.kind === 'SWAP'
      ? {
          upper: items.find((it) => it.itemId === pending.target?.itemId),
          lower: items.find((it) => it.itemId === pending.target?.withItemId),
        }
      : null

  const reasonInvalid = reasonTouched && reason.trim().length < MIN_REASON

  return (
    <article
      className="conflict"
      data-severity={conflict.severity}
      data-resolved={resolved}
      aria-label={`${meta.label} conflict ${conflict.code}: ${conflict.title}`}
    >
      <header className="conflict__head">
        <div className="row" style={{ gap: 8 }}>
          <SeverityBadge severity={conflict.severity} />
          <span className="badge badge--neutral mono">{conflict.code}</span>
          <span className="field__hint">{meta.blocking}</span>
        </div>
        <h3 className="conflict__title">{conflict.title}</h3>
        <p className="conflict__summary">{conflict.summary}</p>
        <p className="conflict__caused">
          <span aria-hidden="true">↳</span>
          {conflict.causedBy}
        </p>
      </header>

      <ul className="evidence">
        <li className="sr-only">Evidence used for this flag:</li>
        {conflict.evidence.map((line, i) => (
          <li key={i}>
            <span />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {resolved && resolution ? (
        <div className="resolved-note">
          <span>
            <strong>
              <span aria-hidden="true">✓ </span>
              {resolution.kind === 'FIXED'
                ? 'Fixed'
                : resolution.kind === 'OVERRIDDEN'
                  ? 'Overridden'
                  : 'Acknowledged'}
            </strong>{' '}
            — {resolution.actionLabel}
          </span>
          {resolution.reason && <q>{resolution.reason}</q>}
          <div>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => setReopened(true)}
              disabled={disabled}
            >
              Change my decision
            </button>
          </div>
        </div>
      ) : (
        <div className="conflict__actions">
          {conflict.actions.map((action) => (
            <div className="action-row" key={action.id}>
              <button
                type="button"
                className={`btn btn--sm ${
                  action.intent === 'primary'
                    ? 'btn--primary'
                    : action.kind === 'REMOVE_OPTION'
                      ? 'btn--danger'
                      : ''
                }`}
                onClick={() => start(action)}
                disabled={disabled}
              >
                {action.label}
                {action.requiresReason && (
                  <span className="sr-only"> (requires a written reason)</span>
                )}
              </button>
              <span className="action-effect">
                {action.effect}
                {action.requiresReason && ' A reason is required.'}
              </span>
            </div>
          ))}
        </div>
      )}

      {pending && (
        <Dialog
          title={
            pending.kind === 'SWAP' ? 'Preview this swap' : `${pending.label} — tell us why`
          }
          onClose={() => setPending(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={commit}>
                {pending.kind === 'SWAP' ? 'Apply swap' : `Confirm — ${pending.label}`}
              </button>
            </>
          }
        >

          <p className="card__hint">
            {swapPreview?.upper && swapPreview.lower
              ? `Moves ${swapPreview.lower.option.collegeShort} · ${swapPreview.lower.option.branch} to #${swapPreview.upper.position} and ${swapPreview.upper.option.collegeShort} · ${swapPreview.upper.option.branch} to #${swapPreview.lower.position}.`
              : pending.effect}
          </p>

          {swapPreview?.upper && swapPreview.lower && (
            <div className="preview-swap">
              <span className="section-label">Now</span>
              <div className="preview-swap__line">
                <span className="preview-swap__pos">#{swapPreview.upper.position}</span>
                <span>
                  {swapPreview.upper.option.collegeShort} · {swapPreview.upper.option.branch}
                </span>
              </div>
              <div className="preview-swap__line">
                <span className="preview-swap__pos">#{swapPreview.lower.position}</span>
                <span>
                  {swapPreview.lower.option.collegeShort} · {swapPreview.lower.option.branch}
                </span>
              </div>
              <div className="preview-swap__arrow" aria-hidden="true">
                ↓
              </div>
              <span className="section-label">After the swap</span>
              <div className="preview-swap__line">
                <span className="preview-swap__pos">#{swapPreview.upper.position}</span>
                <span>
                  <strong>
                    {swapPreview.lower.option.collegeShort} · {swapPreview.lower.option.branch}
                  </strong>
                </span>
              </div>
              <div className="preview-swap__line">
                <span className="preview-swap__pos">#{swapPreview.lower.position}</span>
                <span>
                  <strong>
                    {swapPreview.upper.option.collegeShort} · {swapPreview.upper.option.branch}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {pending.requiresReason && (
            <div className="field">
              <label className="field__label" htmlFor={`reason-${conflict.id}`}>
                Your reason
              </label>
              <span className="field__hint">
                This is stored with your locked list so the decision stays explainable later.
              </span>
              <textarea
                id={`reason-${conflict.id}`}
                className="textarea"
                value={reason}
                aria-invalid={reasonInvalid}
                placeholder="e.g. I would rather have this college than my preferred branch elsewhere."
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setReasonTouched(true)}
              />
              {reasonInvalid && (
                <span className="field__error" role="alert">
                  <span aria-hidden="true">✕</span>
                  Write at least {MIN_REASON} characters so the override is understandable later.
                </span>
              )}
            </div>
          )}
        </Dialog>
      )}
    </article>
  )
}

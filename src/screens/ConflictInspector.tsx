import { useMemo } from 'react'
import type { Severity } from '../types'
import { SEVERITY_ORDER } from '../mock/audit'
import { useAppActions, useAppState, useResolutionMap } from '../state/store'
import { ConflictCard } from '../components/ConflictCard'
import { Banner, SEVERITY_META } from '../components/ui'

const GROUP_COPY: Record<Severity, string> = {
  CRITICAL:
    'Each of these breaks a hard limit you set. Fix them — remove the option, change the limit, or make the limit a soft preference.',
  WARNING:
    'These contradict your stated priorities. You can keep your order, but we will record why.',
  INFO: 'Tradeoffs worth knowing about. Nothing here is wrong.',
}

export function ConflictInspector() {
  const { audit, items, resolutions, activity, auditStale, busy } = useAppState()
  const { goTo, reaudit, lock, applyAction } = useAppActions()
  const resolutionMap = useResolutionMap()

  const grouped = useMemo(() => {
    const map: Record<Severity, typeof audit extends null ? never : NonNullable<typeof audit>['conflicts']> = {
      CRITICAL: [],
      WARNING: [],
      INFO: [],
    }
    for (const conflict of audit?.conflicts ?? []) map[conflict.severity].push(conflict)
    return map
  }, [audit])

  if (!audit) {
    return (
      <div className="card empty">
        <p>No audit yet. Generate a strategy first.</p>
        <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => goTo('profile')}>
          Build my profile
        </button>
      </div>
    )
  }

  const { counts } = audit
  const total = counts.CRITICAL + counts.WARNING + counts.INFO
  const canLock = audit.canLock && !auditStale
  const acknowledged = resolutions.filter((r) => r.kind !== 'FIXED')

  return (
    <div className="stack">
      <div className="row row--between">
        <div>
          <h1>Conflict inspector</h1>
          <p className="card__hint">
            Audit run #{audit.runId} over {items.length} options.
          </p>
        </div>
        <div className="count-pills">
          <span className="badge badge--critical">{counts.CRITICAL} critical</span>
          <span className="badge badge--warning">{counts.WARNING} warning</span>
          <span className="badge badge--info">{counts.INFO} info</span>
        </div>
      </div>

      {auditStale ? (
        <Banner
          tone="stale"
          title="Changes applied — not yet re-audited"
          live
          action={
            <button className="btn btn--sm btn--primary" onClick={reaudit} disabled={busy === 'audit'}>
              {busy === 'audit' ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Re-auditing…
                </>
              ) : (
                'Re-audit'
              )}
            </button>
          }
        >
          <span>
            The list below reflects your fixes, but the verdict does not. Re-run the audit
            before locking.
          </span>
        </Banner>
      ) : counts.CRITICAL > 0 ? (
        <Banner
          tone="critical"
          title={`Locking is blocked by ${counts.CRITICAL} critical conflict${
            counts.CRITICAL > 1 ? 's' : ''
          }`}
        >
          <span>
            Critical conflicts cannot be acknowledged away — the option goes, or the constraint
            changes.
          </span>
        </Banner>
      ) : (
        <Banner
          tone="success"
          title="No critical conflicts — this list can be locked"
          action={
            <button className="btn btn--sm btn--primary" onClick={lock} disabled={busy === 'lock'}>
              {busy === 'lock' ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Locking…
                </>
              ) : (
                'Lock my list'
              )}
            </button>
          }
        >
          <span>
            {acknowledged.length > 0
              ? `${acknowledged.length} acknowledged warning${
                  acknowledged.length > 1 ? 's' : ''
                } will be stored with your snapshot.`
              : 'Nothing left unresolved.'}
          </span>
        </Banner>
      )}

      {total === 0 && (
        <div className="card empty">
          <p>
            <span aria-hidden="true">✓ </span>
            Nothing flagged. Your list is consistent with everything you declared.
          </p>
        </div>
      )}

      {SEVERITY_ORDER.map((severity) => {
        const list = grouped[severity]
        if (list.length === 0) return null
        return (
          <section className="stack stack--sm" key={severity} aria-labelledby={`group-${severity}`}>
            <div className="row" style={{ gap: 10 }}>
              <h2 id={`group-${severity}`}>
                {SEVERITY_META[severity].label} · {list.length}
              </h2>
              <span className="badge badge--neutral">{SEVERITY_META[severity].blocking}</span>
            </div>
            <p className="card__hint">{GROUP_COPY[severity]}</p>
            {list.map((conflict) => (
              <ConflictCard
                key={conflict.id}
                conflict={conflict}
                resolution={resolutionMap[conflict.id]}
                items={items}
                disabled={busy != null}
                onApply={applyAction}
              />
            ))}
          </section>
        )
      })}

      {activity.length > 0 && (
        <section className="card">
          <div className="stack stack--sm">
            <h2>What you have changed</h2>
            <p className="card__hint">
              Every proposal, fix and override, in order. This trail is stored with the locked
              snapshot.
            </p>
            <ul className="activity">
              {activity.map((entry) => (
                <li key={entry.id} data-tone={entry.tone}>
                  <span className="activity__dot" aria-hidden="true" />
                  <span>
                    <b>{entry.label}</b>
                    <p>{entry.detail}</p>
                    {entry.reason && <q>{entry.reason}</q>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="sticky-actions">
        <button type="button" className="btn" onClick={() => goTo('strategy')}>
          Back to strategy
        </button>
        {auditStale || counts.CRITICAL > 0 ? (
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={reaudit}
            disabled={busy === 'audit'}
          >
            {busy === 'audit' ? 'Re-auditing…' : 'Re-audit'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={lock}
            disabled={!canLock || busy === 'lock'}
          >
            {busy === 'lock' ? 'Locking…' : 'Lock my list'}
          </button>
        )}
      </div>
    </div>
  )
}

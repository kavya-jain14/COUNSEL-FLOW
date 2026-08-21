import { useMemo } from 'react'
import type { Severity } from '../types'
import { SEVERITY_ORDER } from '../mock/audit'
import { useAppActions, useAppState, useResolutionMap } from '../state/store'
import { ConflictCard } from '../components/ConflictCard'
import { Band, Banner, NextStep, PageHead } from '../components/ui'

const GROUP_TITLE: Record<Severity, string> = {
  CRITICAL: 'Must fix',
  WARNING: 'Worth checking',
  INFO: 'For information',
}

const GROUP_COPY: Record<Severity, string> = {
  CRITICAL:
    'Each of these breaks a hard limit you set. Remove the option, raise the limit, or turn the limit into a soft preference: your call, but one of them has to happen.',
  WARNING:
    'These contradict your stated priorities without breaking any rule. Keep your order if you meant it; we only record why.',
  INFO: 'Tradeoffs worth knowing about. Nothing here is wrong and nothing needs an answer.',
}

export function ConflictInspector() {
  const { audit, items, resolutions, activity, auditStale, busy, lock: snapshot } =
    useAppState()
  const { goTo, reaudit, lock, applyAction } = useAppActions()
  const resolutionMap = useResolutionMap()

  const grouped = useMemo(() => {
    const map: Record<Severity, NonNullable<typeof audit>['conflicts']> = {
      CRITICAL: [],
      WARNING: [],
      INFO: [],
    }
    for (const conflict of audit?.conflicts ?? []) map[conflict.severity].push(conflict)
    return map
  }, [audit])

  if (!audit) {
    return (
      <>
        <PageHead
          step={4}
          total={5}
          kicker="Conflicts"
          title="Nothing audited yet"
          lede="The conflict inspector opens once there is a strategy to check against your declared limits."
        />
        <div className="empty">
          <p>Generate a strategy first and the audit runs automatically.</p>
          <button className="btn btn--primary" onClick={() => goTo('profile')}>
            Build my profile
          </button>
        </div>
      </>
    )
  }

  const { counts } = audit
  const total = counts.CRITICAL + counts.WARNING + counts.INFO
  const canLock = audit.canLock && !auditStale && !snapshot
  const acknowledged = resolutions.filter(
    (resolution) => resolution.severity === 'WARNING' && resolution.kind === 'OVERRIDDEN',
  )
  const handled = audit.conflicts.filter((c) => resolutionMap[c.id]).length

  return (
    <>
      <PageHead
        step={4}
        total={5}
        kicker="Conflicts"
        title={
          total === 0
            ? 'Your list contradicts nothing'
            : counts.CRITICAL > 0
              ? 'Where your list argues with itself'
              : 'A few tradeoffs to sign off'
        }
        lede={
          total === 0
            ? `Audit run #${audit.runId} over ${items.length} options found nothing that conflicts with anything you declared.`
            : `Audit run #${audit.runId} over ${items.length} options. Work top to bottom. Only the critical group can stop locking.`
        }
        actions={
          <button
            type="button"
            className="btn btn--sm"
            onClick={reaudit}
            disabled={busy === 'audit'}
          >
            {busy === 'audit' ? 'Re-auditing…' : 'Re-audit'}
          </button>
        }
      />

      {total > 0 && (
        <div className="progress" style={{ marginBottom: 26 }}>
          <span className="progress__bar" aria-hidden="true">
            <span
              className="progress__fill"
              style={{ width: `${Math.round((handled / total) * 100)}%` }}
            />
          </span>
          <span className="progress__text">
            <b>{handled}</b> of {total} handled
            {counts.CRITICAL > 0 && ` · ${counts.CRITICAL} still blocking`}
          </span>
        </div>
      )}

      {auditStale ? (
        <Banner
          tone="stale"
          title="Changes applied: not yet re-audited"
          live
          action={
            <button className="btn btn--sm btn--primary" onClick={reaudit} disabled={busy === 'audit'}>
              {busy === 'audit' ? 'Reviewing list…' : 'Re-audit'}
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
          title={`${counts.CRITICAL} hard limit${counts.CRITICAL > 1 ? 's are' : ' is'} being broken`}
        >
          <span>
            These cannot be acknowledged away: either the option goes, or the limit changes.
            Everything else on this page is optional.
          </span>
        </Banner>
      ) : counts.WARNING > 0 ? (
        <Banner
          tone="warning"
          title={`${counts.WARNING} warning decision${counts.WARNING > 1 ? 's' : ''} required`}
        >
          <span>
            Fix each warning or keep it with a written reason, then re-audit before locking.
          </span>
        </Banner>
      ) : (
        <Banner
          tone="success"
          title={snapshot ? 'This strategy is already locked' : 'No unresolved blocking conflicts'}
          action={
            <button
              className="btn btn--sm btn--primary"
              onClick={lock}
              disabled={busy === 'lock' || Boolean(snapshot)}
            >
              {busy === 'lock' ? 'Filing strategy…' : snapshot ? 'Locked' : 'Lock my list'}
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

      <div style={{ marginTop: 34 }}>
        {SEVERITY_ORDER.map((severity) => {
          const list = grouped[severity]
          if (list.length === 0) return null
          return (
            <Band
              key={severity}
              num={`${list.length} item${list.length > 1 ? 's' : ''}`}
              title={GROUP_TITLE[severity]}
              note={GROUP_COPY[severity]}
            >
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
            </Band>
          )
        })}

        {activity.length > 0 && (
          <Band
            num={`${activity.length} entr${activity.length > 1 ? 'ies' : 'y'}`}
            title="What you have changed"
            note="Every proposal, fix and override, in order. This trail is stored with the locked snapshot."
          >
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
          </Band>
        )}
      </div>

      {auditStale ? (
        <NextStep
          tone="wait"
          what="Re-audit to confirm your fixes worked"
          why="You changed things. Re-running the audit is the only way to know whether the flags are actually gone."
        >
          <button className="btn" onClick={() => goTo('strategy')}>
            Back to list
          </button>
          <button className="btn btn--primary" onClick={reaudit} disabled={busy === 'audit'}>
            {busy === 'audit' ? 'Re-auditing…' : 'Re-audit now'}
          </button>
        </NextStep>
      ) : counts.CRITICAL > 0 ? (
        <NextStep
          tone="blocked"
          what={`${counts.CRITICAL} still blocking: pick a fix above`}
          why="Every critical item lists the available decisions. Choosing one either drops the option or relaxes the limit you set."
        >
          <button className="btn" onClick={() => goTo('strategy')}>
            Back to list
          </button>
        </NextStep>
      ) : (
        <NextStep
          tone="ready"
          what="Lock your list"
          why="This saves a snapshot with your order, your reasons, and the dataset version used: so the decision stays explainable later."
        >
          <button className="btn" onClick={() => goTo('strategy')}>
            Back to list
          </button>
          <button
            className="btn btn--primary"
            onClick={lock}
            disabled={!canLock || busy === 'lock'}
          >
            {busy === 'lock' ? 'Locking…' : 'Lock my list'}
          </button>
        </NextStep>
      )}
    </>
  )
}

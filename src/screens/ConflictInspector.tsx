import { useMemo } from 'react'
import type { Severity } from '../types'
import { SEVERITY_ORDER } from '../mock/audit'
import { useAppActions, useAppState, useResolutionMap } from '../state/store'
import { ConflictCard } from '../components/ConflictCard'
import { Band, Banner, NextStep, PageHead } from '../components/ui'

const GROUP_TITLE: Record<Severity, string> = {
  CRITICAL: 'Must fix',
  WARNING: 'Decisions required',
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

  if (items.length === 0) {
    return (
      <>
        <PageHead
          step={4}
          total={5}
          kicker="Conflicts"
          title="Your hard limits leave nothing to review"
          lede="There is no ranked option to audit or lock. CounselFlow kept every hard rule intact instead of silently widening it."
        />
        <Banner tone="warning" title="Review the profile before trying again">
          <span>Widen a limit, make it soft, or remove an exclusion, then generate a new list.</span>
        </Banner>
        <NextStep
          tone="blocked"
          what="Adjust one hard rule"
          why="A new generation is required because the current strategy contains no options."
        >
          <button className="btn btn--primary" onClick={() => goTo('profile')}>
            Review my limits
          </button>
        </NextStep>
      </>
    )
  }

  const { counts } = audit
  const total = counts.CRITICAL + counts.WARNING + counts.INFO
  const canLock = audit.canLock && !auditStale && !snapshot
  const acknowledged = resolutions.filter(
    (resolution) => resolution.severity === 'WARNING' && resolution.kind === 'OVERRIDDEN',
  )
  const decisions = audit.conflicts.filter((c) => c.severity !== 'INFO')
  const handledDecisions = decisions.filter((c) => resolutionMap[c.id]).length
  const firstUnresolved = decisions.find((c) => !resolutionMap[c.id]) ?? null
  const firstAffected = firstUnresolved
    ? items.find((item) => firstUnresolved.itemIds.includes(item.itemId))
    : null

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
            : `Audit run #${audit.runId} over ${items.length} options. Work top to bottom. Critical flags and unresolved warnings must be settled before locking.`
        }
        actions={
          snapshot ? (
            <button type="button" className="btn btn--sm" onClick={() => goTo('locked')}>
              View locked snapshot
            </button>
          ) : auditStale ? (
            <button
              type="button"
              className="btn btn--sm"
              onClick={reaudit}
              disabled={busy === 'audit'}
            >
              {busy === 'audit' ? 'Re-auditing…' : 'Re-audit'}
            </button>
          ) : null
        }
      />

      {firstUnresolved && !auditStale && !snapshot && (
        <section className="decision-brief" aria-labelledby="decision-brief-title">
          <span className="decision-brief__number mono">01</span>
          <div>
            <span className="section-label">Start with this decision</span>
            <h2 id="decision-brief-title">{firstUnresolved.title}</h2>
            <p>
              {firstAffected
                ? `This affects ${firstAffected.option.collegeShort} · ${firstAffected.option.branch}. ${firstUnresolved.summary}`
                : firstUnresolved.summary}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              const target = document.getElementById(`conflict-${firstUnresolved.id}`)
              target?.scrollIntoView({ block: 'center' })
              target?.focus({ preventScroll: true })
            }}
          >
            Make this decision
          </button>
        </section>
      )}

      {decisions.length > 0 && (
        <div className="progress" style={{ marginBottom: 26 }}>
          <span className="progress__bar" aria-hidden="true">
            <span
              className="progress__fill"
              style={{ width: `${Math.round((handledDecisions / decisions.length) * 100)}%` }}
            />
          </span>
          <span className="progress__text">
            <b>{handledDecisions}</b> of {decisions.length} required decisions completed
            {counts.CRITICAL > 0 && ` · ${counts.CRITICAL} still blocking`}
          </span>
        </div>
      )}

      {snapshot ? (
        <Banner
          tone="success"
          title="This is a locked decision record"
          action={
            <button className="btn btn--sm btn--primary" onClick={() => goTo('locked')}>
              View locked snapshot
            </button>
          }
        >
          <span>The order, audit and written reasons below are read-only.</span>
        </Banner>
      ) : auditStale ? (
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
          title="No unresolved blocking conflicts"
          action={
            <button
              className="btn btn--sm btn--primary"
              onClick={lock}
              disabled={busy === 'lock'}
            >
              {busy === 'lock' ? 'Filing strategy…' : 'Lock my list'}
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
                  disabled={busy != null || Boolean(snapshot)}
                  priority={conflict.id === firstUnresolved?.id}
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

      {snapshot ? (
        <NextStep
          tone="ready"
          what="Your reviewed list is already locked"
          why="Open the immutable snapshot to record an allotment or continue to the next counselling round."
        >
          <button className="btn" onClick={() => goTo('strategy')}>
            View ranked list
          </button>
          <button className="btn btn--primary" onClick={() => goTo('locked')}>
            View locked dossier
          </button>
        </NextStep>
      ) : auditStale ? (
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
      ) : counts.WARNING > 0 ? (
        <NextStep
          tone="blocked"
          what={`${counts.WARNING} decision${counts.WARNING > 1 ? 's' : ''} still waiting for you`}
          why="Choose a fix, or keep the tradeoff with a short reason. The first unresolved decision is highlighted above."
        >
          <button className="btn" onClick={() => goTo('strategy')}>Back to list</button>
          {firstUnresolved && (
            <button
              className="btn btn--primary"
              onClick={() => document.getElementById(`conflict-${firstUnresolved.id}`)?.scrollIntoView({ block: 'center' })}
            >
              Continue first decision
            </button>
          )}
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

import { useMemo } from 'react'
import type { Conflict } from '../types'
import { DATASET_LABEL } from '../data/reference'
import { useAppActions, useAppState } from '../state/store'
import { StrategyRow } from '../components/StrategyRow'
import { Banner } from '../components/ui'

export function Strategy() {
  const { items, audit, auditStale, busy, profile } = useAppState()
  const { goTo, moveItem, removeItem, reaudit } = useAppActions()

  const byItem = useMemo(() => {
    const map: Record<string, Conflict[]> = {}
    for (const conflict of audit?.conflicts ?? []) {
      for (const id of conflict.itemIds) {
        ;(map[id] ??= []).push(conflict)
      }
    }
    return map
  }, [audit])

  const counts = audit?.counts ?? { CRITICAL: 0, WARNING: 0, INFO: 0 }
  const total = counts.CRITICAL + counts.WARNING + counts.INFO

  if (items.length === 0) {
    return (
      <div className="card empty">
        <p>No strategy yet. Complete your profile and generate one.</p>
        <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => goTo('profile')}>
          Build my profile
        </button>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="row row--between">
        <div>
          <h1>My strategy</h1>
          <p className="card__hint">
            {items.length} options in your preference order, built from rank {profile.rank} and
            your declared limits. Source: {DATASET_LABEL}.
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
          title="You changed the list"
          live
          action={
            <button className="btn btn--sm" onClick={reaudit} disabled={busy === 'audit'}>
              {busy === 'audit' ? 'Re-auditing…' : 'Re-audit now'}
            </button>
          }
        >
          <span>
            The conflicts below are from the previous version. Re-audit to see what your edits
            actually changed.
          </span>
        </Banner>
      ) : counts.CRITICAL > 0 ? (
        <Banner
          tone="critical"
          title={`${counts.CRITICAL} critical conflict${counts.CRITICAL > 1 ? 's' : ''} block locking`}
          action={
            <button className="btn btn--sm btn--primary" onClick={() => goTo('conflicts')}>
              Open Conflict Inspector
            </button>
          }
        >
          <span>Each one breaks a hard limit you set. They have to be fixed, not dismissed.</span>
        </Banner>
      ) : total > 0 ? (
        <Banner
          tone="warning"
          title="No critical conflicts, but there are things worth checking"
          action={
            <button className="btn btn--sm" onClick={() => goTo('conflicts')}>
              Review conflicts
            </button>
          }
        >
          <span>Warnings can be kept — we will just ask you to say why.</span>
        </Banner>
      ) : (
        <Banner tone="success" title="Clean list">
          <span>Nothing contradicts your declared priorities. You can lock this.</span>
        </Banner>
      )}

      <ol className="strategy-list">
        {items.map((item, i) => (
          <StrategyRow
            key={item.itemId}
            item={item}
            conflicts={byItem[item.itemId] ?? []}
            isFirst={i === 0}
            isLast={i === items.length - 1}
            disabled={busy != null}
            onMove={moveItem}
            onRemove={removeItem}
          />
        ))}
      </ol>

      <p className="card__hint">
        Reachability labels come from historical closing ranks and are not a guarantee. They
        tell you how much coverage your list has — they never decide what you prefer.
      </p>

      <div className="sticky-actions">
        <button type="button" className="btn" onClick={() => goTo('summary')}>
          Back to profile
        </button>
        <button type="button" className="btn btn--primary btn--lg" onClick={() => goTo('conflicts')}>
          {total > 0 ? `Inspect ${total} conflict${total > 1 ? 's' : ''}` : 'Continue to lock'}
        </button>
      </div>
    </div>
  )
}

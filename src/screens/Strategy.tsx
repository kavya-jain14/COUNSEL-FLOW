import { useCallback, useMemo, useState } from 'react'
import type { Conflict } from '../types'
import { DATASET_LABEL } from '../data/reference'
import { formatRank } from '../lib/format'
import { useAppActions, useAppState } from '../state/store'
import { StrategyRow } from '../components/StrategyRow'
import { StrategyInspector } from '../components/StrategyInspector'
import { Banner, NextStep, PageHead } from '../components/ui'
import {
  DecisionImpactModal,
  evaluateDecisionImpact,
  type FitBand,
} from '../features/decision-impact'

export function Strategy() {
  const { items, audit, auditStale, busy, profile, authorityId } = useAppState()
  const { goTo, moveItem, removeItem, reaudit } = useAppActions()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [impactId, setImpactId] = useState<string | null>(null)

  const byItem = useMemo(() => {
    const map: Record<string, Conflict[]> = {}
    for (const conflict of audit?.conflicts ?? []) {
      for (const id of conflict.itemIds) {
        ;(map[id] ??= []).push(conflict)
      }
    }
    return map
  }, [audit])

  const fits = useMemo(() => {
    const map: Record<string, { score: number; band: FitBand; coverage: number }> = {}
    for (const item of items) {
      const { fit } = evaluateDecisionImpact(item, {
        profile,
        items,
        authority: authorityId,
      })
      map[item.itemId] = { score: fit.score, band: fit.band, coverage: fit.coverage }
    }
    return map
  }, [items, profile, authorityId])

  const selected = items.find((i) => i.itemId === selectedId) ?? items[0] ?? null
  const impactItem = items.find((i) => i.itemId === impactId) ?? null

  const openImpact = useCallback((itemId: string) => {
    setSelectedId(itemId)
    setImpactId(itemId)
  }, [])

  if (items.length === 0) {
    return (
      <>
        <PageHead
          step={3}
          total={5}
          kicker="My strategy"
          title="Nothing to rank yet"
          lede="Your choice list is built from the profile you fill in: your rank, your limits, and the branches you actually want."
        />
        <div className="empty">
          <p>Finish your profile and generate a strategy to see it here.</p>
          <button className="btn btn--primary" onClick={() => goTo('profile')}>
            Build my profile
          </button>
        </div>
      </>
    )
  }

  const counts = audit?.counts ?? { CRITICAL: 0, WARNING: 0, INFO: 0 }
  const total = counts.CRITICAL + counts.WARNING + counts.INFO

  return (
    <>
      <PageHead
        step={3}
        total={5}
        kicker="My strategy"
        title="Your list, in the order you would fill it"
        lede={
          <>
            {items.length} options built from rank {profile.rank ? formatRank(profile.rank) : '—'}{' '}
            and the limits you declared. Open any row for its decision impact: what
            choosing that one costs and gains <em>you</em>, measured against your own
            profile.
          </>
        }
        actions={
          <button
            type="button"
            className="btn btn--sm"
            onClick={reaudit}
            disabled={busy === 'audit'}
          >
            {busy === 'audit' ? 'Re-auditing…' : 'Re-audit list'}
          </button>
        }
      />

      <div className="page page--rail">
        <div className="page__flow">
          {auditStale && (
            <Banner
              tone="stale"
              title="These flags are one version behind"
              live
              action={
                <button className="btn btn--sm" onClick={reaudit} disabled={busy === 'audit'}>
                  {busy === 'audit' ? 'Re-auditing…' : 'Re-audit now'}
                </button>
              }
            >
              <span>
                You changed the list. Re-audit to see what your edits actually changed.
              </span>
            </Banner>
          )}

          <div className="tally-set" style={{ margin: auditStale ? '24px 0 18px' : '0 0 18px' }}>
            <span className="tally" data-tone={counts.CRITICAL > 0 ? 'critical' : 'zero'}>
              <b>{counts.CRITICAL}</b> must fix
            </span>
            <span className="tally" data-tone={counts.WARNING > 0 ? 'warning' : 'zero'}>
              <b>{counts.WARNING}</b> worth checking
            </span>
            <span className="tally" data-tone={counts.INFO > 0 ? 'info' : 'zero'}>
              <b>{counts.INFO}</b> for information
            </span>
          </div>

          <div className="ledger">
            <div className="ledger__head" aria-hidden="true">
              <span>Rank</span>
              <span>Option</span>
              <span>Reach</span>
              <span>Status</span>
            </div>
            <ol className="ledger__list">
              {items.map((item, i) => (
                <StrategyRow
                  key={item.itemId}
                  item={item}
                  conflicts={byItem[item.itemId] ?? []}
                  fit={fits[item.itemId]}
                  selected={selected?.itemId === item.itemId}
                  isFirst={i === 0}
                  isLast={i === items.length - 1}
                  disabled={busy != null}
                  onSelect={openImpact}
                  onMove={moveItem}
                  onRemove={removeItem}
                />
              ))}
            </ol>
          </div>

          <p className="band__note" style={{ marginTop: 18, maxWidth: '62ch' }}>
            Reach labels come from historical closing ranks and are not a guarantee. They tell
            you how much coverage your list has: they never decide what you prefer. Source:{' '}
            {DATASET_LABEL}.
          </p>

        </div>

        <StrategyInspector
          item={selected}
          conflicts={selected ? (byItem[selected.itemId] ?? []) : []}
          profile={profile}
          total={items.length}
          disabled={busy != null}
          onMove={moveItem}
          onRemove={removeItem}
          onOpenConflicts={() => goTo('conflicts')}
          onExplain={openImpact}
        />
      </div>

      {impactItem && (
        <DecisionImpactModal
          item={impactItem}
          profile={profile}
          items={items}
          conflicts={byItem[impactItem.itemId] ?? []}
          authority={authorityId}
          disabled={busy != null}
          onClose={() => setImpactId(null)}
          onMove={moveItem}
          onRemove={removeItem}
          onOpenConflicts={() => {
            setImpactId(null)
            goTo('conflicts')
          }}
        />
      )}

      {auditStale ? (
        <NextStep
          tone="wait"
          what="Re-audit before you go further"
          why="Your edits are in, but the verdict below them is not. One click brings them back in sync."
        >
          <button
            className="btn btn--primary"
            onClick={reaudit}
            disabled={busy === 'audit'}
          >
            {busy === 'audit' ? 'Re-auditing…' : 'Re-audit now'}
          </button>
        </NextStep>
      ) : counts.CRITICAL > 0 ? (
        <NextStep
          tone="blocked"
          what={`Fix ${counts.CRITICAL} thing${counts.CRITICAL > 1 ? 's' : ''} before you can lock`}
          why="Each one breaks a hard limit you set yourself. The inspector shows you the options: you pick which one you meant."
        >
          <button className="btn btn--primary" onClick={() => goTo('conflicts')}>
            Show me what to fix
          </button>
        </NextStep>
      ) : total > 0 ? (
        <NextStep
          tone="go"
          what={`Nothing blocks you: ${total} note${total > 1 ? 's' : ''} to skim`}
          why="These are tradeoffs, not errors. Keep your order if you want; we only ask you to say why."
        >
          <button className="btn" onClick={() => goTo('summary')}>
            Back to profile
          </button>
          <button className="btn btn--primary" onClick={() => goTo('conflicts')}>
            Skim the {total} note{total > 1 ? 's' : ''}
          </button>
        </NextStep>
      ) : (
        <NextStep
          tone="ready"
          what="This list is ready to lock"
          why="Nothing in it contradicts anything you declared. Locking saves a snapshot you can reproduce later."
        >
          <button className="btn btn--primary" onClick={() => goTo('conflicts')}>
            Review and lock
          </button>
        </NextStep>
      )}
    </>
  )
}

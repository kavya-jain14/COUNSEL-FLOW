import { useState } from 'react'
import { useAppActions, useAppState } from '../state/store'
import { AUTHORITIES } from '../data/authorities'
import { improvementsOver, labelFor } from '../lib/rounds'
import { formatINRExact, formatKm } from '../lib/format'
import { Band, Banner, NextStep, PageHead, TierBadge } from '../components/ui'
import { DecisionImpactModal } from '../features/decision-impact'

export function Locked() {
  const { lock, items, resolutions, profile, authorityId, currentRound, allottedOptionId, history } =
    useAppState()
  const { goTo, reset, recordAllotment, startNextRound } = useAppActions()
  const [impactId, setImpactId] = useState<string | null>(null)

  if (!lock) {
    return (
      <div className="card empty">
        <p>No locked snapshot exists yet.</p>
        <button className="btn btn--primary" onClick={() => goTo('conflicts')}>
          Return to conflict inspector
        </button>
      </div>
    )
  }

  const overrides = lock.acknowledgedWarnings
  const fixes = resolutions.filter((r) => r.kind === 'FIXED')
  const authority = AUTHORITIES[authorityId]
  const isFinalRound = currentRound >= authority.rounds
  const preview = improvementsOver(items, allottedOptionId)
  const heldItem = items.find((it) => it.option.id === allottedOptionId) ?? null
  const impactItem = items.find((it) => it.itemId === impactId) ?? null

  return (
    <>
      <PageHead
        step={5}
        total={5}
        kicker="Locked"
        title="Your list is locked"
        lede={`${items.length} choices, in this order, with zero unresolved critical conflicts. Everything below is reproducible from the snapshot.`}
        actions={
          <button type="button" className="btn btn--sm" onClick={() => goTo('conflicts')}>
            Back to inspector
          </button>
        }
      />

      <Banner tone="success" title="Snapshot saved" live>
        <span className="mono">{lock.snapshotId}</span>
      </Banner>

      <section className="locked-brief" aria-labelledby="locked-brief-title">
        <div>
          <span className="section-label">Your next action</span>
          <h2 id="locked-brief-title">Record the seat you get after round {currentRound}</h2>
          <p>
            The list itself is final. When allotment arrives, record it and CounselFlow will keep
            only genuine improvements for the next round.
          </p>
        </div>
        <dl className="locked-brief__facts">
          <div><dt>Choices locked</dt><dd className="mono">{items.length}</dd></div>
          <div><dt>Fixes applied</dt><dd className="mono">{fixes.length}</dd></div>
          <div><dt>Explained overrides</dt><dd className="mono">{overrides.length}</dd></div>
          <div><dt>Current round</dt><dd className="mono">{currentRound}/{authority.rounds}</dd></div>
        </dl>
        <a className="btn btn--primary" href="#round-decision">Record allotment</a>
      </section>

      <div style={{ marginTop: 34 }}>
        <Band
          num={`${items.length} choices`}
          title="Locked preference order"
          note="This is the order to fill in. Positions are final unless you start a new profile. Open any row to re-read what that choice means for your profile."
        >
          <div className="ledger">
            <div className="ledger__head" aria-hidden="true">
              <span>Rank</span>
              <span>Option</span>
              <span>Reach</span>
              <span>Source</span>
            </div>
            <ol className="ledger__list">
              {items.map((item) => (
                <li className="lrow-wrap" key={item.itemId}>
                  <button
                    type="button"
                    className="lrow"
                    aria-haspopup="dialog"
                    onClick={() => setImpactId(item.itemId)}
                  >
                    <span className="lrow__pos" aria-hidden="true">
                      {String(item.position).padStart(2, '0')}
                    </span>
                    <span className="lrow__main">
                      <span className="lrow__name">
                        {item.option.collegeShort} · {item.option.branch}
                      </span>
                      <span className="lrow__where">
                        <span>{item.option.city}</span>
                        <span>
                          {item.option.annualFee == null
                            ? 'Fee not on record'
                            : `${formatINRExact(item.option.annualFee)}/yr`}
                        </span>
                        <span>
                          {item.option.distanceKm == null
                            ? 'Distance unknown'
                            : formatKm(item.option.distanceKm)}
                        </span>
                      </span>
                    </span>
                    <span className="lrow__tier">
                      <TierBadge tier={item.tier} />
                    </span>
                    <span className="lrow__status mono">
                      {item.option.sourceYear}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </Band>

        <Band
          num="Provenance"
          title="How to reproduce this"
          note="Same profile, same dataset, same engine version gives the same list."
        >
          <dl className="summary-grid">
            <div className="summary-cell">
              <dt>Profile revision</dt>
              <dd className="mono" style={{ fontSize: '0.9rem' }}>
                {lock.profileRevision}
              </dd>
            </div>
            <div className="summary-cell">
              <dt>Dataset</dt>
              <dd style={{ fontSize: '0.94rem' }}>{lock.datasetVersion}</dd>
            </div>
            <div className="summary-cell">
              <dt>Engine version</dt>
              <dd className="mono" style={{ fontSize: '0.9rem' }}>
                {lock.engineVersion}
              </dd>
            </div>
            <div className="summary-cell">
              <dt>Locked at</dt>
              <dd style={{ fontSize: '0.88rem' }}>
                {new Date(lock.lockedAt).toLocaleString('en-IN')}
              </dd>
            </div>
            <div className="summary-cell">
              <dt>Rank used</dt>
              <dd>
                {profile.rank}
                <small>
                  {profile.rankType === 'CRL' ? 'Common rank' : 'Category rank'} ·{' '}
                  {profile.category}
                </small>
              </dd>
            </div>
            <div className="summary-cell">
              <dt>Fixes applied</dt>
              <dd>{fixes.length}</dd>
            </div>
            <div className="summary-cell">
              <dt>Warnings acknowledged</dt>
              <dd>{overrides.length}</dd>
            </div>
          </dl>
        </Band>

        {overrides.length > 0 && (
          <Band
            num={`${overrides.length} kept`}
            title="Warnings you chose to keep"
            note="These stayed in the list on purpose. Your reason is stored alongside them."
          >
            <ul className="activity">
              {overrides.map((r) => (
                <li key={r.conflictId} data-tone="overridden">
                  <span className="activity__dot" aria-hidden="true" />
                  <span>
                    <b>
                      {r.code} · {r.actionLabel}
                    </b>
                    <p>
                      {r.kind === 'OVERRIDDEN' ? 'Overridden' : 'Acknowledged'} at audit run #
                      {r.atAuditRun}
                    </p>
                    {r.reason && <q>{r.reason}</q>}
                  </span>
                </li>
              ))}
            </ul>
          </Band>
        )}
      </div>

      <div id="round-decision" style={{ marginTop: 34, scrollMarginTop: 100 }}>
        <Band
          num={`Round ${currentRound} of ${authority.rounds}`}
          title="What did you actually get?"
          note="Allotment decides the next round. We only offer options you would genuinely rather have than the seat in your hand: anything at or below it is not worth floating for."
        >
          <div className="field">
            <label className="field__label" htmlFor="allotment">
              Seat allotted in round {currentRound}
            </label>
            <select
              id="allotment"
              className="select"
              value={allottedOptionId ?? ''}
              onChange={(e) => recordAllotment(e.target.value || null)}
            >
              <option value="">Not allotted anything yet</option>
              {items.map((item) => (
                <option key={item.itemId} value={item.option.id}>
                  #{String(item.position).padStart(2, '0')}: {labelFor(item)}
                </option>
              ))}
            </select>
          </div>

          {heldItem && (
            <Banner
              tone={preview.exhausted ? 'success' : 'info'}
              title={
                preview.exhausted
                  ? `You hold your #${preview.heldPosition} choice: nothing on this list beats it`
                  : `${preview.items.length} option${preview.items.length > 1 ? 's' : ''} beat what you hold`
              }
            >
              <span>
                {preview.exhausted
                  ? 'Freezing is the rational move. Floating can only get you something you ranked lower.'
                  : `You were allotted ${labelFor(heldItem)} at #${preview.heldPosition}. Round ${currentRound + 1} would carry only the ${preview.items.length} option${preview.items.length > 1 ? 's' : ''} above it; ${preview.droppedCount} would be dropped as no improvement.`}
              </span>
            </Banner>
          )}
        </Band>

        {history.length > 0 && (
          <Band
            num={`${history.length} done`}
            title="Rounds so far"
            note="Each round keeps its own locked snapshot."
          >
            <ul className="activity">
              {history.map((h) => (
                <li key={h.round} data-tone="locked">
                  <span className="activity__dot" aria-hidden="true" />
                  <span>
                    <b>Round {h.round}</b>
                    <p>
                      {h.items.length} choices locked ·{' '}
                      {h.allottedLabel ? `allotted ${h.allottedLabel}` : 'no allotment recorded'}
                    </p>
                  </span>
                </li>
              ))}
            </ul>
          </Band>
        )}
      </div>

      {isFinalRound || preview.exhausted ? (
        <NextStep
          tone="ready"
          what={
            preview.exhausted
              ? 'Freeze: you already hold your best available option'
              : `Round ${authority.rounds} is the last round for ${authority.label}`
          }
          why="Keep the snapshot ID. If the dataset or your circumstances change, start a new profile rather than editing this one."
        >
          <button type="button" className="btn" onClick={() => goTo('conflicts')}>
            Back to inspector
          </button>
          <button type="button" className="btn btn--primary" onClick={reset}>
            Start a new profile
          </button>
        </NextStep>
      ) : (
        <NextStep
          tone="go"
          what={`Build my round ${currentRound + 1} list`}
          why={
            allottedOptionId
              ? 'We carry forward only the options you rank above the seat you hold, then re-audit them against your constraints.'
              : 'Record your allotment first if you got one: otherwise the next round carries the full list forward.'
          }
        >
          <button type="button" className="btn" onClick={() => goTo('conflicts')}>
            Back to inspector
          </button>
          <button type="button" className="btn btn--primary" onClick={startNextRound}>
            Start round {currentRound + 1}
          </button>
        </NextStep>
      )}

      {impactItem && (
        <DecisionImpactModal
          item={impactItem}
          profile={profile}
          items={items}
          authority={authorityId}
          onClose={() => setImpactId(null)}
        />
      )}
    </>
  )
}

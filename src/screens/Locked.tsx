import { useAppActions, useAppState } from '../state/store'
import { formatINRExact, formatKm } from '../lib/format'
import { Band, Banner, NextStep, PageHead, TierBadge } from '../components/ui'

export function Locked() {
  const { lock, items, resolutions, profile } = useAppState()
  const { goTo, reset } = useAppActions()

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

      <div style={{ marginTop: 34 }}>
        <Band
          num={`${items.length} choices`}
          title="Locked preference order"
          note="This is the order to fill in. Positions are final unless you start a new profile."
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
                <li className="lrow-wrap" data-static="true" key={item.itemId}>
                  <div className="lrow">
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
                  </div>
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
              <dt>Profile version</dt>
              <dd className="mono" style={{ fontSize: '0.9rem' }}>
                {lock.profileVersion}
              </dd>
            </div>
            <div className="summary-cell">
              <dt>Dataset</dt>
              <dd style={{ fontSize: '0.94rem' }}>{lock.datasetLabel}</dd>
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

      <NextStep
        tone="ready"
        what="You are done — fill this order on the portal"
        why="Keep the snapshot ID. If the dataset or your circumstances change, start a new profile rather than editing this one."
      >
        <button type="button" className="btn" onClick={() => goTo('conflicts')}>
          Back to inspector
        </button>
        <button type="button" className="btn btn--primary" onClick={reset}>
          Start a new profile
        </button>
      </NextStep>
    </>
  )
}

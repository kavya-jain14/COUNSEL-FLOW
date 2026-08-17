import { useAppActions, useAppState } from '../state/store'
import { Banner, TierBadge } from '../components/ui'

export function Locked() {
  const { lock, items, resolutions, profile } = useAppState()
  const { goTo, reset } = useAppActions()

  const overrides = resolutions.filter((r) => r.kind !== 'FIXED')
  const fixes = resolutions.filter((r) => r.kind === 'FIXED')

  return (
    <div className="stack">
      <div>
        <h1>Your list is locked</h1>
        <p className="card__hint">
          {items.length} choices, in this order, with zero unresolved critical conflicts.
        </p>
      </div>

      <Banner tone="success" title="Snapshot saved" live>
        <span className="mono">{lock.snapshotId}</span>
      </Banner>

      <section className="card">
        <div className="stack stack--sm">
          <span className="section-label">Reproducibility</span>
          <dl className="summary-grid">
            <div className="summary-cell">
              <dt>Profile version</dt>
              <dd className="mono">{lock.profileVersion}</dd>
            </div>
            <div className="summary-cell">
              <dt>Dataset</dt>
              <dd style={{ fontSize: '0.88rem' }}>{lock.datasetLabel}</dd>
            </div>
            <div className="summary-cell">
              <dt>Engine version</dt>
              <dd className="mono">{lock.engineVersion}</dd>
            </div>
            <div className="summary-cell">
              <dt>Rank used</dt>
              <dd>
                {profile.rank}
                <br />
                <small>{profile.rankType === 'CRL' ? 'Common rank' : 'Category rank'} · {profile.category}</small>
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
        </div>
      </section>

      <section className="card">
        <div className="stack stack--sm">
          <h2>Locked preference order</h2>
          <ol className="strategy-list">
            {items.map((item) => (
              <li className="srow" key={item.itemId}>
                <span className="srow__pos" aria-hidden="true">
                  {item.position}
                </span>
                <div className="srow__body">
                  <div className="row" style={{ gap: 8 }}>
                    <span className="srow__title">
                      {item.option.collegeShort} · {item.option.branch}
                    </span>
                    <TierBadge tier={item.tier} />
                  </div>
                  <div className="srow__meta">
                    <span>{item.option.city}</span>
                    <span className="mono">
                      {item.option.sourceLabel} {item.option.sourceYear}
                    </span>
                  </div>
                </div>
                <span />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {overrides.length > 0 && (
        <section className="card">
          <div className="stack stack--sm">
            <h2>Warnings you chose to keep</h2>
            <p className="card__hint">
              These stayed in the list on purpose. Your reason is stored alongside them.
            </p>
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
          </div>
        </section>
      )}

      <div className="sticky-actions">
        <button type="button" className="btn" onClick={() => goTo('conflicts')}>
          Back to inspector
        </button>
        <button type="button" className="btn btn--primary" onClick={reset}>
          Start a new profile
        </button>
      </div>
    </div>
  )
}

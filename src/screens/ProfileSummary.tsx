import { useMemo } from 'react'
import { BRANCH_LABELS, CATEGORIES, FACTORS } from '../data/reference'
import { formatINRExact, formatKm, formatRank } from '../lib/format'
import { toPayload, validateProfile } from '../lib/validation'
import { useAppActions, useAppState } from '../state/store'
import { Banner, HardSoftBadge } from '../components/ui'

const WEIGHT_WORDS = ['ignored', 'slight', 'some', 'matters', 'important', 'decisive']

export function ProfileSummary() {
  const { profile, busy } = useAppState()
  const { goTo, generate } = useAppActions()

  const errors = useMemo(() => validateProfile(profile), [profile])
  const valid = Object.keys(errors).length === 0
  const payload = useMemo(() => (valid ? toPayload(profile) : null), [profile, valid])

  const categoryLabel =
    CATEGORIES.find((c) => c.value === profile.category)?.label ?? 'Not set'

  return (
    <div className="stack">
      <div>
        <h1>Profile summary</h1>
        <p className="card__hint">
          Check this before generating. Anything under “hard limits” can remove options and
          block your final list.
        </p>
      </div>

      {!valid && (
        <Banner tone="critical" title="Your profile is incomplete" live>
          <span>Go back and fix the highlighted fields — we will not guess missing inputs.</span>
        </Banner>
      )}

      <section className="card">
        <div className="stack stack--sm">
          <span className="section-label">Candidate</span>
          <dl className="summary-grid">
            <div className="summary-cell">
              <dt>Rank</dt>
              <dd>
                {profile.rank == null ? '—' : formatRank(profile.rank)}
                <br />
                <small>{profile.rankType === 'CRL' ? 'Common rank' : 'Category rank'}</small>
              </dd>
            </div>
            <div className="summary-cell">
              <dt>Category</dt>
              <dd>{categoryLabel}</dd>
            </div>
            <div className="summary-cell">
              <dt>Branch order</dt>
              <dd>
                {profile.branchPriority.join(' > ') || '—'}
                <br />
                <small>
                  {profile.branchPriority[0]
                    ? `Top choice: ${BRANCH_LABELS[profile.branchPriority[0]]}`
                    : 'No branches ranked'}
                </small>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="card">
        <div className="stack stack--sm">
          <div className="row row--between">
            <span className="section-label">Hard limits — these can block your list</span>
            <HardSoftBadge mode="hard" />
          </div>

          <dl className="summary-grid">
            <div className="summary-cell">
              <dt>Annual budget</dt>
              <dd>
                {formatINRExact(profile.budget.value)}
                <br />
                <small>
                  {profile.budget.mode === 'hard'
                    ? 'Hard ceiling — over-budget options are flagged critical'
                    : 'Soft preference — over-budget options only rank lower'}
                </small>
              </dd>
            </div>
            <div className="summary-cell">
              <dt>Distance limit</dt>
              <dd>
                {formatKm(profile.distance.value)}
                <br />
                <small>
                  {profile.distance.mode === 'hard'
                    ? 'Hard limit — further colleges are flagged critical'
                    : 'Soft preference — further colleges only rank lower'}
                </small>
              </dd>
            </div>
            <div className="summary-cell">
              <dt>Never accept</dt>
              <dd>
                {profile.hardExclusions.length === 0 ? (
                  <>
                    Nothing excluded
                    <br />
                    <small>No option will be removed on these grounds</small>
                  </>
                ) : (
                  <>
                    {profile.hardExclusions.length} exclusion
                    {profile.hardExclusions.length > 1 ? 's' : ''}
                    <br />
                    <small>{profile.hardExclusions.map((e) => e.label).join(' · ')}</small>
                  </>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="card">
        <div className="stack stack--sm">
          <div className="row row--between">
            <span className="section-label">
              Soft preferences — these only change the order
            </span>
            <HardSoftBadge mode="soft" />
          </div>
          <div className="chips">
            {FACTORS.map((f) => (
              <span className="chip" key={f.key}>
                {f.label}: <strong>{WEIGHT_WORDS[profile.factorWeights[f.key]]}</strong>
              </span>
            ))}
          </div>
          <p className="card__hint">
            No option is ever removed because of these. They decide which of two acceptable
            options sits higher, and they are what the dominated-option check compares.
          </p>
        </div>
      </section>

      {payload && (
        <details className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            What we send to the strategy API
          </summary>
          <p className="card__hint" style={{ margin: '8px 0' }}>
            <code className="mono">POST /api/strategy/generate</code> — weights are normalised
            to sum 1.0 before sending. Currently answered by a local mock.
          </p>
          <pre
            className="mono"
            style={{
              overflowX: 'auto',
              background: 'var(--surface-2)',
              padding: 14,
              borderRadius: 8,
              margin: 0,
            }}
          >
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      )}

      <div className="sticky-actions">
        <button type="button" className="btn" onClick={() => goTo('profile')}>
          Edit profile
        </button>
        <button
          type="button"
          className="btn btn--primary btn--lg"
          disabled={!valid || busy === 'generate'}
          onClick={generate}
        >
          {busy === 'generate' ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Generating…
            </>
          ) : (
            'Generate my strategy'
          )}
        </button>
      </div>
    </div>
  )
}

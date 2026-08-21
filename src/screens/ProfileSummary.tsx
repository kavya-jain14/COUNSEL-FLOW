import { useMemo } from 'react'
import { BRANCH_LABELS, CATEGORIES, DOMICILES, FACTORS, SUB_QUOTAS } from '../data/reference'
import { formatINRExact, formatKm, formatRank } from '../lib/format'
import { validateProfile } from '../lib/validation'
import { useAppActions, useAppState } from '../state/store'
import { Band, Banner, HardSoftBadge, NextStep, PageHead } from '../components/ui'

const WEIGHT_WORDS = ['ignored', 'slight', 'some', 'matters', 'important', 'decisive']

export function ProfileSummary() {
  const { profile, busy } = useAppState()
  const { goTo, generate } = useAppActions()

  const errors = useMemo(() => validateProfile(profile), [profile])
  const valid = Object.keys(errors).length === 0

  const categoryLabel = CATEGORIES.find((c) => c.value === profile.category)?.label ?? 'Not set'
  const domicileLabel = DOMICILES.find((d) => d.value === profile.domicile)?.label ?? 'Not set'
  const quotaLabels = profile.subQuotas.map(
    (q) => SUB_QUOTAS.find((s) => s.value === q)?.label ?? q,
  )
  const hardCount =
    (profile.budget.mode === 'hard' ? 1 : 0) +
    (profile.distance.mode === 'hard' ? 1 : 0) +
    profile.hardExclusions.length

  return (
    <>
      <PageHead
        step={2}
        total={5}
        kicker="Profile summary"
        title="What we are about to run"
        lede={
          hardCount === 0
            ? 'You have set no hard limits, so nothing will be removed outright: every option will be ranked instead.'
            : `${hardCount} hard limit${hardCount > 1 ? 's' : ''} can remove options and block your final list. Everything else only changes the order.`
        }
        actions={
          <button type="button" className="btn btn--sm" onClick={() => goTo('profile')}>
            Edit profile
          </button>
        }
      />

      {!valid && (
        <div style={{ marginBottom: 30 }}>
          <Banner tone="critical" title="Your profile is incomplete" live>
            <span>Go back and fix the highlighted fields: we will not guess missing inputs.</span>
          </Banner>
        </div>
      )}

      <Band
        num="01"
        title="Candidate"
        note="Every position on your list is computed from these three."
      >
        <dl className="summary-grid">
          <div className="summary-cell">
            <dt>Rank</dt>
            <dd>
              {profile.rank == null ? ' - ' : formatRank(profile.rank)}
              <small>{profile.rankType === 'CRL' ? 'Common rank' : 'Category rank'}</small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Category</dt>
            <dd>
              {categoryLabel}
              <small>Decides which closing ranks apply to you</small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Domicile</dt>
            <dd>
              {domicileLabel}
              <small>
                {profile.domicile === 'UP'
                  ? 'Home-state pool: the larger share of UPTAC seats'
                  : profile.domicile === 'OTHER'
                    ? 'Other-state pool: smaller, so cutoffs run tighter'
                    : 'Needed before we can pick the right seat pool'}
              </small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Quotas claimed</dt>
            <dd>
              {quotaLabels.length === 0 ? 'None' : quotaLabels.length}
              <small>
                {quotaLabels.length === 0
                  ? 'Only the open and category pools apply'
                  : `${quotaLabels.join(' · ')}: sample cutoffs are open-category only, so these are recorded but not yet scored`}
              </small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Branch order</dt>
            <dd>
              {profile.branchPriority.join(' › ') || ' - '}
              <small>
                {profile.branchPriority[0]
                  ? `Top choice: ${BRANCH_LABELS[profile.branchPriority[0]]}`
                  : 'No branches ranked'}
              </small>
            </dd>
          </div>
        </dl>
      </Band>

      <Band
        num="02"
        title="Hard limits"
        note="These can remove an option outright and stop your list from locking until you deal with them."
      >
        <div className="band__head">
          <span className="section-label">Can block your list</span>
          <HardSoftBadge mode="hard" />
        </div>
        <dl className="summary-grid">
          <div className="summary-cell">
            <dt>Annual budget</dt>
            <dd>
              {formatINRExact(profile.budget.value)}
              <small>
                {profile.budget.mode === 'hard'
                  ? 'Hard ceiling: over-budget options are flagged critical'
                  : 'Soft preference: over-budget options only rank lower'}
              </small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Distance limit</dt>
            <dd>
              {formatKm(profile.distance.value)}
              <small>
                {profile.distance.mode === 'hard'
                  ? 'Hard limit: further colleges are flagged critical'
                  : 'Soft preference: further colleges only rank lower'}
              </small>
            </dd>
          </div>
          <div className="summary-cell">
            <dt>Never accept</dt>
            <dd>
              {profile.hardExclusions.length === 0 ? (
                <>
                  Nothing excluded
                  <small>No option will be removed on these grounds</small>
                </>
              ) : (
                <>
                  {profile.hardExclusions.length} exclusion
                  {profile.hardExclusions.length > 1 ? 's' : ''}
                  <small>{profile.hardExclusions.map((e) => e.label).join(' · ')}</small>
                </>
              )}
            </dd>
          </div>
        </dl>
      </Band>

      <Band
        num="03"
        title="Soft preferences"
        note="No option is ever removed because of these. They decide which of two acceptable options sits higher."
      >
        <div className="band__head">
          <span className="section-label">Only changes the order</span>
          <HardSoftBadge mode="soft" />
        </div>
        <div className="chips">
          {FACTORS.map((f) => (
            <span className="chip" key={f.key}>
              {f.label}: <strong>{WEIGHT_WORDS[profile.factorWeights[f.key]]}</strong>
            </span>
          ))}
        </div>
      </Band>

      {valid ? (
        <NextStep
          tone="go"
          what="Generate my strategy"
          why="We build the ordered list and run the first conflict audit in one pass. You can edit and re-audit as many times as you like."
        >
          <button type="button" className="btn" onClick={() => goTo('profile')}>
            Edit profile
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy === 'generate'}
            onClick={generate}
          >
            {busy === 'generate' ? 'Preparing strategy…' : 'Generate my strategy'}
          </button>
        </NextStep>
      ) : (
        <NextStep
          tone="blocked"
          what="Finish your profile first"
          why="Some required inputs are still empty, and a guessed rank or category would change every position on your list."
        >
          <button type="button" className="btn btn--primary" onClick={() => goTo('profile')}>
            Back to profile
          </button>
        </NextStep>
      )}
    </>
  )
}

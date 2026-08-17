import { useMemo, useState } from 'react'
import type { Category, RankType } from '../types'
import { CATEGORIES } from '../data/reference'
import { formatINR, formatKm } from '../lib/format'
import {
  MAX_BUDGET,
  MAX_DISTANCE,
  MIN_BUDGET,
  MIN_DISTANCE,
  validateProfile,
} from '../lib/validation'
import { useAppActions, useAppState } from '../state/store'
import { BranchPriority } from '../components/BranchPriority'
import { ConstraintControl } from '../components/ConstraintControl'
import { ExclusionPicker } from '../components/ExclusionPicker'
import { FactorWeightSliders } from '../components/FactorWeights'
import { Banner, Field, HardSoftBadge } from '../components/ui'

const RANK_TYPES: Array<{ value: RankType; label: string }> = [
  { value: 'CRL', label: 'Common rank' },
  { value: 'CATEGORY', label: 'Category rank' },
]

export function BuildProfile() {
  const { profile } = useAppState()
  const { patchProfile, goTo, loadDemoProfile } = useAppActions()
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo(() => validateProfile(profile), [profile])
  const show = (field: keyof typeof errors) => (submitted ? errors[field] : undefined)
  const errorCount = Object.keys(errors).length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (errorCount === 0) goTo('summary')
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="row row--between">
        <div>
          <h1>Build my profile</h1>
          <p className="card__hint">
            Two kinds of input live on this page. Hard limits can remove an option and block
            your final list. Soft preferences only change the order and the explanation.
          </p>
        </div>
        <button type="button" className="btn btn--sm" onClick={loadDemoProfile}>
          Use sample candidate
        </button>
      </div>

      {submitted && errorCount > 0 && (
        <Banner tone="critical" title={`${errorCount} thing${errorCount > 1 ? 's' : ''} to fix`} live>
          <span>Fix the highlighted fields below, then continue to your summary.</span>
        </Banner>
      )}

      <section className="card">
        <div className="stack">
          <div>
            <h2>Your rank</h2>
            <p className="card__hint">
              Eligibility and reachability are both computed from this, so it has to be exact.
            </p>
          </div>

          <div className="grid-2">
            <Field label="Rank" error={show('rank')} htmlFor="rank">
              <input
                id="rank"
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="e.g. 12500"
                value={profile.rank ?? ''}
                aria-invalid={Boolean(show('rank'))}
                onChange={(e) =>
                  patchProfile({ rank: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
            </Field>

            <Field label="Which rank is this?" htmlFor="rank-type-group">
              <div
                className="segmented"
                role="radiogroup"
                aria-label="Rank type"
                id="rank-type-group"
              >
                {RANK_TYPES.map((rt) => (
                  <label className="segmented__opt" key={rt.value}>
                    <input
                      type="radio"
                      name="rankType"
                      checked={profile.rankType === rt.value}
                      onChange={() => patchProfile({ rankType: rt.value })}
                    />
                    <span>{rt.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Category" error={show('category')} htmlFor="category">
              <select
                id="category"
                className="select"
                value={profile.category ?? ''}
                aria-invalid={Boolean(show('category'))}
                onChange={(e) => patchProfile({ category: (e.target.value || null) as Category })}
              >
                <option value="">Select your category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="stack">
          <div>
            <h2>What you want</h2>
            <p className="card__hint">
              Branch order is a preference, not a filter — a lower-ranked branch can still
              appear, it just has to earn its place.
            </p>
          </div>
          <BranchPriority
            value={profile.branchPriority}
            error={show('branchPriority')}
            onChange={(branchPriority) => patchProfile({ branchPriority })}
          />
        </div>
      </section>

      <section className="card">
        <div className="stack">
          <div className="row row--between">
            <div>
              <h2>Your limits</h2>
              <p className="card__hint">
                You decide whether each of these blocks an option or only ranks it lower.
              </p>
            </div>
            <HardSoftBadge mode="hard" />
          </div>

          <ConstraintControl
            label="Annual budget"
            hint="Maximum tuition fee per year you can actually pay."
            setting={profile.budget}
            min={MIN_BUDGET}
            max={MAX_BUDGET}
            step={5000}
            format={formatINR}
            error={show('budget')}
            hardBehaviour="Any option above this is removed and flagged critical. Your list will not lock until it is resolved."
            softBehaviour="Options above this stay on your list but rank lower, and we explain the cost in the reason."
            onChange={(budget) => patchProfile({ budget })}
          />

          <ConstraintControl
            label="Distance from home"
            hint="Furthest you are willing to travel for college."
            setting={profile.distance}
            min={MIN_DISTANCE}
            max={MAX_DISTANCE}
            step={10}
            format={formatKm}
            error={show('distance')}
            hardBehaviour="Anything further than this is removed and flagged critical. Your list will not lock until it is resolved."
            softBehaviour="Further colleges stay on your list but rank lower if you weighted location."
            onChange={(distance) => patchProfile({ distance })}
          />

          <ExclusionPicker
            value={profile.hardExclusions}
            error={show('hardExclusions')}
            onChange={(hardExclusions) => patchProfile({ hardExclusions })}
          />
        </div>
      </section>

      <section className="card">
        <div className="stack">
          <div className="row row--between">
            <h2>Your preferences</h2>
            <HardSoftBadge mode="soft" />
          </div>
          <FactorWeightSliders
            weights={profile.factorWeights}
            error={show('factorWeights')}
            onChange={(factorWeights) => patchProfile({ factorWeights })}
          />
        </div>
      </section>

      <div className="sticky-actions">
        <button type="button" className="btn" onClick={() => goTo('landing')}>
          Back
        </button>
        <button type="submit" className="btn btn--primary btn--lg">
          Review my profile
        </button>
      </div>
    </form>
  )
}

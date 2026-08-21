import { useMemo, useState } from 'react'
import type { Category, Domicile, RankType, SubQuota } from '../types'
import { CATEGORIES, DOMICILES, SUB_QUOTAS } from '../data/reference'
import { DISTANCE_METHOD_NOTE, HOME_CITIES } from '../data/geo'
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
import { Band, Banner, Field, HardSoftBadge, NextStep, PageHead } from '../components/ui'

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
    <form onSubmit={submit} noValidate>
      <PageHead
        step={1}
        total={5}
        kicker="Build my profile"
        title="Tell us what you actually want"
        lede="Two kinds of input live on this page. Hard limits can remove an option and block your final list. Soft preferences only change the order and the explanation attached to it."
        actions={
          <button type="button" className="btn btn--sm" onClick={loadDemoProfile}>
            Use sample candidate
          </button>
        }
      />

      {submitted && errorCount > 0 && (
        <div style={{ marginBottom: 30 }}>
          <Banner
            tone="critical"
            title={`${errorCount} thing${errorCount > 1 ? 's' : ''} still to fill in`}
            live
          >
            <span>Fix the highlighted fields below, then continue to your summary.</span>
          </Banner>
        </div>
      )}

      <Band
        num="01 · Required"
        title="Your rank"
        note="Eligibility and reachability are both computed from this, so it has to be exact."
      >
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

          <Field label="Domicile" error={show('domicile')} htmlFor="domicile">
            <select
              id="domicile"
              className="select"
              value={profile.domicile ?? ''}
              aria-invalid={Boolean(show('domicile'))}
              onChange={(e) => patchProfile({ domicile: (e.target.value || null) as Domicile })}
            >
              <option value="">Select your domicile…</option>
              {DOMICILES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <span className="field__hint">
              {DOMICILES.find((d) => d.value === profile.domicile)?.hint ??
                'Home-state and other-state seats are filled from separate pools.'}
            </span>
          </Field>
        </div>

        <fieldset className="quota-set">
          <legend className="field__label">Reservation quotas you can claim</legend>
          <span className="field__hint">
            Optional, and you can claim more than one. These open extra seat pools — they never
            remove an option from your list.
          </span>
          <div className="quota-grid">
            {SUB_QUOTAS.map((quota) => {
              const checked = profile.subQuotas.includes(quota.value)
              return (
                <label className="quota-opt" key={quota.value} data-checked={checked}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      patchProfile({
                        subQuotas: e.target.checked
                          ? [...profile.subQuotas, quota.value]
                          : profile.subQuotas.filter((q: SubQuota) => q !== quota.value),
                      })
                    }
                  />
                  <span className="quota-opt__text">
                    <b>{quota.label}</b>
                    <small>{quota.hint}</small>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </Band>

      <Band
        num="02 · Required"
        title="What you want"
        note="Branch order is a preference, not a filter — a lower-ranked branch can still appear, it just has to earn its place."
      >
        <BranchPriority
          value={profile.branchPriority}
          error={show('branchPriority')}
          onChange={(branchPriority) => patchProfile({ branchPriority })}
        />
      </Band>

      <Band
        num="03 · Has defaults"
        title="Your limits"
        note="You decide whether each of these blocks an option outright, or only ranks it lower."
      >
        <div className="band__head">
          <span className="section-label">Hard limits can remove options</span>
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

        <Field
          label="Home city"
          hint="Every distance in your list is measured from here, so the distance limit below only means something once this is set."
          error={show('homeCity')}
          htmlFor="homeCity"
        >
          <select
            id="homeCity"
            className="select"
            value={profile.homeCity ?? ''}
            aria-invalid={Boolean(show('homeCity'))}
            onChange={(e) => patchProfile({ homeCity: e.target.value || null })}
          >
            <option value="">Select your home city…</option>
            {HOME_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <span className="field__hint">{DISTANCE_METHOD_NOTE}</span>
        </Field>

        <ConstraintControl
          label="Distance from home"
          hint="Furthest you are willing to travel from your home city."
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
      </Band>

      <Band
        num="04 · Has defaults"
        title="Your preferences"
        note="Soft only. These decide which of two acceptable options sits higher — they never remove anything."
      >
        <div className="band__head">
          <span className="section-label">These only change the order</span>
          <HardSoftBadge mode="soft" />
        </div>
        <FactorWeightSliders
          weights={profile.factorWeights}
          error={show('factorWeights')}
          onChange={(factorWeights) => patchProfile({ factorWeights })}
        />
      </Band>

      {submitted && errorCount > 0 ? (
        <NextStep
          tone="blocked"
          what={`Fill in ${errorCount} more field${errorCount > 1 ? 's' : ''}`}
          why="We will not guess a missing input — a wrong rank or category changes every position on your list."
        >
          <button type="submit" className="btn btn--primary">
            Check again
          </button>
        </NextStep>
      ) : (
        <NextStep
          tone="go"
          what="Review your profile"
          why="Next you get a plain summary of what will block an option and what will only rank it lower. Nothing runs until you approve it."
        >
          <button type="button" className="btn" onClick={() => goTo('landing')}>
            Back
          </button>
          <button type="submit" className="btn btn--primary">
            Review my profile →
          </button>
        </NextStep>
      )}
    </form>
  )
}

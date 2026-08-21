/**
 * Deterministic strategy generation engine.
 *
 * Pipeline (mirrors Blueprint §9):
 *   1. Compute live distanceKm from homeCity using haversineKm.
 *   2. Remove options that violate true hard constraints (budget, distance, exclusions).
 *   3. Retain options with unknown facts but mark confidence/evidence gap.
 *   4. Score each surviving option from normalized factor weights.
 *   5. Add branch-priority contribution separately and visibly.
 *   6. Sort with a stable tie-breaker (seed order by option ID).
 *   7. Assign tier (DREAM / TARGET / SAFE / UNKNOWN) using named ratio buffers.
 *   8. Emit reason facts and engine version metadata.
 *
 * Rules:
 *   - This module is DETERMINISTIC: same profile + same dataset → same order every time.
 *   - Do NOT import React, call fetch, or introduce side effects.
 *   - Weights are normalized before scoring so all 0s produce a 0 total (blocked by
 *     validation), and changing scale (e.g. all 5→10) produces no reordering.
 *   - Scoring is additive; each factor contributes its normalized weight × normalized
 *     option value. Factor values are normalized to [0, 1] across the surviving set.
 *   - Branch priority contributes a fixed BRANCH_WEIGHT fraction outside factor scoring
 *     so it remains visible and can be audited separately.
 */

import type { CandidateProfile, CollegeOption, StrategyItem } from '../types'
import { SEED_OPTIONS } from '../data/seedOptions'
import { INSTITUTE_TYPE_LABELS } from '../data/reference'
import { distanceBetweenCities } from '../data/geo'
import { formatINR, formatKm } from '../lib/format'
import { TIER_DREAM_RATIO_MAX, TIER_TARGET_RATIO_MAX, confidenceFor } from './strategy'

// ─── scoring constants ────────────────────────────────────────────────────────

/**
 * Branch priority is kept as a separate additive bonus on top of factor scores.
 * It contributes BRANCH_WEIGHT fraction of the total score.
 * Factor scores together contribute (1 - BRANCH_WEIGHT).
 *
 * Value 0.30 means "branch order accounts for 30% of the ranking".
 * This makes branch priority the single strongest signal while still allowing
 * a clearly superior option on every factor to occasionally outrank a weak
 * option in a preferred branch.
 */
export const BRANCH_WEIGHT = 0.30

// ─── types ────────────────────────────────────────────────────────────────────

interface ScoredOption {
  option: CollegeOption
  distanceKm: number | null
  factorScore: number   // normalized 0–1, weighted by declared factor weights
  branchScore: number   // normalized 0–1, from branch priority position
  totalScore: number    // factorScore * (1 - BRANCH_WEIGHT) + branchScore * BRANCH_WEIGHT
}

// ─── hard filtering ───────────────────────────────────────────────────────────

function violatesHardConstraints(
  option: CollegeOption,
  distanceKm: number | null,
  profile: CandidateProfile,
): boolean {
  // budget hard constraint — only blocked if the fact is known
  if (profile.budget.mode === 'hard' && option.annualFee != null) {
    if (option.annualFee > profile.budget.value) return true
  }

  // distance hard constraint — only blocked if we have a computable distance
  if (profile.distance.mode === 'hard' && distanceKm != null) {
    if (distanceKm > profile.distance.value) return true
  }

  // hard exclusions
  for (const ex of profile.hardExclusions) {
    switch (ex.kind) {
      case 'branch':
        if (option.branch === ex.value) return true
        break
      case 'instituteType':
        if (option.instituteType === ex.value) return true
        break
      case 'location':
        if (option.city === ex.value) return true
        break
      case 'noHostel':
        if (!option.hostelAvailable) return true
        break
    }
  }

  return false
}

// ─── value extraction ─────────────────────────────────────────────────────────

/**
 * Extract a raw numeric value for each factor from the option.
 * Returns null when the fact is unknown (missing from the dataset).
 * Higher raw value must always mean "better for the candidate" for that factor.
 */
function rawFactorValues(
  option: CollegeOption,
  distanceKm: number | null,
): Record<keyof CandidateProfile['factorWeights'], number | null> {
  return {
    // lower fee is better → negate so higher = better
    fees: option.annualFee != null ? -option.annualFee : null,
    // closer is better → negate distance
    location: distanceKm != null ? -distanceKm : null,
    placements: option.placementScore,
    campus: option.campusScore,
    // hostel: 1 if available, 0 if not (boolean treated as numeric)
    hostel: option.hostelAvailable ? 1 : 0,
  }
}

// ─── normalize across the set ─────────────────────────────────────────────────

/**
 * For each factor, compute min/max across all scored options and return
 * per-option normalized [0, 1] values.  When all options share the same value
 * (or all are null) the normalized score is 0.5 (no differentiation).
 */
function normalizeAcrossSet(
  options: CollegeOption[],
  distances: (number | null)[],
): Array<Record<keyof CandidateProfile['factorWeights'], number>> {
  const factorKeys: Array<keyof CandidateProfile['factorWeights']> = [
    'fees', 'location', 'placements', 'campus', 'hostel',
  ]

  // collect raw values per factor
  const rawPerFactor: Record<string, (number | null)[]> = {}
  for (const key of factorKeys) {
    rawPerFactor[key] = options.map((opt, i) => rawFactorValues(opt, distances[i])[key])
  }

  // compute per-factor min/max among known values
  const mins: Record<string, number> = {}
  const maxs: Record<string, number> = {}
  for (const key of factorKeys) {
    const known = rawPerFactor[key].filter((v): v is number => v != null)
    mins[key] = known.length > 0 ? Math.min(...known) : 0
    maxs[key] = known.length > 0 ? Math.max(...known) : 0
  }

  // normalize each option's values
  return options.map((_, i) => {
    const out = {} as Record<keyof CandidateProfile['factorWeights'], number>
    for (const key of factorKeys) {
      const raw = rawPerFactor[key][i]
      if (raw == null) {
        out[key] = 0.5 // unknown → neutral
      } else {
        const range = maxs[key] - mins[key]
        out[key] = range === 0 ? 0.5 : (raw - mins[key]) / range
      }
    }
    return out
  })
}

// ─── branch score ────────────────────────────────────────────────────────────

/**
 * Convert branch priority position to a [0, 1] score.
 * #1 branch → 1.0, last branch → 0.0/(n-1), unlisted branch → 0.
 */
function branchScore(option: CollegeOption, profile: CandidateProfile): number {
  const branches = profile.branchPriority as string[]
  const idx = branches.indexOf(option.branch)
  if (idx < 0) return 0  // branch not in priority list
  if (branches.length === 1) return 1
  return 1 - idx / (branches.length - 1)
}

// ─── reason facts builder ─────────────────────────────────────────────────────

import type { ReasonFact } from '../types'
import { BRANCH_LABELS } from '../data/reference'

function buildReasons(
  option: CollegeOption,
  distanceKm: number | null,
  profile: CandidateProfile,
): ReasonFact[] {
  const reasons: ReasonFact[] = []
  const branches = profile.branchPriority as string[]
  const idx = branches.indexOf(option.branch)

  // branch priority reason
  if (idx === 0) {
    reasons.push({
      code: 'R-BRANCH-TOP',
      label: 'Matches your top branch',
      detail: `${BRANCH_LABELS[option.branch] ?? option.branch} is #1 in your branch order.`,
      polarity: 'positive',
    })
  } else if (idx > 0) {
    reasons.push({
      code: 'R-BRANCH-RANKED',
      label: `Your #${idx + 1} branch`,
      detail: `You placed ${option.branch} below ${branches.slice(0, idx).join(', ')}.`,
      polarity: 'neutral',
    })
  } else {
    reasons.push({
      code: 'R-BRANCH-UNRANKED',
      label: 'Branch not in your order',
      detail: `${option.branch} is not one of the branches you prioritised, so it carries no branch preference.`,
      polarity: 'negative',
    })
  }

  // fee reason
  if (option.annualFee == null) {
    reasons.push({
      code: 'R-FEE-MISSING',
      label: 'Fee not verified',
      detail: 'Annual fee is missing from the dataset, so it was excluded from scoring.',
      polarity: 'negative',
    })
  } else if (option.annualFee <= profile.budget.value) {
    reasons.push({
      code: 'R-FEE-OK',
      label: 'Within your budget',
      detail: `${formatINR(option.annualFee)}/year against your ${profile.budget.mode === 'hard' ? 'hard ceiling' : 'preferred budget'} of ${formatINR(profile.budget.value)}.`,
      polarity: 'positive',
    })
  } else {
    reasons.push({
      code: 'R-FEE-OVER',
      label: 'Above your budget',
      detail: `${formatINR(option.annualFee)}/year exceeds your ${formatINR(profile.budget.value)} ${profile.budget.mode === 'hard' ? 'hard ceiling' : 'preference'}.`,
      polarity: 'negative',
    })
  }

  // distance reason — use computed live distance
  const km = distanceKm
  if (km == null) {
    if (!profile.homeCity) {
      reasons.push({
        code: 'R-DIST-NOCITY',
        label: 'Home city not set',
        detail: 'Set your home city in the profile to see distance-based reasoning.',
        polarity: 'neutral',
      })
    } else {
      reasons.push({
        code: 'R-DIST-UNKNOWN',
        label: 'Distance not available',
        detail: `${option.city} is not in the distance table. Distance factor excluded from scoring.`,
        polarity: 'neutral',
      })
    }
  } else {
    const within = km <= profile.distance.value
    reasons.push({
      code: within ? 'R-DIST-OK' : 'R-DIST-OVER',
      label: within ? 'Within your travel limit' : 'Beyond your travel limit',
      detail: `${formatKm(km)} from ${profile.homeCity ?? 'home'} against a ${formatKm(profile.distance.value)} ${profile.distance.mode === 'hard' ? 'hard limit' : 'preference'}.`,
      polarity: within ? 'positive' : 'negative',
    })
  }

  // placement reason (only when weighted)
  if (option.placementScore != null && profile.factorWeights.placements >= 3) {
    reasons.push({
      code: 'R-PLACEMENT',
      label: 'Placement record',
      detail: `Recorded placement index ${option.placementScore}/100 — you weighted placements highly.`,
      polarity: option.placementScore >= 75 ? 'positive' : 'neutral',
    })
  }

  // hostel reason (only when weighted)
  if (profile.factorWeights.hostel >= 3) {
    reasons.push({
      code: option.hostelAvailable ? 'R-HOSTEL-YES' : 'R-HOSTEL-NO',
      label: option.hostelAvailable ? 'Hostel available' : 'No hostel recorded',
      detail: option.hostelAvailable
        ? 'Hostel accommodation is listed for this campus.'
        : 'No hostel is listed, and you weighted hostel availability.',
      polarity: option.hostelAvailable ? 'positive' : 'negative',
    })
  }

  // institute type
  reasons.push({
    code: 'R-TYPE',
    label: `${INSTITUTE_TYPE_LABELS[option.instituteType]} institute`,
    detail: `${option.college}, ${option.city}. Source: ${option.sourceLabel} ${option.sourceYear}.`,
    polarity: 'neutral',
  })

  return reasons
}

// ─── tier assignment ─────────────────────────────────────────────────────────

import type { Tier } from '../types'

function assignTier(option: CollegeOption, rank: number | null): Tier {
  if (option.closingRank == null || rank == null) return 'UNKNOWN'
  const ratio = option.closingRank / rank
  if (ratio < TIER_DREAM_RATIO_MAX) return 'DREAM'
  if (ratio < TIER_TARGET_RATIO_MAX) return 'TARGET'
  return 'SAFE'
}

// ─── main engine export ───────────────────────────────────────────────────────

/**
 * Generate a deterministic, profile-personalized strategy list from the seed dataset.
 *
 * This replaces the hardcoded MOCK_ORDER in the old generateMockStrategy.
 * The result is fully deterministic: identical profile → identical order.
 */
export function runStrategyEngine(profile: CandidateProfile): StrategyItem[] {
  // ── step 1: compute live distanceKm for every option ──────────────────────
  const withDistances = SEED_OPTIONS.map((option) => ({
    option,
    distanceKm: distanceBetweenCities(profile.homeCity, option.city),
  }))

  // ── step 2: hard filter ───────────────────────────────────────────────────
  const surviving = withDistances.filter(
    ({ option, distanceKm }) => !violatesHardConstraints(option, distanceKm, profile),
  )

  if (surviving.length === 0) return []

  const options = surviving.map(({ option }) => option)
  const distances = surviving.map(({ distanceKm }) => distanceKm)

  // ── step 3: normalize factor values across the surviving set ──────────────
  const normalizedValues = normalizeAcrossSet(options, distances)

  // normalize declared weights
  const weights = profile.factorWeights
  const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0)
  const normWeights = weightTotal === 0
    ? { placements: 0.2, fees: 0.2, location: 0.2, campus: 0.2, hostel: 0.2 }
    : Object.fromEntries(
        Object.entries(weights).map(([k, v]) => [k, v / weightTotal]),
      ) as typeof weights

  // ── step 4 + 5: compute factor score and branch score ─────────────────────
  const scored: ScoredOption[] = surviving.map(({ option, distanceKm }, i) => {
    const norm = normalizedValues[i]
    const factorScore =
      norm.placements * normWeights.placements +
      norm.fees * normWeights.fees +
      norm.location * normWeights.location +
      norm.campus * normWeights.campus +
      norm.hostel * normWeights.hostel

    const bScore = branchScore(option, profile)

    return {
      option,
      distanceKm,
      factorScore,
      branchScore: bScore,
      totalScore: factorScore * (1 - BRANCH_WEIGHT) + bScore * BRANCH_WEIGHT,
    }
  })

  // ── step 6: sort descending by totalScore, tie-break by option.id (stable) ─
  scored.sort((a, b) => {
    const diff = b.totalScore - a.totalScore
    if (Math.abs(diff) > 1e-9) return diff
    return a.option.id.localeCompare(b.option.id)
  })

  return scored.map(({ option, distanceKm }, i) => {
    const enrichedOption: CollegeOption = distanceKm != null
      ? { ...option, distanceKm }
      : option

    return {
      itemId: `item-${i + 1}`,
      option: enrichedOption,
      tier: assignTier(enrichedOption, profile.rank),
      position: i + 1,
      reasons: buildReasons(enrichedOption, distanceKm, profile),
      confidence: confidenceFor(enrichedOption),
      manuallyPlaced: false,
    } satisfies StrategyItem
  })
}

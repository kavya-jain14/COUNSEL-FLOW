import type {
  CandidateProfile,
  CollegeOption,
  ReasonFact,
  StrategyItem,
  Tier,
} from '../types'
import { BRANCH_LABELS, INSTITUTE_TYPE_LABELS } from '../data/reference'
import { OPTIONS_BY_ID } from '../data/seedOptions'
import { distanceBetweenCities } from '../data/geo'
import { formatINR, formatKm } from '../lib/format'

const MOCK_ORDER: string[] = [
  'hbtu-kanpur-cse',
  'iet-lucknow-it',
  'srmcem-lucknow-cse',
  'mmmut-gorakhpur-ece',
  'biet-jhansi-cse',
  'kiet-ghaziabad-cse',
  'iet-lucknow-it',
  'uiet-kanpur-ee',
  'hbtu-kanpur-ee',
  'rec-banda-cse',
]

/**
 * Rank-buffer constants for deterministic tier classification.
 *
 * Tiers are assigned by comparing the option's last-cycle closing rank to the
 * candidate's own rank using a ratio: closingRank / candidateRank.
 *
 * A ratio < 1 means the option historically closed before (above) the candidate's
 * rank: harder to get. A ratio > 1 means it closed after (below): more accessible.
 *
 * DREAM : closing rank was meaningfully tighter than the candidate's rank last cycle.
 *           The option is a stretch: the candidate may get it if cut-offs move
 *           favourably, but should not rely on it.
 *           Buffer boundary: closingRank / candidateRank < TIER_DREAM_RATIO_MAX (0.90)
 *
 * TARGET: closing rank was in the realistic band around the candidate's rank.
 *           These are the core of the list: reachable in a normal cycle.
 *           Buffer boundary: TIER_DREAM_RATIO_MAX (0.90) ≤ ratio < TIER_TARGET_RATIO_MAX (1.40)
 *
 * SAFE  : closing rank was substantially below the candidate's rank last cycle.
 *           These are fallback options: very likely accessible, included to ensure
 *           coverage in the event of poor cut-off movement at target/dream options.
 *           Buffer boundary: closingRank / candidateRank ≥ TIER_TARGET_RATIO_MAX (1.40)
 *
 * These thresholds are sample values calibrated for UPTAC/AKTU data. Any change
 * requires a golden-fixture update and a version bump in the engine.
 */
export const TIER_DREAM_RATIO_MAX = 0.90
export const TIER_TARGET_RATIO_MAX = 1.40

export function tierFor(option: CollegeOption, rank: number | null): Tier {
  if (option.closingRank == null || rank == null) return 'UNKNOWN'
  const ratio = option.closingRank / rank
  if (ratio < TIER_DREAM_RATIO_MAX) return 'DREAM'
  if (ratio < TIER_TARGET_RATIO_MAX) return 'TARGET'
  return 'SAFE'
}

export function confidenceFor(option: CollegeOption): StrategyItem['confidence'] {
  if (option.missingFacts.length >= 2) return 'low'
  if (option.missingFacts.length === 1) return 'medium'
  return 'high'
}

export function reasonsFor(
  option: CollegeOption,
  profile: CandidateProfile,
): ReasonFact[] {
  const reasons: ReasonFact[] = []

  const branchIndex = (profile.branchPriority as string[]).indexOf(option.branch)
  if (branchIndex === 0) {
    reasons.push({
      code: 'R-BRANCH-TOP',
      label: 'Matches your top branch',
      detail: `${BRANCH_LABELS[option.branch] ?? option.branch} is #1 in your branch order.`,
      polarity: 'positive',
    })
  } else if (branchIndex > 0) {
    reasons.push({
      code: 'R-BRANCH-RANKED',
      label: `Your #${branchIndex + 1} branch`,
      detail: `You placed ${option.branch} below ${profile.branchPriority
        .slice(0, branchIndex)
        .join(', ')}.`,
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
      detail: `${formatINR(option.annualFee)}/year against your ${profile.budget.mode === 'hard' ? 'hard ceiling' : 'preferred budget'
        } of ${formatINR(profile.budget.value)}.`,
      polarity: 'positive',
    })
  } else {
    reasons.push({
      code: 'R-FEE-OVER',
      label: 'Above your budget',
      detail: `${formatINR(option.annualFee)}/year exceeds your ${formatINR(
        profile.budget.value,
      )} ${profile.budget.mode === 'hard' ? 'hard ceiling' : 'preference'}.`,
      polarity: 'negative',
    })
  }

  if (option.distanceKm != null) {
    const within = option.distanceKm <= profile.distance.value
    reasons.push({
      code: within ? 'R-DIST-OK' : 'R-DIST-OVER',
      label: within ? 'Within your travel limit' : 'Beyond your travel limit',
      detail: `${formatKm(option.distanceKm)} from ${profile.homeCity ?? 'your home city'} against a ${formatKm(
        profile.distance.value,
      )} ${profile.distance.mode === 'hard' ? 'hard limit' : 'preference'}.`,
      polarity: within ? 'positive' : 'negative',
    })
  }

  if (option.placementScore != null && profile.factorWeights.placements >= 3) {
    reasons.push({
      code: 'R-PLACEMENT',
      label: 'Placement record',
      detail: `Recorded placement index ${option.placementScore}/100: you weighted placements highly.`,
      polarity: option.placementScore >= 75 ? 'positive' : 'neutral',
    })
  }

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

  reasons.push({
    code: 'R-TYPE',
    label: `${INSTITUTE_TYPE_LABELS[option.instituteType]} institute`,
    detail: `${option.college}, ${option.city}. Source: ${option.sourceLabel} ${option.sourceYear}.`,
    polarity: 'neutral',
  })

  return reasons
}

export function generateMockStrategy(profile: CandidateProfile): StrategyItem[] {
  return MOCK_ORDER.map((optionId, i) => {
    const seed = OPTIONS_BY_ID[optionId]
    const option = {
      ...seed,
      distanceKm: distanceBetweenCities(profile.homeCity, seed.city),
    }
    return {
      itemId: `item-${i + 1}`,
      option,
      tier: tierFor(option, profile.rank),
      position: i + 1,
      reasons: reasonsFor(option, profile),
      confidence: confidenceFor(option),
      manuallyPlaced: false,
    }
  })
}

export function renumber(items: StrategyItem[]): StrategyItem[] {
  return items.map((item, i) => ({ ...item, position: i + 1 }))
}

import type {
  CandidateProfile,
  CandidateProfilePayload,
  FactorKey,
  ProfileErrors,
} from '../types'
import { candidateProfileSchema } from '@counselflow/contracts'
import { BRANCH_LABELS } from '../data/reference'
import { CITY_COORDS } from '../data/geo'

export const MIN_BUDGET = 20000
export const MAX_BUDGET = 600000
export const MIN_DISTANCE = 10
export const MAX_DISTANCE = 2000
export const MAX_RANK = 2000000

export function validateProfile(profile: CandidateProfile): ProfileErrors {
  const errors: ProfileErrors = {}

  if (profile.rank == null) {
    errors.rank = 'Enter your rank: the whole strategy is built from it.'
  } else if (!Number.isInteger(profile.rank) || profile.rank < 1) {
    errors.rank = 'Rank must be a whole number of 1 or more.'
  } else if (profile.rank > MAX_RANK) {
    errors.rank = `That looks too large. Enter a rank up to ${MAX_RANK.toLocaleString('en-IN')}.`
  }

  if (!profile.domicile) {
    errors.domicile = 'Select your domicile: home-state and other-state seats are filled from different pools.'
  }

  if (!profile.homeCity) {
    errors.homeCity = 'Choose your home city: the distance limit is measured from it.'
  } else if (!CITY_COORDS[profile.homeCity]) {
    errors.homeCity = 'We do not have coordinates for that city yet, so distance cannot be checked.'
  }

  if (!profile.category) {
    errors.category = 'Select your category: eligibility and closing ranks depend on it.'
  }

  if (profile.branchPriority.length === 0) {
    errors.branchPriority = 'Add at least one branch and put them in your real order of preference.'
  }

  if (profile.budget.value < MIN_BUDGET || profile.budget.value > MAX_BUDGET) {
    errors.budget = `Annual budget must be between ₹${MIN_BUDGET.toLocaleString(
      'en-IN',
    )} and ₹${MAX_BUDGET.toLocaleString('en-IN')}.`
  }

  if (profile.distance.value < MIN_DISTANCE || profile.distance.value > MAX_DISTANCE) {
    errors.distance = `Distance limit must be between ${MIN_DISTANCE} and ${MAX_DISTANCE} km.`
  }

  const contradicted = profile.hardExclusions.filter(
    (ex) => ex.kind === 'branch' && (profile.branchPriority as string[]).includes(ex.value),
  )
  if (contradicted.length > 0) {
    const names = contradicted
      .map((ex) => BRANCH_LABELS[ex.value] ?? ex.value)
      .join(', ')
    errors.hardExclusions = `${names} is both in your branch order and in "never accept". Remove it from one of them.`
  }

  const totalWeight = Object.values(profile.factorWeights).reduce((a, b) => a + b, 0)
  if (totalWeight === 0) {
    errors.factorWeights =
      'Give at least one factor some weight, otherwise we cannot rank options you would actually prefer.'
  }

  return errors
}

export function isProfileValid(profile: CandidateProfile): boolean {
  return Object.keys(validateProfile(profile)).length === 0
}

export function normalizeWeights(
  weights: CandidateProfile['factorWeights'],
): CandidateProfile['factorWeights'] {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  if (total === 0) return weights
  const out = {} as CandidateProfile['factorWeights']
  for (const key of Object.keys(weights) as FactorKey[]) {
    out[key] = Number((weights[key] / total).toFixed(4))
  }
  return out
}

export function toPayload(profile: CandidateProfile): CandidateProfilePayload {
  return candidateProfileSchema.parse({
    rank: profile.rank as number,
    rankType: profile.rankType,
    category: profile.category!,
    domicile: profile.domicile!,
    subQuotas: [...profile.subQuotas],
    homeCity: profile.homeCity!,
    branchPriority: [...profile.branchPriority],
    budget: { ...profile.budget },
    distance: { ...profile.distance },
    hardExclusions: profile.hardExclusions.map(({ id, kind, value }) => ({ id, kind, value })),
    factorWeights: normalizeWeights(profile.factorWeights),
  })
}

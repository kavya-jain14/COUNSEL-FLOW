import type { BranchCode, CandidateProfile, StrategyItem } from '../types'
import { runStrategyEngine, type EngineContext } from '../mock/engine'
import { BRANCH_LABELS } from '../data/reference'
import { formatINR, formatKm } from './format'

export type LeverId =
  | 'distance'
  | 'budget'
  | 'placements'
  | 'branchTop'
  | 'budgetMode'
  | 'distanceMode'

export interface WhatIfChange {
  lever: LeverId
  label: string
  from: string
  to: string
}

export interface MovedItem {
  item: StrategyItem
  from: number
  to: number
}

export interface WhatIfResult {
  before: StrategyItem[]
  after: StrategyItem[]
  entered: StrategyItem[]
  dropped: StrategyItem[]
  moved: MovedItem[]
  explanation: string
}

function keyOf(item: StrategyItem): string {
  return item.option.id
}

export function applyLever(
  profile: CandidateProfile,
  lever: LeverId,
  value: number | string,
): CandidateProfile {
  const next: CandidateProfile = {
    ...profile,
    budget: { ...profile.budget },
    distance: { ...profile.distance },
    factorWeights: { ...profile.factorWeights },
    branchPriority: [...profile.branchPriority],
    hardExclusions: [...profile.hardExclusions],
    subQuotas: [...profile.subQuotas],
  }

  switch (lever) {
    case 'distance':
      next.distance.value = Number(value)
      break
    case 'budget':
      next.budget.value = Number(value)
      break
    case 'placements':
      next.factorWeights.placements = Number(value)
      break
    case 'budgetMode':
      next.budget.mode = value === 'hard' ? 'hard' : 'soft'
      break
    case 'distanceMode':
      next.distance.mode = value === 'hard' ? 'hard' : 'soft'
      break
    case 'branchTop': {
      const branch = value as BranchCode
      next.branchPriority = [branch, ...next.branchPriority.filter((b) => b !== branch)]
      break
    }
  }
  return next
}

export function describeLever(
  lever: LeverId,
  profile: CandidateProfile,
  value: number | string,
): WhatIfChange {
  switch (lever) {
    case 'distance':
      return {
        lever,
        label: 'Distance limit',
        from: formatKm(profile.distance.value),
        to: formatKm(Number(value)),
      }
    case 'budget':
      return {
        lever,
        label: 'Annual budget',
        from: formatINR(profile.budget.value),
        to: formatINR(Number(value)),
      }
    case 'placements':
      return {
        lever,
        label: 'Placement importance',
        from: `${profile.factorWeights.placements}/5`,
        to: `${value}/5`,
      }
    case 'budgetMode':
      return {
        lever,
        label: 'Budget treated as',
        from: profile.budget.mode === 'hard' ? 'Hard limit' : 'Soft preference',
        to: value === 'hard' ? 'Hard limit' : 'Soft preference',
      }
    case 'distanceMode':
      return {
        lever,
        label: 'Distance treated as',
        from: profile.distance.mode === 'hard' ? 'Hard limit' : 'Soft preference',
        to: value === 'hard' ? 'Hard limit' : 'Soft preference',
      }
    case 'branchTop':
      return {
        lever,
        label: 'Top branch',
        from: profile.branchPriority[0] ?? '—',
        to: String(value),
      }
  }
}

function branchSummary(items: StrategyItem[]): string {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.option.branch, (counts.get(item.option.branch) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([branch, n]) => `${n} ${BRANCH_LABELS[branch] ?? branch}`)
    .join(' and ')
}

function explain(
  change: WhatIfChange,
  entered: StrategyItem[],
  dropped: StrategyItem[],
  moved: MovedItem[],
  beforeCount: number,
  afterCount: number,
): string {
  const delta = afterCount - beforeCount
  const head = `Changing ${change.label.toLowerCase()} from ${change.from} to ${change.to}`

  if (entered.length === 0 && dropped.length === 0 && moved.length === 0) {
    return `${head} changes nothing — your list is already stable against that.`
  }

  const parts: string[] = []
  if (delta > 0) {
    parts.push(`adds ${delta} option${delta > 1 ? 's' : ''}`)
  } else if (delta < 0) {
    parts.push(`removes ${-delta} option${delta < -1 ? 's' : ''}`)
  } else if (entered.length > 0) {
    parts.push(`swaps ${entered.length} option${entered.length > 1 ? 's' : ''} in and out`)
  }

  if (entered.length > 0) {
    parts.push(`bringing in ${branchSummary(entered)}`)
  }
  if (dropped.length > 0 && delta < 0) {
    parts.push(`dropping ${branchSummary(dropped)}`)
  }
  if (parts.length === 0 && moved.length > 0) {
    parts.push(`reorders ${moved.length} option${moved.length > 1 ? 's' : ''} without changing which ones qualify`)
  } else if (moved.length > 0) {
    parts.push(`and reorders ${moved.length} more`)
  }

  return `${head} ${parts.join(', ')}.`
}

export function runWhatIf(
  profile: CandidateProfile,
  before: StrategyItem[],
  lever: LeverId,
  value: number | string,
  context: EngineContext,
): WhatIfResult {
  const draft = applyLever(profile, lever, value)
  const after = runStrategyEngine(draft, context)

  const beforeKeys = new Map(before.map((i) => [keyOf(i), i]))
  const afterKeys = new Map(after.map((i) => [keyOf(i), i]))

  const entered = after.filter((i) => !beforeKeys.has(keyOf(i)))
  const dropped = before.filter((i) => !afterKeys.has(keyOf(i)))
  const moved: MovedItem[] = []
  for (const item of after) {
    const prev = beforeKeys.get(keyOf(item))
    if (prev && prev.position !== item.position) {
      moved.push({ item, from: prev.position, to: item.position })
    }
  }
  moved.sort((a, b) => Math.abs(b.from - b.to) - Math.abs(a.from - a.to))

  const change = describeLever(lever, profile, value)
  return {
    before,
    after,
    entered,
    dropped,
    moved,
    explanation: explain(change, entered, dropped, moved, before.length, after.length),
  }
}

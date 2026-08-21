import type {
  CandidateProfile,
  Conflict,
  FactorKey,
  HardExclusion,
  StrategyItem,
} from '../../../types'
import {
  AUTHORITIES,
  DEFAULT_AUTHORITY,
  type AuthorityId,
} from '../../../data/authorities'
import {
  BRANCH_LABELS,
  FACTORS,
  INSTITUTE_TYPE_LABELS,
  SUB_QUOTAS,
  WEIGHT_WORDS,
} from '../../../data/reference'
import { BRANCH_WEIGHT } from '../../../mock/engine'
import { formatINR, formatKm, formatRank } from '../../../lib/format'
import type {
  DecisionImpact,
  DeclaredPreference,
  FitBand,
  FitContribution,
  FitScore,
  ImpactCode,
  ImpactDimension,
  ImpactFacts,
  ImpactFinding,
  ImpactLabel,
  ImpactSection,
  SatisfactionState,
} from './types'

export interface ImpactContext {
  profile: CandidateProfile
  items: StrategyItem[]
  conflicts?: Conflict[]
  authority?: AuthorityId
}

const TIGHT_HEADROOM = 0.9
const DAILY_COMMUTE_KM = 60
const STRONG_SCORE = 75
const WEAK_SCORE = 58
const CARES = 3
const STRONGLY_CARES = 4

const FACTOR_DIMENSION: Record<FactorKey, ImpactDimension> = {
  fees: 'budget',
  location: 'distance',
  placements: 'placements',
  campus: 'campus',
  hostel: 'hostel',
}

const SECTION_LABEL: Record<ImpactSection, ImpactLabel> = {
  blocking: 'HARD_CONSTRAINT_VIOLATION',
  works: 'STRONG_MATCH',
  compromises: 'SOFT_COMPROMISE',
  risks: 'POTENTIAL_RISK',
  consequences: 'POTENTIAL_RISK',
  unknowns: 'EVIDENCE_GAP',
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function weightWord(value: number): string {
  const index = Math.max(0, Math.min(WEIGHT_WORDS.length - 1, Math.round(value)))
  return WEIGHT_WORDS[index]
}

function factorLabel(key: FactorKey): string {
  return FACTORS.find((factor) => factor.key === key)?.label ?? key
}

function branchLabel(branch: string): string {
  return BRANCH_LABELS[branch] ?? branch
}

function exclusionsMatching(
  profile: CandidateProfile,
  item: StrategyItem,
): HardExclusion[] {
  return profile.hardExclusions.filter((exclusion) => {
    switch (exclusion.kind) {
      case 'branch':
        return item.option.branch === exclusion.value
      case 'instituteType':
        return item.option.instituteType === exclusion.value
      case 'location':
        return item.option.city === exclusion.value
      case 'noHostel':
        return !item.option.hostelAvailable
      default:
        return false
    }
  })
}

function breaksHardLimit(item: StrategyItem, profile: CandidateProfile): boolean {
  const { option } = item
  if (
    profile.budget.mode === 'hard' &&
    option.annualFee != null &&
    option.annualFee > profile.budget.value
  ) {
    return true
  }
  if (
    profile.distance.mode === 'hard' &&
    option.distanceKm != null &&
    option.distanceKm > profile.distance.value
  ) {
    return true
  }
  return exclusionsMatching(profile, item).length > 0
}

function branchRank(profile: CandidateProfile, branch: string): number {
  return (profile.branchPriority as string[]).indexOf(branch)
}

function branchSatisfaction(profile: CandidateProfile, branch: string): number {
  const index = branchRank(profile, branch)
  const total = profile.branchPriority.length
  if (index < 0 || total === 0) return 0
  return clamp01(1 - index / total)
}

function poolLabel(profile: CandidateProfile, authorityId: AuthorityId): string {
  const authority = AUTHORITIES[authorityId]
  const region = profile.domicile === 'OTHER' ? authority.region.other : authority.region.home
  return `${profile.category ?? 'GEN'} · ${region}`
}

function makeFinding(
  code: ImpactCode,
  dimension: ImpactDimension,
  section: ImpactSection,
  state: SatisfactionState,
  weight: number,
  facts: ImpactFacts,
  label?: ImpactLabel,
): ImpactFinding {
  return {
    id: code,
    code,
    label: label ?? SECTION_LABEL[section],
    dimension,
    section,
    state,
    weight: clamp01(weight),
    facts,
  }
}

function evaluateBranch(
  item: StrategyItem,
  ctx: ImpactContext,
  eligible: StrategyItem[],
): ImpactFinding[] {
  const { profile } = ctx
  const { option } = item
  const out: ImpactFinding[] = []
  const index = branchRank(profile, option.branch)
  const order = profile.branchPriority.join(' > ')
  const excluded = profile.hardExclusions.find(
    (exclusion) => exclusion.kind === 'branch' && exclusion.value === option.branch,
  )

  if (excluded) {
    out.push(
      makeFinding('BRANCH_EXCLUDED', 'branch', 'blocking', 'VIOLATED', 1, {
        branch: option.branch,
        branchLabel: branchLabel(option.branch),
        exclusionLabel: excluded.label,
      }),
    )
    return out
  }

  if (index === 0) {
    out.push(
      makeFinding('BRANCH_FIRST_CHOICE', 'branch', 'works', 'SATISFIED', BRANCH_WEIGHT + 0.3, {
        branch: option.branch,
        branchLabel: branchLabel(option.branch),
        order,
      }),
    )
  } else if (index > 0) {
    out.push(
      makeFinding('BRANCH_DOWNGRADE', 'branch', 'compromises', 'PARTIAL', BRANCH_WEIGHT + 0.3, {
        branch: option.branch,
        branchLabel: branchLabel(option.branch),
        choiceNumber: index + 1,
        firstChoice: profile.branchPriority[0],
        firstChoiceLabel: branchLabel(profile.branchPriority[0]),
        passedOver: profile.branchPriority.slice(0, index).join(', '),
        stepsDown: index,
        order,
      }),
    )
  } else {
    out.push(
      makeFinding('BRANCH_UNRANKED', 'branch', 'compromises', 'VIOLATED', BRANCH_WEIGHT + 0.3, {
        branch: option.branch,
        branchLabel: branchLabel(option.branch),
        order,
      }),
    )
  }

  if (index !== 0) {
    const better = eligible
      .filter((other) => other.itemId !== item.itemId)
      .filter((other) => {
        const otherIndex = branchRank(profile, other.option.branch)
        return otherIndex >= 0 && (index < 0 || otherIndex < index)
      })
      .sort((a, b) => a.position - b.position)

    if (better.length > 0) {
      const best = better[0]
      out.push(
        makeFinding(
          'BRANCH_AVAILABLE_ELSEWHERE',
          'branch',
          'compromises',
          'PARTIAL',
          BRANCH_WEIGHT,
          {
            count: better.length,
            branch: best.option.branch,
            exampleName: `${best.option.collegeShort} · ${best.option.branch}`,
            examplePosition: best.position,
            exampleTier: best.tier,
            aheadOfThis: better.filter((other) => other.position < item.position).length,
          },
        ),
      )
    }
  }

  return out
}

function evaluateBudget(
  item: StrategyItem,
  ctx: ImpactContext,
  eligible: StrategyItem[],
): ImpactFinding[] {
  const { profile } = ctx
  const fee = item.option.annualFee
  const limit = profile.budget.value
  const mode = profile.budget.mode
  const declaredWeight = profile.factorWeights.fees
  const weight = mode === 'hard' ? 1 : declaredWeight / 5
  const out: ImpactFinding[] = []

  if (fee == null) {
    out.push(
      makeFinding('FEE_UNKNOWN', 'budget', 'unknowns', 'UNKNOWN', weight, {
        limit,
        mode,
      }),
    )
    return out
  }

  const spare = limit - fee

  if (spare < 0) {
    out.push(
      makeFinding(
        mode === 'hard' ? 'FEE_HARD_BREACH' : 'FEE_SOFT_BREACH',
        'budget',
        mode === 'hard' ? 'blocking' : 'compromises',
        'VIOLATED',
        weight,
        {
          fee,
          limit,
          over: Math.abs(spare),
          overFourYears: Math.abs(spare) * 4,
          mode,
          weightWord: weightWord(declaredWeight),
        },
      ),
    )
  } else if (fee / limit >= TIGHT_HEADROOM) {
    out.push(
      makeFinding('FEE_TIGHT', 'budget', 'risks', 'PARTIAL', weight, {
        fee,
        limit,
        spare,
        mode,
        usedPct: Math.round((fee / limit) * 100),
      }),
    )
  } else if (mode === 'hard' || declaredWeight >= CARES) {
    out.push(
      makeFinding('FEE_WITHIN', 'budget', 'works', 'SATISFIED', weight, {
        fee,
        limit,
        spare,
        spareFourYears: spare * 4,
        mode,
        weightWord: weightWord(declaredWeight),
      }),
    )
  }

  const priced = eligible.filter(
    (other) => other.itemId !== item.itemId && other.option.annualFee != null,
  )
  const cheaper = priced.filter((other) => other.option.annualFee! < fee)
  if (cheaper.length > 0 && (declaredWeight >= 2 || mode === 'hard')) {
    const cheapest = [...cheaper].sort((a, b) => a.option.annualFee! - b.option.annualFee!)[0]
    out.push(
      makeFinding('FEE_ABOVE_LIST', 'budget', 'compromises', 'PARTIAL', weight * 0.6, {
        fee,
        cheaperCount: cheaper.length,
        comparedCount: priced.length,
        cheapestName: `${cheapest.option.collegeShort} · ${cheapest.option.branch}`,
        cheapestFee: cheapest.option.annualFee,
        cheapestPosition: cheapest.position,
        delta: fee - cheapest.option.annualFee!,
        deltaFourYears: (fee - cheapest.option.annualFee!) * 4,
        weightWord: weightWord(declaredWeight),
      }),
    )
  }

  return out
}

function evaluateDistance(
  item: StrategyItem,
  ctx: ImpactContext,
  eligible: StrategyItem[],
): ImpactFinding[] {
  const { profile } = ctx
  const km = item.option.distanceKm
  const limit = profile.distance.value
  const mode = profile.distance.mode
  const declaredWeight = profile.factorWeights.location
  const weight = mode === 'hard' ? 1 : declaredWeight / 5
  const out: ImpactFinding[] = []

  if (km == null) {
    out.push(
      makeFinding('DISTANCE_UNKNOWN', 'distance', 'unknowns', 'UNKNOWN', weight, {
        city: item.option.city,
        homeCity: profile.homeCity,
      }),
    )
    return out
  }

  const measured = eligible.filter(
    (other) => other.itemId !== item.itemId && other.option.distanceKm != null,
  )
  const nearer = measured.filter((other) => other.option.distanceKm! < km).length
  const farther = measured.length - nearer

  if (km > limit) {
    out.push(
      makeFinding(
        mode === 'hard' ? 'DISTANCE_HARD_BREACH' : 'DISTANCE_SOFT_BREACH',
        'distance',
        mode === 'hard' ? 'blocking' : 'compromises',
        'VIOLATED',
        weight,
        {
          km,
          limit,
          over: km - limit,
          homeCity: profile.homeCity,
          city: item.option.city,
          mode,
          weightWord: weightWord(declaredWeight),
        },
      ),
    )
  } else if (km / limit >= TIGHT_HEADROOM) {
    out.push(
      makeFinding('DISTANCE_TIGHT', 'distance', 'risks', 'PARTIAL', weight, {
        km,
        limit,
        spare: limit - km,
        homeCity: profile.homeCity,
        mode,
        usedPct: Math.round((km / limit) * 100),
      }),
    )
  } else if (mode === 'hard' || declaredWeight >= CARES) {
    out.push(
      makeFinding('DISTANCE_WITHIN', 'distance', 'works', 'SATISFIED', weight, {
        km,
        limit,
        spare: limit - km,
        homeCity: profile.homeCity,
        city: item.option.city,
        mode,
        nearerCount: nearer,
        fartherCount: farther,
        comparedCount: measured.length,
        weightWord: weightWord(declaredWeight),
        commutable: km <= DAILY_COMMUTE_KM,
      }),
    )
  }

  return out
}

function evaluateScored(
  item: StrategyItem,
  ctx: ImpactContext,
  eligible: StrategyItem[],
  key: 'placements' | 'campus',
): ImpactFinding[] {
  const { profile } = ctx
  const declaredWeight = profile.factorWeights[key]
  const value = key === 'placements' ? item.option.placementScore : item.option.campusScore
  const dimension: ImpactDimension = key
  const weight = declaredWeight / 5
  const out: ImpactFinding[] = []

  if (declaredWeight < (key === 'placements' ? 1 : CARES)) return out

  if (value == null) {
    if (key === 'placements') {
      out.push(
        makeFinding('PLACEMENT_UNKNOWN', dimension, 'unknowns', 'UNKNOWN', weight, {
          weightWord: weightWord(declaredWeight),
          factorLabel: factorLabel(key),
        }),
      )
    }
    return out
  }

  const scored = eligible
    .filter((other) => other.itemId !== item.itemId)
    .map((other) => ({
      item: other,
      value: key === 'placements' ? other.option.placementScore : other.option.campusScore,
    }))
    .filter((entry): entry is { item: StrategyItem; value: number } => entry.value != null)

  const better = scored.filter((entry) => entry.value > value)
  const best = [...scored].sort((a, b) => b.value - a.value)[0]
  const facts: ImpactFacts = {
    score: value,
    weightWord: weightWord(declaredWeight),
    factorLabel: factorLabel(key),
    betterCount: better.length,
    comparedCount: scored.length,
    betterBelowCount: better.filter((entry) => entry.item.position > item.position).length,
    bestName: best ? `${best.item.option.collegeShort} · ${best.item.option.branch}` : null,
    bestScore: best ? best.value : null,
    bestPosition: best ? best.item.position : null,
  }

  if (key === 'campus') {
    if (value >= STRONG_SCORE) {
      out.push(makeFinding('CAMPUS_STRONG', dimension, 'works', 'SATISFIED', weight, facts))
    } else if (value <= WEAK_SCORE) {
      out.push(makeFinding('CAMPUS_WEAK', dimension, 'compromises', 'PARTIAL', weight, facts))
    }
    return out
  }

  if (value >= STRONG_SCORE) {
    out.push(makeFinding('PLACEMENT_STRONG', dimension, 'works', 'SATISFIED', weight, facts))
  } else if (value <= WEAK_SCORE) {
    out.push(
      makeFinding(
        'PLACEMENT_WEAK',
        dimension,
        declaredWeight >= STRONGLY_CARES ? 'risks' : 'compromises',
        'VIOLATED',
        weight,
        facts,
      ),
    )
  } else if (declaredWeight >= STRONGLY_CARES) {
    out.push(makeFinding('PLACEMENT_MID', dimension, 'compromises', 'PARTIAL', weight, facts))
  }

  return out
}

function evaluateHostel(item: StrategyItem, ctx: ImpactContext): ImpactFinding[] {
  const { profile } = ctx
  const { option } = item
  const declaredWeight = profile.factorWeights.hostel
  const weight = declaredWeight / 5
  const out: ImpactFinding[] = []
  const excluded = profile.hardExclusions.find((exclusion) => exclusion.kind === 'noHostel')

  if (excluded && !option.hostelAvailable) {
    out.push(
      makeFinding('HOSTEL_EXCLUDED', 'hostel', 'blocking', 'VIOLATED', 1, {
        exclusionLabel: excluded.label,
        college: option.collegeShort,
      }),
    )
    return out
  }

  if (option.hostelAvailable && declaredWeight >= CARES) {
    out.push(
      makeFinding('HOSTEL_AVAILABLE', 'hostel', 'works', 'SATISFIED', weight, {
        weightWord: weightWord(declaredWeight),
        km: option.distanceKm,
        homeCity: profile.homeCity,
      }),
    )
  }

  if (!option.hostelAvailable) {
    if (declaredWeight >= CARES) {
      out.push(
        makeFinding('HOSTEL_MISSING', 'hostel', 'compromises', 'VIOLATED', weight, {
          weightWord: weightWord(declaredWeight),
          college: option.collegeShort,
        }),
      )
    }
    if (option.distanceKm != null && option.distanceKm > DAILY_COMMUTE_KM) {
      out.push(
        makeFinding('HOSTEL_NO_COMMUTE', 'hostel', 'risks', 'PARTIAL', Math.max(weight, 0.5), {
          km: option.distanceKm,
          homeCity: profile.homeCity,
          city: option.city,
          commuteKm: DAILY_COMMUTE_KM,
        }),
      )
    }
  }

  return out
}

function evaluateExclusions(item: StrategyItem, ctx: ImpactContext): ImpactFinding[] {
  return exclusionsMatching(ctx.profile, item)
    .filter((exclusion) => exclusion.kind === 'instituteType' || exclusion.kind === 'location')
    .map((exclusion) =>
      exclusion.kind === 'instituteType'
        ? makeFinding('TYPE_EXCLUDED', 'instituteType', 'blocking', 'VIOLATED', 1, {
            exclusionLabel: exclusion.label,
            instituteType:
              INSTITUTE_TYPE_LABELS[item.option.instituteType] ?? item.option.instituteType,
            college: item.option.collegeShort,
          })
        : makeFinding('CITY_EXCLUDED', 'city', 'blocking', 'VIOLATED', 1, {
            exclusionLabel: exclusion.label,
            city: item.option.city,
            college: item.option.collegeShort,
          }),
    )
}

function evaluateReach(
  item: StrategyItem,
  ctx: ImpactContext,
  eligible: StrategyItem[],
): ImpactFinding[] {
  const { profile } = ctx
  const authorityId = ctx.authority ?? DEFAULT_AUTHORITY
  const rank = profile.rank
  const closing = item.option.closingRank
  const out: ImpactFinding[] = []
  const pool = poolLabel(profile, authorityId)

  if (item.tier === 'UNKNOWN' || closing == null || rank == null) {
    out.push(
      makeFinding('REACH_UNKNOWN', 'reach', 'unknowns', 'UNKNOWN', 0.6, {
        college: item.option.collegeShort,
        pool,
      }),
    )
  } else {
    const facts: ImpactFacts = {
      closingRank: closing,
      rank,
      pool,
      year: item.option.sourceYear,
      source: item.option.sourceLabel,
      gapPct: Math.round(Math.abs(closing - rank) / rank * 100),
      position: item.position,
      safeCount: eligible.filter((other) => other.tier === 'SAFE').length,
      dreamAbove: eligible.filter(
        (other) => other.position < item.position && other.tier === 'DREAM',
      ).length,
    }
    if (item.tier === 'DREAM') {
      out.push(makeFinding('REACH_DREAM', 'reach', 'risks', 'PARTIAL', 0.8, facts))
    } else if (item.tier === 'SAFE') {
      out.push(makeFinding('REACH_SAFE', 'reach', 'works', 'SATISFIED', 0.7, facts))
    } else {
      out.push(makeFinding('REACH_TARGET', 'reach', 'works', 'SATISFIED', 0.7, facts))
    }
  }

  if (profile.subQuotas.length > 0) {
    out.push(
      makeFinding('QUOTA_NOT_MODELLED', 'quota', 'unknowns', 'UNKNOWN', 0.5, {
        quotas: profile.subQuotas
          .map((quota) => SUB_QUOTAS.find((entry) => entry.value === quota)?.label ?? quota)
          .join(', '),
        pool,
      }),
    )
  }

  return out
}

function evaluateOrder(item: StrategyItem, ctx: ImpactContext): ImpactFinding[] {
  const { profile, items } = ctx
  const out: ImpactFinding[] = []
  const below = items.filter((other) => other.position > item.position)
  const above = items.filter((other) => other.position < item.position)
  const index = branchRank(profile, item.option.branch)

  if (below.length > 0) {
    const betterBranchBelow = below.filter((other) => {
      const otherIndex = branchRank(profile, other.option.branch)
      return otherIndex >= 0 && (index < 0 || otherIndex < index)
    })
    out.push(
      makeFinding('ORDER_FORFEIT', 'order', 'consequences', 'PARTIAL', 0.9, {
        position: item.position,
        total: items.length,
        belowCount: below.length,
        firstBelowName: `${below[0].option.collegeShort} · ${below[0].option.branch}`,
        betterBranchBelowCount: betterBranchBelow.length,
        betterBranchBelowName:
          betterBranchBelow.length > 0
            ? `${betterBranchBelow[0].option.collegeShort} · ${betterBranchBelow[0].option.branch}`
            : null,
      }),
    )
  }

  out.push(
    makeFinding('ORDER_AHEAD', 'order', 'consequences', 'PARTIAL', 0.9, {
      position: item.position,
      total: items.length,
      aboveCount: above.length,
      dreamAbove: above.filter((other) => other.tier === 'DREAM').length,
      firstAboveName:
        above.length > 0
          ? `${above[above.length - 1].option.collegeShort} · ${above[above.length - 1].option.branch}`
          : null,
    }),
  )

  return out
}

function evaluateContradictions(
  item: StrategyItem,
  ctx: ImpactContext,
  eligible: StrategyItem[],
): ImpactFinding[] {
  const { profile } = ctx
  const out: ImpactFinding[] = []
  const half = Math.ceil(ctx.items.length / 2)
  if (item.position > half) return out

  const checks: Array<{
    key: FactorKey
    value: number | null
    higherIsBetter: boolean
    format: (value: number) => string
  }> = [
    {
      key: 'fees',
      value: item.option.annualFee,
      higherIsBetter: false,
      format: (value) => `${formatINR(value)}/yr`,
    },
    {
      key: 'location',
      value: item.option.distanceKm,
      higherIsBetter: false,
      format: formatKm,
    },
    {
      key: 'placements',
      value: item.option.placementScore,
      higherIsBetter: true,
      format: (value) => `${value}/100`,
    },
    {
      key: 'campus',
      value: item.option.campusScore,
      higherIsBetter: true,
      format: (value) => `${value}/100`,
    },
  ]

  for (const check of checks) {
    const declaredWeight = profile.factorWeights[check.key]
    if (declaredWeight < STRONGLY_CARES || check.value == null) continue

    const peers = eligible
      .filter((other) => other.itemId !== item.itemId)
      .map((other) => ({
        item: other,
        value:
          check.key === 'fees'
            ? other.option.annualFee
            : check.key === 'location'
              ? other.option.distanceKm
              : check.key === 'placements'
                ? other.option.placementScore
                : other.option.campusScore,
      }))
      .filter((entry): entry is { item: StrategyItem; value: number } => entry.value != null)

    if (peers.length < 2) continue

    const worseThanAll = peers.every((entry) =>
      check.higherIsBetter ? entry.value > check.value! : entry.value < check.value!,
    )
    if (!worseThanAll) continue

    const best = [...peers].sort((a, b) =>
      check.higherIsBetter ? b.value - a.value : a.value - b.value,
    )[0]

    out.push(
      makeFinding(
        'CONTRADICTS_WEIGHT',
        FACTOR_DIMENSION[check.key],
        'risks',
        'VIOLATED',
        declaredWeight / 5,
        {
          factorLabel: factorLabel(check.key),
          weightWord: weightWord(declaredWeight),
          position: item.position,
          thisValue: check.format(check.value),
          bestValue: check.format(best.value),
          bestName: `${best.item.option.collegeShort} · ${best.item.option.branch}`,
          bestPosition: best.item.position,
          comparedCount: peers.length,
        },
        'CONTRADICTION',
      ),
    )
  }

  return out.map((finding, index) => ({ ...finding, id: `${finding.code}:${index}` }))
}

function foldConflicts(item: StrategyItem, ctx: ImpactContext): ImpactFinding[] {
  const conflicts = ctx.conflicts ?? []
  const out: ImpactFinding[] = []

  for (const conflict of conflicts) {
    if (!conflict.itemIds.includes(item.itemId)) continue
    const counterpartId = conflict.itemIds.find((id) => id !== item.itemId)
    const counterpart = ctx.items.find((other) => other.itemId === counterpartId)
    const counterpartName = counterpart
      ? `${counterpart.option.collegeShort} · ${counterpart.option.branch}`
      : null

    switch (conflict.code) {
      case 'CF-01':
        out.push(
          makeFinding(
            'CONTRADICTS_BRANCH_ORDER',
            'branch',
            'risks',
            'VIOLATED',
            0.9,
            {
              order: ctx.profile.branchPriority.join(' > '),
              counterpartName,
              counterpartBranch: counterpart?.option.branch ?? null,
              counterpartPosition: counterpart?.position ?? null,
              thisBranch: item.option.branch,
              position: item.position,
              severity: conflict.severity,
            },
            'CONTRADICTION',
          ),
        )
        break
      case 'CF-04':
        out.push(
          makeFinding('DOMINATED_BY_NEIGHBOUR', 'order', 'risks', 'VIOLATED', 0.8, {
            counterpartName,
            counterpartPosition: counterpart?.position ?? null,
            position: item.position,
            aboveThis: (counterpart?.position ?? 0) < item.position,
          }),
        )
        break
      case 'CF-05':
        out.push(
          makeFinding('NO_SAFE_FALLBACK', 'reach', 'risks', 'VIOLATED', 0.85, {
            total: ctx.items.length,
            tier: item.tier,
          }),
        )
        break
      case 'CF-07':
        out.push(
          makeFinding('DUPLICATE_SLOT', 'order', 'risks', 'VIOLATED', 0.6, {
            optionId: item.option.id,
            counterpartPosition: counterpart?.position ?? null,
            position: item.position,
          }),
        )
        break
      default:
        break
    }
  }

  const seen = new Set<string>()
  return out.filter((finding) => {
    if (seen.has(finding.code)) return false
    seen.add(finding.code)
    return true
  })
}

function evaluateEvidence(item: StrategyItem): ImpactFinding[] {
  if (item.option.missingFacts.length === 0) return []
  return [
    makeFinding('EVIDENCE_MISSING', 'evidence', 'unknowns', 'UNKNOWN', 0.5, {
      facts: item.option.missingFacts.join(', '),
      count: item.option.missingFacts.length,
      confidence: item.confidence,
      college: item.option.collegeShort,
    }),
  ]
}

function buildFit(
  item: StrategyItem,
  ctx: ImpactContext,
  findings: ImpactFinding[],
): FitScore {
  const { profile } = ctx
  const { option } = item
  const contributions: FitContribution[] = []

  const branchIndex = branchRank(profile, option.branch)
  contributions.push({
    key: 'branch',
    label: 'Branch order',
    weight: BRANCH_WEIGHT,
    weightWord: 'Fixed 30%',
    satisfaction: branchSatisfaction(profile, option.branch),
    evidence:
      branchIndex >= 0
        ? `${option.branch} is #${branchIndex + 1} of ${profile.branchPriority.length} in your order`
        : `${option.branch} is not in your branch order`,
  })

  const raw: Record<FactorKey, { satisfaction: number | null; evidence: string }> = {
    fees:
      option.annualFee == null
        ? { satisfaction: null, evidence: 'Fee not on record' }
        : {
            satisfaction: clamp01(1 - 0.5 * (option.annualFee / profile.budget.value)),
            evidence: `${formatINR(option.annualFee)}/yr against your ${formatINR(profile.budget.value)} ceiling`,
          },
    location:
      option.distanceKm == null
        ? { satisfaction: null, evidence: 'Distance not on record' }
        : {
            satisfaction: clamp01(1 - 0.5 * (option.distanceKm / profile.distance.value)),
            evidence: `${formatKm(option.distanceKm)} against your ${formatKm(profile.distance.value)} limit`,
          },
    placements:
      option.placementScore == null
        ? { satisfaction: null, evidence: 'Placement record not on record' }
        : {
            satisfaction: option.placementScore / 100,
            evidence: `Recorded placement index ${option.placementScore}/100`,
          },
    campus:
      option.campusScore == null
        ? { satisfaction: null, evidence: 'Campus score not on record' }
        : {
            satisfaction: option.campusScore / 100,
            evidence: `Recorded campus index ${option.campusScore}/100`,
          },
    hostel: {
      satisfaction: option.hostelAvailable ? 1 : 0,
      evidence: option.hostelAvailable ? 'Hostel listed for this campus' : 'No hostel listed',
    },
  }

  const factorTotal = Object.values(profile.factorWeights).reduce((sum, value) => sum + value, 0)

  for (const factor of FACTORS) {
    const declaredWeight = profile.factorWeights[factor.key]
    contributions.push({
      key: factor.key,
      label: factor.label,
      weight: factorTotal === 0 ? 0 : (declaredWeight / factorTotal) * (1 - BRANCH_WEIGHT),
      weightWord: weightWord(declaredWeight),
      satisfaction: raw[factor.key].satisfaction,
      evidence: raw[factor.key].evidence,
    })
  }

  const weighted = contributions.filter((entry) => entry.weight > 0)
  const usable = weighted.filter((entry) => entry.satisfaction != null)
  const declaredWeightTotal = weighted.reduce((sum, entry) => sum + entry.weight, 0)
  const usableWeight = usable.reduce((sum, entry) => sum + entry.weight, 0)
  const score =
    usableWeight === 0
      ? 0
      : Math.round(
          (usable.reduce((sum, entry) => sum + entry.weight * entry.satisfaction!, 0) /
            usableWeight) *
            100,
        )
  const coverage = declaredWeightTotal === 0 ? 0 : usableWeight / declaredWeightTotal
  const unmeasured = weighted
    .filter((entry) => entry.satisfaction == null)
    .map((entry) => entry.label)

  const counts = { satisfied: 0, partial: 0, violated: 0, unknown: 0 }
  for (const finding of findings) {
    if (finding.section === 'consequences') continue
    if (finding.state === 'SATISFIED') counts.satisfied += 1
    else if (finding.state === 'PARTIAL') counts.partial += 1
    else if (finding.state === 'VIOLATED') counts.violated += 1
    else counts.unknown += 1
  }

  const blocked = findings.some((finding) => finding.section === 'blocking')
  const band: FitBand = blocked
    ? 'BLOCKED'
    : score >= 75
      ? 'STRONG'
      : score >= 55
        ? 'WORKABLE'
        : score >= 35
          ? 'STRAINED'
          : 'POOR'

  return {
    score,
    band,
    coverage: Number(coverage.toFixed(4)),
    unmeasured,
    ...counts,
    contributions,
  }
}

function declaredPreferences(
  item: StrategyItem,
  ctx: ImpactContext,
): DeclaredPreference[] {
  const { profile } = ctx
  const authorityId = ctx.authority ?? DEFAULT_AUTHORITY
  const out: DeclaredPreference[] = [
    {
      key: 'rank',
      label: profile.rankType === 'CRL' ? 'Common rank' : 'Category rank',
      value: profile.rank == null ? 'Not set' : formatRank(profile.rank),
      mode: 'fact',
      relevant: true,
    },
    {
      key: 'pool',
      label: 'Seat pool',
      value: poolLabel(profile, authorityId),
      mode: 'fact',
      relevant: true,
    },
    {
      key: 'homeCity',
      label: 'Home city',
      value: profile.homeCity ?? 'Not set',
      mode: 'fact',
      relevant: true,
    },
    {
      key: 'branchPriority',
      label: 'Branch order',
      value: profile.branchPriority.join(' > '),
      mode: 'soft',
      relevant: true,
    },
    {
      key: 'budget',
      label: 'Annual budget',
      value: formatINR(profile.budget.value),
      mode: profile.budget.mode,
      relevant: true,
    },
    {
      key: 'distance',
      label: 'Distance from home',
      value: formatKm(profile.distance.value),
      mode: profile.distance.mode,
      relevant: true,
    },
  ]

  if (profile.subQuotas.length > 0) {
    out.push({
      key: 'subQuotas',
      label: 'Quotas claimed',
      value: profile.subQuotas
        .map((quota) => SUB_QUOTAS.find((entry) => entry.value === quota)?.label ?? quota)
        .join(', '),
      mode: 'fact',
      relevant: true,
    })
  }

  for (const factor of FACTORS) {
    const declaredWeight = profile.factorWeights[factor.key]
    if (declaredWeight < CARES) continue
    out.push({
      key: `weight:${factor.key}`,
      label: factor.label,
      value: weightWord(declaredWeight),
      mode: 'soft',
      relevant: true,
    })
  }

  const matched = new Set(exclusionsMatching(profile, item).map((exclusion) => exclusion.id))
  for (const exclusion of profile.hardExclusions) {
    out.push({
      key: `exclusion:${exclusion.id}`,
      label: 'Never accept',
      value: exclusion.label.replace(/^Never accept /, ''),
      mode: 'hard',
      relevant: matched.has(exclusion.id),
    })
  }

  return out
}

export function evaluateDecisionImpact(
  item: StrategyItem,
  ctx: ImpactContext,
): DecisionImpact {
  const eligible = ctx.items.filter((other) => !breaksHardLimit(other, ctx.profile))

  const findings = [
    ...evaluateExclusions(item, ctx),
    ...evaluateBranch(item, ctx, eligible),
    ...evaluateBudget(item, ctx, eligible),
    ...evaluateDistance(item, ctx, eligible),
    ...evaluateScored(item, ctx, eligible, 'placements'),
    ...evaluateScored(item, ctx, eligible, 'campus'),
    ...evaluateHostel(item, ctx),
    ...evaluateReach(item, ctx, eligible),
    ...evaluateContradictions(item, ctx, eligible),
    ...foldConflicts(item, ctx),
    ...evaluateEvidence(item),
    ...evaluateOrder(item, ctx),
  ]

  const bySection = (section: ImpactSection) =>
    findings
      .filter((finding) => finding.section === section)
      .sort((a, b) => b.weight - a.weight)

  return {
    itemId: item.itemId,
    optionId: item.option.id,
    name: `${item.option.collegeShort} · ${item.option.branch}`,
    college: item.option.college,
    branch: item.option.branch,
    branchLabel: branchLabel(item.option.branch),
    city: item.option.city,
    instituteType:
      INSTITUTE_TYPE_LABELS[item.option.instituteType] ?? item.option.instituteType,
    position: item.position,
    total: ctx.items.length,
    tier: item.tier,
    fit: buildFit(item, ctx, findings),
    declared: declaredPreferences(item, ctx),
    blocking: bySection('blocking'),
    works: bySection('works'),
    compromises: bySection('compromises'),
    risks: bySection('risks'),
    consequences: findings.filter((finding) => finding.section === 'consequences'),
    unknowns: bySection('unknowns'),
  }
}

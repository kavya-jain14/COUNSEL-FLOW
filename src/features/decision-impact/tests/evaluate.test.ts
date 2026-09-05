import { describe, expect, it } from 'vitest'
import type { CandidateProfile, CollegeOption, StrategyItem } from '../../../types'
import { OPTIONS_BY_ID } from '../../../data/seedOptions'
import { distanceBetweenCities } from '../../../data/geo'
import { tierFor } from '../../../mock/strategy'
import { evaluateDecisionImpact } from '../lib/evaluate'
import { narrateImpact } from '../lib/narrate'
import type { DecisionImpact, ImpactCode, ImpactFinding } from '../lib/types'

const BASE_PROFILE: CandidateProfile = {
  rank: 12500,
  rankType: 'CRL',
  category: 'GEN',
  domicile: 'UP',
  subQuotas: [],
  homeCity: 'Lucknow',
  branchPriority: ['CSE', 'IT', 'ECE'],
  budget: { value: 150000, mode: 'hard' },
  distance: { value: 300, mode: 'hard' },
  hardExclusions: [],
  factorWeights: { placements: 4, fees: 3, location: 3, campus: 2, hostel: 2 },
}

function build(profile: CandidateProfile, optionIds: string[]): StrategyItem[] {
  return optionIds.map((id, index) => {
    const seed = OPTIONS_BY_ID[id]
    const option: CollegeOption = {
      ...seed,
      distanceKm: distanceBetweenCities(profile.homeCity, seed.city),
    }
    return {
      itemId: `item-${index + 1}`,
      option,
      tier: tierFor(option, profile.rank),
      position: index + 1,
      reasons: [
        { code: 'R-TEST', label: 'Test', detail: 'Fixture reason.', polarity: 'neutral' },
      ],
      confidence: option.missingFacts.length === 0 ? 'high' : 'medium',
      manuallyPlaced: false,
    }
  })
}

function impactFor(profile: CandidateProfile, optionIds: string[], at = 0): DecisionImpact {
  const items = build(profile, optionIds)
  return evaluateDecisionImpact(items[at], { profile, items })
}

function codes(findings: ImpactFinding[]): ImpactCode[] {
  return findings.map((finding) => finding.code)
}

describe('decision impact — deterministic layer', () => {
  it('reads a first-choice branch inside every limit as a strong match with nothing blocking', () => {
    const roomy: CandidateProfile = { ...BASE_PROFILE, budget: { value: 220000, mode: 'hard' } }
    const impact = impactFor(roomy, ['hbtu-kanpur-cse', 'iet-lucknow-it'])

    expect(impact.blocking).toHaveLength(0)
    expect(codes(impact.works)).toContain('BRANCH_FIRST_CHOICE')
    expect(codes(impact.works)).toContain('FEE_WITHIN')
    expect(impact.fit.band).not.toBe('BLOCKED')
  })

  it('warns about headroom before a limit is broken, not after', () => {
    const impact = impactFor(BASE_PROFILE, ['hbtu-kanpur-cse', 'iet-lucknow-it'])
    const tight = impact.risks.find((f) => f.code === 'FEE_TIGHT')

    expect(impact.blocking).toHaveLength(0)
    expect(tight).toBeDefined()
    expect(tight!.facts.usedPct).toBe(95)
    expect(codes(impact.works)).not.toContain('FEE_WITHIN')
  })

  it('separates a hard limit breach from a soft one on the same option', () => {
    const nearby: CandidateProfile = { ...BASE_PROFILE, distance: { value: 60, mode: 'hard' } }
    const hard = impactFor(nearby, ['hbtu-kanpur-cse', 'iet-lucknow-it'])
    expect(codes(hard.blocking)).toContain('DISTANCE_HARD_BREACH')
    expect(hard.fit.band).toBe('BLOCKED')

    const soft: CandidateProfile = { ...BASE_PROFILE, distance: { value: 60, mode: 'soft' } }
    const lenient = impactFor(soft, ['hbtu-kanpur-cse', 'iet-lucknow-it'])
    expect(lenient.blocking).toHaveLength(0)
    expect(codes(lenient.compromises)).toContain('DISTANCE_SOFT_BREACH')
    expect(lenient.fit.band).not.toBe('BLOCKED')
  })

  it('reports a branch downgrade against the candidate own order, not against the branch itself', () => {
    const impact = impactFor(BASE_PROFILE, ['iet-lucknow-it', 'hbtu-kanpur-cse'])
    const downgrade = impact.compromises.find((f) => f.code === 'BRANCH_DOWNGRADE')

    expect(downgrade).toBeDefined()
    expect(downgrade!.facts.choiceNumber).toBe(2)
    expect(downgrade!.facts.firstChoice).toBe('CSE')
    expect(downgrade!.facts.stepsDown).toBe(1)
    expect(codes(impact.compromises)).toContain('BRANCH_AVAILABLE_ELSEWHERE')
  })

  it('treats a never-accept exclusion as blocking rather than as a ranking penalty', () => {
    const excluded: CandidateProfile = {
      ...BASE_PROFILE,
      branchPriority: ['IT', 'ECE'],
      hardExclusions: [
        { id: 'branch:CSE', kind: 'branch', value: 'CSE', label: 'Never accept CSE' },
      ],
    }
    const impact = impactFor(excluded, ['hbtu-kanpur-cse', 'iet-lucknow-it'])

    expect(codes(impact.blocking)).toContain('BRANCH_EXCLUDED')
    expect(impact.fit.band).toBe('BLOCKED')
  })

  it('stays silent about factors the candidate weighted at zero', () => {
    const indifferent: CandidateProfile = {
      ...BASE_PROFILE,
      budget: { value: 150000, mode: 'soft' },
      factorWeights: { placements: 0, fees: 0, location: 0, campus: 0, hostel: 5 },
    }
    const impact = impactFor(indifferent, ['hbtu-kanpur-cse', 'iet-lucknow-it'])
    const spoken = [...impact.works, ...impact.compromises, ...impact.risks]

    expect(spoken.some((f) => f.dimension === 'placements')).toBe(false)
    expect(spoken.some((f) => f.dimension === 'campus')).toBe(false)
  })

  it('names the seat pool from category and domicile, and flags a quota it cannot model', () => {
    const quota: CandidateProfile = { ...BASE_PROFILE, category: 'OBC', subQuotas: ['GIRLS'] }
    const impact = impactFor(quota, ['hbtu-kanpur-cse', 'iet-lucknow-it'])
    const reach = [...impact.works, ...impact.risks, ...impact.unknowns].find(
      (f) => f.dimension === 'reach',
    )

    expect(String(reach!.facts.pool)).toContain('OBC')
    expect(codes(impact.unknowns)).toContain('QUOTA_NOT_MODELLED')
  })

  it('states the ordering consequence of the position the option actually holds', () => {
    const items = build(BASE_PROFILE, [
      'hbtu-kanpur-cse',
      'iet-lucknow-it',
      'mmmut-gorakhpur-ece',
    ])
    const impact = evaluateDecisionImpact(items[1], { profile: BASE_PROFILE, items })
    const forfeit = impact.consequences.find((f) => f.code === 'ORDER_FORFEIT')
    const ahead = impact.consequences.find((f) => f.code === 'ORDER_AHEAD')

    expect(forfeit!.facts.belowCount).toBe(1)
    expect(ahead!.facts.aboveCount).toBe(1)
  })

  it('produces an identical evaluation for identical inputs', () => {
    const first = impactFor(BASE_PROFILE, ['hbtu-kanpur-cse', 'iet-lucknow-it'])
    const second = impactFor(BASE_PROFILE, ['hbtu-kanpur-cse', 'iet-lucknow-it'])

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })
})

describe('decision impact — narration layer', () => {
  it('renders every finding the deterministic layer emits', () => {
    const profiles: CandidateProfile[] = [
      BASE_PROFILE,
      { ...BASE_PROFILE, distance: { value: 60, mode: 'soft' } },
      { ...BASE_PROFILE, budget: { value: 130000, mode: 'soft' } },
      { ...BASE_PROFILE, branchPriority: ['ME'], subQuotas: ['PWD'] },
      {
        ...BASE_PROFILE,
        factorWeights: { placements: 5, fees: 5, location: 5, campus: 5, hostel: 5 },
      },
    ]
    const ids = Object.keys(OPTIONS_BY_ID).slice(0, 6)

    for (const profile of profiles) {
      const items = build(profile, ids)
      for (const item of items) {
        const narrated = narrateImpact(evaluateDecisionImpact(item, { profile, items }))
        const all = [
          ...narrated.blocking,
          ...narrated.works,
          ...narrated.compromises,
          ...narrated.risks,
          ...narrated.consequences,
          ...narrated.unknowns,
        ]
        for (const finding of all) {
          expect(finding.headline.length).toBeGreaterThan(0)
          expect(finding.detail.length).toBeGreaterThan(0)
          expect(finding.headline).not.toContain('undefined')
          expect(finding.detail).not.toContain('undefined')
          expect(finding.detail).not.toContain('NaN')
        }
        expect(narrated.bottomLine.length).toBeGreaterThan(0)
      }
    }
  })

  it('leads the bottom line with the overridden limit when a hard constraint breaks', () => {
    const nearby: CandidateProfile = { ...BASE_PROFILE, distance: { value: 60, mode: 'hard' } }
    const narrated = narrateImpact(impactFor(nearby, ['hbtu-kanpur-cse', 'iet-lucknow-it']))

    expect(narrated.bottomLine[0]).toContain('absolute')
    expect(narrated.bottomLine[0]).toContain('HBTU Kanpur')
  })

  it('frames the bottom line as a trade when the option both gives and costs', () => {
    const narrated = narrateImpact(impactFor(BASE_PROFILE, ['iet-lucknow-it', 'hbtu-kanpur-cse']))

    expect(narrated.bottomLine[0]).toContain('willing to trade')
    expect(narrated.bottomLine[0]).toContain('CSE')
  })

  it('quotes the candidate own declared wording back to them', () => {
    const narrated = narrateImpact(impactFor(BASE_PROFILE, ['hbtu-kanpur-cse', 'iet-lucknow-it']))
    const quoted = [...narrated.works, ...narrated.compromises]
      .map((finding) => finding.yourWords)
      .filter((words): words is string => words != null)

    expect(quoted.some((words) => words.startsWith('Branch order:'))).toBe(true)
    expect(quoted.some((words) => words.includes('hard limit'))).toBe(true)
  })

  it('is a pure function of the structured impact', () => {
    const impact = impactFor(BASE_PROFILE, ['hbtu-kanpur-cse', 'iet-lucknow-it'])

    expect(JSON.stringify(narrateImpact(impact))).toBe(JSON.stringify(narrateImpact(impact)))
  })
})

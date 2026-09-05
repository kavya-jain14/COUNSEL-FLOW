/**
 * Boundary tests for deterministic tier classification.
 *
 * These tests are the golden fixture referenced by AGENTS.md and docs/CURRENT_STATE.md.
 * Any change to TIER_DREAM_RATIO_MAX or TIER_TARGET_RATIO_MAX MUST:
 *   1. update these expected values;
 *   2. bump the engine version in packages/contracts/src/strategy.ts.
 *
 * Run with:  npx vitest run src/mock/strategy.test.ts
 */

import { describe, expect, it } from 'vitest'
import {
  TIER_DREAM_RATIO_MAX,
  TIER_TARGET_RATIO_MAX,
  tierFor,
  confidenceFor,
  renumber,
  generateMockStrategy,
} from './strategy.js'
import type { CollegeOption, CandidateProfile, StrategyItem } from '../types/index.js'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeOption(closingRank: number | null, missingFacts: string[] = []): CollegeOption {
  return {
    id: 'test-option',
    college: 'Test College',
    collegeShort: 'TC',
    branch: 'CSE',
    instituteType: 'GOVERNMENT',
    city: 'TestCity',
    annualFee: 100000,
    distanceKm: 100,
    hostelAvailable: true,
    placementScore: 80,
    campusScore: 75,
    closingRank,
    sourceLabel: 'Test source',
    sourceYear: 2024,
    missingFacts,
  }
}

const MOCK_PROFILE: CandidateProfile = {
  rank: 10000,
  homeCity: null,
  rankType: 'CRL',
  category: 'GEN',
  domicile: 'UP',
  subQuotas: [],
  branchPriority: ['CSE', 'IT'],
  budget: { value: 200000, mode: 'soft' },
  distance: { value: 500, mode: 'soft' },
  hardExclusions: [],
  factorWeights: { fees: 2, location: 1, placements: 3, campus: 2, hostel: 1 },
}

// ─── exported constants ───────────────────────────────────────────────────────

describe('exported buffer constants', () => {
  it('TIER_DREAM_RATIO_MAX equals 0.90', () => {
    expect(TIER_DREAM_RATIO_MAX).toBe(0.90)
  })

  it('TIER_TARGET_RATIO_MAX equals 1.40', () => {
    expect(TIER_TARGET_RATIO_MAX).toBe(1.40)
  })

  it('DREAM_RATIO_MAX < TARGET_RATIO_MAX', () => {
    expect(TIER_DREAM_RATIO_MAX).toBeLessThan(TIER_TARGET_RATIO_MAX)
  })
})

// ─── tierFor: null-guard ──────────────────────────────────────────────────────

describe('tierFor — UNKNOWN when data is absent', () => {
  it('null candidateRank → UNKNOWN', () => {
    expect(tierFor(makeOption(10000), null)).toBe('UNKNOWN')
  })

  it('null option.closingRank → UNKNOWN', () => {
    expect(tierFor(makeOption(null), 10000)).toBe('UNKNOWN')
  })

  it('both null → UNKNOWN', () => {
    expect(tierFor(makeOption(null), null)).toBe('UNKNOWN')
  })
})

// ─── tierFor: DREAM (ratio < 0.90) ───────────────────────────────────────────

describe('tierFor — DREAM', () => {
  it('ratio=0.50 → DREAM', () => {
    expect(tierFor(makeOption(5000), 10000)).toBe('DREAM')
  })

  it('ratio=0.8999 (just below boundary) → DREAM', () => {
    expect(tierFor(makeOption(8999), 10000)).toBe('DREAM')
  })

  it('ratio=0.90 (exactly at boundary) → NOT DREAM — TARGET', () => {
    expect(tierFor(makeOption(9000), 10000)).toBe('TARGET')
  })
})

// ─── tierFor: TARGET (0.90 ≤ ratio < 1.40) ───────────────────────────────────

describe('tierFor — TARGET', () => {
  it('ratio=0.90 (lower boundary) → TARGET', () => {
    expect(tierFor(makeOption(9000), 10000)).toBe('TARGET')
  })

  it('ratio=1.00 (equal ranks) → TARGET', () => {
    expect(tierFor(makeOption(10000), 10000)).toBe('TARGET')
  })

  it('ratio=1.20 → TARGET', () => {
    expect(tierFor(makeOption(12000), 10000)).toBe('TARGET')
  })

  it('ratio=1.3999 (just below upper boundary) → TARGET', () => {
    expect(tierFor(makeOption(13999), 10000)).toBe('TARGET')
  })

  it('ratio=1.40 (exactly at upper boundary) → NOT TARGET — SAFE', () => {
    expect(tierFor(makeOption(14000), 10000)).toBe('SAFE')
  })
})

// ─── tierFor: SAFE (ratio ≥ 1.40) ────────────────────────────────────────────

describe('tierFor — SAFE', () => {
  it('ratio=1.40 (boundary) → SAFE', () => {
    expect(tierFor(makeOption(14000), 10000)).toBe('SAFE')
  })

  it('ratio=3.00 → SAFE', () => {
    expect(tierFor(makeOption(30000), 10000)).toBe('SAFE')
  })
})

// ─── tierFor: edge ranks ──────────────────────────────────────────────────────

describe('tierFor — edge ranks', () => {
  it('rank=1, closing=1 → ratio=1.00 → TARGET', () => {
    expect(tierFor(makeOption(1), 1)).toBe('TARGET')
  })

  it('rank=2000000, closing=1000000 → ratio=0.50 → DREAM', () => {
    expect(tierFor(makeOption(1000000), 2000000)).toBe('DREAM')
  })

  it('rank=2000000, closing=3000000 → ratio=1.50 → SAFE', () => {
    expect(tierFor(makeOption(3000000), 2000000)).toBe('SAFE')
  })
})

// ─── confidenceFor ───────────────────────────────────────────────────────────

describe('confidenceFor', () => {
  it('no missing facts → high', () => {
    expect(confidenceFor(makeOption(10000, []))).toBe('high')
  })

  it('one missing fact → medium', () => {
    expect(confidenceFor(makeOption(10000, ['annualFee']))).toBe('medium')
  })

  it('two missing facts → low', () => {
    expect(confidenceFor(makeOption(null, ['annualFee', 'closingRank']))).toBe('low')
  })

  it('three missing facts → low', () => {
    expect(confidenceFor(makeOption(null, ['annualFee', 'closingRank', 'placementScore']))).toBe('low')
  })
})

// ─── renumber ────────────────────────────────────────────────────────────────

describe('renumber', () => {
  it('reassigns position 1-based from array order', () => {
    const items = [
      { itemId: 'a', position: 3 } as unknown as StrategyItem,
      { itemId: 'b', position: 7 } as unknown as StrategyItem,
      { itemId: 'c', position: 1 } as unknown as StrategyItem,
    ]
    const result = renumber(items)
    expect(result.map((i) => i.position)).toEqual([1, 2, 3])
  })

  it('preserves all other item fields', () => {
    const items = [{ itemId: 'x', position: 99, extra: 'preserved' } as unknown as StrategyItem]
    const [result] = renumber(items)
    expect((result as unknown as { extra: string }).extra).toBe('preserved')
  })
})

// ─── generateMockStrategy integration ────────────────────────────────────────

describe('generateMockStrategy — integration with seed data', () => {
  it('positions match array index (1-based)', () => {
    const items = generateMockStrategy(MOCK_PROFILE)
    items.forEach((item, idx) => {
      expect(item.position, `item[${idx}].position should be ${idx + 1}`).toBe(idx + 1)
    })
  })

  it('HBTU CSE (closingRank=8900, rank=10000, ratio≈0.89) → DREAM', () => {
    const items = generateMockStrategy(MOCK_PROFILE)
    const item = items.find((i) => i.option.id === 'hbtu-kanpur-cse')
    expect(item, 'hbtu-kanpur-cse must be in the mock list').toBeTruthy()
    expect(item!.tier).toBe('DREAM')
  })

  it('IET Lucknow IT (closingRank=11400, rank=10000, ratio=1.14) → TARGET', () => {
    const items = generateMockStrategy(MOCK_PROFILE)
    // the mock order contains iet-lucknow-it twice; find first occurrence
    const item = items.find((i) => i.option.id === 'iet-lucknow-it')
    expect(item, 'iet-lucknow-it must be in the mock list').toBeTruthy()
    expect(item!.tier).toBe('TARGET')
  })

  it('HBTU Kanpur EE (closingRank=19500, rank=10000, ratio=1.95) → SAFE', () => {
    const items = generateMockStrategy(MOCK_PROFILE)
    const item = items.find((i) => i.option.id === 'hbtu-kanpur-ee')
    expect(item, 'hbtu-kanpur-ee must be in the mock list').toBeTruthy()
    expect(item!.tier).toBe('SAFE')
  })

  it('REC Banda (closingRank=null) → UNKNOWN', () => {
    const items = generateMockStrategy(MOCK_PROFILE)
    const item = items.find((i) => i.option.id === 'rec-banda-cse')
    expect(item, 'rec-banda-cse must be in the mock list').toBeTruthy()
    expect(item!.tier).toBe('UNKNOWN')
  })
})

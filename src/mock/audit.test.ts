import { describe, expect, it } from 'vitest'
import { DEMO_PROFILE } from '../state/store'
import { distanceBetweenCities } from '../data/geo'
import { runStrategyEngine } from './engine'
import { runAudit } from './audit'
import { generateStrategy } from './api'

describe('candidate-facing audit density', () => {
  it('groups the same evidence gap into one decision instead of one warning per option', () => {
    const items = runStrategyEngine(DEMO_PROFILE, {
      authority: 'JOSAA',
      year: 2025,
      round: 6,
    })
    const missingItems = items.filter((item) => item.option.missingFacts.length > 0)
    const signatures = new Set(
      missingItems.map((item) => [...item.option.missingFacts].sort().join('|')),
    )
    const evidenceGaps = runAudit(DEMO_PROFILE, items, []).conflicts.filter(
      (conflict) => conflict.code === 'CF-08',
    )

    expect(missingItems.length).toBeGreaterThan(1)
    expect(evidenceGaps).toHaveLength(signatures.size)
    expect(evidenceGaps.flatMap((conflict) => conflict.itemIds).sort()).toEqual(
      missingItems.map((item) => item.itemId).sort(),
    )
    expect(evidenceGaps.some((conflict) => conflict.itemIds.length > 1)).toBe(true)
  })

  it('can calculate Delhi distance for IPU instead of marking every option unknown', () => {
    expect(distanceBetweenCities('Lucknow', 'Delhi')).toEqual(expect.any(Number))
  })

  it('keeps grouped warnings inside the shared response contract', async () => {
    const response = await generateStrategy(DEMO_PROFILE, {
      authority: 'JOSAA',
      year: 2025,
      round: 6,
    })

    expect(response.audit.counts.WARNING).toBeLessThan(response.items.length)
    expect(response.datasetVersion).toContain('JoSAA 2025 Round 6')
  })

  it('returns an explainable empty result instead of a contract failure', async () => {
    const response = await generateStrategy(DEMO_PROFILE, {
      authority: 'IPU',
      year: 2026,
      round: 3,
    })

    expect(response.items).toHaveLength(0)
    expect(response.audit.canLock).toBe(false)
    expect(response.audit.conflicts.map((conflict) => conflict.code)).toContain('CF-05')
  })
})

import { describe, expect, it } from 'vitest'
import type { AuditResult, Conflict, ConflictAction, LockState, StrategyGenerateResponse } from '../types'
import { appReducer, INITIAL_STATE } from './store'

const locked = { snapshotId: 'locked-test' } as LockState

describe('app state safety boundaries', () => {
  it('clears counselling-specific rank when the authority changes', () => {
    const state = {
      ...INITIAL_STATE,
      profile: {
        ...INITIAL_STATE.profile,
        rank: 12_500,
        category: 'GEN' as const,
        domicile: 'UP' as const,
      },
    }

    const next = appReducer(state, { type: 'SET_AUTHORITY', authorityId: 'JOSAA' })

    expect(next.authorityId).toBe('JOSAA')
    expect(next.profile.rank).toBeNull()
    expect(next.profile.domicile).toBeNull()
    expect(next.announcement).toContain('Enter its rank')
  })

  it('ignores an async response after its operation was invalidated', () => {
    const busy = appReducer(INITIAL_STATE, { type: 'BUSY', busy: 'generate', token: 11 })
    const changed = appReducer(busy, {
      type: 'PATCH_PROFILE',
      patch: { rank: 9_999 },
    })
    const staleResponse = {
      items: [{ itemId: 'stale-item' }],
      audit: { conflicts: [] },
    } as unknown as StrategyGenerateResponse

    const next = appReducer(changed, {
      type: 'GENERATED',
      response: staleResponse,
      token: 11,
    })

    expect(next.items).toHaveLength(0)
    expect(next.profile.rank).toBe(9_999)
  })

  it('keeps profile and strategy mutations read-only after lock', () => {
    const state = { ...INITIAL_STATE, lock: locked }

    expect(appReducer(state, { type: 'PATCH_PROFILE', patch: { rank: 1 } })).toBe(state)
    expect(appReducer(state, { type: 'REMOVE_ITEM', itemId: 'anything' })).toBe(state)
    expect(appReducer(state, { type: 'SET_AUTHORITY', authorityId: 'IPU' })).toBe(state)
  })

  it('rejects allotment records when no locked snapshot exists', () => {
    const next = appReducer(INITIAL_STATE, {
      type: 'RECORD_ALLOTMENT',
      optionId: null,
    })

    expect(next).toBe(INITIAL_STATE)
  })

  it('records converting a hard limit to soft as a fix, not an override', () => {
    const conflict = {
      id: 'CF-02:item',
      code: 'CF-02',
      severity: 'CRITICAL',
    } as Conflict
    const action = {
      id: 'soften-budget',
      kind: 'CONVERT_TO_SOFT',
      label: 'Make budget soft',
      effect: 'Budget becomes a preference.',
      target: { constraint: 'budget' },
    } as ConflictAction
    const state = {
      ...INITIAL_STATE,
      audit: { runId: 1 } as AuditResult,
    }

    const next = appReducer(state, {
      type: 'APPLY_ACTION',
      conflict,
      action,
      reason: 'I can reconsider the budget.',
    })

    expect(next.resolutions[0]?.kind).toBe('FIXED')
    expect(next.profile.budget.mode).toBe('soft')
  })

  it('marks an empty-result audit stale when the profile changes', () => {
    const state = {
      ...INITIAL_STATE,
      audit: { conflicts: [], canLock: false } as unknown as AuditResult,
    }

    const next = appReducer(state, {
      type: 'PATCH_PROFILE',
      patch: { distance: { value: 500, mode: 'hard' } },
    })

    expect(next.auditStale).toBe(true)
  })
})

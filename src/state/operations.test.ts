import { beforeAll, expect, test } from 'vitest'
import { auditStrategy, generateStrategy, lockStrategy } from '../mock/api'
import type { AuditResult, LockState, StrategyGenerateResponse } from '../types'
import { appReducer, DEMO_PROFILE, INITIAL_STATE, type AppState } from './store'
import { toApiError } from '../features/contracts'

let generated: StrategyGenerateResponse
let cleanAudit: AuditResult
let snapshot: LockState

beforeAll(async () => {
  generated = await generateStrategy(DEMO_PROFILE)
  const items = generated.items
    .filter((item) => item.option.id !== 'rec-banda-cse')
    .map((item, i) => ({ ...item, position: i + 1 }))
  cleanAudit = await auditStrategy(DEMO_PROFILE, items, [], generated.audit.runId)
  snapshot = (await lockStrategy(DEMO_PROFILE, items, [], cleanAudit)).snapshot
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => { resolve = complete })
  return { promise, resolve }
}

function sampleState() {
  return appReducer(INITIAL_STATE, { type: 'LOAD_DEMO_PROFILE' })
}

function generatedState() {
  const operation = Symbol()
  return appReducer(
    appReducer(sampleState(), { type: 'BUSY', busy: 'generate', operation }),
    { type: 'GENERATED', response: generated, operation },
  )
}

test.each(['profile edit', 'sample reload', 'authority change', 'reset', 'navigation'] as const)(
  'ignores a delayed generation after %s',
  async (change) => {
    const operation = Symbol()
    let state = appReducer(sampleState(), { type: 'BUSY', busy: 'generate', operation })
    const pending = deferred<StrategyGenerateResponse>()
    const completion = pending.promise.then((response) => {
      state = appReducer(state, { type: 'GENERATED', response, operation })
    })
    switch (change) {
      case 'profile edit': state = appReducer(state, { type: 'PATCH_PROFILE', patch: { rank: 25000 } }); break
      case 'sample reload': state = appReducer(state, { type: 'LOAD_DEMO_PROFILE' }); break
      case 'authority change': state = appReducer(state, { type: 'SET_AUTHORITY', authorityId: 'IPU' }); break
      case 'reset': state = appReducer(state, { type: 'RESET' }); break
      case 'navigation': state = appReducer(state, { type: 'SET_STEP', step: 'profile' }); break
    }
    const current = state
    pending.resolve(generated)
    await completion
    expect(state).toBe(current)
    expect(state.busy).toBeNull()
    expect(state.items).toEqual([])
  },
)

test('an older generation cannot replace a newer completed generation', async () => {
  const older = Symbol()
  const newer = Symbol()
  let state = appReducer(sampleState(), { type: 'BUSY', busy: 'generate', operation: older })
  const pending = deferred<StrategyGenerateResponse>()
  const completion = pending.promise.then((response) => {
    state = appReducer(state, { type: 'GENERATED', response, operation: older })
  })
  state = appReducer(state, { type: 'BUSY', busy: 'generate', operation: newer })
  state = appReducer(state, { type: 'GENERATED', response: generated, operation: newer })
  const current = state
  pending.resolve({ ...generated, items: [] })
  await completion
  expect(state).toBe(current)
  expect(state.items).toHaveLength(7)
})

test('an older failure cannot clear a newer operation or show its error', () => {
  const older = Symbol()
  const newer = Symbol()
  let state = appReducer(sampleState(), { type: 'BUSY', busy: 'generate', operation: older })
  state = appReducer(state, { type: 'BUSY', busy: 'generate', operation: newer })
  const current = state
  state = appReducer(state, { type: 'FAILED', error: toApiError(new Error('older failure')), operation: older })
  expect(state).toBe(current)
  expect(state.busy).toBe('generate')
  expect(state.error).toBeNull()
})

test('a delayed audit cannot make an edited list current again', async () => {
  const operation = Symbol()
  let state = appReducer(generatedState(), { type: 'BUSY', busy: 'audit', operation })
  const pending = deferred<AuditResult>()
  const completion = pending.promise.then((audit) => {
    state = appReducer(state, { type: 'AUDITED', audit, operation })
  })
  state = appReducer(state, { type: 'MOVE_ITEM', itemId: state.items[0].itemId, direction: 1 })
  const current = state
  pending.resolve(cleanAudit)
  await completion
  expect(state).toBe(current)
  expect(state.auditStale).toBe(true)
})

test('a delayed lock cannot lock a profile edited while it was pending', async () => {
  const operation = Symbol()
  let state = appReducer(generatedState(), { type: 'BUSY', busy: 'lock', operation })
  const pending = deferred<LockState>()
  const completion = pending.promise.then((lock) => {
    state = appReducer(state, { type: 'LOCKED', lock, operation })
  })
  state = appReducer(state, { type: 'PATCH_PROFILE', patch: { rank: 25000 } })
  const current = state
  pending.resolve(snapshot)
  await completion
  expect(state).toBe(current)
  expect(state.lock).toBeNull()
  expect(state.auditStale).toBe(true)
})

test('a current failure clears busy and records its error', () => {
  const operation = Symbol()
  const error = toApiError(new Error('current failure'))
  const state = appReducer(
    appReducer(sampleState(), { type: 'BUSY', busy: 'generate', operation }),
    { type: 'FAILED', error, operation },
  )
  expect(state.busy).toBeNull()
  expect(state.pendingOperation).toBeNull()
  expect(state.error).toBe(error)
})

test('current re-audit and lock completions still finish the corrected sample flow', () => {
  let state = generatedState()
  const evidenceGap = state.items.find((item) => item.option.id === 'rec-banda-cse')!
  state = appReducer(state, { type: 'REMOVE_ITEM', itemId: evidenceGap.itemId })
  const auditOperation = Symbol()
  state = appReducer(state, { type: 'BUSY', busy: 'audit', operation: auditOperation })
  state = appReducer(state, { type: 'AUDITED', audit: cleanAudit, operation: auditOperation })
  expect(state.auditStale).toBe(false)
  expect(state.audit?.canLock).toBe(true)
  expect(state.pendingOperation).toBeNull()

  const lockOperation = Symbol()
  state = appReducer(state, { type: 'BUSY', busy: 'lock', operation: lockOperation })
  state = appReducer(state, { type: 'LOCKED', lock: snapshot, operation: lockOperation })
  expect(state.step).toBe('locked')
  expect(state.lock?.itemOrder).toHaveLength(6)
  expect(state.busy).toBeNull()
  expect(state.pendingOperation).toBeNull()
})

test('ignored edits do not cancel a valid operation', () => {
  const operation = Symbol()
  const state: AppState = { ...generatedState(), busy: 'audit', pendingOperation: operation }
  expect(appReducer(state, { type: 'REMOVE_ITEM', itemId: 'missing-item' })).toBe(state)
})

test.each(['generate', 'audit', 'lock'] as const)(
  'clicking the current sidebar step preserves a pending %s operation',
  async (busy) => {
    const operation = Symbol(busy)
    const step = busy === 'generate' ? 'summary' : 'conflicts'
    let state = appReducer(
      { ...generatedState(), step },
      { type: 'BUSY', busy, operation },
    )
    const pending = deferred<void>()
    const completion = pending.promise.then(() => {
      if (busy === 'generate') {
        state = appReducer(state, { type: 'GENERATED', response: generated, operation })
      } else if (busy === 'audit') {
        state = appReducer(state, { type: 'AUDITED', audit: cleanAudit, operation })
      } else {
        state = appReducer(state, { type: 'LOCKED', lock: snapshot, operation })
      }
    })

    const beforeClick = state
    state = appReducer(state, { type: 'SET_STEP', step })
    expect(state).toBe(beforeClick)
    expect(state.busy).toBe(busy)
    expect(state.pendingOperation).toBe(operation)
    pending.resolve()
    await completion
    expect(state.busy).toBeNull()
    expect(state.pendingOperation).toBeNull()
    if (busy === 'generate') expect(state.step).toBe('strategy')
    if (busy === 'audit') expect(state.audit).toBe(cleanAudit)
    if (busy === 'lock') expect(state.lock).toBe(snapshot)
  },
)

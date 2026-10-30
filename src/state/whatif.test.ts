import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { expect, test } from 'vitest'
import { AppProvider, useAppActions, useAppState, type AppState } from './store'
import { applyLever } from '../lib/whatif'
import { runStrategyEngine } from '../mock/engine'
import { profileRevisionFor } from '../features/contracts'
import { toPayload } from '../lib/validation'

function mountCandidate() {
  let current!: { state: AppState; actions: ReturnType<typeof useAppActions> }
  function Probe() {
    current = { state: useAppState(), actions: useAppActions() }
    return null
  }
  let root!: ReturnType<typeof create>
  act(() => { root = create(createElement(AppProvider, null, createElement(Probe))) })
  act(() => current.actions.loadDemoProfile())
  return { current: () => current, unmount: () => act(() => root.unmount()) }
}

test('applying a what-if change generates the list and audit for that exact profile', async () => {
  const candidate = mountCandidate()
  try {
    await act(async () => { await candidate.current().actions.generate() })
    expect(candidate.current().state.items).toHaveLength(7)
    const next = applyLever(candidate.current().state.profile, 'distance', 50)
    await act(async () => { await candidate.current().actions.applyProfileAndGenerate(next) })
    const { state } = candidate.current()
    expect(state.profile).toEqual(next)
    expect(state.items.map(item => item.option.id)).toEqual(runStrategyEngine(next).map(item => item.option.id))
    expect(state.items).toHaveLength(1)
    expect(state.audit?.profileRevision).toBe(profileRevisionFor(toPayload(next)))
    expect(state.auditStale).toBe(false)
    expect(state.busy).toBeNull()
  } finally { candidate.unmount() }
})

test('ordinary generation still reads the current profile without an override', async () => {
  const candidate = mountCandidate()
  try {
    const next = applyLever(candidate.current().state.profile, 'distance', 50)
    act(() => candidate.current().actions.patchProfile(next))
    await act(async () => { await candidate.current().actions.generate() })
    expect(candidate.current().state.items).toHaveLength(1)
    expect(candidate.current().state.audit?.profileRevision).toBe(profileRevisionFor(toPayload(next)))
  } finally { candidate.unmount() }
})

test('a later candidate edit invalidates a pending applied what-if result', async () => {
  const candidate = mountCandidate()
  try {
    const next = applyLever(candidate.current().state.profile, 'distance', 50)
    let pending: Promise<void> | undefined
    act(() => { pending = candidate.current().actions.applyProfileAndGenerate(next) })
    act(() => candidate.current().actions.patchProfile({ rank: 25000 }))
    await act(async () => { await pending })
    expect(candidate.current().state.profile.rank).toBe(25000)
    expect(candidate.current().state.items).toEqual([])
    expect(candidate.current().state.audit).toBeNull()
    expect(candidate.current().state.busy).toBeNull()
  } finally { candidate.unmount() }
})

test('an applied what-if cannot alter an already locked candidate snapshot', async () => {
  const candidate = mountCandidate()
  try {
    await act(async () => { await candidate.current().actions.generate() })
    const evidenceGap = candidate.current().state.items.find(item => item.option.id === 'rec-banda-cse')!
    act(() => candidate.current().actions.removeItem(evidenceGap.itemId))
    await act(async () => { await candidate.current().actions.reaudit() })
    await act(async () => { await candidate.current().actions.lock() })
    const locked = candidate.current().state
    expect(locked.lock).not.toBeNull()
    const next = applyLever(locked.profile, 'distance', 50)
    await act(async () => { await candidate.current().actions.applyProfileAndGenerate(next) })
    expect(candidate.current().state).toBe(locked)
  } finally { candidate.unmount() }
})

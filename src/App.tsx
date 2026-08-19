import { useEffect, useMemo, useRef } from 'react'
import type { Step } from './types'
import { AppProvider, useAppActions, useAppState } from './state/store'
import { FLOW } from './state/flow'
import { Banner, LiveRegion } from './components/ui'
import {
  IconConflict,
  IconLock,
  IconProfile,
  IconStrategy,
  IconSummary,
} from './components/icons'
import { Landing } from './screens/Landing'
import { BuildProfile } from './screens/BuildProfile'
import { ProfileSummary } from './screens/ProfileSummary'
import { Strategy } from './screens/Strategy'
import { ConflictInspector } from './screens/ConflictInspector'
import { Locked } from './screens/Locked'
import { isProfileValid } from './lib/validation'

const NAV_ICONS: Record<Step, (props: { className?: string }) => JSX.Element> = {
  landing: IconProfile,
  profile: IconProfile,
  summary: IconSummary,
  strategy: IconStrategy,
  conflicts: IconConflict,
  locked: IconLock,
}

function Screen({ step }: { step: Step }) {
  switch (step) {
    case 'landing':
      return <Landing />
    case 'profile':
      return <BuildProfile />
    case 'summary':
      return <ProfileSummary />
    case 'strategy':
      return <Strategy />
    case 'conflicts':
      return <ConflictInspector />
    case 'locked':
      return <Locked />
  }
}

function Shell() {
  const state = useAppState()
  const { goTo, lock } = useAppActions()
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mainRef.current?.focus()
  }, [state.step])

  const reachable = useMemo(() => {
    if (state.lock) return ['strategy', 'conflicts', 'locked'] satisfies Step[]
    const steps: Step[] = ['profile']
    if (isProfileValid(state.profile)) steps.push('summary')
    if (state.items.length > 0) steps.push('strategy')
    if (state.audit) steps.push('conflicts')
    return steps
  }, [state.profile, state.items, state.audit, state.lock])

  const currentIndex = FLOW.findIndex((f) => f.step === state.step)
  const canLock = Boolean(state.audit?.canLock) && !state.auditStale && !state.lock
  const activeLabel =
    FLOW.find((f) => f.step === state.step)?.label ?? 'Overview'

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <aside className="sidebar">
        <button className="brand" onClick={() => goTo('landing')} aria-label="CounselFlow home">
          <span className="brand__mark" aria-hidden="true">
            <img src="/brand/counselflow-mark.svg" alt="" />
          </span>
          <span>CounselFlow</span>
        </button>

        <nav className="sidebar__nav" aria-label="Counselling flow">
          {FLOW.map((entry, i) => {
            const Icon = NAV_ICONS[entry.step]
            const isCurrent = entry.step === state.step
            const isDone = currentIndex >= 0 && i < currentIndex
            const enabled = reachable.includes(entry.step)
            return (
              <button
                key={entry.step}
                type="button"
                className="navitem"
                aria-current={isCurrent ? 'page' : undefined}
                disabled={!enabled && !isCurrent}
                onClick={() => goTo(entry.step)}
              >
                <Icon />
                {entry.short}
                {isDone && (
                  <span className="navitem__done" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar__foot">v0.1.0 · mock engine</div>
      </aside>

      <div className="shell__body">
        <header className="topbar">
          <nav className="crumb" aria-label="Breadcrumb">
            <span>CounselFlow</span>
            <span aria-hidden="true">/</span>
            <strong>{activeLabel}</strong>
          </nav>
          <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
            <button
              type="button"
              className="btn btn--sm"
              disabled={!canLock || state.busy === 'lock'}
              onClick={lock}
            >
              {state.lock ? 'Locked' : 'Lock strategy'}
            </button>
            <span className="avatar" aria-hidden="true">
              GB
            </span>
          </div>
        </header>

        <main className="main" id="main" tabIndex={-1} ref={mainRef}>
          {state.error && (
            <Banner tone="critical" title="The last operation was rejected" live>
              <span>
                {state.error.error.message}
                {state.error.requestId ? ` Request: ${state.error.requestId}.` : ''}
              </span>
            </Banner>
          )}
          <Screen step={state.step} />
        </main>
      </div>

      <LiveRegion message={state.announcement} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

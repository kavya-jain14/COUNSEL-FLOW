import { useEffect, useMemo, useRef } from 'react'
import type { Step } from './types'
import { AppProvider, useAppActions, useAppState } from './state/store'
import { flowIndex } from './state/flow'
import { Stepper } from './components/Stepper'
import { LiveRegion } from './components/ui'
import { Landing } from './screens/Landing'
import { BuildProfile } from './screens/BuildProfile'
import { ProfileSummary } from './screens/ProfileSummary'
import { Strategy } from './screens/Strategy'
import { ConflictInspector } from './screens/ConflictInspector'
import { Locked } from './screens/Locked'
import { isProfileValid } from './lib/validation'

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
  const { goTo } = useAppActions()
  const headingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [state.step])

  const reachable = useMemo(() => {
    const steps: Step[] = ['profile']
    if (isProfileValid(state.profile)) steps.push('summary')
    if (state.items.length > 0) steps.push('strategy')
    if (state.audit) steps.push('conflicts')
    if (state.lock.locked) steps.push('locked')
    return steps
  }, [state.profile, state.items, state.audit, state.lock.locked])

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="appbar">
        <div className="appbar__inner">
          <button
            className="brand"
            style={{ background: 'none', border: 0, padding: 0, color: 'inherit' }}
            onClick={() => goTo('landing')}
            aria-label="CounselFlow home"
          >
            <span className="brand__mark" aria-hidden="true">
              CF
            </span>
            CounselFlow
          </button>
          {flowIndex(state.step) >= 0 && (
            <Stepper current={state.step} reachable={reachable} onNavigate={goTo} />
          )}
        </div>
      </header>

      <main className="main" id="main" tabIndex={-1} ref={headingRef}>
        <Screen step={state.step} />
      </main>

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

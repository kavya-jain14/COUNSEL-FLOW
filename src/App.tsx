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
import { LiveRegion } from './components/ui'
import { IconMoon, IconSun } from './components/icons'
import { useTheme } from './lib/theme'
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
  const { goTo, lock } = useAppActions()
  const { theme, toggleTheme } = useTheme()
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mainRef.current?.focus()
  }, [state.step])

  const profileReady = isProfileValid(state.profile)
  const counts = state.audit?.counts ?? { CRITICAL: 0, WARNING: 0, INFO: 0 }

  const reachable = useMemo(() => {
    if (state.lock) return ['strategy', 'conflicts', 'locked'] satisfies Step[]
    const steps: Step[] = ['profile']
    if (profileReady) steps.push('summary')
    if (state.items.length > 0) steps.push('strategy')
    if (state.audit) steps.push('conflicts')
    return steps
  }, [state.profile, state.items, state.audit, state.lock])

  const currentIndex = FLOW.findIndex((f) => f.step === state.step)
  const canLock = Boolean(state.audit?.canLock) && !state.auditStale && !state.lock
  const activeLabel =
    FLOW.find((f) => f.step === state.step)?.label ?? 'Overview'
  }, [profileReady, state.items, state.audit, state.lock.locked])

  const meta: Record<Step, string> = {
    landing: '',
    profile: profileReady ? 'Rank, limits, priorities' : 'Start here — rank and limits',
    summary: profileReady ? 'Check before generating' : 'Finish your profile first',
    strategy:
      state.items.length > 0
        ? `${state.items.length} options ranked`
        : 'Generate from your summary',
    conflicts: state.audit
      ? counts.CRITICAL > 0
        ? `${counts.CRITICAL} must be fixed`
        : state.auditStale
          ? 'Re-audit pending'
          : 'Nothing blocking'
      : 'Opens after the first audit',
    locked: state.lock.locked ? 'Snapshot saved' : 'Clear all critical conflicts',
  }

  const currentIndex = FLOW.findIndex((f) => f.step === state.step)
  const canLock = Boolean(state.audit?.canLock) && !state.auditStale && !state.lock.locked
  const activeLabel = FLOW.find((f) => f.step === state.step)?.label ?? 'Overview'

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <aside className="sidebar">
        <button className="brand" onClick={() => goTo('landing')} aria-label="CounselFlow home">
          <span className="brand__mark" aria-hidden="true">
            <img
              src={
                theme === 'light'
                  ? '/brand/counselflow-mark-light.svg'
                  : '/brand/counselflow-mark.svg'
              }
              alt=""
            />
          </span>
          <span>CounselFlow</span>
        </button>

        <span className="sidebar__title" aria-hidden="true">
          Your five steps
        </span>

        <nav className="sidebar__nav" aria-label="Counselling flow">
          {FLOW.map((entry, i) => {
            const isCurrent = entry.step === state.step
            const isDone = currentIndex >= 0 && i < currentIndex
            const enabled = reachable.includes(entry.step)
            return (
              <button
                key={entry.step}
                type="button"
                className="navitem"
                data-state={isDone ? 'done' : isCurrent ? 'current' : 'todo'}
                aria-current={isCurrent ? 'page' : undefined}
                disabled={!enabled && !isCurrent}
                onClick={() => goTo(entry.step)}
              >
                <span className="navitem__step" aria-hidden="true">
                  {isDone ? '✓' : String(i + 1).padStart(2, '0')}
                </span>
                <span className="navitem__text">
                  <span className="navitem__label">{entry.short}</span>
                  <span className="navitem__meta">{meta[entry.step]}</span>
                </span>
                {!enabled && !isCurrent && (
                  <span className="navitem__lockicon" aria-hidden="true">
                    ⌁
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
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'
              }
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
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

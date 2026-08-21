import { useEffect, useMemo, useRef } from 'react'
import type { Step } from './types'
import { AppProvider, useAppActions, useAppState } from './state/store'
import { FLOW } from './state/flow'
import { Banner, LiveRegion } from './components/ui'
import { Landing } from './screens/Landing'
import { BuildProfile } from './screens/BuildProfile'
import { ProfileSummary } from './screens/ProfileSummary'
import { Strategy } from './screens/Strategy'
import { ConflictInspector } from './screens/ConflictInspector'
import { Locked } from './screens/Locked'
import { isProfileValid } from './lib/validation'
import { ENGINE_VERSION } from './data/reference'

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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    mainRef.current?.focus({ preventScroll: true })
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

  const meta: Record<Step, string> = {
    landing: '',
    profile: profileReady ? 'Rank, limits, priorities' : 'Start with rank and limits',
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
          : counts.WARNING > 0
            ? `${counts.WARNING} decision${counts.WARNING > 1 ? 's' : ''} pending`
            : 'Review complete'
      : 'Opens after the first audit',
    locked: state.lock
      ? 'Snapshot saved'
      : counts.CRITICAL + counts.WARNING > 0
        ? 'Resolve required decisions'
        : 'Ready after review',
  }

  const currentIndex = FLOW.findIndex((f) => f.step === state.step)
  const canLock = Boolean(state.audit?.canLock) && !state.auditStale && !state.lock
  const activeLabel = FLOW.find((f) => f.step === state.step)?.label ?? 'Overview'

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <aside className="sidebar">
        <div className="sidebar__masthead">
          <button className="brand" onClick={() => goTo('landing')} aria-label="CounselFlow home">
            <span className="brand__mark" aria-hidden="true">
              <img src="/brand/counselflow-mark-light.svg" alt="" />
            </span>
            <span>
              CounselFlow
              <small>Candidate preference dossier</small>
            </span>
          </button>
          <span className="document-ref mono">CF / UPTAC / 2026</span>
        </div>

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
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="navitem__text">
                  <span className="navitem__label">{entry.short}</span>
                  <span className="navitem__meta">{meta[entry.step]}</span>
                </span>
                <span className="navitem__state" aria-hidden="true">
                  {isCurrent ? 'Open' : isDone ? 'Filed' : enabled ? 'Ready' : 'Pending'}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar__foot">
          <span>
            <b>Method</b>
            Deterministic ordering
          </span>
          <span className="mono">{ENGINE_VERSION}</span>
        </div>
      </aside>

      <div className="shell__body">
        <header className="topbar">
          <div className="topbar__document">
            <span className="topbar__section mono">ADMISSIONS STRATEGY FILE</span>
            <nav className="crumb" aria-label="Breadcrumb">
              <span>CounselFlow</span>
              <span aria-hidden="true">/</span>
              <strong>{activeLabel}</strong>
            </nav>
          </div>
          <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
            <button
              type="button"
              className="btn btn--sm"
              disabled={!canLock || state.busy === 'lock'}
              onClick={lock}
            >
              {state.lock ? 'Locked' : 'Lock strategy'}
            </button>
            <span className="topbar__status mono" aria-label="Current strategy status">
              {state.lock ? 'FILED' : state.auditStale ? 'REVIEW DUE' : 'WORKING COPY'}
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

import { useAppActions } from '../state/store'
import { FLOW } from '../state/flow'

export function Landing() {
  const { goTo, loadDemoProfile } = useAppActions()

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">
          <span aria-hidden="true">◆</span>
          AKTU / UPTAC counselling
        </span>
        <h1>Know what to fill, in what order, and why.</h1>
        <p>
          Predictors tell you what you might get. CounselFlow builds an ordered choice list
          from your own constraints, explains every position, and catches the contradictions
          you would otherwise submit under pressure.
        </p>
        <div className="row">
          <button className="btn btn--primary btn--lg" onClick={() => goTo('profile')}>
            Build my profile
          </button>
          <button
            className="btn btn--lg"
            onClick={() => {
              loadDemoProfile()
              goTo('profile')
            }}
          >
            Load the sample candidate
          </button>
        </div>
      </section>

      <div className="card">
        <div className="stack stack--sm">
          <span className="section-label">The loop</span>
          <div className="flow-map">
            {FLOW.map((entry, i) => (
              <span key={entry.step} style={{ display: 'contents' }}>
                {i > 0 && <span aria-hidden="true">→</span>}
                <span className="flow-map__node">{entry.label}</span>
              </span>
            ))}
          </div>
          <p className="card__hint">
            Nothing is locked until every critical conflict is resolved. Warnings can be
            overridden, but only with a reason that stays attached to your final list.
          </p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Hard limits actually block</h3>
          <p className="card__hint" style={{ marginTop: 6 }}>
            A ₹1.5 lakh hard ceiling removes a ₹2 lakh option and refuses to lock until you
            fix it. A soft budget only ranks it lower. You choose which one you meant.
          </p>
        </div>
        <div className="card">
          <h3>Your order stays yours</h3>
          <p className="card__hint" style={{ marginTop: 6 }}>
            CounselFlow never silently reorders your list. When it wants to swap two rows it
            shows you the before and after first, and you decide.
          </p>
        </div>
      </div>

      <p className="card__hint">
        Demo build — the strategy and audit responses come from a local mock while the
        engine and API are being finished. Every fact shown carries its source label.
      </p>
    </div>
  )
}

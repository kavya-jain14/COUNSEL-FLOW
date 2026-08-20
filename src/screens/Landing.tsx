import { useAppActions } from '../state/store'

const STEPS: Array<{ title: string; note: string }> = [
  { title: 'Build my profile', note: 'Rank, category, budget, distance, branch order.' },
  { title: 'Profile summary', note: 'See what counts as a hard limit before anything runs.' },
  { title: 'My strategy', note: 'An ordered list, with the reason behind every position.' },
  { title: 'Conflicts', note: 'Where your list argues with what you told us — and how to settle it.' },
  { title: 'Lock', note: 'A snapshot of the order, the reasons, and the data version used.' },
]

export function Landing() {
  const { goTo, loadDemoProfile } = useAppActions()

  return (
    <>
      <section className="hero">
        <div className="hero__text">
          <span className="eyebrow">
            <span aria-hidden="true">◆</span>
            AKTU / UPTAC counselling
          </span>
          <h1>
            Know what to fill, in what order, and <em>why</em>.
          </h1>
          <p className="hero__lede">
            Predictors tell you what you might get. CounselFlow builds an ordered choice list
            from your own constraints, explains every position, and catches the contradictions
            you would otherwise submit under pressure.
          </p>
          <div className="row" style={{ gap: 12 }}>
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
        </div>

        <div className="hero__aside">
          <span className="section-label" style={{ marginBottom: 14, display: 'block' }}>
            Five steps, start to locked
          </span>
          <ol className="steps">
            {STEPS.map((step) => (
              <li key={step.title}>
                <span>
                  <b>{step.title}</b>
                  <small>{step.note}</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pitch">
        <article>
          <h3>Hard limits actually block</h3>
          <p>
            A ₹1.5 lakh hard ceiling removes a ₹2 lakh option and refuses to lock until you fix
            it. A soft budget only ranks it lower. You choose which one you meant.
          </p>
        </article>
        <article>
          <h3>Your order stays yours</h3>
          <p>
            CounselFlow never silently reorders your list. When it wants to swap two rows it
            shows you the before and after first, and you decide.
          </p>
        </article>
        <article>
          <h3>Every position is explained</h3>
          <p>
            Select any row and you get the reasons that put it there, how much room it leaves
            under your limits, and the dataset line each fact came from.
          </p>
        </article>
      </section>

      <p className="band__note" style={{ marginTop: 46, maxWidth: '68ch' }}>
        Demo build — the strategy and audit responses come from a local mock while the engine
        and API are being finished. Every fact shown carries its source label. Nothing is
        locked until every critical conflict is resolved; warnings can be overridden, but only
        with a reason that stays attached to your final list.
      </p>
    </>
  )
}

import { useAppActions } from '../state/store'

const STEPS: Array<{ title: string; note: string }> = [
  { title: 'Build profile', note: 'Rank, category, domicile and declared limits.' },
  { title: 'Review profile', note: 'Confirm what may filter an option and what only affects order.' },
  { title: 'Read strategy', note: 'Inspect the ranked preference list and its evidence.' },
  { title: 'Resolve conflicts', note: 'Fix contradictions or record a deliberate exception.' },
  { title: 'Lock dossier', note: 'Save the final order with dataset and engine revisions.' },
]

const SAMPLE_OPTIONS = [
  ['01', 'HBTU Kanpur', 'CSE', '₹1,42,000', '75 km', 'Dream'],
  ['02', 'BIET Jhansi', 'CSE', '₹1,24,000', '284 km', 'Target'],
  ['03', 'IET Lucknow', 'IT', '₹1,38,000', '0 km', 'Target'],
  ['04', 'REC Banda', 'CSE', 'Not recorded', '164 km', 'No data'],
  ['05', 'HBTU Kanpur', 'EE', '₹1,18,000', '75 km', 'Safe'],
  ['06', 'UIET Kanpur', 'EE', '₹1,20,000', '75 km', 'Safe'],
  ['07', 'MMMUT Gorakhpur', 'ECE', '₹1,28,000', '241 km', 'Target'],
] as const

export function Landing() {
  const { goTo, loadDemoProfile } = useAppActions()

  return (
    <div className="landing-document">
      <section className="hero">
        <div className="hero__text">
          <span className="eyebrow">UPTAC · JoSAA · IPU preference strategy</span>
          <p className="hero__folio mono">SAMPLE DOSSIER 01 · UPTAC · WORKING COPY</p>
          <h1>A preference list you can defend under pressure.</h1>
          <p className="hero__lede">
            CounselFlow turns a candidate profile into an ordered college list, records the
            evidence behind every position, and audits the list against the candidate&apos;s own
            priorities before it can be locked. The result is a fill-ready order with visible
            evidence and required decisions.
          </p>
          <div className="hero__actions">
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
              Open sample candidate
            </button>
          </div>

          <dl className="hero__facts">
            <div>
              <dt>Rank</dt>
              <dd className="mono">12,500 CRL</dd>
            </div>
            <div>
              <dt>Branch order</dt>
              <dd className="mono">CSE / IT / ECE</dd>
            </div>
            <div>
              <dt>Hard ceiling</dt>
              <dd className="mono">₹1,50,000 yearly</dd>
            </div>
            <div>
              <dt>Distance</dt>
              <dd className="mono">300 km from Lucknow</dd>
            </div>
          </dl>
        </div>

        <aside className="hero__aside" aria-label="CounselFlow document index">
          <div className="index-heading">
            <span>Document index</span>
            <span className="mono">05 sections</span>
          </div>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="steps__number mono">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <b>{step.title}</b>
                  <small>{step.note}</small>
                </span>
              </li>
            ))}
          </ol>
          <p className="marginal-note">
            The ordering and audit remain deterministic. Generated prose may clarify stored
            evidence, but it cannot change a score, a row, or the lock decision.
          </p>
        </aside>
      </section>

      <section className="sample-dossier" aria-labelledby="sample-title">
        <header className="sample-dossier__head">
          <div>
            <span className="section-label">Live product specimen · UPTAC</span>
            <h2 id="sample-title">Seven-option preference register</h2>
          </div>
          <p>
            UPTAC sample profile: General category, UP domicile, placements weighted highest.
            Every number below is carried into the explanation and audit.
          </p>
        </header>

        <div className="sample-dossier__body">
          <div className="table-scroll">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Institute</th>
                  <th>Branch</th>
                  <th>Annual fee</th>
                  <th>Distance</th>
                  <th>Band</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_OPTIONS.map((option) => (
                  <tr key={`${option[0]}-${option[1]}`}>
                    {option.map((value, index) => (
                      <td key={value} className={index === 0 || index > 2 ? 'mono' : undefined}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="audit-margin" aria-label="Sample audit notes">
            <span className="section-label">Margin audit</span>
            <article>
              <span className="audit-margin__code mono">CF-01 / WARNING</span>
              <h3>Branch priority conflict</h3>
              <p>IET IT appears above REC CSE, while the candidate declared CSE above IT.</p>
            </article>
            <article>
              <span className="audit-margin__code mono">CF-08 / WARNING</span>
              <h3>Evidence gap</h3>
              <p>Annual fee, closing rank and placement evidence are missing for REC Banda.</p>
            </article>
            <button
              className="text-link"
              type="button"
              onClick={() => {
                loadDemoProfile()
                goTo('profile')
              }}
            >
              Run this candidate through all five steps
            </button>
          </aside>
        </div>
      </section>

      <section className="method-sheet" aria-labelledby="method-title">
        <header>
          <span className="section-label">Operating method</span>
          <h2 id="method-title">What the candidate controls</h2>
        </header>
        <div className="method-sheet__rows">
          <article>
            <span className="mono">A</span>
            <h3>Hard limits</h3>
            <p>Budget, distance, and exclusions can remove an option and prevent locking.</p>
          </article>
          <article>
            <span className="mono">B</span>
            <h3>Soft preferences</h3>
            <p>Placements, fees, distance, campus and hostel alter ranking weight only.</p>
          </article>
          <article>
            <span className="mono">C</span>
            <h3>Final judgement</h3>
            <p>Every proposed swap is visible. A kept warning requires a written reason.</p>
          </article>
        </div>
      </section>

      <footer className="document-foot">
        <span>Reference datasets · verify final choices with the selected authority&apos;s official notices</span>
        <span className="document-foot__links">
          <a href="/privacy.html">Privacy</a>
          <a href="/terms.html">Terms of use</a>
        </span>
        <span className="mono">CF-MVP / 2026</span>
      </footer>
    </div>
  )
}

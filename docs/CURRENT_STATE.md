# Current state

Last updated: 2026-09-05

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSEL-FLOW`
- Remote default branch: `main`
- Latest audited main base: `d116e83` (`feat: make counselling flow attention-first`).
- PR #5 merged the frontend contract adapter.
- PR #6 merged named rank-buffer strategy rules and boundary tests.
- PR #8 merged domicile, sub-quota, home-city and exclusion-id contract fixes.
- PR #9 merged the final strategy-item contract bug fix.
- PR #10 merged multi-authority datasets, round progression and the deterministic
  candidate decision-impact evaluator.
- Active quality branch: `fix/devils-advocate-ux`, created from latest `main`.

## Locked product decisions

- The hackathon hero remains profile, ordered preference strategy, explanations, conflict
  audit, visible fix or override, re-audit and immutable lock.
- The strategy and audit engines remain deterministic.
- Optional AI may clarify supplied facts only.
- Unresolved critical or warning findings block locking.
- A kept warning requires a written reason and a fresh audit.

## Latest main integration

- Preserved UPTAC, JoSAA and IPU authority selection plus the newly ingested official
  cutoff datasets.
- Preserved round allotment recording and next-round improvement filtering.
- Preserved the deterministic decision-impact evaluator and its candidate-specific fit,
  compromise, risk and evidence-gap explanations.
- Restyled the decision-impact modal as a single-column ruled dossier. Its prior three
  column card layout, colored edge treatments, rounded surfaces and decorative glyphs are
  not exposed in the Calm Scholar layer.

## Devil's-advocate quality pass

- Locked strategy, conflict and profile state is now genuinely immutable. The visible
  What If, reorder, remove, re-audit and conflict controls are unavailable after filing,
  matching the reducer's safety boundary.
- Generate, re-audit and lock operations carry an operation token. A response is ignored
  if the candidate changes their profile or counselling while the request is in flight.
- Applying a What If profile now regenerates from the proposed values instead of the
  previous React render's profile.
- Changing UPTAC, JoSAA or IPU clears the counselling-specific rank rather than silently
  reusing it in another system.
- Evidence gaps with the same missing facts are grouped into one explained decision.
  The JoSAA reference run falls from 60 repeated evidence warnings to three grouped
  decisions without hiding any affected option.
- Delhi coordinates are included, so IPU distance limits are enforced rather than treating
  every Delhi option as an unknown distance.
- Generated and locked records cite the active authority dataset and reference round; they
  no longer label JoSAA/IPU strategies as UPTAC.
- Empty strategy copy distinguishes an unfinished profile from a valid run where no option
  survives hard limits. The shared generate response permits this zero-result state, while
  audit and lock requests still require a non-empty strategy.
- Quota and hard-limit copy now describes current engine behavior accurately. Recorded
  sub-quotas are not presented as applied seat pools unless a matching source row exists.
- The previously standalone mock-engine test now runs under Vitest, and the root `check`
  command includes all application tests.

## Calm Scholar UI checkpoint

- Replaced the dark SaaS skin with a document-driven admissions dossier system.
- Palette is limited to soft sky blue, deep navy, warm paper, crisp off-white and beige.
- Libre Baskerville is the display face, IBM Plex Sans is the body face and IBM Plex Mono
  is used for rank, fees, distance, codes and revisions.
- The five-step sidebar is now a numbered document index with no icon library or decorative
  completion marks.
- Profile sections use ruled form bands; strategy and lock use flat registers; explanation
  content is marginalia; conflict decisions read as audit records.
- Added a real landing specimen derived from the golden demo profile: seven surviving
  options and exactly two warnings, CF-01 and CF-08.
- Gradients, shadows, glass, decorative emoji, pill navigation, oversized corner radii,
  purple-black styling and decorative motion are disabled by the active visual layer.
- Removed candidate-facing API payloads, integration-lab navigation, spinner glyphs and
  decorative reorder arrows.
- Added deployable privacy and terms notices linked from the landing document footer.
- Updated every active brand asset to the Calm Scholar palette and typography.
- The visual redesign remains isolated in `src/styles/calm-scholar.css`; this quality pass
  changes only the state, audit and UX behavior described above.
- Full design notes: `design/CALM_SCHOLAR.md`.

## Verification

- Shared-contract TypeScript build: passed.
- Root TypeScript `--noEmit`: passed.
- Contract test suite: 15 passed, 0 failed.
- Application test suite: 61 passed across 7 files.
- Production Vite build: passed, 157 modules transformed.
- Privacy and terms pages are included in the production output.
- `git diff --check`: passed.
- Golden UPTAC engine/audit run: 7 options, 0 critical, 2 warnings.
- JoSAA audit-density run: 60 options, 3 grouped warnings instead of 60 evidence cards.
- IPU hard-distance run: Lucknow to Delhi is measured; a 300 km hard limit correctly
  produces no surviving Delhi options.
- Responsive desktop/mobile rules are implemented at 900 px and 680 px.
- The cloud browser cannot open this workspace's localhost preview, so the final screenshot
  pass must be done on Kavya's Mac before presentation.

## Immediate commands

```bash
git remote set-url origin https://github.com/kavya-jain14/COUNSEL-FLOW.git
git fetch origin --prune
git switch fix/devils-advocate-ux
npm ci
npm run check
npm run audit:runtime
npm run dev
```

Do not run `npm audit fix --force` during the hackathon. Capture one desktop landing
screenshot, one strategy screenshot and one 375 px profile screenshot for the PR and demo
deck.

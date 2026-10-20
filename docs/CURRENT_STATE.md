# Current state

Last updated: 2026-10-20

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSEL-FLOW`
- Remote default branch: `main`
- Latest main checkpoint integrated through GitHub: `164235b`
- PR #5 merged the frontend contract adapter.
- PR #6 merged named rank-buffer strategy rules and boundary tests.
- PR #8 merged domicile, sub-quota, home-city and exclusion-id contract fixes.
- PR #9 merged the final strategy-item contract bug fix.
- PR #10 merged multi-authority datasets, round progression and the deterministic
  candidate decision-impact evaluator.
- Active UI branch: `feat/calm-scholar-ui`, created from latest `main`.

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
- The redesign is isolated in `src/styles/calm-scholar.css`; strategy, audit, lock and
  contract behavior remain unchanged.
- Full design notes: `design/CALM_SCHOLAR.md`.

## Verification

- Shared-contract TypeScript build: passed.
- Root TypeScript `--noEmit`: passed.
- Contract test suite: 14 passed, 0 failed.
- Production Vite build: passed, 130 modules transformed.
- Privacy and terms pages are included in the production output.
- `git diff --check`: passed.
- Golden engine and audit run: 7 options, 0 critical, 2 warnings (CF-01 and CF-08).
- Responsive desktop/mobile rules are implemented at 900 px and 680 px.
- The cloud browser cannot open this workspace's localhost preview, so the final screenshot
  pass must be done on Kavya's Mac before presentation.

## Immediate commands

```bash
git remote set-url origin https://github.com/kavya-jain14/COUNSEL-FLOW.git
git fetch origin --prune
git switch feat/calm-scholar-ui
npm ci
npm run check
npm run dev
```

Do not run `npm audit fix --force` during the hackathon. Capture one desktop landing
screenshot, one strategy screenshot and one 375 px profile screenshot for the PR and demo
deck.

## Candidate screen loading — 2026-10-17

Branch: `fix/lazy-candidate-screens`, based on `main` at `d116e83`.
Changed files: `src/App.tsx` and this checkpoint. The landing document remains eager;
profile, summary, strategy, conflicts and lock screens now load on first use. A live
status message announces a screen while its module loads. The provider stays mounted
outside the loading boundary, preserving candidate, audit and lock state during navigation.
No contract, dataset, engine or audit rule changed.

The production entry JavaScript decreased from 1,242.79 kB to 1,135.56 kB
(gzip: 185.30 kB to 157.42 kB). The five screens and shared decision-impact code are
separate chunks. The large-bundle warning remains: generated options/cutoffs still load
through the shared state/engine graph. Deferring that data needs a separate change.

Verification: `npm run check` passed (typecheck, 14 contract tests, production build),
and `git diff --check` passed. An isolated React/jsdom navigation smoke test loaded all
five deferred screens: sample candidate, summary, seven-option generation, conflicts,
remove the evidence-gap option, re-audit, and lock the six-option snapshot. This verifies
component loading and state continuity. A subsequent Chromium 153 production smoke test
completed the same flow with zero page errors: the landing requested only the entry
script, and all five screen chunks were fetched on navigation. Desktop landing and
375 px locked-page screenshots were inspected; the locked page had no horizontal
overflow. This is a navigation/loading check, not a network-timing benchmark or a
complete visual audit. The browser came from the available packaged Chromium binary
after the standard browser download failed.

This is independent of workspace/Scenario Lab PRs #14 and #15. PR #16 still supplies the
separate application-test gate and narration fix; neither branch is merged here. Keep
this loading change in draft until teammate review; the workspace/Scenario Lab release
and full visual review remain separate gates.
Rollback is a revert of this screen-loading commit. Next commands:

```bash
git switch fix/lazy-candidate-screens
npm ci
npm run check
```


## Deferred strategy data — 2026-10-20

Branch: `fix/defer-strategy-dataset`, based on PR #17's
`fix/lazy-candidate-screens` at `5fc8f7a`. This dependent follow-up requires that screen
loading boundary; it does not merge PR #17 or the workspace/Scenario Lab/test-gate
branches (#14–16). Owner: Kavya; frontend review partner: Gargi.

The shared provider now imports the mock API, generated-set metadata and cutoffs only
when an async strategy operation starts. Independent generation imports start together.
The pure item-position helper lives in `src/lib/itemOrder.ts`, with its existing mock
strategy export preserved. This removes the provider's eager path through mock seed data.
Existing synchronous engine/data APIs, candidate ranking, audit and lock rules are
unchanged. Import failures follow the existing operation-error path and clear busy state.

Changed files: `src/state/store.tsx`, `src/lib/itemOrder.ts`, `src/mock/strategy.ts`,
`src/state/store.test.ts`, and this checkpoint. Initial JavaScript fell from 1,135.56 kB
(gzip 157.42 kB) to 257.76 kB (gzip 79.71 kB) against the PR #17 baseline. The generated
data is a separate 821.57 kB chunk (gzip 66.61 kB), requested on first generation. The
large-chunk warning remains for that deferred chunk; this does not reduce total dataset
bytes or claim a network-timing benchmark.

Verification:

- `npm run check`: typecheck, 14 contract tests and production build passed.
- `npx vitest run src/state/store.test.ts src/domain`: 8 tests passed, including an
  initial-render regression that rejects eager API/generated-data/cutoff imports.
- Existing `src/mock/strategy.test.ts`, bundled with esbuild for the Node test runner:
  30 tests passed, including item-position preservation.
- Chromium 153 before/after production checks produced identical strategy-row text and
  audit counts for UPTAC (7 choices), JoSAA (60) and IPU (43). JoSAA/IPU used the sample
  profile with budget and distance set to soft preferences to exercise loaded datasets.
- No strategy/data chunk was requested on landing, profile or summary. First generation
  loaded it; the sample fix/re-audit/lock flow saved the same six-choice snapshot.
- A deliberately blocked API chunk displayed the existing rejection banner, restored
  the Generate button and produced no strategy or uncaught page error.
- Successful navigation had no page errors. The 375 px locked page had no horizontal
  overflow; its screenshot was inspected. This is not a complete visual audit.
- `git diff --check`: passed.

PR #16 still owns inclusion of application tests in `npm run check`/CI. The new boundary
regression was run explicitly here; no duplicate test-gate change is included. Keep this
follow-up in draft for teammate review and the dependent PR #17 integration. Rollback:
revert this dataset-deferral commit. Next commands:

```bash
git switch fix/defer-strategy-dataset
npm ci
npm run check && npx vitest run src/state/store.test.ts src/domain
```

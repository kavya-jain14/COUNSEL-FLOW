# Current state

Last updated: 2026-10-30

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

## Ignore superseded strategy operations — 2026-10-21

Branch: `fix/stale-strategy-operations`, based on PR #18's
`fix/defer-strategy-dataset` at `dfc886f`. This dependent fix targets that branch;
integrate #17 and #18 before retargeting it to `main`. Owner: Kavya; frontend review
partner: Gargi. PRs #14–16 remain separate.

A strategy request could finish after a profile edit, sample reload, authority switch,
reset, navigation or newer request and replace the current list/audit/lock. Each
operation now carries a unique token. Accepted state changes invalidate the pending
token; successful or failed completions only apply while their token is current.
An old failure cannot clear a newer operation's busy indicator. Ignored edits leave
current work intact. Mock APIs, contracts, deterministic ranking/audit rules and lazy
data imports are unchanged.

Changed files: `src/state/store.tsx`, `src/state/operations.test.ts`,
`src/lab/scenarios.ts` and this checkpoint. The lab includes the delayed generation /
profile-edit reproduction. Verification:

- `npm run check`: typecheck, 14 contract tests and production build passed.
- `npx vitest run src/state/operations.test.ts src/state/store.test.ts src/domain
  --maxWorkers=1 --minWorkers=1`: 20 passed, including 12 operation tests. Removing
  only the stale-result guard made nine of those regressions fail; the guard was
  restored and the suite passed. Current re-audit and six-choice lock still succeed.
- Existing mock-strategy tests bundled with esbuild for Node: 30 passed.
- Chromium production check delayed the generated-data chunk, changed sample rank
  to 25,000 while generation waited, then released the chunk. The edited profile
  remained open with rank 25,000; a subsequent generation succeeded using that rank.
  No uncaught page errors occurred. The resulting screenshot was inspected; this
  checks the stale-operation flow, not a complete visual audit.
- Entry JavaScript: 258.18 kB / gzip 79.81 kB. The generated dataset remains a deferred
  821.57 kB chunk / gzip 66.61 kB; its existing large-chunk warning remains.
- `git diff --check`: passed.

PR #16 still owns adding application tests to the default CI gate, so these state
regressions were run explicitly. Keep the dependent PR in draft for teammate review;
no merge or deployed-backend verification is included. Rollback: revert this operation
invalidation commit. Next commands:

```bash
git switch fix/stale-strategy-operations
npm ci
npm run check && npx vitest run src/state/operations.test.ts src/state/store.test.ts src/domain --maxWorkers=1 --minWorkers=1
```

## Preserve work when clicking the open step — 2026-10-26

Branch: `fix/preserve-current-screen-operation`, based on PR #19's
`fix/stale-strategy-operations` at `7330ca5`. This dependent fix targets that branch;
integrate #17, #18 and #19 first. Owner: Kavya; frontend review partner: Gargi.
PRs #14–16 remain separate. The last durable base checkpoint is `7330ca5`.

Clicking the already-open sidebar step previously dispatched a new state object and
invalidated the current operation token even though no navigation occurred. A pending
generation, audit or lock could then finish silently without applying its result.
`SET_STEP` now leaves the state unchanged when the target is already open. Actual
navigation and candidate edits continue to discard superseded work as before.

Changed files: `src/state/store.tsx`, `src/state/operations.test.ts`,
`src/lab/scenarios.ts` and this checkpoint. No engine, audit rule, API contract,
dataset, screen markup or style changed. Verification:

- Three new delayed-completion regressions (generation, audit and lock) failed on
  `7330ca5`: the redundant navigation cleared busy state and its operation token.
- `npm run check` passed: typecheck, 14 contract tests and production build.
- Explicit Vitest state/domain suite: 23 passed, including all 15 operation tests.
  Existing tests still prove that real navigation and profile changes cancel stale work.
- Existing mock-strategy suite bundled for Node: 30 passed. Total tested: 67.
- Production Chromium held the generated-data request, clicked the open Summary
  sidebar entry during generation, and confirmed the Preparing state remained active.
  Releasing the request opened Strategy with all seven sample options and no page errors.
- Initial JavaScript remains 258.20 kB / gzip 79.82 kB; generated data remains deferred
  at 821.57 kB / gzip 66.61 kB. The existing deferred-chunk size warning remains.
- `git diff --check` passed.

Fresh installation used `npm ci --ignore-scripts` followed by `npm exec prisma generate`
to restore the generated client before typechecking; no database was accessed. PR #16
still owns putting application tests in the default check/CI gate, so state regressions
were run explicitly. Keep this dependent PR in draft for teammate review. Broader
visual review and deployed backend verification remain separate. Rollback: revert
this same-step navigation fix. Next commands:

```bash
git switch fix/preserve-current-screen-operation
npm ci
npm run check && npx vitest run src/state/operations.test.ts src/state/store.test.ts src/domain --maxWorkers=1 --minWorkers=1
```

## Apply the what-if profile before generation — 2026-10-30

Branch: `fix/apply-what-if-profile`, based on PR #20's
`fix/preserve-current-screen-operation` at `41b864e`. This dependent fix targets
that branch; integrate #17 → #18 → #19 → #20 first. Owner: Kavya; frontend review
partner: Gargi. Existing PRs #14–16 remain separate.

The What-if panel previously dispatched a profile change and called the ordinary
Generate callback in the same React event. That callback still captured the old
profile. The saved inputs changed, but the generated list and its fresh audit used
the previous limits. Generation now has a shared profile-explicit path; the
apply-and-generate action passes the exact profile accepted from the preview.
Ordinary Generate remains a zero-argument event action. Locked snapshots reject the
new action, and later edits still invalidate pending completions. Lazy imports,
deterministic ranking/audit rules, contracts and datasets are unchanged.

Changed files: `src/state/store.tsx`, `src/screens/Strategy.tsx`,
`src/state/whatif.test.ts`, `src/lab/scenarios.ts`, `package.json`,
`package-lock.json` and this checkpoint. The React 18.3.1 test renderer and its
matching types are development-only dependencies for real batched-hook regressions;
they are not imported by the application or included in its production payload.
Verification:

- Production Chromium on the base reproduced the actual failure: the UPTAC sample
  started with seven choices, a 50 km hard-distance preview showed one, but Apply
  regenerated seven. The fixed production build applies one choice, matching the
  preview, with zero page errors.
- Four new hook tests pass: applied profile/list/audit agreement, ordinary Generate,
  invalidation after a later candidate edit, and immutable locked snapshots.
- `npm run check` passed typecheck, 14 contract tests and production build.
- Explicit state/domain Vitest suite: 27 tests pass. Existing mock-strategy Node
  suite: 30 pass. Total tested: 71.
- Initial JavaScript is 258.35 kB / gzip 79.90 kB. Generated data remains deferred
  at 821.57 kB / gzip 66.61 kB; its existing large-chunk warning remains.
- React best-practices review preserves event-based updates, stable dependencies,
  lazy data loading and existing accessibility. No style or markup redesign.
- `git diff --check` passed.

PR #16 still owns adding application tests to the default check/CI gate, so these
hook tests are run explicitly. Keep this dependent PR in draft for teammate review.
Broader visual and deployed-backend checks remain separate. Rollback: revert this
apply-and-generate commit. Next commands:

```bash
git switch fix/apply-what-if-profile
npm ci
npm run check && npx vitest run src/state/whatif.test.ts src/state/operations.test.ts src/state/store.test.ts src/domain --maxWorkers=1 --minWorkers=1
```

# Current state

Last updated: 2026-10-17

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

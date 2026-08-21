# Current state

Last updated: 2026-08-22

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSEL-FLOW`
- Remote default branch: `main`
- Latest main checkpoint inspected through GitHub: `ba6674c`
- PR #5 merged the frontend contract adapter.
- PR #6 merged named rank-buffer strategy rules and boundary tests.
- PR #8 merged domicile, sub-quota, home-city and exclusion-id contract fixes.
- PR #9 merged the final strategy-item contract bug fix.
- Active UI branch: `feat/calm-scholar-ui`, created from latest `main`.

## Locked product decisions

- The hackathon hero remains profile, ordered preference strategy, explanations, conflict
  audit, visible fix or override, re-audit and immutable lock.
- The strategy and audit engines remain deterministic.
- Optional AI may clarify supplied facts only.
- Unresolved critical or warning findings block locking.
- A kept warning requires a written reason and a fresh audit.

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
- Foundation PR `#1` was squash-merged into `main` at `25a75cb`.
- Gargi's existing `feature/gargi-profile-conflicts` branch and history remain preserved.
- Active feature branch: `main` in the local integration workspace.
- Main-branch protection is being configured with PR review and the `frontend` CI check.

## Durable product decisions

- Keep CounselFlow; reduce it to the preference-strategy and conflict-audit hero flow.
- Deterministic engine owns filtering, scoring, ordering, audit and lock eligibility.
- Optional AI explains supplied facts only and always has a template fallback.
- Root Vite app remains the integration lab during the hackathon.
- Zod schemas in `packages/contracts` are the wire-contract source of truth.
- An unresolved critical or warning conflict blocks locking. A kept warning becomes an
  explained override, then the changed state must be re-audited.

## Shared-contract checkpoint

- Added versioned schemas and inferred types for profile, strategy, audit, lock and API
  error envelopes under `packages/contracts`.
- Added revision checks, strict unknown-field rejection, normalized-weight validation,
  unique IDs, conflict-count checks and stale-audit lock protection.
- Added explicit missing-fact/null consistency and immutable snapshot metadata.
- Added valid/invalid JSON fixtures plus Node contract tests.
- Root npm workspace/scripts and GitHub CI now include contract compilation/tests.
- Provisional frontend types remain in place; `packages/contracts/MIGRATION.md` documents
  the later adapter work instead of mixing it into this branch.
- Updated lab expectations so unresolved warnings block until a reason and re-audit.

## Decision-impact checkpoint

- Added `src/features/decision-impact` — a per-option "what does choosing this mean for
  me" evaluator, opened as a modal from any row of the generated list and from the
  locked snapshot.
- Two layers, strictly separated: `lib/evaluate.ts` forms every verdict and emits
  structured findings (code, label, satisfaction state, raw facts, no prose);
  `lib/narrate.ts` holds one renderer per code and only turns those facts into
  sentences. An AI explanation adapter would implement `ImpactNarrator` and could not
  change a verdict, per the architecture rule; the template renderer stays the fallback.
- Findings are labelled `HARD_CONSTRAINT_VIOLATION`, `CONTRADICTION`, `SOFT_COMPROMISE`,
  `POTENTIAL_RISK`, `STRONG_MATCH` or `EVIDENCE_GAP`. Hard violations render in their own
  alarm block above everything else and force the fit band to `BLOCKED`.
- A factor weighted 0 produces no statement at all, so the output cannot drift into
  generic praise. Reachability is stated as last cycle's closing rank in the candidate's
  own category/domicile seat pool, never as a chance.
- The fit score reuses `BRANCH_WEIGHT` from the ordering engine so the two cannot drift,
  and reports its own evidence coverage when a weighted factor is missing from the data.
- Lab scenarios `decision-impact-is-personal` and `decision-impact-is-deterministic`
  added; 14 unit cases in `src/features/decision-impact/tests/evaluate.test.ts`.
- `WEIGHT_WORDS` moved from `FactorWeights.tsx` into `src/data/reference.ts` so the modal
  quotes the candidate's own slider wording.

## Validation and blockers

- JSON fixtures and lockfile parse successfully; `git diff --check` passes.
- Added the missing Next, Prisma, Zod, Vitest and Node type dependencies to the root
  package manifest and synchronized the npm lockfile.
- Local validation passes: TypeScript check, Prisma client generation, 14 contract tests,
  7 domain tests, production build, and Vite startup with HTTP 200.
- Do not run `npm audit fix --force`; dependency audit findings remain separate work.

## Next commands after importing this checkpoint

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

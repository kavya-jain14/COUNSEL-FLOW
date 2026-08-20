# Current state

Last updated: 2026-08-21

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSE-FLOW`
- Remote default branch: `main`
- Foundation PR `#1` was squash-merged into `main` at `25a75cb`.
- Gargi's existing `feature/gargi-profile-conflicts` branch and history remain preserved.
- Active feature branch: `feat/shared-contracts`, created from the latest `main`.
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

## Strategy-engine checkpoint

- Active branch: `feat/strategy-engine` — pushed, PR to be opened.
- Tier buffers extracted to `TIER_DREAM_RATIO_MAX` (0.90) and `TIER_TARGET_RATIO_MAX` (1.40)
  with JSDoc in `src/mock/strategy.ts`.
- Golden boundary tests added at `src/mock/strategy.test.ts` (run via
  `npx tsx --test src/mock/strategy.test.ts`).
- TierBadge and StrategyInspector lede updated to cite buffer boundaries.
- Lab scenario `tier-boundary-classification` added to `src/lab/scenarios.ts`.
- macOS ghost duplicate directories (`@types/react 2`, `react-dom 2`,
  `src/features/contracts/* 2`) cleaned up; pre-existing TS2688 is resolved.
- `tsconfig.json` now excludes `*.test.ts` from the browser-lib compile.
- `npm run check` passes: 14 contract tests, typecheck, vite build.

## Validation and blockers

- JSON fixtures and lockfile parse successfully; `git diff --check` passes.
- This workspace cannot reach the npm registry, so dependency installation, TypeScript
  compilation, contract tests and the production build must be run on Kavya's Mac and
  then confirmed by the PR's `frontend` GitHub Actions check.
- Do not run `npm audit fix --force`; dependency audit findings remain separate work.

## Next commands after importing this checkpoint

```bash
npm ci
npm run check
git push -u origin feat/shared-contracts
```

Open a Draft PR into `main`, wait for the `frontend` check, and request Fuzail's backend
contract review plus Gargi's frontend-adapter review before marking it ready.

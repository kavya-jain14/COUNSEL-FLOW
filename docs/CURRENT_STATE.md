# Current state

Last updated: 2026-08-21

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSEL-FLOW`
- Remote default branch: `main`
- Foundation PR `#1` was squash-merged into `main` at `25a75cb`.
- Gargi's existing `feature/gargi-profile-conflicts` branch and history remain preserved.
- Active feature branch: `feat/strategy-engine` — pushed, Draft PR #6 open.

## Durable product decisions

- Keep CounselFlow; reduce it to the preference-strategy and conflict-audit hero flow.
- Deterministic engine owns filtering, scoring, ordering, audit and lock eligibility.
- Optional AI explains supplied facts only and always has a template fallback.
- Root Vite app remains the integration lab during the hackathon.
- Zod schemas in `packages/contracts` are the wire-contract source of truth.
- An unresolved critical or warning conflict blocks locking. A kept warning becomes an
  explained override, then the changed state must be re-audited.

## Shared-contract checkpoint (PR #2 merged)

- Added versioned schemas and inferred types for profile, strategy, audit, lock and API
  error envelopes under `packages/contracts`.
- Added revision checks, strict unknown-field rejection, normalized-weight validation,
  unique IDs, conflict-count checks and stale-audit lock protection.
- Added explicit missing-fact/null consistency and immutable snapshot metadata.
- Added valid/invalid JSON fixtures plus Node contract tests.
- Root npm workspace/scripts and GitHub CI now include contract compilation/tests.

## Strategy-engine checkpoint (PR #6 open — feat/strategy-engine)

### Tier buffers (commit 9ceb423)
- Extracted `TIER_DREAM_RATIO_MAX` (0.90) and `TIER_TARGET_RATIO_MAX` (1.40) with JSDoc.
- TierBadge and StrategyInspector lede updated to cite buffer boundaries explicitly.
- Boundary test file: `src/mock/strategy.test.ts`.
- Lab scenario `tier-boundary-classification` added.

### Deterministic scoring engine (commit e8d9f99)
- New `src/mock/engine.ts` implements the full Blueprint §9 pipeline:
  1. Live `distanceKm` via `haversineKm(homeCity → college city)`.
  2. Hard filter — budget, distance, exclusions — before any scoring.
  3. Normalized factor scoring (placements, fees, location, campus, hostel) across surviving set.
  4. Branch priority contributes `BRANCH_WEIGHT` (30%) separately from factor scores.
  5. Stable tie-breaker by `option.id`.
  6. Tier assignment with named ratio buffers.
  7. Reason facts built from live computed distance, not null.
- `src/mock/api.ts` wired to `runStrategyEngine` (was `generateMockStrategy`).
- `ENGINE_VERSION` bumped to `engine-0.2.0` in `src/data/reference.ts`.

### Integration lab dashboard (latest commit on feat/strategy-engine)
- New `src/screens/LabDashboard.tsx` — golden scenario runner UI.
- Accessible via the `lab` button in the sidebar footer.
- Runs all 8 scenarios in `src/lab/scenarios.ts` against the live engine and audit.
- Shows pass/fail verdict, conflict codes, canLock status, and manual setup steps.
- **Verified: 8/8 scenarios pass** as of 2026-08-21.
- `App.tsx` footer now shows live `ENGINE_VERSION` instead of hardcoded string.

### Lab scenarios (8 total)
| ID | Proves |
|---|---|
| golden-fix-and-lock | Full hero loop converges |
| hard-budget-breach | CF-02 is raised for over-budget options |
| branch-priority-inversion | CF-01 fires for comparable ECE-over-CSE violations |
| stale-audit-after-manual-move | Manual (stale-gate requires multi-step interaction) |
| missing-evidence | CF-08 fires for options with missing facts |
| tier-boundary-classification | DREAM/TARGET/SAFE boundaries from named ratio buffers |
| deterministic-factor-scoring | Weights change order deterministically |
| hard-distance-filter | Gorakhpur filtered out at 100 km hard limit |

## Current validation status

- `npm run check` passes: 14 contract tests, typecheck, vite build
- `npm run typecheck` passes clean
- All 8 lab scenarios: 8/8 PASS
- Hero flow end-to-end verified in browser: generate → audit → lock

## Next commands after importing this checkpoint

```bash
git checkout feat/strategy-engine
npm run check
```

Open PR #6 for review. Request Fuzail's review on engine scoring logic and
Gargi's review on LabDashboard UI copy before marking it ready for merge.

# Current state

Last updated: 2026-08-21

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSEL-FLOW`
- Remote default branch: `main`
- Foundation PR `#1` was squash-merged into `main` at `25a75cb`.
- Shared-contract PR `#2` was squash-merged into `main` at `34e09ae` after approvals
  from Fuzail and Gargi; its `CI/frontend` check passed.
- Gargi's existing `feature/gargi-profile-conflicts` branch and history remain preserved.
- Active feature branch: `main` — all latest PRs merged.

## Durable product decisions

- Keep CounselFlow; reduce it to the preference-strategy and conflict-audit hero flow.
- Deterministic engine owns filtering, scoring, ordering, audit and lock eligibility.
- Optional AI explains supplied facts only and always has a template fallback.
- Root Vite app remains the integration lab during the hackathon.
- Zod schemas in `packages/contracts` are the wire-contract source of truth.
- An unresolved critical or warning conflict blocks locking. A kept warning becomes an
  explained override, then the changed state must be re-audited.

## Frontend-adapter & Strategy-engine checkpoint (PR 5 & 6 merged)

- Frontend domain types now derive from `@counselflow/contracts`; only incomplete form
  state and display metadata remain UI-local.
- Added `src/features/contracts` as the single boundary for request IDs, stable profile/
  list revisions, validation failures and API error envelopes.
- Generate, audit and lock mocks now construct and parse the real versioned wire shapes.
- Stale profile/list revisions are re-computed after edits and rechecked at lock time.
- Unresolved warnings now block locking until fixed or overridden with a written reason
  and a successful re-audit.
- Locked state is the immutable contract snapshot, including timestamp, dataset/engine
  versions, audit run and acknowledged warning decisions.
- Adapter failures clear busy state and surface a shared error envelope in the app shell.
- Contract compilation now runs before standalone dev, typecheck and build commands.

### Tier buffers
- Extracted `TIER_DREAM_RATIO_MAX` (0.90) and `TIER_TARGET_RATIO_MAX` (1.40) with JSDoc.
- TierBadge and StrategyInspector lede updated to cite buffer boundaries explicitly.
- Boundary test file: `src/mock/strategy.test.ts`.
- Lab scenario `tier-boundary-classification` added.

### Deterministic scoring engine
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

### Integration lab dashboard
- New `src/screens/LabDashboard.tsx` — golden scenario runner UI.
- Accessible via the `lab` button in the sidebar footer.
- Runs all 8 scenarios in `src/lab/scenarios.ts` against the live engine and audit.
- Shows pass/fail verdict, conflict codes, canLock status, and manual setup steps.
- **Verified: 8/8 scenarios pass** as of 2026-08-21.
- `App.tsx` footer now shows live `ENGINE_VERSION` instead of hardcoded string.

## Current validation status

- `npm run check` passes: 14 contract tests, typecheck, vite build
- `npm run typecheck` passes clean
- All 8 lab scenarios: 8/8 PASS
- Hero flow end-to-end verified in browser: generate → audit → lock

## Next commands after importing this checkpoint

```bash
git checkout main
npm run check
```

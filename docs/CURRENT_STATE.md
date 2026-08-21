# Current state

Last updated: 2026-08-21

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSE-FLOW`
- Remote default branch: `main`
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

## Validation and blockers

- JSON fixtures and lockfile parse successfully; `git diff --check` passes.
- Added the missing Next, Prisma, Zod, Vitest and Node type dependencies to the root
  package manifest and synchronized the npm lockfile.
- Local validation passes: TypeScript check, Prisma client generation, 14 contract tests,
  7 domain tests, production build, and Vite startup with HTTP 200.
- Do not run `npm audit fix --force`; dependency audit findings remain separate work.

## Next commands after importing this checkpoint

```bash
npm ci
npm run check
npm run dev
```

Open a Draft PR into `main`, wait for the `frontend` check, and request Fuzail's backend
contract review plus Gargi's frontend-adapter review before marking it ready.

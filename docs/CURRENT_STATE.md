# Current state

Last updated: 2026-08-19

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSE-FLOW`
- Remote default branch: `main`
- Foundation PR `#1` was squash-merged into `main` at `25a75cb`.
- Shared-contract PR `#2` was squash-merged into `main` at `34e09ae` after approvals
  from Fuzail and Gargi; its `CI/frontend` check passed.
- Gargi's existing `feature/gargi-profile-conflicts` branch and history remain preserved.
- Active feature branch: `feat/frontend-contract-adapter`, created from `34e09ae`.
- Main-branch protection uses PR review and the `frontend` CI check.

## Durable product decisions

- Keep CounselFlow; reduce it to the preference-strategy and conflict-audit hero flow.
- Deterministic engine owns filtering, scoring, ordering, audit and lock eligibility.
- Optional AI explains supplied facts only and always has a template fallback.
- Root Vite app remains the integration lab during the hackathon.
- Zod schemas in `packages/contracts` are the wire-contract source of truth.
- An unresolved critical or warning conflict blocks locking. A kept warning becomes an
  explained override, then the changed state must be re-audited.

## Frontend-adapter checkpoint

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

## Review follow-up

- Fuzail's PR #2 note, “just see the buffer of ranks,” belongs to deterministic strategy
  classification rather than the transport schema.
- The next `feat/strategy-engine` branch must replace unexplained tier ratios with named,
  documented rank buffers and boundary tests. Do not present tier labels as probability.

## Validation and blockers

- PR #2 passed 14 contract tests, root TypeScript and the production Vite build locally
  on Kavya's Mac; its GitHub Actions check also passed.
- Current adapter branch passes structural JSON/whitespace checks in this workspace.
- This workspace cannot reach the npm registry, so the new root typecheck, contract tests
  and production build must be confirmed on Kavya's Mac and by the PR check.
- Do not run `npm audit fix --force`; dependency audit findings remain separate work.

## Next commands after importing this checkpoint

```bash
npm ci
npm run check
git push -u origin feat/frontend-contract-adapter
```

Open a Draft PR into `main`, wait for `frontend`, and request Gargi's frontend review plus
Fuzail's request/revision review before marking it ready.

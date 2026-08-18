# Current state

Last updated: 2026-08-19

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSE-FLOW`
- Remote default branch: `feature/gargi-profile-conflicts`
- Remote baseline tip when foundation work started: `a6d33fd`
- Local `main` now points to the untouched baseline `a6d33fd`; it is not published yet.
- Current local branch: `chore/repo-foundation`
- Important: the remote has no `main` branch yet. Preserve Gargi's branch and history.

## Durable product decisions

- Keep CounselFlow; reduce it to the preference-strategy and conflict-audit hero flow.
- Deterministic engine owns filtering, scoring, ordering, audit and lock eligibility.
- Optional AI explains supplied facts only and always has a template fallback.
- Root Vite app remains the integration lab during the hackathon.
- Existing frontend paths are preserved until shared contracts are frozen.

## Foundation checkpoint

- Foundation changes are committed at the head of `chore/repo-foundation` with message
  `chore: initialize CounselFlow repository foundation`.
- Master README, narrowed MVP blueprint, architecture, workflow and resume protocol prepared.
- Brand mark and horizontal logo prepared under `public/brand`.
- Feature-template, API boundary, shared-contract boundary and lab scenarios prepared.
- GitHub CI and PR checklist prepared.
- `git diff --check` passes and both SVG assets parse as valid XML.

## Validation and blockers

- Baseline `npm ci` is currently blocked in this managed environment: npm repeatedly
  falls back to unwritable `/root/.npm` and reports corrupt/retried tar entries.
- Typecheck/build must be rerun in a normal shell or once npm registry/cache access is
  available; no failure has yet been attributed to application code.
- Publishing is blocked in this environment because GitHub CLI/auth is unavailable.
  Do not pretend this branch was pushed or a PR was opened.

## Next three commands

```bash
npm ci && npm run typecheck && npm run build
git push origin main
git push -u origin chore/repo-foundation
```

After both pushes: open the foundation PR into `main`, review it, then set `main` as the
protected default branch before starting feature branches.

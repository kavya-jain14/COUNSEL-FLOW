# Current state

Last updated: 2026-08-19

## Repository

- Remote: `https://github.com/kavya-jain14/COUNSE-FLOW`
- Remote default branch: `feature/gargi-profile-conflicts`
- Remote baseline tip when foundation work started: `a6d33fd`
- Remote `main` points to the untouched baseline `a6d33fd`.
- Current local branch: `chore/repo-foundation`
- Draft PR: `#1 chore: initialize CounselFlow repository foundation`
- Important: preserve Gargi's branch and history when changing the default branch.

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
- On Kavya's Mac, `npm ci`, `npm run typecheck` and `npm run build` pass.
- GitHub Actions CI run #1 passes for foundation commit `893aba5`.

## Validation and blockers

- PR #1 is open, Draft and mergeable into `main`; its CI is green.
- PR body must be filled before moving it out of Draft.
- Repository default branch still needs to change to `main` after the PR is merged.
- `npm ci` reports two dependency audit findings. Do not run `npm audit fix --force` in
  the foundation PR; inspect them separately on `chore/dependency-audit`.

## Next three commands

```bash
gh pr ready 1 --repo kavya-jain14/COUNSE-FLOW
gh pr merge 1 --repo kavya-jain14/COUNSE-FLOW --squash --delete-branch
gh repo edit kavya-jain14/COUNSE-FLOW --default-branch main
```

After the default branch changes, protect `main`, update the local checkout, and create
`feat/shared-contracts` from the latest `main`.

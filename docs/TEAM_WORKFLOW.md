# Team workflow

## Ownership

| Workstream | Primary | Review partner | First branches |
|---|---|---|---|
| Strategy rules, ordering, workspace, final integration | Kavya | Gargi / Fuzail for API | `feat/strategy-engine`, `feat/workspace` |
| Onboarding, profile controls, conflict inspector, accessibility | Gargi | Kavya | `feat/profile`, `feat/conflict-audit` |
| API, persistence, lock snapshots, source metadata, deployment | Fuzail | Kavya or Gargi | `feat/backend-contracts`, `feat/persistence-lock` |
| Shared contracts and backend integration | Kavya + Gargi + Fuzail | One non-author approval | `feat/shared-contracts` |

Kavya and Gargi may take backend slices, but Fuzail remains the backend primary and
reviews server boundaries. Ownership means “responsible for completion,” not “only
person allowed to edit.”

## One feature, one branch

1. Start from updated `main`.
2. Create `feat/<feature>` or `fix/<bug>`; one feature only.
3. Add/update the contract before wiring UI and API.
4. Add one golden case and at least one edge/failure case.
5. Run local checks and exercise the relevant flow in the integration app.
6. Open a PR with screenshots for UI or request/response examples for backend.
7. Get one teammate approval, squash merge, then delete the branch.

Do not stack unrelated work on an unmerged branch. If feature B depends on feature A,
finish A first or make the dependency explicit in both PR descriptions.

## PR size and handoff

Prefer a PR that can be understood in 15 minutes. A PR must state:

- what changed and what did not;
- owner and reviewer;
- contract impact;
- exact scenario tested;
- typecheck/build/test result;
- known risk and rollback method;
- follow-up branch, if any.

Before stopping, update `docs/CURRENT_STATE.md` with branch, last durable commit, changed
files, checks, blockers and the next three commands. This is the single resume point.

## Integration-lab rule

The root app is where a feature is proven against other features. It must support the
golden demo and deliberate bad inputs in `src/lab/scenarios.ts`. Mocks are test doubles,
not production authority. When the backend endpoint is ready, swap the adapter rather
than rewriting screens.

## Release gate for the hackathon demo

- profile validation and hard/soft language are unambiguous;
- generated order contains fact-based reasons;
- all critical conflicts block lock;
- fixes make conflicts disappear on a real re-audit;
- warnings require a reason to keep;
- stale audits cannot lock;
- locked snapshot is reproducible and versioned;
- AI-off mode still completes the entire demo;
- mobile and keyboard paths remain usable.

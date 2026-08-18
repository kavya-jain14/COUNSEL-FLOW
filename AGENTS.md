# CounselFlow repository instructions

Before changing code, read `README.md`, `docs/CURRENT_STATE.md`,
`docs/ARCHITECTURE.md`, and `docs/TEAM_WORKFLOW.md`.

- Preserve the hackathon hero flow and exclusions in the README.
- Work on one short-lived feature or fix branch. Never write feature work directly to
  `main` or rewrite another contributor's branch.
- Inspect `git status` before and after every task. Existing changes belong to the
  contributor who made them; do not reset or delete them.
- Freeze or update shared contracts before implementing both sides of an API change.
- Keep deterministic ordering/audit logic separate from optional AI explanations.
- Add or update a scenario in `src/lab/scenarios.ts` for engine/audit behavior.
- Run `npm run typecheck` and `npm run build` before declaring frontend work complete.
- Update `docs/CURRENT_STATE.md` at every durable checkpoint or before handing off.
- If context is missing, use `docs/ANTIGRAVITY_MASTER_PROMPT.md`; do not guess.

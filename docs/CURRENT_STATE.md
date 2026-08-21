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
- The redesign is isolated in `src/styles/calm-scholar.css`; strategy, audit, lock and
  contract behavior remain unchanged.
- Full design notes: `design/CALM_SCHOLAR.md`.

## Verification

- Shared-contract TypeScript build: passed.
- Root TypeScript `--noEmit`: passed.
- Contract test suite: 14 passed, 0 failed.
- Production Vite build: passed, 132 modules transformed.
- `git diff --check`: passed.
- Golden engine and audit run: 7 options, 0 critical, 2 warnings (CF-01 and CF-08).
- Responsive desktop/mobile rules are implemented at 900 px and 680 px.
- The cloud browser cannot open this workspace's localhost preview, so the final screenshot
  pass must be done on Kavya's Mac before presentation.

## Immediate commands

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

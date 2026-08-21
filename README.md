# CounselFlow

![CounselFlow logo](public/brand/counselflow-logo.svg)

CounselFlow is a counselling strategy workspace, not another college predictor. A
candidate enters rank, category, budget, distance, branch priority and hard constraints;
the product builds an explainable preference order, stress-tests it for contradictions,
and lets the candidate fix, justify and lock the final list.

> **Hackathon hero flow:** Profile → generated preference list → why this order →
> conflict audit → fix or justify → re-audit → lock.

The recommendation and conflict engine stays deterministic. Optional AI may turn stored
facts into clearer explanations, but it never invents facts or silently changes the
order.

## Repository map

| Path | Purpose | Owner |
|---|---|---|
| `src/` | Current candidate UI and local integration lab | Kavya + Gargi |
| `src/features/` | Destination for isolated frontend/domain feature modules | Feature owner |
| `src/lab/` | Golden demo and fault-injection scenarios | Kavya + reviewers |
| `services/api/` | Backend service boundary; backend code must live here | Fuzail + backend contributor |
| `packages/contracts/` | Shared validated API contracts | Kavya + Fuzail |
| `public/brand/` | Approved repository and app logo assets | Team |
| `docs/` | Architecture, workflow, handoff prompt and live checkpoint | Team |

The existing `src/screens`, `src/mock`, `src/state` and `src/types` implementation is
intentionally preserved. We will extract it feature-by-feature after the shared
contracts are frozen, instead of doing a risky mass move before the demo works.

## Start locally

```bash
npm ci
npm run dev
```

Before opening a PR:

```bash
npm run typecheck
npm run build
```

## Branch rule

Every independently reviewable feature gets its own short-lived branch from `main`:

```text
feat/profile
feat/strategy-engine
feat/conflict-audit
feat/workspace
feat/lock-strategy
fix/<short-bug-name>
chore/<repo-or-tooling-change>
```

Do not mix unrelated features, do not push feature work directly to `main`, and do not
create a long-lived personal integration branch. The root Vite app is the shared
integration lab: merge small features into it only after their contracts and golden
scenario pass.

The remote now has `main` at the reviewed frontend baseline, while
`feature/gargi-profile-conflicts` remains the default until foundation PR #1 is merged.
After that merge, make `main` the protected default. Never force-push or rewrite Gargi's
historical branch.

Read the [`hackathon master blueprint`](docs/MVP_BLUEPRINT.md), the working agreement in
[`docs/TEAM_WORKFLOW.md`](docs/TEAM_WORKFLOW.md), the architecture in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and the current checkpoint in
[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).

If a session or tool limit interrupts the build, paste
[`docs/ANTIGRAVITY_MASTER_PROMPT.md`](docs/ANTIGRAVITY_MASTER_PROMPT.md) into the next
agent. It contains the locked scope, ownership, recovery checks and handoff format.

---

## Current candidate-facing frontend

React + Vite + TypeScript. Covers the candidate side of the hackathon MVP:

```
Build my profile → Profile summary → Mock strategy → Conflicts → Fix → Re-audit → Lock
```

Everything runs against a **local mock** of the strategy API, so this half of the
product is demo-complete without the backend.

```bash
npm ci
npm run dev
```

`npm run build` type-checks and bundles. `npm run typecheck` alone is faster.

---

## What is built

**1. Build My Profile** (`src/screens/BuildProfile.tsx`)

Rank + rank type, category, ordered branch priority, annual budget, distance limit,
hard exclusions, and soft factor sliders — with validation and a summary step.

The central UX rule is the hard/soft split, and it is enforced in three places:

| | Hard constraint | Soft preference |
|---|---|---|
| Controls | budget, distance (candidate's choice), "never accept" list | factor weight sliders |
| Visual | double navy rule, `H` code, "Hard limit" label | single rule, `S` code, "Soft preference" label |
| Behaviour | removes/blocks an option, flags **Critical**, blocks lock | only changes order and wording |

Budget and distance each carry an explicit **Treat as: Hard limit / Soft preference**
toggle, with a sentence stating what that choice will do. Converting a hard limit to
soft is also offered as a *fix* inside the Conflict Inspector.

**2. Conflict Inspector** (`src/screens/ConflictInspector.tsx`)

All eight blueprint rules, grouped Critical, Warning and Info. Each audit record shows the
severity, the code, the contradiction in one line, the stored facts that triggered it,
which declared constraint caused it, and the available actions with their consequences.

**3. The interaction flow**

Fix → re-audit → lock is a real gate, not a decoration:

- any edit marks the audit **stale** and replaces the Lock button with **Re-audit**
- Critical conflicts cannot be acknowledged away — remove the option, change the
  constraint, or convert it to soft
- Warnings can be kept, but only through a dialog that requires a written reason
- proposed swaps are previewed (before → after) before they apply; nothing is ever
  silently reordered
- the locked snapshot records profile / dataset / engine version, every fix, and every
  override reason

---

## Contracts to freeze with the team

Provisional types live in [`src/types/index.ts`](src/types/index.ts) and should be
replaced by the shared Zod schemas. The UI only depends on these shapes.

**For Fuzail** — `CandidateProfilePayload` is what the profile screen posts to
`POST /api/strategy/generate`. Weights are normalised to sum 1.0 client-side
(`src/lib/validation.ts`). Frontend validation rules should be mirrored server-side; the
server stays authoritative.

**For Kavya** — `StrategyItem` (option, tier, position, `ReasonFact[]`, confidence,
`manuallyPlaced`) and `Conflict` / `ConflictAction` / `AuditResult`. Conflict ids must be
**stable across re-audits**, otherwise acknowledged warnings reappear; the mock derives
them from code + item ids rather than generating them randomly.

Swapping in the real API is a one-file change: [`src/mock/api.ts`](src/mock/api.ts)
already has the three endpoints' call signatures.

---

## What is mocked, and one judgement call inside it

- [`src/data/seedOptions.ts`](src/data/seedOptions.ts) — 9 verified sample rows, each
  with a source label, year, and explicit `missingFacts`
- [`src/mock/strategy.ts`](src/mock/strategy.ts) — a fixed order that deliberately
  contains the demo's mistakes
- [`src/mock/audit.ts`](src/mock/audit.ts) — CF-01…CF-08 as **real rules**, not canned
  conflict objects

The audit is rule-based on purpose: fix → re-audit is only honest if removing an option
actually makes the flag disappear. This is Kavya's territory in the real build — it
exists here so the interaction flow can be demonstrated and tested now.

**One rule needed a decision.** A naive CF-01 flags *every* adjacent branch inversion,
so fixing one spawns two more and the list never converges. The blueprint's wording is
"above a **comparable** CSE option", so comparability is judged on college quality
(the weighted placements + campus facts):

- lower option is equal-or-better on college quality → **Warning**, recommend swap.
  Swapping wins on both branch and college, so the order is simply wrong.
- the option above has the better college → **Info**, "college chosen over branch".
  That is a legitimate tradeoff, and the blueprint asks us to confirm intent rather
  than nag.

Worth confirming with Kavya before the engine implements CF-01 for real.

Verified end to end: the sample candidate generates 2 critical + 4 warnings, and the
demo fix sequence converges to 0 critical / 0 warning / 1 info, then locks.

---

## Design system

The active UI implements **CounselFlow Calm Scholar**, an admissions-dossier system built
from deep navy, soft sky blue, warm paper and beige. It uses Libre Baskerville for display,
IBM Plex Sans for body copy and IBM Plex Mono for ranks, fees, distance and revision data.

The complete specification is in [`design/CALM_SCHOLAR.md`](design/CALM_SCHOLAR.md). The
active layer lives in [`src/styles/calm-scholar.css`](src/styles/calm-scholar.css) and is
loaded after the legacy stylesheet, keeping the redesign isolated and reversible.

The shell is a numbered five-section document index. Profile inputs sit in ruled sections,
the strategy and locked list are registers, explanations appear as marginalia, and conflict
decisions read as an audit record. The interface uses no gradients, shadows, glass, emoji,
decorative icon library, soft cards, purple-black palette or decorative checkmark lists.

## Accessibility

Colour is never the only signal. Every severity, tier, and hard/soft state also carries
a code, a word, and a distinct border treatment. Reorder is button-driven so it works
with a keyboard and on touch. The modal traps focus and closes on Escape; step changes
move focus to the top of the content; state changes are announced through a live region.
Verified with no horizontal overflow at 375 px.

## Known dev-only quirk

Editing `src/state/store.tsx` triggers a full HMR remount (the file exports both a
component and hooks, which breaks react-refresh's boundary) and logs a transient
`useAppState must be used inside <AppProvider>` error while React swaps trees. It does
not affect the built app or a fresh page load.

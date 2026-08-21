# Feature: decision-impact

- Owner: Gargi
- Reviewer: replace-me
- Branch: `feature/gargi-profile-conflicts`
- Status: implemented

## User outcome

A candidate opens any row of their generated preference list and reads what choosing
**that** option means for **them** — the advantages their own declared preferences
create, the compromises those same preferences force, the risks attached, and one
bottom line. Never a college review.

## In scope

- One deterministic evaluation of a single `StrategyItem` against a `CandidateProfile`.
- One template narration of that evaluation.
- One reusable modal, driven entirely by props, opened from any list row.

## Not in scope

- Changing list order, tiers, audit conflicts or the lock gate. The evaluator reads;
  it never writes.
- Admission probabilities. Reachability is reported as last cycle's closing rank in the
  candidate's own seat pool and nothing more.

## The two-layer rule

```text
profile + item + list  ──▶  evaluate.ts  ──▶  DecisionImpact  ──▶  narrate.ts  ──▶  sentences
                            (decides)         (structured)        (only renders)
```

`evaluate.ts` is the only place a verdict is formed. It emits `ImpactFinding` records
carrying a code, a label (`HARD_CONSTRAINT_VIOLATION`, `CONTRADICTION`,
`SOFT_COMPROMISE`, `POTENTIAL_RISK`, `STRONG_MATCH`, `EVIDENCE_GAP`), a satisfaction
state and raw numeric facts — no prose.

`narrate.ts` holds one renderer per code and turns those facts into sentences. It
cannot add, drop, reorder or re-label a finding, and it cannot decide anything. Swapping
the template renderer for an AI adapter means implementing `ImpactNarrator`
(`(impact: DecisionImpact) => NarratedImpact`) and nothing else; the verdict is already
fixed by then. `NarratedImpact.source` records which renderer produced the text, and the
template remains the mandatory fallback per `docs/ARCHITECTURE.md`.

## What makes a statement personal

A finding is only emitted when the candidate declared something it can be measured
against:

| Declared input | Drives |
| --- | --- |
| `branchPriority` | first-choice match, N-step downgrade, unranked branch, better branch still on the list |
| `budget` + `factorWeights.fees` | headroom, tight headroom, hard vs soft breach, cost against cheaper options on their own list |
| `distance` + `homeCity` + `factorWeights.location` | measured distance, tight margin, hard vs soft breach, commutability |
| `factorWeights.placements` / `.campus` | strong / mid / weak — quoted with the candidate's own weight word |
| `factorWeights.hostel` | availability, and the unpriced accommodation cost when far from home with no hostel |
| `hardExclusions` | branch, institute type, city and no-hostel exclusions, always blocking |
| `rank` + `category` + `domicile` | reachability inside the named seat pool |
| `subQuotas` | an explicit statement that the loaded cutoffs cannot model the claimed quota |
| list position | what allotment at this position forfeits, and what has to fail above it |
| high weight vs worst-on-list | contradictions between a stated priority and the chosen order |

A factor weighted `0` produces no statement at all — not a neutral one. That is what
keeps the output from drifting into "good placements".

## Fit score

`fit.score` is preference satisfaction, not a chance of admission: each declared factor
is scored against this option alone (absolute, not ranked against the set), weighted the
way the candidate weighted it, with branch order fixed at `BRANCH_WEIGHT` — the same
30/70 split the ordering engine uses, imported from it so the two cannot drift. Any hard
violation forces the band to `BLOCKED` regardless of score.

## Public contract

```ts
DecisionImpactModal      // props-only React component, no store access
evaluateDecisionImpact   // (item, { profile, items, conflicts?, authority? }) => DecisionImpact
narrateImpact            // (impact) => NarratedImpact
ImpactNarrator           // the seam an AI adapter must implement
```

Internal files under `lib/` and `components/` are not importable from other features.

## Scenarios

- Golden case: `decision-impact-is-personal` in `src/lab/scenarios.ts`.
- Edge/failure case: `decision-impact-is-deterministic` in `src/lab/scenarios.ts`.
- Unit: `tests/evaluate.test.ts` — 14 cases covering hard vs soft separation, silence on
  zero-weight factors, seat-pool naming, ordering consequences, and byte-identical
  output for identical input.

## Done when

- [x] Deterministic layer decides; narration layer only renders.
- [x] Golden and edge scenarios recorded in the lab.
- [x] `npm run typecheck` and `npm run build` pass.
- [x] Keyboard behaviour checked — focus trap, Escape to close, focus restored on close.

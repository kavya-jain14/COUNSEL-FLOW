# CounselFlow hackathon master blueprint

- Status: scope-locked MVP
- Product owner: Kavya
- Frontend/product: Kavya + Gargi
- Backend primary: Fuzail

## 1. One-line pitch

Predictors tell a candidate what they might get. CounselFlow builds the order they
should actually submit, explains every placement, and catches preference-list mistakes
before the candidate locks it.

## 2. Problem

Counselling candidates do not only need a list of eligible colleges. They must convert
personal tradeoffs into a single ordered preference list. That is where costly mistakes
happen:

- a less-preferred branch is accidentally placed above a preferred comparable option;
- an unaffordable or too-distant option survives despite a declared hard limit;
- the list has attractive options but no acceptable fallback;
- duplicate, dominated or poorly evidenced options create false confidence;
- generic predictors show cutoffs without explaining how budget, distance and branch
  priority should change the final order.

## 3. Product promise

CounselFlow gives the candidate an explainable strategy artifact:

1. a profile that distinguishes non-negotiable constraints from preferences;
2. a deterministic, personalized preference order;
3. fact-based reasons for each position;
4. a conflict audit with evidence and consequences;
5. a controlled fix/reorder/override flow;
6. a reproducible locked snapshot.

It does **not** promise admission, submit an application, or fabricate probability.

## 4. Core advantages

| Advantage | Why it matters | Proof in the demo |
|---|---|---|
| Strategy, not prediction | Turns eligibility data into an actionable order | A complete ranked list is generated |
| Hard/soft separation | Prevents a preference from being mistaken for a non-negotiable rule | Budget/distance mode changes severity and eligibility |
| Deterministic decisions | Same inputs produce auditable results | Re-audit removes a conflict only after its cause changes |
| Explainable placement | Candidate sees which facts and priorities drove the order | Each row carries reasons and confidence |
| Conflict stress test | Finds internal contradictions before lock | CF-01–CF-08 inspect the latest list |
| Candidate control | The system recommends but never silently rewrites intent | Swaps preview before/after; kept warnings need a reason |
| Evidence honesty | Missing/stale facts reduce confidence instead of becoming fiction | Evidence-gap warning cites missing fields/source year |
| Reproducible lock | The final decision can be recovered and defended | Snapshot records item order and version metadata |
| AI-safe by design | Demo works even when an LLM is slow or unavailable | Template explanation fallback completes the flow |

## 5. User and benefit

Primary user: a student/candidate preparing an AKTU/UPTAC-style choice list who knows
their rank and constraints but is unsure how to order tradeoffs.

Candidate benefits:

- fewer accidental ordering and constraint mistakes;
- clearer reasoning instead of a black-box score;
- faster comparison of branch, college, fee, distance and safety coverage;
- confidence that the final list matches declared intent;
- a visible record of warnings knowingly accepted.

Team/judge benefits:

- a focused end-to-end story that can be demonstrated in minutes;
- real decision logic rather than a chat wrapper;
- a responsible AI boundary with deterministic fallback;
- an architecture that can later replace mocks without discarding the UX.

## 6. Hero flow

### Step 1 — Build profile

Collect:

- rank and rank type;
- category;
- ordered branch priority;
- annual budget and hard/soft mode;
- maximum distance and hard/soft mode;
- never-accept exclusions: branch, institute type, location or no hostel;
- soft weights: placements, fees, location, campus and hostel.

Validate incomplete inputs, normalize weights and show a human-readable summary plus
the exact API payload.

### Step 2 — Generate strategy

Apply hard filtering, compute deterministic factor scores, form dream/target/safe tiers
and create an ordered list. Every item contains position, reasons, confidence, source
metadata and a manual-placement flag.

### Step 3 — Explain the order

Show positive/negative/neutral reason facts, relevant tradeoffs and missing evidence.
The explanation must be traceable to profile/dataset facts.

### Step 4 — Inspect conflicts

Audit the current profile and current order. Group results Critical → Warning → Info.
Each card shows rule code, contradiction, evidence, declared constraint, possible action
and consequence.

### Step 5 — Fix or justify

Candidate may remove, swap, move, change a constraint, convert hard to soft, deduplicate
or keep an eligible warning with a written reason. Critical conflicts cannot be
acknowledged away. Nothing is silently reordered.

### Step 6 — Re-audit and lock

Every edit marks the audit stale. Lock stays disabled until the latest revision is
audited, no critical conflict remains, and kept warnings have reasons. Persist a
versioned snapshot of the final order and decisions.

## 7. Conflict catalogue

| Code | Rule | Default severity | Candidate action |
|---|---|---|---|
| CF-01 | Branch-priority inversion between comparable options | Warning; Info when stronger college is a deliberate tradeoff | Preview swap or confirm intent |
| CF-02 | Annual fee crosses declared budget | Critical if hard; Info if soft | Remove, raise limit, or explicitly soften |
| CF-03 | Distance crosses declared limit | Critical if hard; Info if soft | Remove, extend radius, or explicitly soften |
| CF-04 | Adjacent option is dominated on every weighted factor | Warning | Reorder/remove or keep with reason |
| CF-05 | No fallback the candidate would actually accept | Warning | Add/retain an acceptable safe option |
| CF-06 | Option matches a “never accept” exclusion | Critical | Remove option or change exclusion with reason |
| CF-07 | Same college-branch option appears twice | Warning | Deduplicate |
| CF-08 | Fee/rank/placement or other evidence is missing | Warning | Verify source or accept uncertainty with reason |

Conflict IDs must be stable across re-audits and derived from rule + involved item IDs.

## 8. Feature scope

### Must ship for the hackathon

- candidate profile with hard/soft controls and validation;
- curated sample dataset with source year and missing-fact markers;
- deterministic strategy generation and tiered order;
- reason facts and confidence;
- all eight conflict rules;
- manual move/swap/remove and constraint fixes;
- stale-audit gate, written warning overrides and versioned lock;
- local integration lab with golden/fault scenarios;
- responsive, keyboard-usable candidate flow;
- mock adapter that can be swapped for real API endpoints.

### Stretch only after the hero flow is stable

- grounded AI wording of existing reasons with template fallback;
- saved sessions and lightweight resume token;
- comparison drawer for two list items;
- deployable backend persistence and shareable locked snapshot;
- analytics for demo funnel/abandoned conflict step.

### Explicitly excluded from this build

- admin console and automated data ingestion/scraping;
- live counselling submission, login/payment or notifications;
- Redis, queues or worker orchestration without a measured need;
- multiple counselling systems/cycles beyond the curated demo;
- general chatbot, opaque LLM ordering or admission guarantees.

## 9. Decision engine

Suggested deterministic pipeline:

1. validate profile and dataset version;
2. remove options that violate true hard exclusions/known hard facts;
3. retain unknown facts but mark confidence/evidence gap;
4. calculate normalized factor contribution from declared weights;
5. include branch-priority contribution separately and visibly;
6. bucket dream/target/safe using transparent sample rules;
7. sort with stable tie-breakers;
8. emit reason facts and engine version;
9. audit the generated order independently.

The exact scoring coefficients may evolve, but every change needs golden fixtures and a
version bump. The audit must not simply echo canned conflicts.

## 10. AI that adds real value

The deterministic engine answers **what order and what conflict**. Optional AI answers
**how to explain that tradeoff clearly to this candidate**.

Input to AI: only structured profile facts, reason facts, conflict evidence and approved
tone/length. Output: explanation text. Validate that the response references no option
or numeric fact absent from the input; fall back to templates on failure/timeout.

This is a meaningful GenAI layer without handing a high-impact ordering decision to an
opaque model.

## 11. Screens

| Screen | Primary decision/action |
|---|---|
| Landing | Understand strategy-vs-predictor value |
| Build profile | Declare priorities and hard/soft constraints |
| Profile summary | Verify inputs and API payload |
| Strategy workspace | Read reasons and manually adjust order |
| Conflict inspector | Resolve or justify audited contradictions |
| Locked strategy | View final versioned snapshot |

Design direction is CounselFlow Editorial Dark: warm parchment text, terracotta action
accent, sand hard-constraint treatment, clear typography and non-color status cues.

## 12. API contract outline

- `POST /api/strategy/generate(profile)` → profile/list revision, engine/dataset version,
  ordered `StrategyItem[]`;
- `POST /api/strategy/audit(profile, items, revision)` → stable conflicts, counts,
  audited revision, `canLock`;
- `POST /api/strategy/lock(profile, items, audit, resolutions)` → reject stale audits or
  unresolved critical/warning decisions; otherwise return snapshot ID/version;
- `GET /api/health` → deployment health.

Server validates inputs and lock invariants even when the client already checked them.

## 13. Demo script

1. Introduce the gap: “A predictor gives possibilities; submission still requires one
   risky ordered list.”
2. Enter a sample rank, CSE > ECE, ₹1.5L hard budget and distance preference.
3. Generate the list and open two fact-based explanations.
4. Reveal a comparable branch inversion and a ₹2L budget breach.
5. Preview a swap, remove/change the hard-budget option and show the audit turning stale.
6. Re-audit; justify one non-critical evidence gap.
7. Lock and show the versioned order/decisions.
8. Close with: deterministic decisions, optional grounded AI explanation, no guarantees.

Target live demo: 3–4 minutes, with a pre-recorded backup of the same golden path.

## 14. Acceptance criteria

- same input/version produces the same order and conflict IDs;
- hard violations block lock and cannot be dismissed;
- editing profile/order invalidates the previous audit;
- fixing the cause removes the conflict on real re-audit;
- every kept warning stores a non-empty reason;
- no generated text introduces unsupported facts;
- unknown facts are visible and lower confidence;
- the complete flow works with AI disabled;
- no horizontal overflow at 375px and critical actions work from keyboard;
- typecheck/build/tests pass in CI.

## 15. Build order and ownership

| Sequence | Branch | Primary | Deliverable |
|---|---|---|---|
| 0 | `chore/repo-foundation` | Kavya | Stable `main`, folders, docs, brand, CI |
| 1 | `feat/shared-contracts` | Kavya + Fuzail | Validated profile/strategy/audit/lock schemas |
| 2 | `feat/profile` | Gargi | Profile controls, validation, payload fixtures |
| 3 | `feat/strategy-engine` | Kavya | Deterministic order, reasons, golden fixtures |
| 4 | `feat/backend-contracts` | Fuzail | API skeleton, validation, seed adapter, health |
| 5 | `feat/conflict-audit` | Gargi + Kavya | Inspector UX plus CF-01–CF-08 rule contract |
| 6 | `feat/workspace` | Kavya | Reorder/fix actions and audit invalidation |
| 7 | `feat/persistence-lock` | Fuzail | Server lock gate and versioned snapshot |
| 8 | `fix/demo-hardening` | Team | Integration, responsive/accessibility, deploy/demo |

Branches may overlap only after their shared contract has merged. Each engine/audit PR
includes a golden fixture and an edge/failure case.

## 16. Main risks and controls

| Risk | Control |
|---|---|
| Scope becomes a startup roadmap | Reject work that does not improve the hero demo |
| LLM looks bolted on | Use it only for grounded personalized explanation; show fallback |
| Mock feels fake | Execute deterministic rules and make fixes disappear on re-audit |
| Data is challenged | Show source/year/missing facts; avoid admission guarantees |
| Merge chaos | Freeze contracts, one feature/branch, small reviewed PRs |
| Demo network fails | Curated local data, mock adapter and AI-off fallback |
| Backend is late | Preserve adapter boundary; frontend demo remains end-to-end |

## 17. Judging alignment

The concept naturally demonstrates innovation (preference stress-testing), technical
depth (deterministic engine + versioned audit state), user impact (preventing costly
ordering mistakes), UX clarity (evidence and consequences) and responsible AI. Once the
actual hackathon criteria/link is available, map its weighted sections to this demo and
remove any low-value stretch work; do not invent the criteria.

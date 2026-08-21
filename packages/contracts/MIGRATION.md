# Provisional frontend → wire contract migration

The shared schemas intentionally preserve the current candidate concepts while making
revision and version metadata explicit.

| Current frontend shape | Shared contract | Migration note |
|---|---|---|
| `CandidateProfilePayload` | `candidateProfileSchema` | Same core fields; normalized weights and contradictions are runtime-validated |
| `StrategyItem[]` | `strategyItemsSchema` | Positions must match array order; nullable evidence fields must match `missingFacts` |
| `{ items, audit }` mock result | `strategyGenerateResponseSchema` | Adds contract, request, profile/list, dataset and engine versions |
| `Resolution` | `resolutionSchema` | Adds original conflict severity; warning acceptance maps to an explained `OVERRIDDEN` resolution |
| `AuditResult` | `auditResultSchema` | Adds audited profile/list revisions, unique conflict IDs and cross-checks counts/lock eligibility |
| `LockState` | `lockStrategyResponseSchema` | Becomes an immutable, timestamped snapshot whose warning decisions are validated |
| thrown/ad-hoc error | `apiErrorEnvelopeSchema` | Stable machine code plus human message and field errors |

The frontend integration lives behind `src/features/contracts` and `src/mock/api.ts`.
Screens do not import backend-specific types. Warning acceptance is translated from the
UI action into a wire-level `OVERRIDDEN` resolution carrying the original severity.

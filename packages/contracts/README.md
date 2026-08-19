# `@counselflow/contracts`

Runtime-validated wire contracts shared by the candidate frontend and API. Zod schemas
are the source of truth; TypeScript types are inferred from them rather than maintained
as a second handwritten model.

## Scope

- candidate profile and normalized preferences;
- strategy items, evidence and generated-list response;
- conflict actions, resolutions and revision-aware audit;
- stale-safe lock request and versioned snapshot response;
- common request metadata and error envelope.

This package does not contain UI state, database rows, scoring coefficients or backend
framework code. Existing types in `src/types/index.ts` remain the frontend adapter until
a later feature PR migrates screens to this package.

## Lock invariants

- profile and list revisions must match the latest audit;
- `canLock` is false while any critical or warning conflict remains unresolved;
- accepting a warning is an `OVERRIDDEN` resolution with its original severity and a
  written reason;
- informational conflicts may be acknowledged without pretending they were warnings;
- snapshot warning decisions contain only explained warning overrides;
- missing option facts are `null` and must be named in `missingFacts` exactly.

## Commands

From the repository root:

```bash
npm run contracts:typecheck
npm run contracts:test
npm run contracts:build
```

Use `npm run check` to run the root frontend typecheck, contract tests and production
build in the same order used for local handoff.

## Versioning

Every wire object carries `contractVersion: "1.0.0"`. Additive optional fields may ship
in a minor package version. Removing/renaming fields, changing enum values or tightening
previously accepted data requires a new wire-contract version and a migration note.

See [`MIGRATION.md`](MIGRATION.md) for the provisional-frontend compatibility map.

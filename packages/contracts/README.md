# Shared contracts

This package will become the single source of truth for validated frontend/backend
schemas. The current provisional TypeScript interfaces remain in `src/types/index.ts`
until a dedicated `feat/shared-contracts` PR is agreed.

Freeze these shapes first:

- `CandidateProfilePayload`;
- `StrategyItem` and fact-based reasons;
- `Conflict`, evidence and allowed actions;
- `AuditResult`, list/profile revision and `canLock`;
- lock request/response and versioned snapshot;
- common validation/error envelope.

The contract PR must include valid and invalid fixtures, explicit nullability, version
fields, stable enum values and an upgrade/migration note. Frontend convenience types and
database row types must not leak into the wire contract.

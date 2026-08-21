# Frontend contract adapter

This feature is the only frontend boundary allowed to translate validation failures,
request IDs and deterministic profile/list revisions. Screens consume view state; the
mock API and eventual HTTP API both exchange `@counselflow/contracts` objects.

- Owners: Kavya + Gargi
- Backend reviewer: Fuzail
- Contract: `@counselflow/contracts` wire version `1.0.0`

## Rules

- Parse every generate, audit and lock exchange at runtime.
- Never let incomplete form state cross the API boundary.
- Recompute revisions from canonical payloads after every edit.
- Convert adapter failures to the shared API error envelope.
- Keep scoring, ranking and conflict rules outside this folder.

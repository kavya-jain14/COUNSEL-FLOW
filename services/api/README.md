# CounselFlow API service boundary

Fuzail is the backend primary; Kavya and Gargi may own reviewed backend slices. Server
implementation belongs under this directory rather than inside frontend `src`.

Target modules:

```text
services/api/
├── src/modules/profile/
├── src/modules/strategy/
├── src/modules/audit/
├── src/modules/lock/
├── src/modules/data/
├── src/db/
└── tests/
```

Initial endpoints:

- `POST /api/strategy/generate` — validate profile, return ordered strategy items;
- `POST /api/strategy/audit` — audit profile + latest order, return stable conflicts;
- `POST /api/strategy/lock` — reject stale or unresolved blocking state, persist a
  versioned snapshot;
- `GET /api/health` — build/deployment health only.

Do not choose a framework or database in a placeholder commit. Freeze the schemas in
`packages/contracts`, then select the smallest stack the team can run and deploy during
the hackathon.

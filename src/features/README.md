# Feature modules

This directory is the destination for new or incrementally extracted features. Do not
move all existing screens here at once. Each extraction must keep the demo working and
be reviewed as its own feature PR.

Copy `_template/README.md` into `src/features/<feature>/README.md`, then use this shape:

```text
<feature>/
├── components/       feature-owned React components
├── fixtures/         examples used by tests and the integration lab
├── lib/              pure deterministic logic
├── tests/            behavior tests
├── index.ts          stable public exports
└── README.md         scope, owner and contracts
```

Rules:

- import another feature only through its `index.ts`;
- shared API shapes come from `packages/contracts` once that package is active;
- server calls go through an adapter, never directly from presentation components;
- engine and audit logic stays deterministic and testable without React;
- add/update a case in `src/lab/scenarios.ts` when behavior changes.

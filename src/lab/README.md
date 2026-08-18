# Integration lab

The root Vite app is the hackathon integration lab. It should run the golden demo and
deliberately broken inputs before a feature is merged. `scenarios.ts` is the shared
catalog; a future automated suite can consume the same IDs and expectations.

Every strategy/audit PR adds at least:

1. one golden case that should lock;
2. one edge or fault case that proves the rule fails safely;
3. expected conflict codes and whether lock must be blocked.

Mocks under `src/mock` are replaceable adapters. They must behave like the agreed API
contract and must not become the only place where a product rule is documented.

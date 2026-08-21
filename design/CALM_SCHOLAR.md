# CounselFlow Calm Scholar

The active candidate UI uses a document-driven admissions dossier system. It is intended
to feel like a counselling gazette prepared by a careful human team, not a generic SaaS
dashboard.

## Palette

Only this family is used:

| Token | Value | Use |
|---|---:|---|
| Deep navy | `#112A46` | Text, rules, primary actions, sidebar |
| Muted blue | `#4F7894` | Secondary labels and numeric annotations |
| Soft sky | `#DCECF5` | Page field, selected rows, calm status fields |
| Warm paper | `#FBFAF5` | Main document surface |
| Warm beige | `#ECE5D8` | Table heads, decision notes, hard-limit fields |

Severity is communicated with words, codes, line weight, and border style. It does not
introduce red, amber, green, purple, or rainbow status colors.

## Type

- Display: Libre Baskerville, with Georgia as the local fallback.
- Body: IBM Plex Sans, with Arial as the local fallback.
- Data: IBM Plex Mono, with Consolas as the local fallback.

Rank, fees, distance, revisions, conflict codes, option positions, and engine metadata use
the data face with tabular numerals.

## Layout rules

- The left rail is a numbered five-section document index.
- Content is divided by hairline rules and editorial bands.
- Strategy and locked lists are ruled registers, not floating cards.
- The strategy explanation sits in a marginalia column.
- Conflict decisions read as a case file: finding, evidence, choices, recorded outcome.
- Mobile retains the same document order and converts the index to a horizontal five-step
  register.

## Explicit exclusions

The UI does not use gradients, shadows, glass effects, decorative icon libraries, emoji,
testimonials, pricing patterns, bento grids, dot fields, radial shapes, neon, purple-black
themes, oversized rounded corners, or decorative checkmark lists. Motion is disabled in
the visual layer.

## Final acceptance gate

- The candidate shell exposes only the five product steps. The integration lab remains a
  development file and has no candidate-facing navigation.
- The active stylesheet forces flat backgrounds, square geometry, static hover states,
  zero blur, zero shadow and zero decorative animation.
- Reorder controls use written labels instead of an icon library or decorative arrows.
- Loading states use plain status copy instead of a spinner or skeleton surface.
- The landing page contains a real seven-row product specimen with two reproducible audit
  findings.
- Privacy and terms links open complete, deployable notices using the same palette and type
  system.
- Brand SVGs use only the Calm Scholar palette and the approved type families.

## Implementation boundary

`src/styles/calm-scholar.css` is loaded after the legacy stylesheet. It owns the active
visual system without changing strategy, audit, lock, contract, or state behavior. The
file can be removed from `src/main.tsx` to return to the prior skin while keeping every
product interaction intact.

The landing specimen is generated from the golden demo profile:

- rank 12,500 CRL;
- General category and UP domicile;
- CSE, IT, ECE branch priority;
- ₹1,50,000 annual hard ceiling;
- 300 km hard distance limit from Lucknow;
- seven surviving options;
- two audit warnings: CF-01 branch priority conflict and CF-08 evidence gap.

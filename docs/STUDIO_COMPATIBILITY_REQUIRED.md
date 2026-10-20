# Kenmark Studio — separate Brain 2.0 changes required

This document records source-level interoperability issues found against `tanoojmehra/kenmark-studio` main on 2026-10-20. **Do not change Studio as part of the Skills task.**

- `src/lib/projects/brain-artifacts-shared.ts`: `ARTIFACT_FILENAME_RE` currently requires exactly 3 digits. Accept full >=3-digit positive canonical prefixes for issue and plan files.
- `src/lib/projects/brain-artifacts-core.ts`: `validatePlanFrontmatter` requires exactly 3 digits; `parseIndexedArtifactIds` and `deduplicatePlansOrIssuesIndex` restrict rows to three digits. Reconciliation uses `name.slice(0,3)` and a single per-ID map that skips duplicate history. Replace with whole-ID parsing, duplicate conflict reporting, non-destructive repair and high-water-safe ledger reconciliation.
- `src/lib/projects/brain-artifacts-core.ts`: `scanArtifactDir` and `listBrainArtifacts` contain exact-3-digit filename filters. Support >=3 and numeric sorting, including archive/completed histories.
- `src/lib/projects/brain-issues.ts` and `brain-plans.ts`: `name.slice(0,3)` fallback truncates IDs above 999; parse complete filename prefixes, verify status/list/create/lookup/complete for 4- and 5-digit IDs.
- `src/lib/brain/loader.ts`: `FEATURE_FILE_PATTERN` only matches 3-digit feature docs; accept higher IDs and legacy metadata without Markdown normalization.
- `src/lib/projects/kenmark-init-status.ts`: legacy `00-overview.md` already partly accepted; ensure partial Brain does not force invalid regeneration.
- Preserve Markdown as canonical; derived MongoDB indexes may be reconstructed, but must not mutate KB on import. Add cross-repository regression tests.

After publishing a verified new npm package, update Studio's pinned package version and npm integrity using the actual published tarball metadata. Never guess integrity or edit Studio without explicit authorization.

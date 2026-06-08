---
id: 008
title: Adopt pass misleading zero adopted count
severity: P1
area: workflow
source: init adopt reporting investigation
status: completed
created: 2026-06-07
files:
  - scripts/setup-skills.js
  - scripts/kenmark-packs.js
  - scripts/skills-adopt.js
  - scripts/kenmark-hub.js
related:
  - 001
---

## Summary

`init` / `setup` / `install-recommended` log `Adopt pass: 0 adopted/updated of N candidate(s)` when all catalog skills already exist in `~/.kenmark/store`. The counter only counts `action === "adopted"`, not `store-current`. The `store-current` path still runs `processSkillPortability` (IDE anchor rewrites, cwd-relative script repair), so users believe init did nothing when packs were skipped as already installed.

## Evidence

- `kenmark-hub.js` `adoptCatalogSkills`: when store hash matches source, pushes `action: "store-current"` after `processSkillPortability(storePath, name)`.
- `setup-skills.js` and `kenmark-packs.js` filter only `r.action === "adopted"` for the summary line.
- Observed log: `Adopt pass: 0 adopted/updated of 39 candidate(s)` despite portability repairs on all 39 skills.

## Suggested fix

- Add shared adopt-result summarizer in `kenmark-hub.js`.
- Report separately: adopted, portability-refreshed (`store-current`), review-required, skipped.
- Example: `Adopt pass: 0 adopted, 39 portability-refreshed of 39 candidate(s)`.

## Out of scope (noted)

- **`review-required` skips portability:** When store and source differ without `--adopt-overwrite`, adopt bails before `processSkillPortability`. Fixing would require running portability on the store copy even when content review is needed — only if a small, safe change.
- **`init`/`setup --force` not forwarded to adopt:** `setup-skills.js` passes `force: false` into `adoptCatalogSkills`. Propagating `--force` would change overwrite semantics; defer unless trivial.

## Acceptance criteria

- [x] Adopt summary counts `store-current` as portability-refreshed (not adopted).
- [x] `setup`, `kenmark-packs`, and `adopt` commands use consistent messaging.
- [x] Review-required and skipped counts still surfaced when non-zero.
- [x] Tests cover summarizer; `npm test` and `test:portability` pass.
- [x] `brain/kb/` and changelogs updated.

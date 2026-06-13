---
id: 010
title: Legacy cleanup deletes canonical bundled kenmark-* skills
severity: P0
area: cli
source: cleanup verification
status: completed
created: 2026-06-08
completed: 2026-06-13
files:
  - scripts/kenmark-hub.js
  - scripts/test-legacy-cleanup-canonical.js
related:
  - 009
---

## Summary

`listLegacyKenmarkSkillPaths()` treats canonical bundled skill names as legacy when the rename target equals `kenmark-${old}` in `LEGACY_SKILL_RENAMES`. Init/setup legacy cleanup then deletes active store and IDE skills (e.g. `kenmark-troubleshoot`, `kenmark-issues-setup`).

## Evidence

- `LEGACY_SKILL_RENAMES.troubleshoot` is `kenmark-troubleshoot`; legacy list also includes `kenmark-troubleshoot`.
- `removeLegacyKenmarkInstalls` runs during `installKenmarkSkillsToStoreWithLegacyCleanup` on init/setup.
- Seven skills wrongly removed in verification: kenmark-troubleshoot, kenmark-repo-hygiene, kenmark-issues-setup, and issues list/check/scan/fix-and-ship paths.

## Suggested fix

- When building legacy paths, omit `kenmark-${old}` when it equals `LEGACY_SKILL_RENAMES[old]`.
- Keep intermediate stale paths like `kenmark-init-brain` (canonical is `kenmark-init`).

## Acceptance criteria

- [x] `listLegacyKenmarkSkillPaths()` excludes canonical bundled names.
- [x] Init/store install followed by legacy cleanup retains bundled skills.
- [x] `npm test` passes.
- [x] `brain/kb/` and CHANGELOG updated.

## Resolution

`listLegacyKenmarkSkillPaths()` skips `kenmark-${old}` when it equals the canonical rename target. `scripts/test-legacy-cleanup-canonical.js` regression test passes.

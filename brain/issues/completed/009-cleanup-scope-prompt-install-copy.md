---
id: 009
title: Cleanup scope prompt reuses install wording
severity: P2
area: cli
source: user feedback
status: completed
created: 2026-06-08
completed: 2026-06-13
files:
  - scripts/interactive.js
  - scripts/kenmark-cleanup.js
  - scripts/test-interactive-scope-prompt.js
related:
  - 001
---

## Summary

Interactive `cleanup` calls shared `promptScope`, which always asks "Where should skills be installed?" — misleading for a removal/hygiene command.

## Evidence

- `kenmark-cleanup.js` uses `promptScope(mode)` when stdin is a TTY.
- `interactive.js` hard-coded install copy for all callers.

## Suggested fix

- Parameterize `promptScope` by purpose (`install` vs `cleanup`).
- Pass `{ purpose: "cleanup" }` from cleanup only; install/setup/update/packs/adopt keep install copy.
- Add unit test for prompt strings.

## Acceptance criteria

- [x] Cleanup wizard asks where cleanup should run, not where skills should be installed.
- [x] Init/setup/update/packs/adopt prompts unchanged.
- [x] `npm test` passes.
- [x] `brain/kb/` updated.

## Resolution

Global-only refactor removed interactive scope prompts; cleanup hardcodes `mode = "global"`. `getScopePromptLines("cleanup")` provides cleanup-specific copy; `test-interactive-scope-prompt.js` asserts install vs cleanup strings.

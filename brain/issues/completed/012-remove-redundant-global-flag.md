---
id: 012
title: Remove redundant --global flag from CLI
severity: P2
area: dx
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-13
completed: 2026-06-13
files:
  - scripts/interactive.js
  - scripts/cli.js
  - scripts/setup-skills.js
  - scripts/kenmark-setup.js
  - scripts/kenmark-packs.js
  - scripts/kenmark-update.js
  - scripts/skills-adopt.js
  - scripts/kenmark-cleanup.js
related:
  - 002
---

## Summary

Installs are global-only; `--global` is redundant. Remove it from help, docs, and examples. Strip deprecated `--global` / `--scope global` silently for backward compatibility.

## Acceptance criteria

- [x] CLI help and SKILL examples omit `--global`
- [x] Internal spawns do not pass `--global`
- [x] Legacy scripts passing `--global` still work (silently ignored)
- [x] `npm test` passes

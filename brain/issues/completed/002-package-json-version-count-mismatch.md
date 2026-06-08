---
id: 002
title: package.json version 2.2.0 and skill count mismatch
severity: P0
area: dx
source: kenmark-issues-scan
status: completed
created: 2026-06-07
completed: 2026-06-07
files:
  - package.json
related:
  - 003
  - 004
---

## Summary

The npm package version remains `2.2.0` while 36 bundled skills exist (including `kenmark-issues-fix-and-ship`). The `package.json` description still referenced 35 universal Kenmark agent skills, causing `npm run validate` skill-count checks to fail against the on-disk 36 `SKILL.md` directories.

## Evidence

- `package.json` — `"version": "2.2.0"` and description contained `35 universal Kenmark agent skills`
- `skills/user-skills/` — 36 directories with `SKILL.md` (including `kenmark-issues-fix-and-ship`)

## Suggested fix

1. Bump `package.json` version to `2.3.0`.
2. Update description to `36 universal Kenmark agent skills...`.

## Acceptance criteria

- [ ] `package.json` version is `2.3.0`
- [ ] `package.json` description says `36 universal Kenmark agent skills`
- [ ] `npm run validate` skill-count check passes

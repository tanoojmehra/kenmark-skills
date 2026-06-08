---
id: 004
title: CHANGELOG unreleased section needs v2.3.0 release entry
severity: P1
area: docs
source: kenmark-issues-scan
status: completed
created: 2026-06-07
completed: 2026-06-07
files:
  - CHANGELOG.md
related:
  - 002
  - 003
---

## Summary

The `## Unreleased` section documents `kenmark-issues-fix-and-ship` and the 36-skill count but version metadata remains at 2.2.0. The unreleased notes should become a dated `## v2.3.0` release section with an empty `## Unreleased` above it.

## Evidence

- `CHANGELOG.md` — `## Unreleased` contains fix-and-ship 1.1.0 and skill count 36 notes
- `package.json` — still `2.2.0` at time of audit

## Suggested fix

1. Move unreleased content into `## v2.3.0 — Issues fix-and-ship orchestrator`.
2. Leave `## Unreleased` empty (or with no substantive entries).

## Acceptance criteria

- [ ] `## v2.3.0` section exists with fix-and-ship and docs entries
- [ ] `## Unreleased` is empty above v2.3.0

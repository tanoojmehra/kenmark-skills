---
id: 023
title: Node 24 EISDIR symlink compatibility bug
severity: P1
area: cli
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-07-04
completed: 2026-07-04
files:
  - scripts/kenmark-hub.js
related: []
---

## Summary

On Node v24.9.0, `fs.rmSync(path, { force: true })` on a symlink-to-directory throws `ERR_FS_EISDIR` instead of removing the symlink. This causes installer crashes during "Adopt catalog skills" deduplication step.

## Evidence

Installer output:
```
Path is a directory: /Users/adnanbaig/.gemini/skills/graphify
```
Which is thrown by `fs.rmSync` inside `removePathIfExists` (in `scripts/kenmark-hub.js`).

## Suggested fix

Use `fs.unlinkSync(targetPath)` for symbolic links in `removePathIfExists`.

## Acceptance criteria

- [x] `removePathIfExists` unlinks symbolic links instead of calling `rmSync`.
- [x] No regression on older Node.js versions.

---
id: 005
title: Add TodoWrite to kenmark-issues-fix-and-ship allowed-tools
severity: P2
area: workflow
source: kenmark-issues-scan
status: completed
created: 2026-06-07
completed: 2026-06-07
files:
  - skills/user-skills/kenmark-issues-fix-and-ship/SKILL.md
related: []
---

## Summary

The `kenmark-issues-fix-and-ship` orchestrator skill manages multi-step workflows but does not list `TodoWrite` in `allowed-tools`, limiting agents from tracking phase progress during end-to-end issue fix-and-ship runs.

## Evidence

- `skills/user-skills/kenmark-issues-fix-and-ship/SKILL.md` — `allowed-tools` lists Bash, Read, Write, Edit, Grep, Glob, AskUserQuestion but not TodoWrite

## Suggested fix

Add `TodoWrite` to the `allowed-tools` frontmatter list.

## Acceptance criteria

- [ ] `TodoWrite` appears in `allowed-tools` frontmatter

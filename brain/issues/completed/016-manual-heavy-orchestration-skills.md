---
id: "016"
title: Make heavy orchestration skills manual-only
severity: P1
area: skills
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-15
completed: 2026-06-15
files:
  - skills/user-skills/kenmark-subagents/SKILL.md
  - skills/user-skills/kenmark-audit-loop/SKILL.md
  - skills/user-skills/kenmark-plans-execute/SKILL.md
  - skills/user-skills/kenmark-issues-fix-and-ship/SKILL.md
  - skills/user-skills/kenmark-commit/SKILL.md
  - skills/user-skills/kenmark-init/SKILL.md
related: []
---

# Make heavy orchestration skills manual-only

## Problem

Ship/orchestration skills auto-load on broad intent despite write/git/destructive potential.

## Acceptance criteria

- [ ] `disable-model-invocation: true` on listed skills
- [ ] Narrowed descriptions and triggers where specified
- [ ] `kenmark-init` drops broad triggers like "project standards"

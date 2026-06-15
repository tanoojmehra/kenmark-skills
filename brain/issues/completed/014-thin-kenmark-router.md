---
id: "014"
title: Thin kenmark-router and make manual-only
severity: P0
area: skills
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-15
completed: 2026-06-15
files:
  - skills/user-skills/kenmark-router/SKILL.md
  - skills/user-skills/kenmark-router/references/routing-policy.md
  - skills/user-skills/kenmark-router/references/registry-bootstrap.md
related: []
---

# Thin kenmark-router and make manual-only

## Problem

Router body embeds full registry bootstrap script and routing tables, loading heavy context for skill selection.

## Acceptance criteria

- [ ] `disable-model-invocation: true` with explicit triggers only
- [ ] Heavy content moved to `references/`
- [ ] SKILL.md is a thin 5-step workflow

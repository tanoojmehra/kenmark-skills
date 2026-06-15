---
id: "019"
title: Make kenmark-plan manual-only with explicit durable triggers (Option B)
severity: P0
area: skills
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-15
completed: 2026-06-15
files:
  - skills/user-skills/kenmark-plan/SKILL.md
  - skills/user-skills/kenmark-router/SKILL.md
related: []
---

# Make kenmark-plan manual-only (Option B)

## Problem

`kenmark-plan` is auto-invokable with broad triggers and always writes `brain/plans/`, reintroducing the original usage hotspot.

## Acceptance criteria

- [ ] `disable-model-invocation: true`
- [ ] Narrow triggers to explicit durable planning only
- [ ] Router/docs no longer list `kenmark-plan` as core auto skill

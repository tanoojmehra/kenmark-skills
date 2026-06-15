---
id: "013"
title: Split kenmark-plan into plan-lite and plan-durable
severity: P0
area: skills
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-15
completed: 2026-06-15
files:
  - skills/user-skills/kenmark-plan-lite/SKILL.md
  - skills/user-skills/kenmark-plan-durable/SKILL.md
  - skills/user-skills/kenmark-plan-durable/references/persist-plan.md
related: []
---

# Split kenmark-plan into plan-lite and plan-durable

## Problem

`kenmark-plan` is auto-invokable, write-capable, and triggers on broad phrases ("think hard", "roadmap"). Casual planning loads durable `brain/plans/` persistence every time.

## Acceptance criteria

- [ ] `kenmark-plan-lite` — chat-level plans, read-only tools, auto-invokable
- [ ] `kenmark-plan-durable` — writes `brain/plans/`, manual invocation only
- [ ] Step 7 persistence logic preserved in `references/persist-plan.md`
- [ ] `kenmark-plan` removed; docs and validate updated

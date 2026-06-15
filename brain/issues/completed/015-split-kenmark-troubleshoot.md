---
id: "015"
title: Split kenmark-troubleshoot default vs deep
severity: P0
area: skills
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-15
completed: 2026-06-15
files:
  - skills/user-skills/kenmark-troubleshoot/SKILL.md
  - skills/user-skills/kenmark-troubleshoot-deep/SKILL.md
related: []
---

# Split kenmark-troubleshoot default vs deep

## Problem

Default troubleshoot allows Task, WebSearch, WebFetch, and write risk — too heavy for routine diagnosis.

## Acceptance criteria

- [ ] Default skill is read-only, local-first, evidence + hypothesis tree
- [ ] `kenmark-troubleshoot-deep` holds sub-agent, research, artifact sections
- [ ] Deep skill is manual-only

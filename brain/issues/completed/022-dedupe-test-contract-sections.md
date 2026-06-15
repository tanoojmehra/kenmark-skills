---
id: "022"
title: Remove duplicated testing contract sections from kenmark-test skills
severity: P2
area: skills
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-15
completed: 2026-06-15
files:
  - skills/user-skills/kenmark-test-*/SKILL.md
related: []
---

# Dedupe test skill bodies

## Acceptance criteria

- [ ] Each `kenmark-test-*` references `skills/shared/testing-contract.md` only
- [ ] Duplicate package-manager and safety blocks removed from skill bodies

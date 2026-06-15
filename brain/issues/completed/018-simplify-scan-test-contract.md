---
id: "018"
title: Rename simplify-scan and extract shared testing contract
severity: P2
area: skills
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-15
completed: 2026-06-15
files:
  - skills/user-skills/kenmark-simplify-scan/SKILL.md
  - skills/shared/testing-contract.md
related: []
---

# Rename simplify-scan and extract shared testing contract

## Problem

`kenmark-simplify` collides with "simplify this code"; test skills repeat package-manager rules.

## Acceptance criteria

- [ ] `kenmark-simplify-scan` with manual invocation and narrow triggers
- [ ] Shared `skills/shared/testing-contract.md` referenced by `kenmark-test-*`
- [ ] E2E and CI test skills manual-only

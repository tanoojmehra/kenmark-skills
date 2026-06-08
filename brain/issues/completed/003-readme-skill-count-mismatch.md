---
id: 003
title: README skill count references still say 35
severity: P0
area: docs
source: kenmark-issues-scan
status: completed
created: 2026-06-07
completed: 2026-06-07
files:
  - README.md
related:
  - 002
---

## Summary

`README.md` still documented 35 first-party Kenmark skills in multiple places (overview, CLI table, init vs setup table, repository layout tree) while `skills/README.md` and on-disk bundles already reflect 36 skills.

## Evidence

- `README.md` — `**35 first-party skills**`, table `| Kenmark skills | 35 |`, `Install 35 Kenmark skills`, init vs setup `| 35 Kenmark skills |`, repo tree `# 35 universal skills`
- `skills/README.md` — `bundled universal skills (36)`

## Suggested fix

Update all README skill-count references from 35 to 36.

## Acceptance criteria

- [ ] All README skill-count patterns match 36
- [ ] `npm run validate` README skill-count checks pass

---
id: 001
title: Replace Awesome Code Review with Simplify in recommended catalog
severity: P1
area: workflow
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-13
completed: 2026-06-13
files:
  - skills/user-skills/recommended-catalog.json
  - skills/user-skills/kenmark-setup/SKILL.md
  - skills/user-skills/kenmark-packs/SKILL.md
  - brain/kb/features/004-recommended-packs.md
  - brain/kb/07-features.md
  - brain/kb/05-api-and-integrations.md
  - brain/kb/11-known-risks-and-decisions.md
  - README.md
  - scripts/test-packs-verify-skip.js
related: []
---

## Summary

Swap the default recommended pack from Awesome Code Review (`code-review-skill`, git-sync) to Brian Lovin's **Simplify** skill (`brianlovin/claude-config`, npx skills CLI).

## Evidence

- `skills/user-skills/recommended-catalog.json` defaults to `code-review-skill` (Awesome Code Review).
- User request: remove Awesome Code Review from recommended defaults and add Simplify via `npx -y skills add brianlovin/claude-config --skill simplify`.

## Suggested fix

1. Replace `code-review-skill` pack with `simplify` in catalog v6.
2. Update presets, defaults, and docs referencing `code-review-skill`.
3. Update pack verify/adopt test to use `simplify`.

## Acceptance criteria

- [x] Catalog defaults select `impeccable` + `simplify`.
- [x] `code-review-skill` pack removed from catalog.
- [x] Docs and skill references updated.
- [x] `npm run validate` and `npm run test:packs-verify` pass.

---
id: 002
title: Remove project scope; global-only Kenmark installs
severity: P1
area: workflow
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-13
completed: 2026-06-13
files:
  - scripts/setup-skills.js
  - scripts/kenmark-setup.js
  - scripts/kenmark-packs.js
  - scripts/kenmark-update.js
  - scripts/skills-adopt.js
  - scripts/kenmark-cleanup.js
  - scripts/interactive.js
  - scripts/cli.js
  - scripts/validate-repo.js
  - skills/user-skills/recommended-catalog.json
related:
  - 001
---

## Summary

Kenmark-skills is global-only. Remove project scope from CLI, catalog pack installs, and docs. Error on `--project` / `--scope project`.

## Evidence

- CLI commands accept `--project` and interactive scope prompts (global vs project).
- Catalog packs define `install.project` blocks alongside `install.global`.
- User: project-based installation "sucks"; default and only path should be global.

## Global install audit (recommended packs)

| Pack | Global install | Action |
| --- | --- | --- |
| impeccable | `npx skills add pbakaus/impeccable -g -y` | Keep |
| simplify | `npx skills add brianlovin/claude-config -g -y -s simplify` | Keep |
| graphify | `uv tool install graphifyy && graphify install` | Keep |
| seo-geo-selected | `npx skills add … -g -y -s <skills>` | Keep |
| seo-geo-full | `npx skills add … -g -y` | Keep |
| ecc | Manual global Claude config | Keep |

No packs removed — all support global install.

## Suggested fix

1. Reject `--project` in all CLI entrypoints.
2. Remove scope prompts; always use global targets.
3. Catalog v7: global install/verify metadata only.
4. Update tests and KB.

## Acceptance criteria

- [x] `--project` exits with clear error on setup/init/packs/adopt/update/cleanup
- [x] No interactive scope prompt
- [x] Catalog packs have global install only
- [x] `npm run validate` and `npm test` pass

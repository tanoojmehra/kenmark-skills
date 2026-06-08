---
id: 001
title: Catalog skill path portability / Impeccable adoption bug
severity: P0
area: dx
source: kenmark-issues-scan
status: completed
created: 2026-06-07
completed: 2026-06-07
files:
  - scripts/kenmark-hub.js
  - scripts/skills-adopt.js
  - scripts/setup-skills.js
  - scripts/kenmark-packs.js
  - scripts/test-skill-portability.js
  - scripts/doctor.js
related: []
---

## Summary

Adopted third-party catalog skills (e.g., `impeccable`) are failing to run after installation/adoption because they contain hardcoded relative paths that assume they are located within a `.agents/skills/<skill-name>` directory structure. Once Kenmark moves them to the canonical store (`~/.kenmark/store/skills`) and links them to the IDE skill folders, these paths break.

## Evidence

In Claude Code, the skill is loaded from `~/.claude/skills/impeccable`, but the skill attempts to run a script at:
`~/.claude/skills/impeccable/.agents/skills/impeccable/scripts/context.mjs`

This indicates the `SKILL.md` possesses a hardcoded path like `node .agents/skills/impeccable/scripts/context.mjs` instead of being relative to the skill root.

## Suggested fix

1. Update the installation and adoption logic to detect and rewrite broken nested paths if they match the catalog skill pattern.
2. Implement a `resolveSkillRoot` helper to ensure scripts are executed relative to the actual installed skill directory.
3. Add a validation/doctor check (`npx kenmark-skills doctor`) to detect and suggest repairs for broken installations.
4. Implement a repair mode in `npx kenmark-skills adopt` to replace stale/broken copies with symlinks to the canonical store.

## Acceptance criteria

- [x] `impeccable` and other catalog skills run correctly after adoption into any IDE target (Claude, Cursor, Codex).
- [x] No nested `.agents/skills/<name>` paths are required or assumed in the installed version.
- [x] `npx kenmark-skills doctor` identifies broken catalog skill paths.
- [x] `npx kenmark-skills adopt --symlink` repairs broken copies.

## Resolution

- `normalizeSkillPaths` / `processSkillPortability` rewrite `.agents/.cursor/.claude/skills/<name>/` to `./` in `SKILL.md` and `scripts/*.{js,mjs}` on store copy (setup, adopt) and on existing store copies during adopt (`store-current` repair).
- `resolveSkillRoot` resolves skill directory from symlinks or nested paths.
- `runDoctor` scans store and non-symlinked IDE copies for non-portable paths; suggests `npx kenmark-skills adopt --global --ide all -y`.
- `adopt --symlink` relinks broken IDE copies to normalized store content.
- `test:portability` regression tests cover normalization, adopt repair, and doctor scan helpers.

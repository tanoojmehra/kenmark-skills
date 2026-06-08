---
id: 007
title: Impeccable setup scripts fail when run from consumer project CWD
severity: P0
area: dx
source: kenmark-issues-fix-and-ship
status: completed
created: 2026-06-07
completed: 2026-06-07
files:
  - scripts/kenmark-hub.js
  - scripts/test-skill-portability.js
  - scripts/doctor.js
related:
  - 001
---

## Summary

After issue 001 normalized IDE anchor paths to `./scripts/`, agents still fail when running impeccable setup commands from a consumer project root (e.g. `kenmark-studio`). Shell commands resolve `./scripts/context.mjs` against the project CWD, not the skill directory, producing `Cannot find module .../scripts/context.mjs`.

## Evidence

User report: impeccable page-by-page audit failed at setup when agent ran:

```bash
cd /Users/tsmehra/Development/kenmark-studio && node ./scripts/context.mjs
```

Error: `Cannot find module '/Users/tsmehra/Development/kenmark-studio/scripts/context.mjs'`

The script exists at `~/.claude/skills/impeccable/scripts/context.mjs` (and `~/.kenmark/store/skills/impeccable/scripts/context.mjs`).

Impeccable `SKILL.md` Setup step 1 instructs: `` Run `node ./scripts/context.mjs` `` — five similar invocations in SKILL.md.

## Suggested fix

During catalog skill adopt / portability repair, rewrite agent-facing `node ./scripts/<file>` invocations in `SKILL.md` (and `reference/*.md`) to absolute store-resolved paths so agents can run them from any project CWD.

Extend doctor to flag remaining cwd-relative script invocations in store/IDE copies.

## Acceptance criteria

- [x] After adopt, impeccable `SKILL.md` uses absolute script paths resolvable from any consumer project CWD.
- [x] `node <resolved-path>/context.mjs` works when run from a project without local `scripts/context.mjs`.
- [x] Doctor reports cwd-relative `node ./scripts/` patterns in catalog skills.
- [x] `test:portability` covers cwd-relative rewrite.

## Resolution

- `normalizeCwdRelativeScripts` / `buildAbsoluteSkillScriptCommand` rewrite `node ./scripts/*.mjs` in `SKILL.md` and `reference/*.md` during `processSkillPortability` (setup/adopt and `store-current` repair).
- Handles markdown backtick-wrapped commands and bare invocations; preserves CLI args.
- `scanSkillForNonPortablePaths` / `runDoctor` flag remaining cwd-relative script invocations.
- `test:portability` regression tests cover backtick and bare forms.

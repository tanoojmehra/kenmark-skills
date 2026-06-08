---
id: 011
title: Gemini CLI skill conflict warnings from duplicate Codex/Gemini links
severity: P1
area: dx
source: user-report
status: completed
created: 2026-06-08
completed: 2026-06-08
files:
  - scripts/kenmark-hub.js
  - scripts/setup-skills.js
  - scripts/kenmark-packs.js
  - scripts/skills-adopt.js
  - scripts/test-gemini-codex-dedupe.js
related: []
---

## Summary

When both Codex and Gemini were selected during `init`/`setup`, Kenmark linked every skill into `~/.agents/skills` and `~/.gemini/skills`. Gemini CLI treats those paths as aliases and printed a conflict warning for each skill on every startup.

## Evidence

Gemini CLI v0.45.2 startup (representative):

```
Skill conflict detected: "kenmark-init" from "/Users/.../.agents/skills/kenmark-init/SKILL.md"
is overriding the same skill from "/Users/.../.gemini/skills/kenmark-init/SKILL.md".
```

Repeated for all bundled Kenmark skills and recommended packs (~39 warnings).

## Suggested fix

- When both `codex` and `gemini` are in `--ide`, link once to `~/.agents/skills`.
- Prune Kenmark-managed duplicates from `~/.gemini/skills` when the same skill exists in `~/.agents/skills`.
- Doctor soft-warning for remaining duplicates.

## Acceptance criteria

- [x] `setup --ide codex,gemini` links skills only under `~/.agents/skills`.
- [x] `setup --ide gemini` alone still links under `~/.gemini/skills`.
- [x] Re-run setup removes existing Kenmark duplicates from `~/.gemini/skills`.
- [x] Regression test `scripts/test-gemini-codex-dedupe.js`.

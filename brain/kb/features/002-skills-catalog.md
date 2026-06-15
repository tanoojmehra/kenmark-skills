# Bundled skills catalog

Last updated: 2026-06-07
Status: reviewed

## Summary

**43** universal Kenmark skills in `skills/user-skills/<name>/SKILL.md`. Logical categories via YAML frontmatter — flat on-disk layout.

## Categories

| Category | Examples |
| --- | --- |
| onboarding | `kenmark-init`, `kenmark-setup` |
| workflow | `kenmark-router`, `kenmark-plan`, `kenmark-troubleshoot`, `kenmark-repo-*`, `kenmark-security-review`, `kenmark-performance` |
| testing | `kenmark-test-plan`, `kenmark-test-unit`, … `kenmark-test-ci` |
| git | `kenmark-commit` |
| issues | `kenmark-issues-setup`, … `kenmark-issues-fix-and-ship`, `kenmark-audit-loop`, `kenmark-simplify` |
| plans | `kenmark-plans-setup`, `kenmark-plan`, … `kenmark-plans-execute` |
| admin | `kenmark-packs`, `kenmark-update`, `kenmark-maintain`, `kenmark-agents` |

Full logical map: `skills/README.md`.

## Activation tiers

Policy for **kenmark-router** and humans — all skills remain installed; tiers describe invocation frequency.

### Core daily

May use freely: `kenmark-router`, `kenmark-troubleshoot`, `kenmark-plan`, `kenmark-output`, `kenmark-init`, `kenmark-repo-quality`, `kenmark-repo-secrets`, `kenmark-repo-public`, `kenmark-repo-kb`, `kenmark-commit`, `kenmark-maintain`, `kenmark-security-review`, `kenmark-performance`.

### Specialist

Use when task clearly matches: `kenmark-subagents`, `kenmark-repo-docs`, `kenmark-repo-structure`, `kenmark-repo-deps`, `kenmark-repo-release`, `kenmark-repo-hygiene`, all `kenmark-test-*`, all `kenmark-issues-*`, all `kenmark-plans-*`.

### Explicit admin

User must ask: `kenmark-setup`, `kenmark-packs`, `kenmark-update`, `kenmark-agents`.

## Using skills in chat

1. Confirm skill folder is on agent search path (after `init`).
2. Name skill or trigger phrase — agent must **read full SKILL.md**.
3. Unclear problems → **kenmark-troubleshoot** first, not router.

## Maintenance

Add row to `skills/README.md` and bump skill frontmatter `version` when behavior changes.

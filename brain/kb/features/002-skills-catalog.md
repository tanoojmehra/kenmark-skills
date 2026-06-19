# Bundled skills catalog

Last updated: 2026-06-07
Status: reviewed

## Summary

**39** universal Kenmark skills in `skills/user-skills/<name>/SKILL.md`. Logical categories via YAML frontmatter — flat on-disk layout.

## Categories

| Category | Examples |
| --- | --- |
| onboarding | `kenmark-init`, `kenmark-setup` |
| workflow | `kenmark-plan`, `kenmark-troubleshoot`, `kenmark-repo-*`, `kenmark-security-review`, `kenmark-performance` |
| testing | `kenmark-test-plan`, `kenmark-test-unit`, … `kenmark-test-ci` |
| git | `kenmark-commit` |
| issues | `kenmark-issues-scan`, `kenmark-audit-loop`, `kenmark-issues-fix-and-ship` |
| plans | `kenmark-plan`, `kenmark-plans-execute` |
| admin | `kenmark-update`, `kenmark-skills-maintain`, `kenmark-agents` |

Full logical map: `skills/README.md`.

## Activation tiers

Policy for **kenmark-router** and humans — all skills remain installed; tiers describe invocation frequency.

### Core daily

May use freely: `kenmark-troubleshoot`, `kenmark-output`, `kenmark-tracker-list`, `kenmark-repo-quality`, `kenmark-repo-secrets`, `kenmark-repo-public`, `kenmark-kb-sync`, `kenmark-skills-maintain`, `kenmark-security-review`, `kenmark-performance`.

### Specialist

Use when task clearly matches: `kenmark-subagents`, `kenmark-repo-docs`, `kenmark-repo-deps`, `kenmark-repo-release`, `kenmark-repo-hygiene`, all `kenmark-test-*`, `kenmark-issues-scan`, `kenmark-audit-loop`, `kenmark-issues-fix-and-ship`, `kenmark-plan`, `kenmark-plans-execute`, `kenmark-tracker-setup`, `kenmark-tracker-check`, `kenmark-tracker-maintain`.

### Explicit admin

User must ask: `kenmark-setup`, `kenmark-update`, `kenmark-agents`.

## Using skills in chat

1. Confirm skill folder is on agent search path (after `init`).
2. Name skill or trigger phrase — agent must **read full SKILL.md**.
3. Unclear problems → **kenmark-troubleshoot** first, not router.

## Maintenance

Add row to `skills/README.md` and bump skill frontmatter `version` when behavior changes.

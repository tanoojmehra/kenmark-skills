---
name: kenmark-router
version: 1.1.0
category: workflow
scope: universal
phase: discover
description: "Manual skill router. Use only when the user explicitly asks which Kenmark skill fits, or when no obvious specialist skill matches. Prefer direct specialist skills when intent is clear."
triggers:
  - kenmark-router
  - which skill should we use
  - pick the right skill
  - route skill
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: true
---

# Kenmark Router

Manual router — use only when the user explicitly asks which skill fits.

## Workflow

1. Parse user intent: domain, phase, stack, risk.
2. Refresh or read `~/.kenmark/cache/skills-registry.json` (see `references/registry-bootstrap.md`).
3. Score candidates using `references/routing-policy.md`.
4. Pick the narrowest matching skill.
5. Do not route to admin/ship/destructive skills unless explicitly requested.

Then read the winner's `SKILL.md` and follow it.

## Skill activation tiers (summary)

**Core auto skills (prefer for broad work):** `kenmark-plan-lite`, `kenmark-troubleshoot`, `kenmark-output`, `kenmark-repo-quality`, `kenmark-repo-secrets`, `kenmark-repo-public`, `kenmark-security-review`, `kenmark-performance`.

**Specialist (clear intent only):** `kenmark-subagents`, `kenmark-repo-*`, `kenmark-test-*`, `kenmark-issues-*`, `kenmark-plans-*`.

**Explicit admin (never auto):** `kenmark-setup`, `kenmark-packs`, `kenmark-update`, `kenmark-agents`.

**Manual heavy workflows:** `kenmark-router`, `kenmark-plan-durable`, `kenmark-troubleshoot-deep`, `kenmark-plans-execute`, `kenmark-issues-fix-and-ship`, `kenmark-commit`, `kenmark-init`, `kenmark-audit-loop`.

## Recommended flow

| Situation | Skill |
| --- | --- |
| Unclear problem | **`kenmark-troubleshoot`** |
| Chat-level plan | **`kenmark-plan-lite`** |
| Durable plan in `brain/plans/` | **`kenmark-plan-durable`** (explicit) |
| Complete deliverables | **`kenmark-output`** |
| Parallel tracks | **`kenmark-subagents`** (explicit) |
| Ship commits | **`kenmark-commit`** (explicit) |

## Output format

```markdown
**Routed skill:** `<name>` (<category>, <phase>, risk:<risk>)
**Why:** <one sentence>
**Next:** <first step from that skill>
```

## References

- `references/registry-bootstrap.md` — cache generation script
- `references/routing-policy.md` — scoring algorithm and tie-break rules

## Maintenance

Refresh bundled skills via `npx kenmark-skills setup` / `update`. Registry cache regenerates on each router invocation.

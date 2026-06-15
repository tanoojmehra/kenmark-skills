---
name: kenmark-plan
version: 1.3.0
category: plans
scope: universal
phase: plan
description: "Manual durable planning workflow that writes indexed plan files to brain/plans/ and updates INDEX.md. Use only when the user explicitly asks to create/save a plan in brain/plans or invoke kenmark-plan."
triggers:
  - kenmark-plan
  - create plan file
  - save plan
  - brain/plans
  - durable plan
  - source of truth plan
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - TodoWrite
  - AskUserQuestion
risk: write-files
disable-model-invocation: true
---

# Kenmark Plan

## Purpose

Use this skill when the user wants a plan before execution.

This skill:

- asks which **plan tier** to use (unless already clear from the request)
- inspects repo context at tier-appropriate depth
- produces a tier-scaled execution plan
- **always writes a durable plan file** to `brain/plans/` and updates `INDEX.md` (no chat-only plans)

This skill does **not** implement by default. Use **`kenmark-plans-execute`** to implement an approved plan.

---

## Core principle

```text
Tier → Frame → Inspect → Options → Risks → Plan → Persist → Proceed
```

Do not jump straight to implementation unless the user explicitly asks.

---

## Step 0 — Preconditions

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
PLANS_DIR="$REPO_ROOT/brain/plans"
test -f "$PLANS_DIR/INDEX.md" || echo "STOP: run kenmark-plans-setup or kenmark-init first"
```

If `brain/plans/INDEX.md` is missing, run **`kenmark-plans-setup`** (or **`kenmark-init`**) before creating plan files.

---

## Step 1 — Choose plan tier

Ask the user unless the tier is already explicit in the request.

Use **AskUserQuestion** with these five options:

| Option | Label | When |
| --- | --- | --- |
| 1 | **Quick** | Small, clear scope; bugfix-sized |
| 2 | **Prototype** | Spike, POC, timeboxed experiment |
| 3 | **Full Feature** | Normal feature or change |
| 4 | **Dig Deep** | Architecture, migration, high-risk or unclear work |
| 5 | **ULTRATHINK** | Production-critical, multi-system, long-term source of truth |

**Trigger inference** (skip Ask when obvious):

| User says | Tier |
| --- | --- |
| `quick`, `small`, `just fix` | quick |
| `prototype`, `spike`, `POC` | prototype |
| `ultrathink`, `think deeply`, `source of truth` | ultrathink |
| `dig deep`, `think hard`, `architecture`, `migration` | dig-deep |
| `full feature`, normal feature work | full-feature |

Store tier as frontmatter value: `quick`, `prototype`, `full-feature`, `dig-deep`, `ultrathink`.

---

## Step 2 — Tier depth contract

| Tier | Inspection | Options | Plan sections |
| --- | --- | --- | --- |
| **quick** | Light (`git status`, key files) | Skip — recommend one path | Goal, 3–7 steps, top risks, 1–2 verification commands |
| **prototype** | Moderate | 1–2 brief options | MVP scope, timebox, spike phases, throwaway vs keep |
| **full-feature** | Thorough | 2+ options table | Full phased plan, files table, acceptance criteria |
| **dig-deep** | Deep | Options + tradeoffs + recommendation | Rollback, verification matrix, phased rollout |
| **ultrathink** | Maximum (+ WebSearch/Context7 when relevant) | Exhaustive options + rejected alternatives | All dig-deep sections + decision log, contingencies, subagent tracks, link `brain/kb/decisions/` |

All tiers must include at minimum: **Summary**, **Goal**, **Plan** (checklist), **Acceptance criteria**.

---

## Step 3 — Frame the request

Capture:

```markdown
## Planning frame

- Goal:
- Current state:
- Desired outcome:
- Scope:
- Constraints:
- Unknowns:
- Risk level:
- Time sensitivity:
- Plan tier: {tier}
```

Light inspection (all tiers):

```bash
git status --short
```

Higher tiers: read README, `brain/kb/`, package scripts, relevant source, tests, recent git changes, related issue/plan files.

---

## Step 4 — Determine planning type

| Type | Examples |
| --- | --- |
| `feature` | new module, UI, API, workflow |
| `refactor` | restructure, simplify, rename, migration |
| `debug` | failing build, runtime issue, bug |
| `architecture` | stack decisions, boundaries, system design |
| `release` | publish, deploy, version, changelog |
| `repo-maintenance` | hygiene, docs, quality gates |
| `agent-workflow` | skills, subagents, rules, automation |
| `unknown` | unclear or mixed request |

---

## Step 5 — Generate options (tier-gated)

| Tier | Options required? |
| --- | --- |
| quick | No — state recommended approach only |
| prototype | 1–2 brief options |
| full-feature | 2+ options in table |
| dig-deep | 2+ options + tradeoffs + recommendation |
| ultrathink | Exhaustive options + rejected alternatives in decision log |

Options table (when required):

```markdown
## Options

| Option | Summary | Pros | Cons | Risk | When to choose |
| --- | --- | --- | --- | --- | --- |
| A | ... | ... | ... | Low/Med/High | ... |
| B | ... | ... | ... | Low/Med/High | ... |

Recommended: Option A

Why:
- ...
```

---

## Step 6 — Produce the execution plan

Use tier-appropriate sections. Full-feature and above use:

```markdown
# Plan — {title}

## Summary

## Goal

## Current understanding

## Recommended approach

## Phased plan

### Phase 1 — Preparation / discovery
- [ ] ...

### Phase 2 — Implementation
- [ ] ...

### Phase 3 — Verification
- [ ] ...

### Phase 4 — Documentation / KB update
- [ ] ...

## Files likely involved

| File/area | Expected change |
| --- | --- |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |

## Acceptance criteria

- [ ] ...

## Commands/checks to run

## Open questions
```

**ultrathink** adds: **Decision log**, **Contingencies**, **Subagent tracks** (when parallel investigation helps), links to `brain/kb/decisions/`.

Every plan must answer:

```text
What should be done first?
What should not be touched?
How do we know it worked?
What could go wrong?
What is the rollback?
What docs/brain files should be updated?
```

---

## Step 7 — Persist plan file (mandatory)

Follow **`references/persist-plan.md`** exactly for ID ledger rules, collision checks, plan file frontmatter, and `INDEX.md` updates.

---

## Step 8 — Present to user

In chat, summarize:

1. Goal
2. Tier chosen
3. Recommended approach
4. Plan file path (`brain/plans/{id}-{slug}.md`)
5. Next step (approve plan → **`kenmark-plans-execute`**, or adjust tier)

---

## Output contract

A valid `kenmark-plan` response must include:

1. Plan tier
2. Goal
3. Current understanding
4. Recommended approach
5. Phased checklist (scaled to tier)
6. Risks (when tier ≥ prototype)
7. Acceptance criteria
8. Verification commands/checks
9. Written plan file path
10. Next step

---

## Safety rules

* Prefer read-only inspection first; write only plan files and INDEX updates.
* Do not hide assumptions.
* Do not over-plan when tier is **quick**.
* Do not skip risks for **dig-deep** or **ultrathink**.
* Do not pretend uncertain facts are confirmed.
* If the task is high-risk, include rollback and verification.

---

## Anti-patterns

* Do not implement while planning unless asked.
* Do not make a generic plan that ignores repo context.
* Do not ask 10 clarifying questions before giving value.
* Do not skip writing the plan file when INDEX exists.
* Do not calculate next ID from `brain/plans/` alone.

## Related skills

- **`kenmark-plans-setup`** — bootstrap tracker when `INDEX.md` missing
- **`kenmark-plans-list`** — view active plans dashboard
- **`kenmark-plans-execute`** — implement an approved plan
- **`kenmark-plans-check`** — verify acceptance criteria and archive
- **`kenmark-plans-maintain`** — fix INDEX drift

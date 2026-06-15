---
name: kenmark-plans-setup
version: 1.0.0
category: plans
scope: universal
phase: setup
description: "Bootstrap brain/plans/ documentation structure: create brain/plans/, brain/plans/completed/, and brain/plans/INDEX.md with ID ledger and templates. Not for authoring plans — use kenmark-plan to create plan files. Redundant if kenmark-init already bootstrapped plan tracking. Use when asked to \"setup plans\", \"init plans\", or \"bootstrap plans directory\"."
triggers:
  - setup plans
  - init plans
  - bootstrap plans directory
  - initialize plans
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
risk: write-files
disable-model-invocation: true
---

# Kenmark Plans Setup

## Purpose

Bootstrap the **`brain/plans/` documentation structure** from scratch — not author execution plans.

Creates:

- `brain/plans/` — active plans
- `brain/plans/completed/` — archived completed/superseded/cancelled plans
- `brain/plans/INDEX.md` — master index with ID ledger, status tables, and templates

**Not this skill:** creating plan content is **`kenmark-plan`**.

## Relationship to `kenmark-init`

- **`kenmark-init`** always creates empty `brain/plans/` and `brain/plans/completed/` dirs as part of the brain scaffold.
- During init (Step 1c), init runs **this skill's Steps 2–4** to write `INDEX.md` when missing.
- **If `brain/plans/INDEX.md` already exists** (from a prior init or this skill), stop — setup is complete; suggest **`kenmark-plan`** to create plans or **`kenmark-plans-list`** to view the tracker.

---

## Step 1 — Find or create the brain directory

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
PLANS_DIR="$REPO_ROOT/brain/plans"
COMPLETED_DIR="$PLANS_DIR/completed"
echo "REPO_ROOT=$REPO_ROOT"
echo "PLANS_DIR=$PLANS_DIR"
```

If `brain/` does not exist, create it:

```bash
mkdir -p "$PLANS_DIR" "$COMPLETED_DIR"
echo "Created: $PLANS_DIR and $COMPLETED_DIR"
```

If `brain/plans/INDEX.md` already exists:

```bash
[ -f "$PLANS_DIR/INDEX.md" ] && echo "SKIP: INDEX.md exists — setup already done"
```

Report to the user and stop (or offer **`kenmark-plan`** / **`kenmark-plans-list`**).

---

## Step 2 — Create the INDEX.md

Write `brain/plans/INDEX.md` with this exact structure:

```markdown
# Plans Index

## ID Ledger

| Field | Value |
|------|-------|
| Last Assigned ID | 000 |
| Next ID | 001 |

## Ledger Rules

- Plan IDs are global and immutable.
- IDs are never reused.
- Completed plans reserve their IDs forever.
- New plan IDs must be calculated from `INDEX.md`, active files, and completed files.
- Do not calculate next ID from `brain/plans/` alone.

## Overview

| Category | Count |
|----------|-------|
| Active plans | 0 |
| Completed | 0 |
| **Total** | **0** |

## Completed Plans

| ID | Title | Tier | Completed |
|----|-------|------|-----------|
| _none yet_ | | | |

## Active Plans by Status

### Proposed

| ID | Title | Tier |
|----|-------|------|
| _none_ | | |

### Approved

| ID | Title | Tier |
|----|-------|------|
| _none_ | | |

### In progress

| ID | Title | Tier |
|----|-------|------|
| _none_ | | |

## Plan Structure

Each plan file contains:

\`\`\`yaml
---
id: "XXX"
title: ...
tier: quick|prototype|full-feature|dig-deep|ultrathink
type: feature|refactor|debug|architecture|release|repo-maintenance|agent-workflow|unknown
status: proposed|approved|in-progress|done|superseded|cancelled
source: kenmark-plan
created: YYYY-MM-DD
approved: YYYY-MM-DD
completed: YYYY-MM-DD
files:
  - relevant-files
related_issues:
  - "042"
related_plans:
  - "003"
---

## Summary

## Goal

## Plan

## Acceptance criteria
\`\`\`

## Plan Tiers

| Tier | When to use |
|------|-------------|
| quick | Small, clear scope; bugfix-sized work |
| prototype | Spike, POC, timeboxed experiment |
| full-feature | Normal feature or change |
| dig-deep | Architecture, migration, high-risk or unclear work |
| ultrathink | Production-critical, multi-system, long-term source of truth |

## Plan Types

| Type | Description |
|------|-------------|
| feature | New module, UI, API, workflow |
| refactor | Restructure, simplify, rename, migration |
| debug | Failing build, runtime issue, bug strategy |
| architecture | Stack decisions, boundaries, system design |
| release | Publish, deploy, version, changelog |
| repo-maintenance | Hygiene, docs, quality gates |
| agent-workflow | Skills, subagents, rules, automation |
| unknown | Unclear or mixed request |

## Workstreams

| Workstream | Plans |
|-----------|-------|
| _none yet_ | |
```

---

## Step 3 — Verify structure

```bash
echo "=== Directory structure ==="
ls -la "$PLANS_DIR/"
echo ""
echo "=== Completed dir ==="
ls -la "$COMPLETED_DIR/"
echo ""
echo "=== INDEX.md exists ==="
[ -f "$PLANS_DIR/INDEX.md" ] && echo "YES" || echo "MISSING"
```

---

## Step 4 — Confirm to user

Report what was created:

- `brain/plans/` directory
- `brain/plans/completed/` directory
- `brain/plans/INDEX.md` with full template

Then suggest next steps: use **`kenmark-plan`** to author a plan, or use **`kenmark-plans-list`** to see the empty tracker.

## Related skills

- **`kenmark-init`** — Step 1c runs this setup when `INDEX.md` is missing
- **`kenmark-plan`** — create plan files (requires `INDEX.md` from this skill or init)
- **`kenmark-plans-list`** — view plans dashboard
- **`kenmark-plans-maintain`** — fix tracker structural drift (duplicates, stale index)
- **`kenmark-plans-execute`** — implement an approved plan end to end

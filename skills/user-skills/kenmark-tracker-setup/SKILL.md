---
name: kenmark-tracker-setup
version: 1.0.0
category: workflow
scope: universal
phase: setup
description: "Bootstrap brain/issues/ and/or brain/plans/ documentation structure: create directories, completed/ subdirs, and INDEX.md with ID ledger and templates. Accepts a tracker-type parameter (issues, plans, or both). Redundant if kenmark-init already bootstrapped tracking. Use when asked to setup issues, init issues, bootstrap issues directory, initialize issues, setup plans, init plans, bootstrap plans directory, or initialize plans."
triggers:
  - setup issues
  - init issues
  - bootstrap issues directory
  - initialize issues
  - setup plans
  - init plans
  - bootstrap plans directory
  - initialize plans
  - setup trackers
  - init trackers
  - bootstrap trackers
  - kenmark-tracker-setup
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

# Kenmark Tracker Setup

## Purpose

Bootstrap the **`brain/issues/`** and/or **`brain/plans/`** documentation structure from scratch — not discover bugs or author plans.

Accepts a `tracker-type` parameter:
- `issues` — bootstrap only `brain/issues/`
- `plans` — bootstrap only `brain/plans/`
- `both` (default) — bootstrap both trackers

Creates per tracker:
- `brain/{tracker}/` — active items
- `brain/{tracker}/completed/` — archived resolved items
- `brain/{tracker}/INDEX.md` — master index with ID ledger, status tables, and templates

**Not this skill:** scanning the codebase and writing issue files is **`kenmark-issues-scan`**; authoring plans is **`kenmark-plan`**.

## Relationship to `kenmark-init`

- **`kenmark-init`** always creates empty `brain/issues/` and `brain/plans/` dirs as part of the brain scaffold.
- During init, init runs this skill's Steps 2–4 for each tracker when `INDEX.md` is missing (unless user opts out with "brain only, no trackers").
- **If `INDEX.md` already exists** for a tracker, skip setup for that tracker; suggest the appropriate scan/list skill.

---

## Step 1 — Determine tracker type

If the user specified a tracker type (`issues`, `plans`, or `both`), use that. Otherwise default to `both`.

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
echo "REPO_ROOT=$REPO_ROOT"
```

For each enabled tracker (`issues` and/or `plans`):

```bash
TRACKER_DIR="$REPO_ROOT/brain/{tracker}"
COMPLETED_DIR="$TRACKER_DIR/completed"
echo "TRACKER_DIR=$TRACKER_DIR"
```

If `brain/` does not exist, create it:

```bash
mkdir -p "$TRACKER_DIR" "$COMPLETED_DIR"
echo "Created: $TRACKER_DIR and $COMPLETED_DIR"
```

If `brain/{tracker}/INDEX.md` already exists:

```bash
[ -f "$TRACKER_DIR/INDEX.md" ] && echo "SKIP: INDEX.md exists — setup already done"
```

Report to the user and stop (or offer the appropriate scan/list skill).

---

## Step 2 — Create the INDEX.md

### For issues tracker

Write `brain/issues/INDEX.md` with this exact structure:

```markdown
# Issues Index

## ID Ledger

| Field | Value |
|------|-------|
| Last Assigned ID | 000 |
| Next ID | 001 |

## Ledger Rules

- Issue IDs are global and immutable.
- IDs are never reused.
- Completed issues reserve their IDs forever.
- New issue IDs must be calculated from `INDEX.md`, active files, and completed files.
- Do not calculate next ID from `brain/issues/` alone.

## Overview

| Category | Count |
|----------|-------|
| Active issues | 0 |
| Completed | 0 |
| **Total** | **0** |

## Completed Issues

| ID | Title | Completed |
|----|-------|-----------|
| _none yet_ | | |

## Active Issues by Priority

### P0 — Critical

| ID | Title |
|----|-------|
| _none_ | |

### P1 — High

| ID | Title |
|----|-------|
| _none_ | |

### P2 — Medium

| ID | Title |
|----|-------|
| _none_ | |

## Issue Structure

Each issue file contains:

\`\`\`yaml
---
id: XXX
title: ...
severity: P0|P1|P2
area: frontend|backend|api|database|auth|security|ui|testing|performance|dx|infra|docs|workflow|unknown
source: how-the-issue-was-found
status: open|completed
created: YYYY-MM-DD
files:
  - relevant-files
related:
  - related-issue-ids
---

## Summary

## Evidence

## Suggested fix

## Acceptance criteria
\`\`\`

## Areas

| Area | Description |
|------|-------------|
| frontend | Web/mobile UI, components, pages, client routing |
| backend | Server logic, services, domain layer (non-route HTTP) |
| api | HTTP/API routes, handlers, webhooks, GraphQL |
| database | Schema, migrations, ORM, persistence |
| auth | Sessions, OAuth, permissions, identity |
| security | Hardening, crypto, rate limits, input validation |
| ui | Visual design, layout, accessibility, UX polish |
| testing | Test gaps, flaky tests, missing coverage |
| performance | Latency, bundle size, caching, Core Web Vitals |
| dx | Tooling, refactors, dead code, developer ergonomics |
| infra | CI/CD, deploy, config, observability |
| docs | README, API docs, comments, onboarding |
| workflow | Scripts, automation, issue/process tooling |
| unknown | Area unclear until triaged |
| worker | Background jobs, queues, cron (add row only if the repo has them) |

Add or rename areas in this table to match the project. Omit unused rows (especially `worker` when there are no background jobs).

## Workstreams

| Workstream | Issues |
|-----------|--------|
| _none yet_ | |
```

### For plans tracker

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
ls -la "$TRACKER_DIR/"
echo ""
echo "=== Completed dir ==="
ls -la "$COMPLETED_DIR/"
echo ""
echo "=== INDEX.md exists ==="
[ -f "$TRACKER_DIR/INDEX.md" ] && echo "YES" || echo "MISSING"
```

---

## Step 4 — Confirm to user

Report what was created:
- `brain/issues/` and/or `brain/plans/` directories
- `brain/issues/completed/` and/or `brain/plans/completed/` directories
- `brain/issues/INDEX.md` and/or `brain/plans/INDEX.md` with full templates

Then suggest next steps:
- For issues: use **`kenmark-issues-scan`** to discover bugs/gaps and create issue files, or use **`kenmark-tracker-list`** to see the tracker
- For plans: use **`kenmark-plan`** to author a plan, or use **`kenmark-tracker-list`** to see the tracker

## Related skills

- **`kenmark-init`** — runs this setup when `INDEX.md` is missing
- **`kenmark-issues-scan`** — find bugs/gaps and file issues (requires `INDEX.md` from this skill or init)
- **`kenmark-plan`** — create plan files (requires `INDEX.md` from this skill or init)
- **`kenmark-tracker-list`** — view open issues and plans dashboard
- **`kenmark-tracker-check`** — move resolved items to completed/ and refresh index
- **`kenmark-tracker-maintain`** — fix tracker structural drift (duplicates, stale index)

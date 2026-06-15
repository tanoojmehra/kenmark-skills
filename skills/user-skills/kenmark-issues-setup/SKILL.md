---
name: kenmark-issues-setup
version: 1.3.0
category: issues
scope: universal
phase: setup
description: "Bootstrap brain/issues/ documentation structure: create brain/issues/, brain/issues/completed/, and brain/issues/INDEX.md with ID ledger and templates. Not for scanning the codebase — use kenmark-issues-scan to find bugs and file issues. Redundant if kenmark-init already bootstrapped issue tracking. Use when asked to \"setup issues\", \"init issues\", or \"bootstrap issues directory\"."
triggers:
  - setup issues
  - init issues
  - bootstrap issues directory
  - initialize issues
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

# Kenmark Issues Setup

## Purpose

Bootstrap the **`brain/issues/` documentation structure** from scratch — not discover or file bugs.

Creates:

- `brain/issues/` — active issues
- `brain/issues/completed/` — archived resolved issues
- `brain/issues/INDEX.md` — master index with ID ledger, priority tables, and templates

**Not this skill:** scanning the codebase and writing issue files is **`kenmark-issues-scan`**.

## Relationship to `kenmark-init`

- **`kenmark-init`** always creates empty `brain/issues/` and `brain/issues/completed/` dirs as part of the brain scaffold.
- During init (Step 1b), init runs **this skill's Steps 2–4** to write `INDEX.md` when missing (unless user opts out with "brain only, no trackers").
- **If `brain/issues/INDEX.md` already exists** (from a prior init or this skill), stop — setup is complete; suggest **`kenmark-issues-scan`** to populate issues or **`kenmark-issues-list`** to view the tracker.

---

## Step 1 — Find or create the brain directory

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
ISSUES_DIR="$REPO_ROOT/brain/issues"
COMPLETED_DIR="$ISSUES_DIR/completed"
echo "REPO_ROOT=$REPO_ROOT"
echo "ISSUES_DIR=$ISSUES_DIR"
```

If `brain/` does not exist, create it:

```bash
mkdir -p "$ISSUES_DIR" "$COMPLETED_DIR"
echo "Created: $ISSUES_DIR and $COMPLETED_DIR"
```

If `brain/issues/INDEX.md` already exists:

```bash
[ -f "$ISSUES_DIR/INDEX.md" ] && echo "SKIP: INDEX.md exists — setup already done"
```

Report to the user and stop (or offer **`kenmark-issues-scan`** / **`kenmark-issues-list`**).

---

## Step 2 — Create the INDEX.md

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

---

## Step 3 — Verify structure

```bash
echo "=== Directory structure ==="
ls -la "$ISSUES_DIR/"
echo ""
echo "=== Completed dir ==="
ls -la "$COMPLETED_DIR/"
echo ""
echo "=== INDEX.md exists ==="
[ -f "$ISSUES_DIR/INDEX.md" ] && echo "YES" || echo "MISSING"
```

---

## Step 4 — Confirm to user

Report what was created:
- `brain/issues/` directory
- `brain/issues/completed/` directory
- `brain/issues/INDEX.md` with full template

Then suggest next steps: use **`kenmark-issues-scan`** to discover bugs/gaps and create issue files, or use **`kenmark-issues-list`** to see the empty tracker.

## Related skills

- **`kenmark-init`** — Step 1b runs this setup when `INDEX.md` is missing
- **`kenmark-issues-scan`** — find bugs/gaps and file issues (requires `INDEX.md` from this skill or init)
- **`kenmark-issues-list`** — view open issues dashboard
- **`kenmark-issues-maintain`** — fix tracker structural drift (duplicates, stale index)

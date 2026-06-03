---
name: kenmark-issues-setup
version: 1.2.0
category: issues
scope: universal
phase: setup
description: "Set up the brain/issues/ directory structure: create brain/issues/, brain/issues/completed/, and brain/issues/INDEX.md from scratch. Use when asked to \"setup issues\", \"init issues\", or \"bootstrap issues directory\"."
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
disable-model-invocation: false
---

# Kenmark Issues Setup

## Purpose

Create the full `brain/issues/` directory structure from scratch:
- `brain/issues/` — active issues
- `brain/issues/completed/` — archived resolved issues
- `brain/issues/INDEX.md` — master index with all issues grouped by priority

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

Then suggest next steps: use `/kenmark-issues-scan` to populate with issues discovered from the codebase, or use `/kenmark-issues-list` to see the empty state.

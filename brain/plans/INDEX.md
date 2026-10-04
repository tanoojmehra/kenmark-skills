# Plans Index

## ID Ledger

| Field | Value |
|------|-------|
| Last Assigned ID | 001 |
| Next ID | 002 |

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
| Completed | 1 |
| **Total** | **1** |

## Completed Plans

| ID | Title | Tier | Completed |
|----|-------|------|-----------|
| 001 | Add kenmark-server-defense skill for server & project vulnerability audit, incident detection, and hardening | full-feature | 2026-09-15 |

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

```yaml
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
```

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

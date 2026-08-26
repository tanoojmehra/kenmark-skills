# Specs Index

Specs are living product/engineering intent. They describe what should stay true; plans describe how a specific change will ship; issues describe known gaps.

## ID Ledger

| Field | Value |
|------|-------|
| Last Assigned ID | 001 |
| Next ID | 002 |

## Ledger Rules

- Spec IDs are global and immutable.
- IDs never reused.
- Replaced specs move to `archived/` and keep their ID.
- New spec IDs must be calculated from this file, active specs, and archived specs.

## Overview

| Category | Count |
|----------|-------|
| Active specs | 1 |
| Archived | 0 |
| **Total** | **1** |

## Active Specs

| ID | Title | Area | Status |
|----|-------|------|--------|
| 001 | [Brain specs workflow](001-brain-specs-workflow.md) | agent-workflow | active |

## Archived Specs

| ID | Title | Area | Archived |
|----|-------|------|----------|
| _none yet_ | | | |

## Spec Structure

Each spec file contains:

```yaml
---
id: "XXX"
title: ...
area: cli|skills|mcp|docs|agent-workflow|repo-maintenance
status: draft|active|archived|superseded
created: YYYY-MM-DD
updated: YYYY-MM-DD
supersedes:
superseded_by:
related_plans:
related_issues:
---
```

Required body sections:

- `## Intent`
- `## Scope`
- `## Current behavior`
- `## Desired behavior`
- `## Open questions`
- `## Change log`


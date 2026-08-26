---
id: "001"
title: Brain specs workflow
area: agent-workflow
status: active
created: 2026-06-22
updated: 2026-06-22
supersedes:
superseded_by:
related_plans:
related_issues:
---

# Brain specs workflow

## Intent

Add a lightweight spec layer to `brain/` so durable product and workflow decisions have one place to evolve over time.

Specs are not completion checklists. A spec remains active while it describes the desired shape of a system or feature.

## Scope

- Store specs in `brain/specs/`.
- Track specs in `brain/specs/INDEX.md`.
- Allow multiple active specs split by feature, system area, or team boundary.
- Archive replaced specs under `brain/specs/archived/` when a new spec supersedes them.

## Current behavior

`brain/issues/` tracks known problems. `brain/plans/` tracks proposed or approved implementation work. `brain/kb/` records confirmed project knowledge after changes land.

There is no first-class place for long-lived desired behavior before it becomes plans, issues, or KB.

## Desired behavior

- Create or update a spec when a discussion defines durable intent.
- Create plans from specs when implementation is ready.
- Create issues from specs when gaps or bugs are found.
- Update KB after implementation confirms the spec in the codebase.
- Archive, do not rewrite history, when a replacement spec changes the shape enough that old context would mislead.

## Open questions

- Should Kenmark ship a reusable `kenmark-spec` skill, or is the tracker enough until usage proves the need?

## Change log

- 2026-06-22: Created initial spec workflow.


---
name: kenmark-plan
version: 1.0.0
category: workflow
scope: universal
phase: plan
description: "Universal planning skill for turning vague or complex requests into a clear execution plan before implementation. Use when asked to plan, think deeply, create a roadmap, break down work, compare approaches, or prepare before coding."
triggers:
  - kenmark-plan
  - plan this
  - create a plan
  - make a plan
  - think deeply
  - think hard
  - before coding
  - implementation plan
  - architecture plan
  - roadmap
  - break this down
  - how should we approach this
  - plan before implementing
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - TodoWrite
  - WebSearch
  - WebFetch
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Kenmark Plan

## Purpose

Use this skill when the user wants a plan before execution.

This skill is for:

- complex implementation planning
- architecture planning
- repo change planning
- migration planning
- debugging strategy
- product/feature breakdown
- release planning
- refactor planning
- risk-aware execution planning
- deciding between approaches

This skill does **not** implement by default. It produces a plan first.

---

## Core principle

```text
Understand → Inspect → Options → Risks → Plan → Acceptance Criteria → Ask / Proceed
```

Do not jump straight to implementation unless the user explicitly asks.

---

## Operating modes

| Mode                   | Use when                                                     | Output                                    |
| ---------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `quick-plan`           | Small task, clear scope                                      | Short steps + risks                       |
| `standard-plan`        | Normal feature/change                                        | Detailed execution plan                   |
| `deep-plan`            | Complex architecture, migration, production, or unclear work | Options, tradeoffs, risks, phased rollout |
| `implementation-ready` | User wants coding after plan                                 | Plan + exact first implementation steps   |

Use `deep-plan` when the user says:

* think hard
* dig deep
* architecture
* migration
* production
* best approach
* long-term
* source of truth
* plan before coding

---

## Safety rules

* Prefer read-only inspection first.
* Do not edit files unless the user asks to implement or asks to save the plan.
* If creating a durable plan, write only after approval.
* Do not hide assumptions.
* Do not over-plan simple tasks.
* Do not ask unnecessary questions if a reasonable plan can be made from available context.
* If the task is high-risk, include rollback and verification.

---

## Step 1 — Frame the request

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
- User preference:
```

If the repo is available, inspect:

```bash
git status --short
find . -maxdepth 3 -type f \( -name package.json -o -name README.md -o -name "SKILL.md" -o -name tsconfig.json -o -name next.config.js -o -name next.config.mjs -o -name prisma.schema -o -name schema.prisma \) -print
```

Do not run expensive commands unless needed.

---

## Step 2 — Determine planning type

Classify the plan:

| Type               | Examples                                   |
| ------------------ | ------------------------------------------ |
| `feature`          | new module, UI, API, workflow              |
| `refactor`         | restructure, simplify, rename, migration   |
| `debug`            | failing build, runtime issue, bug          |
| `architecture`     | stack decisions, boundaries, system design |
| `release`          | publish, deploy, version, changelog        |
| `repo-maintenance` | hygiene, docs, quality gates               |
| `agent-workflow`   | skills, subagents, rules, automation       |
| `unknown`          | unclear or mixed request                   |

---

## Step 3 — Inspect enough context

Inspect only what changes the plan.

For repos, look for:

* README / docs
* brain/kb if present
* package scripts
* relevant source folders
* config files
* tests
* recent git changes
* related issue files

If the task concerns a public/current tool, library, package, or external service, research current docs or release notes.

---

## Step 4 — Generate options before choosing

For non-trivial work, produce at least two approaches:

```markdown
## Options

| Option | Summary | Pros | Cons | Risk | When to choose |
| --- | --- | --- | --- | --- | --- |
| A | ... | ... | ... | Low/Med/High | ... |
| B | ... | ... | ... | Low/Med/High | ... |
```

Then recommend one:

```markdown
Recommended: Option A

Why:
- ...
```

---

## Step 5 — Produce the execution plan

Use this structure:

```markdown
# Kenmark Plan

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
- [ ] ...

## Commands/checks to run

(include a separate bash code block with concrete commands)

## Open questions

* ...
```

---

## Step 6 — Make the plan actionable

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

## Step 7 — Optional artifact

If the user asks to save the plan, write:

```text
brain/plans/YYYY-MM-DD-short-title.md
```

Use:

```markdown
# Plan — <title>

Date:
Status: proposed|approved|in-progress|done

## Goal

## Context

## Plan

## Acceptance criteria

## Verification

## Risks

## Decision log
```

Do not create this file unless requested or already operating inside an explicit brain/documentation workflow.

---

## Output contract

A valid `kenmark-plan` response must include:

1. Goal
2. Current understanding
3. Recommended approach
4. Phased checklist
5. Risks
6. Acceptance criteria
7. Verification commands/checks
8. Next step

---

## Anti-patterns

* Do not implement while planning unless asked.
* Do not make a generic plan that ignores repo context.
* Do not ask 10 clarifying questions before giving value.
* Do not skip risks for production or migration plans.
* Do not pretend uncertain facts are confirmed.

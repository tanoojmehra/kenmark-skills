---
name: kenmark-subagents
version: 1.0.0
category: workflow
scope: universal
phase: orchestrate
description: "Universal sub-agent orchestration skill for splitting complex work into specialist tracks, running parallel/delegated investigation when supported, and synthesizing findings into a final decision or plan."
triggers:
  - kenmark-subagents
  - use sub agents
  - use subagents
  - delegate this
  - split into agents
  - parallel investigation
  - use specialist agents
  - run multiple agents
  - orchestrate agents
  - agent team
  - independent tracks
allowed-tools:
  - Task
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

# Kenmark Subagents

## Purpose

Use this skill when a task is complex enough to benefit from specialist investigation tracks.

This skill is for:

- large audits
- architecture decisions
- debugging complex failures
- repo-wide analysis
- research-heavy questions
- migration planning
- performance investigations
- security/public-readiness reviews
- product/technical tradeoff analysis
- multi-file implementation planning

It should not be used for simple one-shot tasks.

---

## Core principle

```text
Split independent questions → Delegate → Collect evidence → Reconcile conflicts → Synthesize
```

Sub-agents are useful only when they reduce uncertainty.

---

## When to use sub-agents

Use sub-agents when at least one is true:

```text
[ ] The task has multiple independent domains
[ ] The repo/system is large
[ ] The answer needs research + local inspection
[ ] There are competing hypotheses
[ ] The decision is high-impact
[ ] The user explicitly asked to use sub-agents
[ ] A single linear pass is likely to miss things
```

Do not use sub-agents when:

```text
[ ] The task is small and obvious
[ ] The user needs a fast direct answer
[ ] The task is mostly formatting
[ ] The work is destructive and not approved
[ ] Delegation would create noise instead of clarity
```

---

## Standard agent tracks

Pick only the tracks that fit.

| Track                | Responsibility                                        |
| -------------------- | ----------------------------------------------------- |
| `context-agent`      | Understand user goal, constraints, current state      |
| `repo-agent`         | Inspect repo structure, files, scripts, configs       |
| `code-agent`         | Inspect implementation paths and likely code changes  |
| `quality-agent`      | Check type/build/lint/test/release gates              |
| `security-agent`     | Look for secrets, risky actions, public-safety issues |
| `research-agent`     | Check current docs, package behavior, external facts  |
| `architecture-agent` | Compare design options and system tradeoffs           |
| `risk-agent`         | Identify failure modes, rollback, migration risk      |
| `docs-agent`         | Identify docs/brain/KB updates required               |
| `synthesis-agent`    | Merge findings into final recommendation              |

---

## Delegation rule

Each sub-agent must have:

```text
Specific question
Scope boundaries
Allowed evidence
Output format
Confidence level
```

Do not ask sub-agents vague prompts like:

```text
Review this repo.
```

Use:

```text
Inspect package scripts and CLI entry points. Determine whether all referenced files exist and whether dry-run commands are safe. Return blockers, evidence, and recommended fixes.
```

---

## Sub-agent prompt template

```markdown
You are the `<track-name>` for this Kenmark investigation.

## Goal

<overall user request>

## Your focused task

<specific question for this sub-agent>

## Scope

Include:
- ...

Exclude:
- ...

## Rules

- Prefer evidence over guesses.
- Cite file paths, commands, logs, or sources.
- Separate facts from assumptions.
- Mark confidence as High / Medium / Low.
- Do not make destructive changes.
- If you cannot verify something, say what would verify it.

## Output

1. Findings
2. Evidence
3. Risks / unknowns
4. Recommendation
5. Confidence
```

---

## Fallback if sub-agents are unavailable

If the environment does not support a `Task` tool or sub-agent delegation, emulate sub-agents sequentially:

```markdown
## Track A — Context

## Track B — Repo / evidence

## Track C — Research

## Track D — Risk

## Track E — Synthesis
```

Clearly say:

```text
Sub-agent tool is unavailable, so I am running the tracks sequentially.
```

---

## Step 1 — Decide tracks

Create a table:

```markdown
## Delegation plan

| Track | Question | Why needed | Output |
| --- | --- | --- | --- |
| repo-agent | ... | ... | ... |
| risk-agent | ... | ... | ... |
```

Use no more than 3–5 tracks for normal work.

Use 6–8 only for deep audits.

---

## Step 2 — Run tracks

For each track, either:

* call the sub-agent tool if available, or
* run the track sequentially.

Do not let agents modify files unless the user explicitly approved implementation.

---

## Step 3 — Reconcile findings

After tracks return, synthesize:

```markdown
## Cross-agent synthesis

| Topic | Agreement | Conflict | Decision |
| --- | --- | --- | --- |
| ... | ... | ... | ... |
```

If agents disagree, prefer:

```text
local evidence > official docs > recent reputable sources > assumptions
```

---

## Step 4 — Final output

Use this format:

```markdown
# Kenmark Subagents Report

## Delegation summary

| Track | Status | Confidence |
| --- | --- | --- |

## Key findings

1. ...

## Evidence

| Evidence | Source | Supports |
| --- | --- | --- |

## Conflicts / uncertainty

- ...

## Recommended decision or plan

1. ...
2. ...
3. ...

## Follow-up checks

- ...

## If implementing next

- Files likely involved:
- Commands/checks:
- Risks:
- Rollback:
```

---

## Step 5 — Optional artifact

If the user asks to save the investigation, write:

```text
brain/subagents/YYYY-MM-DD-short-title.md
```

Only write this file after approval or in an explicit brain documentation workflow.

---

## Anti-patterns

* Do not spawn sub-agents for tiny tasks.
* Do not delegate vague questions.
* Do not accept sub-agent findings without synthesis.
* Do not hide conflicts between agents.
* Do not use sub-agents as theater.
* Do not let sub-agents make irreversible changes.
* Do not produce a pile of findings without a decision.

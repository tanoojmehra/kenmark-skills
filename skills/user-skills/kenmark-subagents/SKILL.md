---
name: kenmark-subagents
version: 2.0.0
category: workflow
scope: universal
phase: orchestrate
description: "Manual deep orchestration skill for complex work that benefits from fresh specialist or task workers. Use when the user explicitly asks for subagents/parallel tracks, or when another Kenmark workflow escalates to deep investigation or bounded worker execution."
triggers:
  - kenmark-subagents
  - use subagents
  - parallel investigation
  - split into agents
  - specialist agents
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
disable-model-invocation: true
---

# Kenmark Subagents

## Purpose

Use fresh sub-agents when complex work benefits from isolated context, independent evidence, or bounded execution.

The controller should coordinate and integrate. Workers should do the heavy investigation or implementation without feeding their full working history back into the parent.

> **Fresh workers receive task capsules. The controller receives compact results.**

Use **kenmark-context** as the default context-budget policy. This skill is the explicit deep orchestration workflow.

---

## Core principles

```text
Decompose bounded work
→ isolate context
→ delegate
→ collect compact envelopes
→ reconcile conflicts
→ verify centrally
→ retain state, not history
```

Sub-agents are useful only when they reduce uncertainty, context pollution, or wall-clock time.

Fresh context is valuable even when work runs sequentially.

---

## When to use sub-agents

Use when at least one is true:

```text
[ ] The task has multiple independent domains or issues
[ ] The repo/system is large
[ ] The answer needs research + local inspection
[ ] There are competing hypotheses
[ ] The decision is high-impact
[ ] The user explicitly asked to use sub-agents
[ ] A single linear pass is likely to miss things
[ ] The controller would otherwise accumulate large tool output
[ ] A plan/backlog can be split into bounded tasks
```

Do not use when:

```text
[ ] The task is small and obvious
[ ] The user needs a fast direct answer
[ ] The task is mostly formatting
[ ] The work is destructive and not approved
[ ] Delegation would create more context than it removes
[ ] Parallel writers would touch the same repository state
```

---

## Worker shape: task first, role second

For implementation, prefer one bounded outcome per worker:

```text
issue-103-worker
issue-108-worker
auth-regression-worker
```

Use role-based tracks for investigations:

| Track | Responsibility |
| --- | --- |
| `context-agent` | Understand goal, constraints, current state |
| `repo-agent` | Inspect repo structure, files, scripts, configs |
| `code-agent` | Inspect implementation paths and likely changes |
| `quality-agent` | Check type/build/lint/test/release gates |
| `security-agent` | Look for secrets, risky actions, public-safety issues |
| `research-agent` | Check current docs, package behavior, external facts |
| `architecture-agent` | Compare design options and system tradeoffs |
| `risk-agent` | Identify failure modes, rollback, migration risk |
| `docs-agent` | Identify docs/brain/KB updates required |
| `synthesis-agent` | Merge findings into a decision |

Do not keep a single long-lived worker for unrelated tasks merely because they share a technology.

---

## Task capsule (required)

Each worker receives **only the context it needs**:

```markdown
## Task
<one bounded outcome>

## Success
- <acceptance criterion>
- <acceptance criterion>

## Relevant context
- <file/module/spec/issue pointer>
- <small decision from earlier work>

## Constraints
- <scope boundary>
- <project/safety rule>

## Dependencies
- <task/commit required first, or "none">

## Rules
- Prefer evidence over guesses.
- Read project rules relevant to this task.
- Do not expand scope.
- Do not make destructive changes without approval.
- Keep verbose logs and exploration out of the return message.

## Return
Return only the compact result envelope below.
```

Do **not** copy the full parent conversation into a worker prompt by default.

Prefer file paths, issue IDs, plan IDs, commit SHAs, and artifact pointers over pasted contents.

---

## Compact result envelope (required)

Workers should target roughly **150–500 tokens** unless more detail is explicitly requested.

```yaml
status: done | blocked | failed
summary: <1-3 sentences>
files:
  - <path>
verification:
  - <check>: pass | fail | not-run
decisions:
  - <only decisions future work needs>
blockers:
  - <only unresolved blockers>
commit: <sha or null>
artifact: <path/url or null>
confidence: High | Medium | Low
```

A worker may create a detailed artifact when useful, but should return only the pointer plus conclusions.

Never dump full command output, discarded hypotheses, or large diffs back into the controller.

---

## Delegation modes

### Investigation mode

Use 3–5 focused tracks for normal complex work; 6–8 only for deep audits.

Parallelize independent **read-only** tracks when supported.

### Implementation mode

Use one fresh worker per bounded issue/task when practical.

For write tasks:

- parallelize only when file/state ownership is clearly independent;
- otherwise run fresh workers sequentially;
- each worker must re-read current repository state before editing;
- the controller owns integration and final verification.

Do not create multiple concurrent workers that can race on the same branch/files.

---

## Step 1 — Build the dependency map

Create a compact table:

```markdown
| Task/track | Depends on | Isolation | Parallel safe? | Return |
| --- | --- | --- | --- | --- |
| #103 login redirect | - | fresh worker | yes | compact envelope |
| #121 coverage | #103,#108 | fresh worker | no | compact envelope |
```

Keep this in the controller. Do not store worker narratives in the table.

---

## Step 2 — Run fresh workers

For each task/track:

1. create the task capsule;
2. start a fresh worker when supported;
3. let the worker inspect the relevant sources itself;
4. collect only the compact result envelope;
5. record status / dependency-changing decisions / commit or artifact.

If the environment has no true subagent primitive, follow **kenmark-context** fallback rules and say that true isolation is unavailable. Sequential headings in the same context are not sub-agents.

---

## Step 3 — Reconcile

For investigations, synthesize disagreements:

```markdown
| Topic | Agreement | Conflict | Decision |
| --- | --- | --- | --- |
| ... | ... | ... | ... |
```

Prefer:

```text
current local evidence
> official/current docs
> recent reputable sources
> assumptions
```

For implementation workers, inspect integration boundaries and repository state rather than replaying each worker's full history.

---

## Step 4 — Verify centrally

The controller owns final verification.

A worker's passing test result can become stale after another worker changes adjacent code.

Run the appropriate final integration gates after all relevant work is combined.

---

## Step 5 — Final output

Return a concise orchestration summary:

```markdown
# Kenmark Subagents Report

| Task/track | Status | Commit/artifact | Confidence |
| --- | --- | --- | --- |

## Key decisions
- ...

## Verification
- ...

## Conflicts / blockers
- ...

## Recommended next action
- ...
```

Expose detailed worker evidence only when the user asks or when it is necessary to explain a blocker/risk.

---

## Optional durable artifacts

Use existing repo trackers/specs/plans where possible.

If the user explicitly asks to save a standalone investigation, write:

```text
brain/subagents/YYYY-MM-DD-short-title.md
```

Do not create duplicate durable state when `brain/issues/`, `brain/plans/`, or a spec already owns it.

---

## Anti-patterns

- Do not spawn sub-agents for tiny tasks.
- Do not delegate vague prompts such as "review this repo".
- Do not forward the whole conversation by default.
- Do not accept worker claims without integration checks.
- Do not hide conflicts between workers.
- Do not request essay-length worker reports.
- Do not paste verbose logs back into the controller.
- Do not keep one worker alive across unrelated tasks to save setup tokens.
- Do not parallelize overlapping writes.
- Do not use sub-agents as theater.
- Do not let workers make irreversible changes outside user-approved scope.

---
name: kenmark-context
version: 1.0.0
category: workflow
scope: universal
phase: orchestrate
description: "Automatic context-budget controller for long, queued, multi-part, research-heavy, or repo-wide work. Keeps the primary agent lean by decomposing bounded tasks, sending minimal task capsules to fresh workers when available, and retaining compact state instead of verbose history."
triggers:
  - keep context small
  - context is getting large
  - long running task
  - queue these issues
  - multiple issues
  - split this task
  - delegate work
  - context budget
  - context efficiency
  - many tasks
allowed-tools:
  - Task
  - Read
  - Grep
  - Glob
  - Bash
  - TodoWrite
  - WebSearch
  - WebFetch
risk: read-only
disable-model-invocation: false
---

# Kenmark Context

## Purpose

Protect the **primary agent's context** during substantial work.

The goal is not minimum total tokens. Prefer spending more tokens in isolated workers when that keeps the controller responsive, focused, and cheap to continue.

> **The main agent should remember state, not history.**

Use this skill proactively for queued issues, multi-phase plans, repo-wide investigations, research + implementation combinations, repeated task switching, or any workflow likely to accumulate large tool output.

Do not add delegation overhead to small one-shot tasks.

---

## Core policy

```text
small bounded task
  -> do locally

large but single-threaded task
  -> keep local context selective
  -> offload verbose artifacts/logs to files when possible

multiple bounded tasks
  -> decompose
  -> send task capsules to fresh workers
  -> receive compact return envelopes
  -> retain only state/dependencies in the controller

independent tasks
  -> parallelize when safe

shared-state / same-files / git-conflicting tasks
  -> run isolated workers sequentially
```

Fresh context is more important than parallelism. Sequential fresh workers still provide most of the context-isolation benefit.

---

## Automatic delegation signals

Prefer delegation when **two or more** signals apply, or when one signal is very strong:

```text
[ ] 2+ independent issues or requested changes
[ ] 3+ plan phases with separable implementation work
[ ] research + repo inspection + implementation are all needed
[ ] repo-wide search is likely to generate large observations
[ ] multiple unrelated test/build failures are queued
[ ] a worker can own a bounded file/module surface
[ ] the conversation already contains substantial unrelated history
[ ] the user is queueing work while away / wants many items processed
[ ] one linear agent would repeatedly reread unrelated evidence
```

Keep work local when:

```text
[ ] one obvious file / one obvious change
[ ] delegation setup would exceed the work itself
[ ] the next action depends tightly on the immediately previous result
[ ] multiple workers would edit the same state concurrently
[ ] the environment has no usable worker/subagent primitive
```

---

## Context budget rules

### Controller

The primary agent owns:

- user intent and hard constraints
- decomposition and dependency ordering
- task status
- integration decisions
- approvals and safety gates
- final verification
- concise user-facing progress

The primary agent should **not** retain:

- full worker reasoning
- complete command output
- long file dumps
- discarded approaches
- duplicate copies of source already available in the repo
- verbose test logs after the result is known

### Worker

Each worker receives only:

- the bounded task
- acceptance criteria
- relevant file/module pointers
- required project rules
- dependencies from earlier tasks
- explicit constraints
- exact return contract

Do **not** forward the whole parent conversation unless the task genuinely requires it.

---

## Task capsule

Use this shape for delegated work:

```markdown
## Task
<one bounded outcome>

## Success
- <acceptance criterion>
- <acceptance criterion>

## Relevant context
- <file/module/spec pointer>
- <small decision from earlier work>

## Constraints
- <project rule>
- <scope boundary>
- <safety / compatibility constraint>

## Dependencies
- <commit/task/result required first, or "none">

## Return
Return only:
- status
- 1-3 sentence summary
- files changed / evidence inspected
- verification result
- decisions that affect later tasks
- blockers
- commit/artifact reference when available
```

Prefer pointers such as file paths, issue IDs, plan IDs, commit SHAs, and artifact paths over copied contents.

---

## Compact return envelope

Workers must not dump their working context into the controller.

Preferred envelope:

```yaml
status: done | blocked | failed
summary: <1-3 sentences>
files:
  - <path>
verification:
  - <command/check>: pass | fail | not-run
decisions:
  - <only decisions future tasks need>
blockers:
  - <only unresolved blocker>
commit: <sha or null>
artifact: <path/url or null>
```

Target roughly **150-500 tokens** unless the controller explicitly requests more detail.

If a long report is useful, store it as an artifact and return only its pointer plus conclusions.

---

## State ledger

For queued work, track **state instead of history**:

```markdown
| Task | Status | Depends on | Owner/context | Commit/artifact | Blocker |
| --- | --- | --- | --- | --- | --- |
| #103 login redirect | done | - | fresh worker | 6c23b90 | - |
| #108 mobile menu | active | - | fresh worker | - | - |
| #121 coverage | pending | #103,#108 | - | - | wait for code |
```

Keep the ledger compact. Do not copy worker narratives into it.

Use an existing issue/plan tracker when the repo already has one. Do not create a second durable tracker merely for context management.

---

## Execution strategy

### 1. Decompose

Split by outcome, not by generic role, whenever implementation is involved.

Prefer:

```text
worker: fix issue #103
worker: fix issue #108
worker: verify auth regression
```

over:

```text
frontend worker
backend worker
testing worker
```

Role-based specialist tracks remain useful for investigations; explicit deep orchestration can use **kenmark-subagents**.

### 2. Order dependencies

Build the smallest dependency graph.

Run independent read-only investigation tracks in parallel when supported.

For write tasks:

- parallel only when file/state ownership does not overlap;
- otherwise use fresh workers sequentially;
- never trade repository safety for concurrency.

### 3. Delegate

Start a **fresh worker/context** for each meaningful bounded task when the harness supports it.

Do not keep one long-lived worker merely because several tasks share a technology.

### 4. Integrate

After each worker returns:

1. record status / commit / artifact;
2. retain only decisions needed by later tasks;
3. verify conflicts with current repository state;
4. continue to the next bounded task.

### 5. Verify centrally

The controller owns final integration checks.

A worker saying "tests pass" is evidence, not permission to skip final checks when later tasks may have changed the same system.

---

## Context trimming when workers are unavailable

If no subagent/Task primitive exists:

1. still decompose the work;
2. process one bounded task at a time;
3. keep only a compact checkpoint after each task;
4. prefer targeted reads over whole-repo dumps;
5. summarize long errors/tool output immediately after extracting the conclusion;
6. use files/artifacts for verbose intermediate material when the environment supports it.

Do **not** pretend sequential sections in the same context provide isolation. Say that true worker isolation is unavailable.

---

## Handoff checkpoints

Before intentionally switching session/context, persist only what is needed to restart:

```text
scope + accepted decisions
current task statuses
next pending task
files/commits changed
verification commands + outcomes
unresolved blockers / approvals
```

Repository state and durable artifacts are the source of truth; conversation history is not.

---

## Interaction with Kenmark workflows

- **kenmark-subagents** — explicit deep/specialist orchestration. Use its worker discipline and compact envelopes.
- **kenmark-plans-execute** — delegate independent phases/tasks instead of executing every phase in the controller.
- **kenmark-issues-fix-and-ship** — ideal for queued issues; isolate each bounded fix where safe.
- **kenmark-troubleshoot-deep** — delegate competing hypotheses/research tracks, then keep only the selected diagnosis.
- **kenmark-output** — final response completeness still applies; context efficiency must not omit required deliverables.

---

## Anti-patterns

- Do not delegate tiny work just to appear agentic.
- Do not send workers the entire chat by default.
- Do not ask workers for essay-length reports.
- Do not paste full logs into the controller after extracting the result.
- Do not reuse a worker across unrelated tasks merely to save setup tokens.
- Do not parallelize overlapping git/file writes.
- Do not let delegation hide conflicts, failures, or skipped verification.
- Do not optimize for minimum token spend when the user prefers speed and a lean controller.

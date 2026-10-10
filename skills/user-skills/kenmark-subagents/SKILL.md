---
name: kenmark-subagents
version: 3.0.0
category: workflow
scope: universal
phase: orchestrate
description: "Manual task-first subagent orchestrator. On explicit request, builds a complete task queue, launches a fresh subagent per task, enforces a configurable concurrency cap, drains an optional elastic pool, supervises deadlines and retries, and verifies every outcome."
triggers:
  - kenmark-subagents
  - use subagents
  - parallel investigation
  - split into agents
  - specialist agents
  - orchestrate task queue
  - subagent pool
  - max agents
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

# Kenmark Subagents — Task Queue and Elastic Pool

## Contract

The **orchestrator owns the entire task list, dispatch, supervision, integration, verification, and final accounting**. It must not merely suggest task assignments and walk away.

For every bounded task, create a **new isolated subagent** when the runtime supports one. Workers each own **one task attempt** and return a compact result; terminate/retire them after they finish. **Pool slots are reusable; worker contexts are not.** Do not leave a long-lived specialist agent processing unrelated tasks.

This is an explicitly invoked, manual orchestration skill. Use **kenmark-context** for context budgeting, minimal capsules, and small return envelopes. This skill is the authoritative scheduler when explicitly invoked; generic "do locally when small" guidance in kenmark-context does **not** override an explicit request to delegate each task.

**Important capability boundary:** A SKILL.md is a protocol, not a process manager. True spawning, concurrent waits, cancellation, clocks, continuous intake, and cleanup require **native harness support** (such as Task/agent APIs). Never simulate real subagents with headings, promise background execution after the session ends, claim enforced deadlines without a timer/cancellation primitive, or report an unverified worker as finished. See [references/scheduling-contract.md](references/scheduling-contract.md) for state transitions and examples.

## Operating defaults (user overrides take precedence)

~~~yaml
orchestration:
  maxAgents: 4               # hard cap on live workers, including stopping/stuck workers
  pooling: elastic            # elastic | batch
  minIdleAgents: 0            # fresh-per-task: do not retain warm worker sessions
  scheduling: priority-fifo   # highest priority ready task, FIFO within priority
  heartbeatMinutes: 3        # best-effort, only with observable worker state
  softDeadlineMinutes: 10    # request progress / surface at-risk status
  hardDeadlineMinutes: 30    # stop/recover or escalate; not a completion guarantee
  maxAttempts: 2             # initial attempt + at most 1 safe retry
~~~

- **Elastic (default):** While active, continuously admit new user tasks to the queue; dispatch the next ready task when a worker slot frees, without waiting for the whole wave. Create workers only for ready tasks; retire them at completion. The queue may grow beyond maxAgents; live workers may not.
- **Batch:** Dispatch up to maxAgents ready tasks, wait for that wave to become terminal, then dispatch the next wave. Still use fresh workers per task, preserve dependencies, and respect the cap.
- **Set maxAgents:** Accept a user-supplied positive integer, subject to the harness's lower actual limit; report the effective cap. If maxAgents=1, this is a sequential **fresh-worker** queue, not one reused worker.
- **Time budgets:** Task-specific deadline overrides defaults. If the user gives a global due time, derive per-task budgets from it and prioritize the critical path, but never promise all work will complete by the deadline.
- **Capability check:** Before scheduling, detect whether the current harness can spawn genuine isolated agents, run/wait in parallel, inspect progress, cancel/terminate, and accept tasks during a run. State missing capabilities once and degrade honestly. If there is no true subagent primitive, **do not claim to run the pool**: offer/execute a sequential local fallback only if consistent with user intent and label it non-delegated.

## Step 1 — Build and show the COMPLETE task queue first

Before starting workers, break the request into bounded, independently verifiable outcomes. Prefer one concrete issue/deliverable per task over general roles. Include integration/verification tasks if they require work, but final acceptance remains with the orchestrator.

Each task must contain:

~~~yaml
id: T001
title: Fix login redirect
priority: normal           # critical | high | normal | low
status: queued             # see reference for full lifecycle
dependsOn: []              # prerequisite task IDs
scope: [src/auth/login.ts]
acceptance:
  - Redirect returns to the intended safe URL
writeOwnership: [src/auth/login.ts]
estimatedMinutes: 15       # planning hint, not guarantee
softDeadlineMinutes: 10    # per-task override optional
hardDeadlineMinutes: 30    # per-task override optional
attempt: 0
workerId: null
result: null
~~~

Track the **queue ledger** visibly using TodoWrite or the available plan/task UI. For queued workflows, at minimum retain task ID, priority, dependencies, status, assigned worker/attempt, time budget, files/state ownership, result/verification, blocker. Use existing repo issues/plans as durable source of truth when applicable; don't create competing durable trackers.

Before dispatch:
1. Check every task has measurable acceptance criteria, constraints, and dependencies.
2. Detect cycles, missing prerequisite IDs, duplicates, and conflicting write/state ownership. Resolve or mark blocked **before** spawning.
3. Respect explicitly requested read-only scope, approvals, project rules, and access limits.
4. Show task count and effective maxAgents/pooling/deadline/retry settings.

For newly queued work during execution, append a new ID, dedupe and re-evaluate dependencies, then dispatch at the next scheduler opportunity. Mid-run intake is real-time **only if** the harness accepts messages while executing; otherwise ingest tasks at the next available interaction/checkpoint.

## Step 2 — Dispatch via a bounded scheduler (not ad-hoc delegation)

**Ready** means: queued/requeued, all dependencies verified done, no missing approvals, and no conflicts with live write ownership. Blocked tasks do not consume workers.

~~~text
while orchestrator is active:
  ingest any newly available queue items
  reconcile worker events, heartbeats, deadline breaches and terminations
  inspect returned artifacts; verify completed attempts before marking done
  update dependencies, blockers, retry decisions and queue ledger
  while liveWorkerCount < effectiveMaxAgents and ready tasks exist:
    choose highest-priority ready task (FIFO tie-break)
    reserve exclusive write ownership and one pool slot
    create a NEW subagent with the task capsule; assign worker ID + attempt
    mark task running only if spawn succeeded (else release slot and escalate)
  if no running workers and no ready tasks:
    if every task verified done: complete run
    else: report unresolved blocked/failed/cancelled tasks; do not claim complete
  else:
    wait on observable native worker event or next supported checkpoint
~~~

**Dispatch invariants:**
- Assign each ready task to exactly one live worker attempt; do not spawn duplicates.
- Never exceed effectiveMaxAgents. A timed-out worker still occupies its slot until termination is **confirmed**; do not overbook speculative capacity.
- Independent read-only work may run in parallel. Concurrent writers require separately isolated worktrees/branches/environments and non-overlapping file **and external state** ownership. With only one shared checkout or overlapping state, serialize write work, even if maxAgents is higher.
- Do not start a dependent task until the controller has **verified** the prerequisite outcome and integrated the required artifacts.
- The parent orchestrator does scheduling, reviews, conflict reconciliation, and integration; do not perform delegated implementation in the parent merely to clear the queue.
- On each release, **retire the old worker and create a fresh subagent for the next task**. Pooling reuses capacity, not a worker's memory.

## Step 3 — Launch task capsules with real assignments

Pass one bounded task, not the full conversation:

~~~markdown
## Assignment
Task: T001 — Fix login redirect
Attempt: 1 of 2
Owner: exclusive src/auth/login.ts
Priority: normal

## Goal and acceptance
- <bounded outcome>
- <measurable acceptance criteria>

## Inputs and dependencies
- <relevant file paths / issue IDs / verified prerequisite results>
- <project rules to read>

## Constraints and safety
- <allowed edit or read-only scope; branch/worktree>
- <no destructive action or privilege expansion without approval>
- <do not reassign or spawn nested workers unless explicitly permitted>

## Deadline and progress
Soft deadline: <duration / timestamp>
Hard deadline: <duration / timestamp>
Heartbeat: <supported interval or "not observable">
Report progress when requested; signal blockers early.
Stop at hard deadline if cancellation is supported; otherwise report limitations.

## Required return envelope
taskId: T001
attempt: 1
status: done | blocked | failed | cancelled
summary: <1-3 sentences>
files: [<changed or inspected path>]
verification: [<check and pass/fail/not-run>]
decisions: [<future-relevant only>]
blockers: [<unresolved only>]
commit: <sha or null>
artifact: <path/url or null>
confidence: High | Medium | Low
~~~

Use the host's **actual native subagent tool** (Task, spawn-agent, etc.) and capture its worker/run ID. Starting an ordinary chat message or reusing an existing worker does not fulfill a fresh subagent assignment. If spawn fails, the task remains queued/blocked with a cause, not running.

## Step 4 — Supervise completion, deadlines and failures

- At every available event/checkpoint, reconcile **worker ID, status, elapsed time, and last progress**. Where native wait/poll/timer support exists, check the configured heartbeat cadence; otherwise report that periodic supervision cannot be guaranteed.
- At the **soft deadline**, request a concise progress update, surface a risk, and consider moving remaining work into a smaller follow-up task. Do **not** count this as success or automatically duplicate the active worker.
- At the **hard deadline**, request cancellation/terminate if supported, wait for confirmed stop, reconcile partial writes/artifacts, then retry **only** if safe and within maxAttempts. If termination cannot be confirmed, mark **stuck/needs intervention**, keep the slot occupied, and do not dispatch a second writer for the same scope.
- A failed or blocked attempt returns its slot once stopped. Retry transient failures with a **new worker** and revised capsule; no blind retry for missing approvals, deterministic failures, or irreversible/ambiguous mutations.
- A worker saying "done" means **reported_done**, not accepted. Inspect its artifacts, changes and acceptance evidence; run relevant integration/quality checks when feasible. Mark **done** only on controller acceptance; otherwise mark retryable/blocked/failed with explicit evidence.
- If a prerequisite fails permanently, mark dependent tasks blocked with the dependency cause. Do not spin/retry forever.
- Release a pool slot only after the worker is confirmed exited and any exclusive ownership is safely released. Record termination failures.

## Step 5 — Drain the queue and verify ALL tasks

Do not finish when the first wave returns. Continue scheduling until **every queued task** is accounted for.

A successful run requires:
1. Every task in the final ledger has status **done** with acceptance evidence; no queued, ready, running, reported_done, verifying, retrying, blocked, failed, cancelled, or stuck tasks remain.
2. All required code/artifacts have been integrated safely; any stale worker checks have been rerun against the final combined state when feasible.
3. Dependencies are satisfied and there are no unowned conflicts or unverified results.
4. Live worker count is zero, or shutdown limitations are explicitly disclosed (in that case do not claim clean shutdown).

If anything is unresolved, report **incomplete**, show affected task IDs and blockers, and give a concrete recovery action. An attempted task is not a completed task.

## Output / ongoing status

Start with a compact queue snapshot. Update it after dispatch waves, meaningful worker completions, failure/deadline events, or intake of new tasks:

~~~markdown
Tasks: 8 | Done: 3 | Running: 4/4 | Queued: 1 | Blocked: 0
Pool: elastic | Max: 4 | Retries: 1 | At risk: T006

| ID | Task | Worker/attempt | Status | Deadline | Acceptance |
| --- | --- | --- | --- | --- | --- |
| T001 | Login redirect | agent-12 / 1 | done | met | verified |
~~~

Final report: **complete/incomplete**, total tasks by terminal status, tasks verified, retries/deadline breaches, conflicts/integration checks, changes/commits/artifacts, active-worker shutdown status, and unresolved blockers. Do not claim continued monitoring after the interaction ends unless a real persistent runtime explicitly provides it.

## Safety and boundaries

- Subagents never gain permissions beyond the user's instructions; do not run destructive actions without approval.
- No direct parallel writes to the same checkout, branch, files, database, environment, or shared external state. Isolation must be real, not merely a prompt instruction.
- Reconcile partially applied actions before retrying. Retries of non-idempotent operations require explicit proof of safety or approval.
- Keep verbose worker logs in worker contexts or artifacts; the parent stores **state, not worker history**.
- Do not skip a failed/blocked task silently to make the progress counter show 100%.
- Do not confuse an agent pool with the separate **kenmark-agents** inventory/cleanup skill.

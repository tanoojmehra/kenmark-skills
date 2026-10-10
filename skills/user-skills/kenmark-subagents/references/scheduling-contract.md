# Scheduling contract — kenmark-subagents v3

This document supplements SKILL.md and should be read when running a queued, multi-worker orchestration.

## State machine

~~~text
queued -> ready -> spawning -> running -> reported_done -> verifying -> done
  |        |         |          |              |           |
  |        |         |          |              +-----------+--> retry_wait -> ready
  |        |         |          +--> stopping -> failed / cancelled / retry_wait
  |        |         +--> queued / blocked (spawn refused)
  |        +--> blocked (approval/conflict/dependency)
  +--> blocked (dependency cycle/missing ID)

running/stopping -> stuck (cannot confirm termination; slot remains occupied)
~~~

- **queued:** accepted into ledger, not yet eligible.
- **ready:** prerequisites verified done, approvals present, write ownership available.
- **spawning/running:** slot and ownership reserved; worker ID recorded after successful spawn.
- **reported_done/verifying:** worker returned claimed success; orchestrator is checking evidence.
- **done:** acceptance verified, integration performed, required evidence recorded.
- **retry_wait:** prior attempt stopped and reconciled; next attempt is permitted and budgeted.
- **blocked:** needs dependency, human action, missing capability, or conflict resolution.
- **failed/cancelled:** terminal unsuccessful; not counted as completed.
- **stuck:** unconfirmed worker termination; retain capacity and ownership reservation.

The aggregate run is **complete** only if every task is done. All other drained states yield **incomplete**.

## Config interpretation

| Setting | Default | Operational meaning |
| --- | --- | --- |
| maxAgents | 4 | Upper bound on live worker attempts, including stopping/stuck workers |
| pooling | elastic | Fill freed slots immediately; batch waits for current wave |
| minIdleAgents | 0 | No idle worker sessions; each task receives a fresh context |
| scheduling | priority-fifo | critical > high > normal > low; enqueue order for ties |
| heartbeatMinutes | 3 | Poll/check *only* if native runtime exposes progress or wait events |
| softDeadlineMinutes | 10 | Nonfatal progress/scope checkpoint |
| hardDeadlineMinutes | 30 | Attempt to stop, recover, and reassess; never guaranteed delivery |
| maxAttempts | 2 | Max total attempts, counting the first |
 
User-provided global limits, task-level limits, and harness capabilities override defaults. Enforce the lower of configured cap and native harness concurrency. When the harness has no async wait, timers, cancellation or mid-run messages, label those features unavailable and never fake them.

## Scheduling example

Given maxAgents=2, pooling=elastic, tasks T001/T002/T003 independent and T004 dependent on T001:

1. Queue all four first. Reserve slots for T001 and T002; each gets a new worker.
2. T002 returns. Terminate it, release its slot, and spawn a **new** worker for T003 while T001 runs.
3. T001 returns. Verify its acceptance before marking done. Only now T004 may become ready and receive a new worker in the freed slot.
4. T003 completes. Reconcile/verify it. T004 completes and is verified. Confirm no live workers and all four done.
5. If T004 fails, retry within safe budget or report incomplete; do not mark the run complete.

Batch mode differs only in step 2: T003 waits until the first wave (T001 and T002) is terminal.

## Timeout and retry guardrail examples

- **Read-only research:** worker exceeds hard deadline, native cancellation confirms stop; reschedule smaller research task within remaining attempts.
- **Code writer in isolated worktree:** cancellation confirms stop; examine its worktree and commits, ensure no dangling integration, then dispatch a fresh worker with a corrected scope.
- **External payment/API mutation:** timeout after request submission with unknown outcome; do **not** retry automatically. Reconcile remote state or ask for approval.
- **Unkillable worker:** mark stuck, retain slot/ownership, and report inability to guarantee shutdown. Never double-book its files merely because it stopped reporting.
- **No subagent API:** build/report the queue and either decline actual delegated execution or explicitly use a local sequential non-subagent fallback if user intent allows; never pretend the pool ran.

## Live queue intake

While the orchestration session is active, new user tasks get a unique ID, acceptance criteria, priority and dependencies. Verify no duplicate or unsafe ownership overlap before making them ready. With mid-run input support, admit immediately; otherwise admit at the next tool turn or explicit checkpoint. A written SKILL.md alone cannot run a daemon or watch for future instructions while no agent invocation is active.

## Verification obligations

A worker's result envelope is only a proposal for acceptance. For code tasks, check relevant diffs and integration state, and run appropriate checks if the environment and permissions permit. For research, check evidence against the task question. For operational tasks, confirm observed remote state where possible. Record evidence or "not verifiable"; never turn a "not verifiable" outcome into verified done.

If further work is needed, generate a new child task ID with a recorded dependency rather than silently broadening a worker's original scope.

# Context orchestration

Last updated: 2026-10-10
Status: implemented

## Goal

Keep the primary agent fast and focused during long, queued, multi-part, research-heavy, or repo-wide work even when the upstream API does not provide useful prompt caching.

The design explicitly optimizes for **controller context size**, not minimum total token usage.

> The primary agent remembers state, not history.

## Architecture

```text
user
  |
  v
primary agent / controller
  |
  +-- small bounded task ----------------------> execute locally
  |
  +-- multi-part / queued / context-heavy ----> kenmark-context
                                                   |
                                                   +-- decompose dependency graph
                                                   +-- build minimal task capsules
                                                   +-- fresh worker contexts
                                                   +-- compact return envelopes
                                                   |
                                                   v
                                            controller integration
                                                   |
                                                   +-- state ledger
                                                   +-- final verification
                                                   +-- concise user report
```

## Native skills

### `kenmark-context`

Automatic, read-only context-budget policy.

Responsibilities:

- decide when delegation is worthwhile;
- split work into bounded outcomes;
- distinguish sequential isolation from safe parallelism;
- prevent full-conversation inheritance by default;
- enforce compact worker returns;
- keep a small task/dependency ledger;
- define fallback behavior when the harness has no true subagent primitive.

### `kenmark-subagents` v2 (historical baseline)

Earlier explicit deep orchestration workflow; superseded by v3 task scheduling below.

Changes from v1:

- fresh worker/context per meaningful bounded task;
- task-first workers for implementation, role-based tracks for investigation;
- required task capsule;
- required compact result envelope;
- sequential fresh-worker mode for shared state;
- central integration verification;
- explicit prohibition on returning verbose logs/history to the controller.

## Context contract

### Worker input

Workers receive only:

- bounded task and acceptance criteria;
- relevant file/module/spec pointers;
- required project rules;
- dependencies;
- explicit scope/safety constraints.

The full parent conversation is not copied unless genuinely required.

### Worker output

Default return envelope:

```yaml
status: done | blocked | failed
summary: <1-3 sentences>
files:
  - <path>
verification:
  - <check>: pass | fail | not-run
decisions:
  - <future-relevant only>
blockers:
  - <unresolved only>
commit: <sha or null>
artifact: <path/url or null>
```

Target size is roughly 150–500 tokens.

Verbose evidence should remain inside the worker or be stored as an artifact and referenced by path/URL.

## Execution policy

### Parallel

Use parallel workers for independent read-only tracks or write tasks with clearly non-overlapping file/state ownership.

### Sequential isolated

Use fresh workers sequentially when tasks share repository state or may edit overlapping files.

This retains context isolation without introducing git/file races.

### Local

Keep tiny or tightly coupled work in the controller when delegation overhead is larger than the task.

## Workflow integration

### Plans

`kenmark-plans-execute` v1.1 classifies phases before implementation and can delegate bounded phases/tasks. It keeps a compact phase/task status ledger and re-reads current repository state before dependent work.

### Issues

`kenmark-issues-fix-and-ship` v1.2 builds a dependency table and prefers one fresh worker per bounded issue where useful. Coverage/testing issues that depend on several fixes run after those fixes integrate.

### Project initialization

`kenmark-init` v1.4 adds a short context-efficiency rule to generated pointer stubs and the default `brain/rules/standards.md` template so the behavior is persistent across supported harnesses.

The always-loaded instruction stays intentionally small; the detailed mechanism lives in the skills.

## Optional third-party complement

Catalog v14 adds Addy Osmani's `context-engineering` skill as an optional global pack.

It complements native Kenmark orchestration with deeper guidance on:

- selective context loading;
- context hierarchy/budgeting;
- compression/trimming;
- restartable session boundaries.

It is **not** a replacement for `kenmark-context` and is not selected by default.

## Safety

- Delegation never expands user-approved scope.
- Manual ship/orchestration skills remain explicit.
- Parallel writers must not race on the same files/state.
- The controller owns final verification.
- Worker test results can become stale after later mutations.
- Repository files, trackers, commits, and artifacts remain the source of truth.

## Expected tradeoff

Total token usage may increase because fresh workers independently load focused context.

That is intentional when it reduces repeated processing of a large parent conversation and keeps the main session responsive through long queues of work.

## kenmark-subagents v3 — task-first elastic worker pool (2026-10-10)

The v2 guidance did not prescribe actual queue dispatch, agent caps, deadline recovery or whole-queue completion. The v3 skill adds a bounded scheduler:

- **Decompose first:** create and show all task IDs, priorities, acceptance criteria, dependencies and write ownership before starting workers.
- **One fresh worker per task attempt:** no recycled worker context. A pool slot (not the worker) is reused after an agent exits.
- **Concurrency and intake:** configurable `maxAgents` (default 4), `pooling: elastic|batch` (elastic default), FIFO within priority, queue refill when workers finish, and task additions while running when the harness supports it.
- **Supervision:** configurable heartbeat, soft/hard time budgets, safe capped retry (2 total attempts), worker cancellation/confirmation, and stuck worker slots that cannot be overbooked.
- **Acceptance:** worker reported success is not completion; the controller verifies outcomes and integration, then marks `done`. The run is `complete` only when every queued task is verified done.
- **Write safety:** parallel mutations require isolated worktrees/branches and non-overlapping file/external state ownership; otherwise serialize.
- **Honest capability fallback:** SKILL.md cannot itself provide timers, daemons, concurrent worker APIs, termination, or future monitoring. It must disclose unsupported harness capabilities rather than claim them.

Detailed transitions, configuration, examples and failure recovery: `skills/user-skills/kenmark-subagents/references/scheduling-contract.md`.

The v2 worker capsule/compact-return ideas remain intact; `kenmark-context` still supplies automatic context budgeting for non-explicit delegation.

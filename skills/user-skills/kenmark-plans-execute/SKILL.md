---
name: kenmark-plans-execute
version: 1.1.1
category: plans
scope: universal
phase: ship
description: "Manual end-to-end ship workflow. Use only when the user explicitly asks to execute an approved plan / implement plan phases and ship."
triggers:
  - execute plan
  - run the plan
  - implement plan
  - ship plan
  - kenmark-plans-execute
  - build from plan
  - execute plans
allowed-tools:
  - Task
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
  - TodoWrite
risk: git-write
disable-model-invocation: true
---

# Kenmark Plans Execute

## Purpose

Orchestrate plan-to-production workflow in repos that use `brain/plans/`:

```text
select plan → in-progress → implement phases → verify → archive → commit/push
```

Load sibling skills for each phase:

| Phase | Skill |
| --- | --- |
| Context / decomposition | `kenmark-context` (automatic policy; fresh workers when useful) |
| Author plans | `kenmark-plan` |
| Verify / archive | `kenmark-tracker-check` |
| Index health | `kenmark-tracker-maintain` (when INDEX disagrees with folders) |
| Related issues | `kenmark-tracker-check` (when plan lists `related_issues`) |
| KB sync | `kenmark-kb-sync` |
| Commit / push | `kenmark-commit` |

---

## Hard rules (non-negotiable)

1. **Read first:** `brain/rules/standards.md`, `brain/plans/INDEX.md`, and `brain/rules/workflow.md` when present.
2. **Global plan IDs:** never reuse IDs; compute next ID from INDEX + active + `completed/` (see `kenmark-plan`).
3. **Feature branch:** never commit on protected branches unless the user explicitly approves.
4. **No co-author trailers** — verify each commit with `git log -1 --format=%B`.
5. **No force push**, **no `--no-verify`**, **no git config** changes.
6. **Knowledge consistency gate** — after verification compare existing canonical KB against durable facts; edit only if documented knowledge changed, otherwise report `KB already consistent`.
7. **Confirm large or risky work** — pause when a phase touches many unrelated paths or changes public API surface.
8. **Keep controller context lean** — for separable phases/tasks, use fresh bounded workers with task capsules and compact return envelopes; retain task state, not worker history.
9. **Plan status gate** — no implementation edit until the plan file reads `status: in-progress` and `INDEX.md` lists it under In progress. Verify with `grep '^status:'` at the start of Phase 3; a plan that still says `proposed`/`approved` during implementation is a governance skip, not a style choice.

---

## Phase 0 — Preconditions

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
test -f "$REPO_ROOT/brain/plans/INDEX.md" || echo "STOP: run kenmark-tracker-setup first"
git rev-parse --abbrev-ref HEAD
git status --short
```

If `INDEX.md` is missing, run `kenmark-tracker-setup` or stop. If INDEX ledger disagrees with folders, run `kenmark-tracker-maintain` first.

---

## Phase 1 — Select plan

1. If the user named a plan ID, load `brain/plans/{id}-*.md`.
2. Otherwise list **approved** and **in-progress** plans from `INDEX.md` and ask which to execute.
3. Prefer `approved` over `proposed`. Do not execute `proposed` plans without user approval to start.

```bash
PLANS_DIR="$(git rev-parse --show-toplevel)/brain/plans"
ls "$PLANS_DIR"/[0-9]*.md 2>/dev/null
```

Output a short summary: plan ID, title, tier, phases, files likely touched.

---

## Phase 2 — Mark in progress (blocking gate)

Phase 3 must not start until this phase is verifiably complete. The plan file and `INDEX.md` are the evidence; a plan still marked `proposed` or `approved` during implementation means governance was skipped.

1. Set `status: in-progress` in plan frontmatter.
2. Move entry in `INDEX.md` from Approved (or Proposed) to **In progress** table.
3. Set `approved: YYYY-MM-DD` if not already set.
4. Confirm both edits landed before continuing:

```bash
PLAN_FILE=brain/plans/{id}-{slug}.md
grep -n '^status:' "$PLAN_FILE"        # expected: status: in-progress
grep -n '{id}' brain/plans/INDEX.md    # expected: row under the In progress table
```

---

## Phase 3 — Implement phases (feature branch)

### Pre-implementation gate (blocking)

Re-read the plan frontmatter before the first code edit and stop if Phase 2 did not land:

```bash
PLAN_FILE=brain/plans/{id}-{slug}.md
grep -q '^status: in-progress' "$PLAN_FILE" \
  || echo "STOP: plan is not in-progress — complete Phase 2 (status + INDEX In progress row) before editing code"
```

If this prints `STOP`, finish Phase 2 first (or self-correct now and note the correction in the report). Do not implement against a `proposed`/`approved` plan.

### Branch safety

Follow `kenmark-commit` branch rules. Create `feature/<plan-slug>` or `fix/<plan-slug>` when on a protected branch.

### Context-aware execution

Before implementing, classify the plan phases/tasks:

- **small/tightly coupled:** execute locally;
- **bounded + independent:** delegate to a fresh worker when the harness supports it;
- **bounded but shared-state:** use fresh workers sequentially;
- **read-only investigation:** parallelize when safe.

Use **kenmark-context** task capsules. Workers return only status, summary, files, verification, future-relevant decisions, blockers, and commit/artifact reference. Do not forward the full conversation or paste verbose worker logs back into the controller.

Keep a compact plan execution ledger: phase/task, status, dependency, commit/artifact, blocker. The plan file and repository remain the source of truth.

### Per-phase loop

For each phase in the plan file (in dependency order):

1. Read checklist items and `files:` hints.
2. Implement the **smallest correct change** per item.
3. After verification check whether durable canonical KB facts changed, otherwise leave KB untouched.
4. Run verification commands from the plan when listed.
5. Tick completed checklist items in the plan file (optional, for progress tracking).
6. After a delegated task returns, record only its compact state; inspect the current repo before starting dependent work.

**Pause gate:** if a phase touches >8 unrelated paths or changes public API, ask the user before proceeding.

---

## Phase 4 — Verify and archive

Follow `kenmark-tracker-check`:

1. Verify all acceptance criteria against the codebase.
2. Run plan verification commands.
3. Move file to `brain/plans/completed/`.
4. Set `status: done` and `completed: YYYY-MM-DD`.
5. Update `INDEX.md` — remove from In progress; add to Completed table.
6. Close related issues via `kenmark-tracker-check` when `related_issues` are listed and work is done.
7. Confirm the status transition was observable: if the plan never carried `status: in-progress` (the Phase 3 gate was skipped), state that in the report rather than archiving silently.

Skip `AskUserQuestion` when the user explicitly invoked this orchestrator and evidence is clear.

---

## Phase 5 — Pre-commit validation

Run repo quality gates when feasible (`npm run validate`, `typecheck`, `lint`, `test` per `package.json`).

---

## Phase 6 — Commit/push only after explicit user authorization

Only when authorized, use **`kenmark-commit`** to group changes (code + plan archive + any warranted KB).

Suggest PR when on a feature branch; merge only when the user explicitly requests.

---

## Phase 7 — Report

Report:

- Plan ID and title executed
- Phases completed
- Files changed
- Verification results
- Whether plan was archived
- Worker/delegation summary when used (task status + commit/artifact only)
- Suggested next steps (related plans, open issues)


## Brain 2.0 portable consistency contract

- Files and Git are canonical. Studio/MongoDB/indexing/embeddings/network are never required for this skill.
- Issues and plans keep investigations, hypotheses, tests, implementation history and milestones. KB contains verified durable knowledge, updated only after source evidence demonstrates an existing fact changed.
- On no-op KB checks report `KB already consistent`; do not append meaningless changelog entries.
- Positive numeric IDs use complete >=3-digit prefixes and scale beyond 999; never reuse a reserved number or delete history merely to reconcile an index.
- Coordinate concurrent tracker/KB writers and keep legacy Brain files unchanged by default; commit/push/merge only when authorized.

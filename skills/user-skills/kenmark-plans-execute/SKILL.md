---
name: kenmark-plans-execute
version: 1.0.0
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
| Author plans | `kenmark-plan-durable` |
| Verify / archive | `kenmark-plans-check` |
| Index health | `kenmark-plans-maintain` (when INDEX disagrees with folders) |
| Related issues | `kenmark-issues-check` (when plan lists `related_issues`) |
| KB sync | `kenmark-repo-kb` |
| Commit / push | `kenmark-commit` |

---

## Hard rules (non-negotiable)

1. **Read first:** `brain/rules/standards.md`, `brain/plans/INDEX.md`, and `brain/rules/workflow.md` when present.
2. **Global plan IDs:** never reuse IDs; compute next ID from INDEX + active + `completed/` (see `kenmark-plan-durable`).
3. **Feature branch:** never commit on protected branches unless the user explicitly approves.
4. **No co-author trailers** — verify each commit with `git log -1 --format=%B`.
5. **No force push**, **no `--no-verify`**, **no git config** changes.
6. **Code and KB move together** — update `brain/kb/` and `brain/CHANGELOG.md` for behavioral changes.
7. **Confirm large or risky work** — pause when a phase touches many unrelated paths or changes public API surface.

---

## Phase 0 — Preconditions

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
test -f "$REPO_ROOT/brain/plans/INDEX.md" || echo "STOP: run kenmark-plans-setup first"
git rev-parse --abbrev-ref HEAD
git status --short
```

If `INDEX.md` is missing, run `kenmark-plans-setup` or stop. If INDEX ledger disagrees with folders, run `kenmark-plans-maintain` first.

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

## Phase 2 — Mark in progress

1. Set `status: in-progress` in plan frontmatter.
2. Move entry in `INDEX.md` from Approved (or Proposed) to **In progress** table.
3. Set `approved: YYYY-MM-DD` if not already set.

---

## Phase 3 — Implement phases (feature branch)

### Branch safety

Follow `kenmark-commit` branch rules. Create `feature/<plan-slug>` or `fix/<plan-slug>` when on a protected branch.

### Per-phase loop

For each phase in the plan file (in order):

1. Read checklist items and `files:` hints.
2. Implement the **smallest correct change** per item.
3. Update impacted `brain/kb/` when behavior changes.
4. Run verification commands from the plan when listed.
5. Tick completed checklist items in the plan file (optional, for progress tracking).

**Pause gate:** if a phase touches >8 unrelated paths or changes public API, ask the user before proceeding.

---

## Phase 4 — Verify and archive

Follow `kenmark-plans-check`:

1. Verify all acceptance criteria against the codebase.
2. Run plan verification commands.
3. Move file to `brain/plans/completed/`.
4. Set `status: done` and `completed: YYYY-MM-DD`.
5. Update `INDEX.md` — remove from In progress; add to Completed table.
6. Close related issues via `kenmark-issues-check` when `related_issues` are listed and work is done.

Skip `AskUserQuestion` when the user explicitly invoked this orchestrator and evidence is clear.

---

## Phase 5 — Pre-commit validation

Run repo quality gates when feasible (`npm run validate`, `typecheck`, `lint`, `test` per `package.json`).

---

## Phase 6 — Commit and push

Use **`kenmark-commit`** to group changes (code + plan archive + KB).

Suggest PR when on a feature branch; merge only when the user explicitly requests.

---

## Phase 7 — Report

Report:

- Plan ID and title executed
- Phases completed
- Files changed
- Verification results
- Whether plan was archived
- Suggested next steps (related plans, open issues)

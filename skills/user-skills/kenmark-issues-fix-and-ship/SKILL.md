---
name: kenmark-issues-fix-and-ship
version: 1.0.0
category: workflow
scope: universal
phase: ship
description: "End-to-end orchestrator: parse issue candidates, scan/dedupe INDEX, fix on a feature branch, complete issues, kenmark-commit, and merge (PR default). Use for \"fix issues and ship\", \"issues fix and ship\", or full scan-fix-commit-merge workflows."
triggers:
  - fix issues and ship
  - issues fix and ship
  - kenmark-issues-fix-and-ship
  - scan fix commit merge
  - fix and ship issues
  - issue workflow ship
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
risk: git-write
disable-model-invocation: false
---

# Kenmark Issues Fix and Ship

## Purpose

Orchestrate the full issue-to-production workflow in repos that use `brain/issues/`:

```text
parse candidates → dedupe INDEX → create issues → fix loop → complete issues → commit/push → merge
```

Load sibling skills for each phase — do not reimplement their rules:

| Phase | Skill |
| --- | --- |
| Discover / file issues | `kenmark-issues-scan` |
| Verify / close issues | `kenmark-issues-check` |
| Index health | `kenmark-issues-maintain` (when INDEX disagrees with folders) |
| KB sync | `kenmark-repo-kb` |
| Commit / push | `kenmark-commit` |

See `references/workflow.md` for phase detail and `references/merge-safety.md` for branch policy.

---

## Hard rules

1. **Read first:** `brain/rules/standards.md`, `brain/issues/INDEX.md`, and `brain/rules/workflow.md` when present.
2. **Global issue IDs:** never reuse IDs; compute next ID from INDEX + active + `completed/` (see `kenmark-issues-scan`).
3. **Feature branch:** never commit directly to protected deployment branches unless the user explicitly approves after a CI/CD warning.
4. **No co-author trailers** in commits (see `kenmark-commit`).
5. **No force push**, **no `--no-verify`**, **no git config** changes.
6. **Code and KB move together** — update `brain/kb/` and `brain/CHANGELOG.md` for behavioral changes.
7. **Merge default:** open a PR; direct merge to `main`/`master` only when the user explicitly requests it.

---

## Phase 1 — Parse candidates and dedupe

1. Accept a blob (user message, scan notes, or pasted findings).
2. Read `brain/issues/INDEX.md` and list existing titles / IDs.
3. Drop duplicates of open or completed issues (same bug pattern or file).
4. Assign next IDs per `kenmark-issues-scan` ID ledger rules.

Output a short plan: candidate issues, IDs to assign, files likely touched.

---

## Phase 2 — Create issues

Follow `kenmark-issues-scan` Step 5–6:

- Write `brain/issues/{id}-{slug}.md` with frontmatter and acceptance criteria.
- Update `INDEX.md` ledger, counts, and priority tables.

---

## Phase 3 — Fix loop (feature branch)

1. **Branch safety** (see `kenmark-commit` Step 2): create `fix/` or `feature/` branch if on a protected branch or if the current branch name mismatches the work.
2. For each open issue (priority order P0 → P1 → P2):
   - Read issue evidence and `files:` hints.
   - Implement the smallest correct fix; match repo conventions.
   - Run quality gates when feasible: `pnpm typecheck`, `pnpm lint`, tests relevant to the change.
   - Update impacted `brain/kb/` files.
3. If INDEX drift appears (missing files, wrong counts), run `kenmark-issues-maintain` before closing issues.

---

## Phase 4 — Complete issues

Follow `kenmark-issues-check`:

1. Verify each fixed issue against the codebase (grep / read evidence paths).
2. Move resolved files to `brain/issues/completed/`.
3. Add `completed: YYYY-MM-DD` to frontmatter; update `INDEX.md` active/completed tables.
4. Skip AskUserQuestion when the user explicitly invoked this orchestrator for a full ship run and evidence is clear.

---

## Phase 5 — Commit and push

Invoke `kenmark-commit`:

- Group logical commits by area.
- Include `brain/` updates in the same push batch.
- Push with `-u origin HEAD` when no upstream exists.

---

## Phase 6 — Merge

**Default:** create a PR (`gh pr create`) with summary and test plan.

**Direct merge** only when the user explicitly says e.g. "merge to main" and accepts CI/CD may run:

1. Ensure PR checks pass or user waived them.
2. Merge via `gh pr merge` (squash or merge per repo convention).
3. Report PR URL and merge commit on the default branch.

Never force-push protected branches.

---

## Report

Return to the user:

- Issue IDs created and completed (with dates)
- Root cause and fix summary per bug
- Skill/files touched (if this workflow added skills or KB)
- Checks run (typecheck, lint, test)
- Branch, commit SHAs, PR URL, merge result

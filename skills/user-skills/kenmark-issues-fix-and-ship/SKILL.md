---
name: kenmark-issues-fix-and-ship
version: 1.1.0
category: workflow
scope: universal
phase: ship
description: "Manual end-to-end ship workflow. Use only when the user explicitly asks to fix issues and ship / run the full issues blob workflow."
triggers:
  - fix issues end to end
  - run the issues workflow
  - issues blob to merge
  - scan fix commit and merge
  - blob to merge
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
  - TodoWrite
risk: git-write
disable-model-invocation: true
---

# Kenmark Issues Fix and Ship

## Purpose

Orchestrate the full issue-to-production workflow in repos that use `brain/issues/`:

```text
parse blob → dedupe INDEX → create issues → fix loop → complete issues → commit/push → merge
```

Load sibling skills for each phase — do not reimplement their rules:

| Phase | Skill |
| --- | --- |
| Discover / file issues | `kenmark-issues-scan` |
| Verify / close issues | `kenmark-tracker-check` |
| Index health | `kenmark-tracker-maintain` (when INDEX disagrees with folders) |
| KB sync | `kenmark-kb-sync` |
| Commit / push | `kenmark-commit` |

See `references/workflow.md` for phase detail and `references/merge-safety.md` for branch policy.

---

## Hard rules (non-negotiable)

1. **Read first:** `brain/rules/standards.md`, `brain/issues/INDEX.md`, and `brain/rules/workflow.md` when present.
2. **Global issue IDs:** never reuse IDs; compute next ID from INDEX + active + `completed/` (see `kenmark-issues-scan`).
3. **Feature branch:** never commit on `main`, `master`, `dev`, `develop`, `staging`, or `production` unless the user explicitly approves after a CI/CD warning.
4. **No co-author trailers** — never add `Co-authored-by:`, `Made-with:`, or similar; verify each commit with `git log -1 --format=%B`.
5. **No force push**, **no `--no-verify`**, **no git config** changes.
6. **Code and KB move together** — update `brain/kb/` and `brain/CHANGELOG.md` for behavioral changes.
7. **Merge default:** open a PR; direct merge only when the user explicitly requests it.
8. **Stop if zero new issues** — when the blob yields no unique candidates after dedupe, report and stop before creating a feature branch.
9. **Confirm large or risky fixes** — when a fix touches many files (>8 unrelated paths) or changes a public API surface, pause and confirm with the user before committing.

---

## Phase 0 — Preconditions

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
test -f "$REPO_ROOT/brain/issues/INDEX.md" || echo "STOP: run kenmark-tracker-setup first"
git rev-parse --abbrev-ref HEAD
git status --short
```

If `INDEX.md` is missing, run `kenmark-tracker-setup` or stop. If INDEX ledger disagrees with folders, run `kenmark-tracker-maintain` before creating issues.

---

## Phase 1 — Parse blob and dedupe

1. Accept a blob (user message, pasted findings, scan notes, or bullet list).
2. Split into candidate issues — one bug/gap per candidate with title, evidence paths, and suggested fix.
3. Read `brain/issues/INDEX.md` and grep existing issue titles:

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel)/brain/issues"
grep -h "^title:" "$ISSUES_DIR"/*.md "$ISSUES_DIR/completed"/*.md 2>/dev/null | sort -u
```

4. Drop duplicates of open or completed issues (same bug pattern, same primary file, or same title).
5. Compute next IDs per `kenmark-issues-scan` ID ledger rules.

**Stop gate:** if zero unique candidates remain, report "no new issues from blob" and stop. Do not create a feature branch or empty commits.

Output a short plan: candidate issues, IDs to assign, files likely touched, estimated priority (P0/P1/P2).

---

## Phase 2 — Create issues

Follow `kenmark-issues-scan` Steps 5–6:

- Write `brain/issues/{id}-{slug}.md` with frontmatter (`id`, `title`, `severity`, `area`, `source: kenmark-issues-fix-and-ship`, `status: open`, `created`, `files`, `related`) and acceptance criteria.
- Update `INDEX.md` ledger (`Last Assigned ID`, `Next ID`), counts, and priority tables.

Set `status: in-progress` in frontmatter when starting fixes in Phase 3 (optional; revert to `open` if abandoning).

---

## Phase 3 — Fix loop (feature branch)

### Branch safety (before any code edit)

Follow `kenmark-commit` Step 2:

```bash
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
```

If on a protected branch or branch name mismatches the work, create:

```bash
git switch -c fix/<short-summary>
# or: git switch -c feature/<short-summary>
```

### Per-issue loop (P0 → P1 → P2)

For each open issue from this run (or all open if user asked to fix existing backlog):

1. Read issue `files:` and Evidence section.
2. Search codebase to confirm the bug still exists.
3. Implement the **smallest correct fix**; match repo naming and patterns.
4. Update impacted `brain/kb/` files when behavior, API, schema, auth, UI, deploy, or workflow changed.
5. Run quality gates when feasible (detect from `package.json` scripts):

```bash
pnpm typecheck   # or npm run typecheck / yarn typecheck
pnpm lint        # or npm run lint
pnpm test        # when tests exist and cover the change
```

6. If INDEX drift appears, run `kenmark-tracker-maintain` before closing issues.

**Pause gate:** if a single fix touches >8 unrelated file paths or changes a public API (exported types, route contracts, env vars), ask the user to confirm before proceeding.

---

## Phase 4 — Complete issues

Follow `kenmark-tracker-check`:

1. Verify each fixed issue against the codebase (grep / read evidence paths).
2. Move resolved files to `brain/issues/completed/`.
3. Add `completed: YYYY-MM-DD` and `status: completed` to frontmatter; update `INDEX.md` active/completed tables.
4. Skip `AskUserQuestion` when the user explicitly invoked this orchestrator for a full ship run and evidence is clear.
5. Run `kenmark-tracker-maintain` if counts or ledger drift after bulk closes.

---

## Phase 5 — Pre-commit validation

Before invoking `kenmark-commit`, run repo validation:

```bash
pnpm typecheck && pnpm lint
# Add pnpm test when the repo has meaningful tests for touched areas
```

Report failures honestly; fix or ask the user before committing.

---

## Phase 6 — Commit and push

Invoke `kenmark-commit`:

- Group logical commits by area (code + matching `brain/` in same batch).
- Never stage `.env`, credentials, or secrets.
- After each commit: `git log -1 --format=%B` — abort if co-author trailers appear.
- Push with `-u origin HEAD` when no upstream exists.

---

## Phase 7 — Merge

**Default (PR-first):**

```bash
gh pr create --title "fix: <summary>" --body "$(cat <<'EOF'
## Summary
- <issue IDs and fixes>

## Test plan
- [ ] typecheck
- [ ] lint
- [ ] manual verification of <area>
EOF
)"
```

Ask the user to confirm merge target every time:

```
Merge target?
A) Open PR only (recommended)
B) Merge PR to main/master after CI
C) Direct merge to <branch> — I understand CI/CD may run
```

**Direct merge** only when the user explicitly chooses C and names the branch. See `references/merge-safety.md`.

Before merge:

1. Ensure PR checks pass or user waived them.
2. Merge via `gh pr merge` (squash or merge per repo convention).
3. Never force-push protected branches.

---

## Report

Return to the user:

| Item | Detail |
| --- | --- |
| Issues created | IDs and titles |
| Issues completed | IDs with completion dates |
| Fixes | Root cause + fix summary per bug |
| Checks | typecheck, lint, test — pass/fail |
| Git | branch, commit SHAs + subjects |
| Ship | PR URL, merge result (if merged) |
| KB | `brain/kb/` and `CHANGELOG.md` files updated |

---

## Quick reference — do / don't

| Do | Don't |
| --- | --- |
| Feature branch off protected branches | Commit directly on `main`/`dev` |
| Dedupe blob against INDEX + completed | Create duplicate issues |
| Stop when blob yields zero new issues | Open empty PRs |
| `git log -1 --format=%B` after each commit | Co-authored-by trailers |
| PR by default | Force-push protected branches |
| Confirm large/API-breaking fixes | Silent wide refactors |
| `kenmark-commit` grouping rules | `git add -A` blindly |

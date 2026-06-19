---
name: kenmark-tracker-check
version: 1.0.0
category: workflow
scope: universal
phase: verify
description: "Check open issues in brain/issues/ and/or active plans in brain/plans/ against the codebase. If items have been fully resolved by recent work, move them to completed/ and update INDEX.md. Accepts a tracker-type parameter (issues, plans, or both). Requires INDEX.md from kenmark-tracker-setup or kenmark-init. Use when asked to check issues, check if issues are done, sync issues, update issues index, check plans, check if plans are done, sync plans, or update plans index."
triggers:
  - check issues
  - check if issues are done
  - sync issues
  - update issues index
  - issues check
  - check plans
  - check if plans are done
  - sync plans
  - update plans index
  - plans check
  - check trackers
  - sync trackers
  - kenmark-tracker-check
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
risk: write-files
disable-model-invocation: true
---

# Kenmark Tracker Check

## Purpose

Read all open issues in `brain/issues/` and/or active plans in `brain/plans/`, check whether the described problem has been resolved or acceptance criteria met by recent code changes, and if so move the item to `brain/{tracker}/completed/` and update `INDEX.md`.

Accepts a `tracker-type` parameter:
- `issues` — check only issues
- `plans` — check only plans
- `both` (default) — check both

If `INDEX.md` is missing for a tracker, stop and run **`kenmark-tracker-setup`** (or **`kenmark-init`**) first.

---

## Step 1 — Find all open items

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
ISSUES_DIR="$REPO_ROOT/brain/issues"
PLANS_DIR="$REPO_ROOT/brain/plans"
```

For each enabled tracker:

```bash
# Issues
find "$ISSUES_DIR" -maxdepth 1 -name "*.md" -not -path "*/completed/*" -not -name "INDEX.md" | sort

# Plans
find "$PLANS_DIR" -maxdepth 1 -name "[0-9][0-9][0-9]-*.md" -not -name "INDEX.md" 2>/dev/null | sort
```

Parse each file to get its `id`, `title`, and `status`.

---

## Step 2 — Check each item against the codebase

### For issues

Search the codebase for evidence that the problem described in the issue has been fixed. Use Grep to find relevant code patterns.

Key search targets per issue type (adapt paths to this repo):

| Issue type | What to search |
|------------|----------------|
| API routes | Paths from issue `files:` or discovered `**/api/**`, `**/routes/**` |
| UI | Component/page paths from `files:` or `**/components/**`, `**/pages/**` |
| Background jobs | Worker/service dirs from `files:` or `**/worker/**`, `**/jobs/**` |
| Schema / DSL | Schema or config dirs from `files:` or `**/schema/**`, `**/migrations/**` |
| Database | Migration folders (`**/migrations/**`, `**/prisma/**`, `**/db/**`) |
| Tests | Mirrored `*.test.*` / `*.spec.*` next to sources listed in `files:` |

Evidence that an issue is resolved:
- The old/buggy code no longer exists (search returns nothing)
- The new/correct code exists and looks right
- Tests pass that previously failed or were missing

### For plans

For each active plan (`proposed`, `approved`, or `in-progress`):

1. Read the **Acceptance criteria** section and phased checklist.
2. Search the codebase using paths from `files:` frontmatter and plan body.
3. Run verification commands listed in the plan when present.

Evidence that a plan is complete:
- All acceptance criteria checkboxes are satisfied in the codebase
- Verification commands pass
- Related issues (if any) are closed

Skip plans still in `proposed` unless the user asked to close them explicitly.

---

## Step 3 — Confirm before archiving

For each item that appears resolved, use AskUserQuestion:

### For issues

```
D<N> — Close issue #{id}?
Issue: {title}
Evidence: {what you found in the codebase}
ELI10: We think this bug is fixed. Confirm before archiving it so we don't
lose context if it isn't actually fixed.
Stakes if we pick wrong: A resolved-but-not-fix issue stays open — low cost.
A not-resolved issue that gets closed loses tracking — high cost.
Recommendation: A — close and archive if evidence is clear.
Note: options differ in kind, not coverage — no completeness score.
A) Close and archive (recommended)
B) Keep open — evidence is inconclusive
C) Skip — not enough context to decide
```

### For plans

```
D<N> — Archive plan #{id}?
Plan: {title} (tier: {tier})
Evidence: {what you found}
Recommendation: Archive if all acceptance criteria are met.
A) Archive to completed/ (recommended)
B) Keep active — evidence inconclusive
C) Skip — not enough context
```

---

## Step 4 — Move the item file

```bash
# For issues
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"
COMPLETED_DIR="$ISSUES_DIR/completed"
mkdir -p "$COMPLETED_DIR"
# mv "$ISSUES_DIR/{filename}" "$COMPLETED_DIR/{filename}"

# For plans
PLANS_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/plans"
COMPLETED_DIR="$PLANS_DIR/completed"
mkdir -p "$COMPLETED_DIR"
# mv "$PLANS_DIR/{filename}" "$COMPLETED_DIR/{filename}"
```

Update frontmatter:
- For issues: `status: completed`, `completed: YYYY-MM-DD`
- For plans: `status: done` (or `superseded` / `cancelled` if user specifies), `completed: YYYY-MM-DD`

---

## Step 5 — Update INDEX.md

For each archived item:

1. Remove it from the active tables
2. Add it to the Completed table with today's date
3. Update the counts
4. Do not decrement `Last Assigned ID`

## ID preservation rule

When closing an item:
- Keep the same ID.
- Move the file to `brain/{tracker}/completed/`.
- Do not renumber items.
- Do not reuse the completed ID for a new item.
- Update `INDEX.md` Completed table and counts.

---

## Step 6 — Report

Report:
- How many items checked
- How many closed/archived
- How many remain open/active
- Any items where evidence was inconclusive (kept open/active)

---
name: kenmark-issues-check
version: 1.0.0
category: issues
scope: universal
phase: verify
description: "Check open issues in brain/issues/ against the codebase. If an issue has been fully resolved by recent work, move it to brain/issues/completed/ and update INDEX.md. Use when asked to \"check issues\", \"check if issues are done\", \"sync issues\", or \"update issues index\"."
triggers:
  - check issues
  - check if issues are done
  - sync issues
  - update issues index
  - issues check
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Issues Check — Verify and Close Resolved Issues

## Purpose

Read all open issues in `brain/issues/`, check whether the described problem
has been resolved by recent code changes, and if so move the issue to
`brain/issues/completed/` and update `INDEX.md`.

---

## Step 1 — Find all open issues

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"
echo "ISSUES_DIR=$ISSUES_DIR"
find "$ISSUES_DIR" -maxdepth 1 -name "*.md" -not -path "*/completed/*" -not -name "INDEX.md" | sort
```

Parse each issue file to get its `id`, `title`, and `status`.

---

## Step 2 — Check each issue against the codebase

For each open issue, search the codebase for evidence that the problem described
in the issue has been fixed. Use Grep to find relevant code patterns.

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

---

## Step 3 — Confirm before closing

For each issue that appears resolved, use AskUserQuestion:

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

---

## Step 4 — Move the issue file

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"
COMPLETED_DIR="$ISSUES_DIR/completed"
mkdir -p "$COMPLETED_DIR"
# Move: mv "$ISSUES_DIR/{filename}" "$COMPLETED_DIR/{filename}"
```

---

## Step 5 — Update INDEX.md

For each closed issue:

1. Remove it from the "Active Issues" table
2. Add it to the "Completed Issues" table with today's date
3. Update the counts

Read INDEX.md first, then edit to reflect the completed issue.

---

## Step 6 — Report

Report:
- How many issues checked
- How many closed
- How many remain open
- Any issues where evidence was inconclusive (kept open)

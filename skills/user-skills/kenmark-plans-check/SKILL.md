---
name: kenmark-plans-check
version: 1.0.0
category: plans
scope: universal
phase: verify
description: "Check active plans in brain/plans/ against the codebase. If acceptance criteria are met, move the plan to brain/plans/completed/ and update INDEX.md. Requires brain/plans/INDEX.md from kenmark-plans-setup or kenmark-init. Use when asked to \"check plans\", \"check if plans are done\", \"sync plans\", or \"update plans index\"."
triggers:
  - check plans
  - check if plans are done
  - sync plans
  - update plans index
  - plans check
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

# Kenmark Plans Check

## Purpose

Read all active plans in `brain/plans/`, verify whether acceptance criteria
have been met by recent code changes, and if so move the plan to
`brain/plans/completed/` and update `INDEX.md`.

If `INDEX.md` is missing, stop and run **`kenmark-plans-setup`** (or **`kenmark-init`**) first.

---

## Step 1 — Find all active plans

```bash
PLANS_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/plans"
echo "PLANS_DIR=$PLANS_DIR"
find "$PLANS_DIR" -maxdepth 1 -name "[0-9][0-9][0-9]-*.md" -not -name "INDEX.md" 2>/dev/null | sort
```

Use pattern `[0-9][0-9][0-9]-*.md` for plan files.

Parse each plan file to get its `id`, `title`, `status`, `tier`, and acceptance criteria checklist.

---

## Step 2 — Check each plan against the codebase

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

For each plan that appears complete, use AskUserQuestion:

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

## Step 4 — Move the plan file

```bash
PLANS_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/plans"
COMPLETED_DIR="$PLANS_DIR/completed"
mkdir -p "$COMPLETED_DIR"
# mv "$PLANS_DIR/{filename}" "$COMPLETED_DIR/{filename}"
```

Update frontmatter:

- `status: done` (or `superseded` / `cancelled` if user specifies)
- `completed: YYYY-MM-DD`

---

## Step 5 — Update INDEX.md

For each archived plan:

1. Remove it from the Proposed / Approved / In progress tables
2. Add it to the Completed Plans table with today's date
3. Update overview counts
4. Do not decrement `Last Assigned ID`

---

## ID preservation rule

When archiving a plan:

- Keep the same ID.
- Move the file to `brain/plans/completed/`.
- Do not renumber or reuse IDs.
- Update `INDEX.md` Completed table and counts.

---

## Step 6 — Report

Report:

- How many plans checked
- How many archived
- How many remain active
- Any plans where evidence was inconclusive (kept active)

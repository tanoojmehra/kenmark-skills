---
name: kenmark-plans-maintain
version: 1.0.0
category: plans
scope: universal
phase: maintain
description: "Audit brain/plans/ for structural health: missing files, duplicate IDs across open/completed, stale frontmatter (wrong status), INDEX.md drift from reality, and orphaned completed plans never added to INDEX. Use when asked to \"check plans health\", \"audit plans\", \"fix plans tracking\", or \"plans maintenance\"."
triggers:
  - plans health
  - check plans tracking
  - audit plans
  - fix plans tracking
  - plans maintenance
  - fix duplicate plans
  - plans cleanup
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
risk: destructive-possible
disable-model-invocation: false
---

# Kenmark Plans Maintain

## Purpose

Audit and fix structural problems in `brain/plans/` tracking:

1. **Duplicates** — same plan ID in both `brain/plans/` and `brain/plans/completed/`
2. **INDEX drift** — INDEX says completed but file is still active (or vice versa)
3. **Missing frontmatter** — required fields (`id`, `title`, `tier`, `type`, `status`) missing or invalid
4. **Orphan completed** — files in `completed/` not listed in INDEX Completed table

---

## Step 1 — Enumerate all plan IDs

```bash
PLANS_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/plans"

ls "$PLANS_DIR"/[0-9]*.md 2>/dev/null | xargs -I{} basename {} .md | \
  sed 's/-.*//' | sort -n > /tmp/open_plan_ids.txt

ls "$PLANS_DIR/completed"/[0-9]*.md 2>/dev/null | xargs -I{} basename {} .md | \
  sed 's/-.*//' | sort -n > /tmp/completed_plan_ids.txt

echo "ACTIVE count: $(wc -l < /tmp/open_plan_ids.txt)"
echo "COMPLETED count: $(wc -l < /tmp/completed_plan_ids.txt)"
```

---

## Step 1.5 — Global ID ledger check

```bash
PLANS_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/plans"

{
  find "$PLANS_DIR" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" \
    -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  find "$PLANS_DIR/completed" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" \
    -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  grep -Eo '\b[0-9]{3}\b' "$PLANS_DIR/INDEX.md" 2>/dev/null
} | grep -E '^[0-9]{3}$' | sort -n | uniq > /tmp/all_plan_ids.txt

echo "Highest ID (all sources): $(tail -1 /tmp/all_plan_ids.txt 2>/dev/null || echo none)"
grep -E 'Last Assigned ID|Next ID' "$PLANS_DIR/INDEX.md" 2>/dev/null || echo "ID Ledger section missing"
```

If `Last Assigned ID` is lower than any observed plan ID, update it to the highest observed ID and set `Next ID` to highest + 1 (3-digit zero-padded). Never reuse or decrement IDs.

---

## Step 2 — Detect duplicate IDs

```bash
comm -12 /tmp/open_plan_ids.txt /tmp/completed_plan_ids.txt
```

For each duplicate, keep the copy matching frontmatter `status:` (`done`/`superseded`/`cancelled` → completed folder; active statuses → open folder).

---

## Step 3 — Frontmatter validation

Required fields: `id`, `title`, `tier`, `type`, `status`.

Valid `tier`: `quick`, `prototype`, `full-feature`, `dig-deep`, `ultrathink`

Valid `status` (active folder): `proposed`, `approved`, `in-progress`

Valid `status` (completed folder): `done`, `superseded`, `cancelled`

Cross-check folder vs status:

- Active folder must not contain `done`/`superseded`/`cancelled`
- Completed folder must contain terminal statuses only

---

## Step 4 — INDEX drift

Reconcile INDEX status tables (Proposed, Approved, In progress, Completed) with actual files on disk. Add missing entries; remove stale entries.

---

## Step 5 — Summary report

```
PLANS MAINTENANCE REPORT — {date}
════════════════════════════════════════════════════════════════════
Active plans:     {N}  (brain/plans/)
Completed plans:  {N}  (brain/plans/completed/)

HEALTH:
  Duplicates (active+completed): {N}
  INDEX drift:                   {N}
  Missing/invalid frontmatter:   {N}
  Orphan completed:              {N}
  Untracked active:              {N}

RECOMMENDED ACTIONS:
  1. [specific fixes]
════════════════════════════════════════════════════════════════════
```

---

## Step 6 — Apply fixes

- **Duplicate removal**: remove the wrong copy
- **Status fix**: edit frontmatter `status:`
- **Move to completed**: `mv brain/plans/<file> brain/plans/completed/`
- **INDEX update**: move plan ID between status tables in `brain/plans/INDEX.md`

---

## Hard Rules

1. **Never delete a plan file without understanding why it exists**
2. **INDEX.md is the source of truth for the ID ledger** — preserve highest ID; never reuse IDs
3. **Commit plan tracker fixes separately** from code changes when possible

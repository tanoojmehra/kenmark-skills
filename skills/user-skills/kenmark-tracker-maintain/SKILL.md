---
name: kenmark-tracker-maintain
version: 1.0.0
category: workflow
scope: universal
phase: maintain
description: "Audit brain/issues/ and/or brain/plans/ for structural health: missing files, duplicate IDs across open/completed, stale frontmatter (wrong status), INDEX.md drift from reality, and orphaned completed items never added to INDEX. Accepts a tracker-type parameter (issues, plans, or both). Use when asked to check issues health, audit issues, fix issues tracking, issues maintenance, check plans health, audit plans, fix plans tracking, or plans maintenance."
triggers:
  - issues health
  - check issues tracking
  - audit issues
  - fix issues tracking
  - issues maintenance
  - fix duplicate issues
  - issues cleanup
  - plans health
  - check plans tracking
  - audit plans
  - fix plans tracking
  - plans maintenance
  - fix duplicate plans
  - plans cleanup
  - tracker health
  - audit trackers
  - fix tracker tracking
  - tracker maintenance
  - kenmark-tracker-maintain
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
risk: destructive-possible
disable-model-invocation: true
---

# Kenmark Tracker Maintain

## Purpose

**Default mode: report-only.** Do not delete, move, or rewrite tracker files until the user approves a specific repair plan.

Audit and fix structural problems in `brain/issues/` and/or `brain/plans/` tracking. This skill catches the four categories of drift that accumulate over time:

1. **Duplicates** — same ID exists in both the active folder and `completed/`
2. **INDEX drift** — INDEX.md says completed but file is still active, or says open but file only exists in `completed/`
3. **Missing frontmatter** — files missing required frontmatter fields or with invalid values
4. **Orphan completed** — files in `completed/` not listed in INDEX.md Completed table

Accepts a `tracker-type` parameter:
- `issues` — maintain only issues
- `plans` — maintain only plans
- `both` (default) — maintain both

---

## Step 1 — Enumerate all IDs

For each enabled tracker:

```bash
TRACKER_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/{tracker}"

# All IDs in active folder
ls "$TRACKER_DIR"/[0-9]*.md 2>/dev/null | xargs -I{} basename {} .md | \
  sed 's/-.*//' | sort -n > /tmp/open_{tracker}_ids.txt

# All IDs in completed folder
ls "$TRACKER_DIR/completed"/[0-9]*.md 2>/dev/null | xargs -I{} basename {} .md | \
  sed 's/-.*//' | sort -n > /tmp/completed_{tracker}_ids.txt

echo "ACTIVE count: $(wc -l < /tmp/open_{tracker}_ids.txt)"
echo "COMPLETED count: $(wc -l < /tmp/completed_{tracker}_ids.txt)"
```

### Global ID ledger check

```bash
TRACKER_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/{tracker}"

{
  find "$TRACKER_DIR" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" \
    -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  find "$TRACKER_DIR/completed" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" \
    -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  grep -Eo '\b[0-9]{3}\b' "$TRACKER_DIR/INDEX.md" 2>/dev/null
} | grep -E '^[0-9]{3}$' | sort -n | uniq > /tmp/all_{tracker}_ids.txt

echo "Highest ID (all sources): $(tail -1 /tmp/all_{tracker}_ids.txt 2>/dev/null || echo none)"
grep -E 'Last Assigned ID|Next ID' "$TRACKER_DIR/INDEX.md" 2>/dev/null || echo "ID Ledger section missing"
```

If `Last Assigned ID` is lower than any observed ID, update it to the highest observed ID and set `Next ID` to highest + 1 (3-digit zero-padded). Never reuse or decrement IDs.

---

## Step 2 — Detect duplicate IDs

```bash
comm -12 /tmp/open_{tracker}_ids.txt /tmp/completed_{tracker}_ids.txt
```

Any output = that ID exists in both folders. For each duplicate:
- If the item is truly **completed**: the active file is wrong — delete it
- If the item is truly **open**: the completed copy is wrong — delete it
- When in doubt, check the file's frontmatter `status:` field

---

## Step 3 — Frontmatter validation

### For issues

Required fields: `id`, `title`, `severity`, `area`, `status`.

Valid `severity`: `P0`, `P1`, `P2`

Valid `status` (active folder): `open`

Valid `status` (completed folder): `completed`

Cross-check folder vs status:
- Active folder must not contain `status: completed`
- Completed folder must contain `status: completed`

### For plans

Required fields: `id`, `title`, `tier`, `type`, `status`.

Valid `tier`: `quick`, `prototype`, `full-feature`, `dig-deep`, `ultrathink`

Valid `status` (active folder): `proposed`, `approved`, `in-progress`

Valid `status` (completed folder): `done`, `superseded`, `cancelled`

Cross-check folder vs status:
- Active folder must not contain `done`/`superseded`/`cancelled`
- Completed folder must contain terminal statuses only

---

## Step 4 — INDEX drift

Reconcile INDEX status tables with actual files on disk. Add missing entries; remove stale entries.

---

## Step 5 — Summary report

```
TRACKER MAINTENANCE REPORT — {date} ({tracker})
════════════════════════════════════════════════════════════════════
Active items:     {N}  (brain/{tracker}/)
Completed items:  {N}  (brain/{tracker}/completed/)

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
- **Move to completed**: `mv brain/{tracker}/<file> brain/{tracker}/completed/`
- **INDEX update**: move ID between status tables in `brain/{tracker}/INDEX.md`

---

## Hard Rules

1. **Never delete a file without understanding why it exists**
2. **INDEX.md is the source of truth for the ID ledger** — preserve highest ID; never reuse IDs
3. **Commit tracker fixes separately** from code changes when possible

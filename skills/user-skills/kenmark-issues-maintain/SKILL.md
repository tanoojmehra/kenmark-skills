---
name: kenmark-issues-maintain
version: 1.2.0
category: issues
scope: universal
phase: maintain
description: "Audit brain/issues/ for structural health: missing files, duplicate IDs across open/completed, stale frontmatter (wrong status), INDEX.md drift from reality, and orphaned completed issues never added to INDEX. Use when asked to \"check issues health\", \"audit issues\", \"fix issues tracking\", or \"issues maintenance\"."
triggers:
  - issues health
  - check issues tracking
  - audit issues
  - fix issues tracking
  - issues maintenance
  - fix duplicate issues
  - issues cleanup
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

# Kenmark Issues Maintain

## Purpose

Audit and fix structural problems in `brain/issues/` tracking. This skill
catches the four categories of drift that accumulate over time:

1. **Duplicates** — same issue ID exists in both `brain/issues/` (open) and
   `brain/issues/completed/` (completed) — one must be removed
2. **INDEX drift** — INDEX.md says an issue is completed but the file is still
   in `brain/issues/`, or says open but file only exists in `completed/`
3. **Missing fronts matter** — issue files missing required frontmatter fields
   (id, title, severity, area, status) or with invalid values
4. **Orphan completed** — files in `completed/` not listed in INDEX.md
   Completed table

---

## Step 1 — Enumerate all issue IDs

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"

# All IDs in open folder
ls "$ISSUES_DIR"/[0-9]*.md 2>/dev/null | xargs -I{} basename {} .md | \
  sed 's/-.*//' | sort -n > /tmp/open_ids.txt

# All IDs in completed folder
ls "$ISSUES_DIR/completed"/[0-9]*.md 2>/dev/null | xargs -I{} basename {} .md | \
  sed 's/-.*//' | sort -n > /tmp/completed_ids.txt

# IDs marked completed in INDEX.md
grep '^\[0' "$ISSUES_DIR/INDEX.md" | sed 's/.*\[\(.*\)\](.*/\1/' | \
  sed 's/^0*//' | grep '^[0-9]' | sort -n > /tmp/index_completed_ids.txt

echo "OPEN count: $(wc -l < /tmp/open_ids.txt)"
echo "COMPLETED count: $(wc -l < /tmp/completed_ids.txt)"
echo "INDEX completed count: $(wc -l < /tmp/index_completed_ids.txt)"
```

---

## Step 1.5 — Global ID ledger check

Collect IDs from:

- `INDEX.md`
- active files
- completed files

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"

{
  find "$ISSUES_DIR" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" \
    -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  find "$ISSUES_DIR/completed" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" \
    -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  grep -Eo '\b[0-9]{3}\b' "$ISSUES_DIR/INDEX.md" 2>/dev/null
} | grep -E '^[0-9]{3}$' | sort -n | uniq > /tmp/all_ids.txt

echo "Highest ID (all sources): $(tail -1 /tmp/all_ids.txt 2>/dev/null || echo none)"
grep -E 'Last Assigned ID|Next ID' "$ISSUES_DIR/INDEX.md" 2>/dev/null || echo "ID Ledger section missing"
```

Report:

- highest ID in INDEX
- highest ID in active files
- highest ID in completed files
- duplicate IDs (open + completed)
- missing files referenced by INDEX
- files missing from INDEX
- whether `Last Assigned ID` is correct

If `Last Assigned ID` is lower than any observed issue ID, update it to the highest observed ID and set `Next ID` to highest + 1 (3-digit zero-padded). Never reuse or decrement IDs.

---

## Step 2 — Detect duplicate IDs (open AND completed)

```bash
comm -12 /tmp/open_ids.txt /tmp/completed_ids.txt
```

Any output = that issue ID exists in both folders. This is the most common
drift. For each duplicate:
- If the issue is truly **completed**: the open file in `brain/issues/` is
  wrong — delete it with `rm brain/issues/<file>`
- If the issue is truly **open**: the completed copy is wrong — delete it with
  `rm brain/issues/completed/<file>`
- When in doubt, check the file's frontmatter `status:` field

If duplicates are found, after fixing run:

```bash
git add -u brain/issues/completed/
git commit -m "fix(brain): remove duplicate completed issue files

The brain/issues/completed/ folder had accumulated duplicate copies of
issues that already existed in brain/issues/ (open issues being tracked).
Keep only truly completed issues in completed/; open issues remain in
brain/issues/ per the established structure."
```

---

## Step 3 — Check INDEX drift

Find IDs that INDEX says are completed but still have an open file:

```bash
comm -12 /tmp/index_completed_ids.txt /tmp/open_ids.txt
```

Find IDs that INDEX says are open but only exist in completed/ (forgot to
move to completed/ folder):

```bash
comm -23 /tmp/index_completed_ids.txt /tmp/open_ids.txt | \
  while read id; do
    if ! ls brain/issues/${id}*.md 2>/dev/null | grep -q .; then
      echo "$id — in INDEX as completed but no open file (OK to leave)"
    fi
  done
```

Find IDs in the open folder that are NOT in INDEX's active list (forgot to
close or add to completed):

```bash
# Get active IDs from INDEX P0/P1/P2 tables
grep '^\[0' "$ISSUES_DIR/INDEX.md" | grep -v 'completed/' | \
  sed 's/.*\[\(.*\)\](.*/\1/' | sed 's/^0*//' | grep '^[0-9]' | \
  sort -n > /tmp/index_active_ids.txt

comm -23 /tmp/open_ids.txt /tmp/index_active_ids.txt
```

These IDs are in the open folder but not listed as active in INDEX — either
they were completed and not moved to `completed/`, or they're brand new and
need adding to INDEX.

---

## Step 4 — Frontmatter validation

For each issue file (both `brain/issues/` and `brain/issues/completed/`),
validate the frontmatter has required fields and valid values.

```bash
for f in brain/issues/[0-9]*.md brain/issues/completed/[0-9]*.md; do
  id=$(basename "$f" .md | sed 's/-.*//')
  status=$(grep '^status:' "$f" 2>/dev/null | awk '{print $2}')
  severity=$(grep '^severity:' "$f" 2>/dev/null | awk '{print $2}')
  area=$(grep '^area:' "$f" 2>/dev/null | awk '{print $2}')

  # Check for missing fields
  if [ -z "$status" ]; then echo "MISSING status: $f"; fi
  if [ -z "$severity" ]; then echo "MISSING severity: $f"; fi
  if [ -z "$area" ]; then echo "MISSING area: $f"; fi

  # Validate area values (defaults + optional worker; legacy maintainability OK)
  if [ -n "$area" ] && ! echo "$area" | grep -qE '^(frontend|backend|api|database|auth|security|ui|testing|performance|dx|infra|docs|workflow|unknown|worker|maintainability)$'; then
    echo "INVALID area '$area': $f"
  fi

  # Validate severity values
  if [ -n "$severity" ] && ! echo "$severity" | grep -qE '^(P0|P1|P2)$'; then
    echo "INVALID severity '$severity': $f"
  fi

  # Validate status values
  if [ -n "$status" ] && ! echo "$status" | grep -qE '^(open|completed)$'; then
    echo "INVALID status '$status': $f"
  fi

  # Cross-check: files in brain/issues/ should have status: open
  if [[ "$f" == brain/issues/[0-9]*.md ]] && [ "$status" = "completed" ]; then
    echo "STALE status=completed but in open folder: $f"
  fi

  # Cross-check: files in brain/issues/completed/ should have status: completed
  if [[ "$f" == brain/issues/completed/* ]]; then
    if [ "$status" != "completed" ]; then
      echo "WRONG status=$status (expected completed) in completed folder: $f"
    fi
  fi
done
```

For each finding:
- **MISSING**: Add the required frontmatter field
- **INVALID**: Fix the invalid value
- **STALE**: Move the file to `completed/` and update INDEX.md
- **WRONG**: Fix status to `completed`

---

## Step 5 — Orphan completed check (in INDEX but not in folder)

```bash
comm -23 /tmp/index_completed_ids.txt /tmp/completed_ids.txt
```

Each ID in this list appears in INDEX.md as completed but has no file in
`completed/`. This means the file was deleted or never migrated. Either:
- Create the completed issue file by moving from open (if it was fixed but
  file not moved)
- Or the issue was already fixed and the completed file was deleted — no action

---

## Step 6 — Summary report

After all checks, print a structured summary:

```
ISSUES MAINTENANCE REPORT — {date}
════════════════════════════════════════════════════════════════════
Open issues:      {N}  (brain/issues/)
Completed issues: {N}  (brain/issues/completed/)
INDEX active:     {N}  (from INDEX.md P0/P1/P2 tables)
INDEX completed:  {N}  (from INDEX.md completed table)

HEALTH:
  Duplicates (open+completed): {N} — FIX or IGNORE
  INDEX drift (open but marked completed): {N} — FIX
  Missing frontmatter fields: {N} — FIX
  Invalid field values:       {N} — FIX
  Orphan completed (in INDEX, no file): {N} — REVIEW
  Untracked open (not in INDEX): {N} — ADD TO INDEX or COMPLETE

RECOMMENDED ACTIONS:
  1. [list of specific fix commands or file-level actions]
════════════════════════════════════════════════════════════════════
```

---

## Step 7 — Apply fixes

For each fixable issue from the report:

- **Duplicate removal**: `rm brain/issues/<file>` or `rm brain/issues/completed/<file>`
- **Status fix**: Edit the frontmatter `status:` field
- **Move to completed**: `mv brain/issues/<file> brain/issues/completed/`
- **INDEX update**: Edit `brain/issues/INDEX.md` to move issue ID from active table
  to completed table (add completed date)

After fixing, commit with:

```bash
git add -u brain/issues/
git commit -m "fix(brain): issues maintenance — {brief description of what was fixed}"
```

---

## Hard Rules

1. **Never delete an issue file without understanding why it exists** — if an
   ID appears in both folders, one is wrong, not both
2. **INDEX.md is the source of truth for the ID ledger and intended issue state.**
   If counts disagree, reconcile INDEX.md with actual files.
   If ID allocation disagrees, preserve the highest ID found anywhere and never reuse IDs.
3. **Always commit completed issue file moves separately** from code fixes so
   the brain/ history is clean and reviewable
4. **Do not touch open issue files** — the maintenance skill only moves,
   renames, or updates completed issues; open issues are owned by whoever is
   actively working on them
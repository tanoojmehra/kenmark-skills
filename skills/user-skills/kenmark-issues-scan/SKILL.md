---
name: kenmark-issues-scan
version: 1.3.0
category: issues
scope: universal
phase: discover
description: "Scan the codebase for bugs, gaps, and inconsistencies; create new issue files in brain/issues/ with unique IDs. Requires brain/issues/INDEX.md from kenmark-issues-setup or kenmark-init — this skill does NOT bootstrap the tracker. Use when asked to \"scan for new issues\", \"find new issues\", or \"discover issues\"."
triggers:
  - scan for new issues
  - find new issues
  - discover issues
  - new issues
  - scan issues
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

# Kenmark Issues Scan

## Purpose

**Scan and document** — find bugs, gaps, and inconsistencies in the codebase, then **create issue files** under `brain/issues/` with evidence and unique IDs.

**Not setup.** This skill does not create the tracker layout. If `brain/issues/INDEX.md` is missing, stop and run **`kenmark-issues-setup`** (or opt in during **`kenmark-init`**) first.

Assign unique IDs (next available in the 3-digit sequence), populate with
evidence, and optionally update INDEX.md.

---

## Hard Rules

1. Never create an issue without reading `brain/issues/INDEX.md`.
2. Never calculate the next ID from `brain/issues/` alone.
3. Always include completed issues when calculating the next ID.
4. Always include IDs already listed in `INDEX.md`, even if files are missing.
5. Never reuse an ID.
6. Never renumber issues.
7. If `INDEX.md` and folders disagree, stop and run `kenmark-issues-maintain` before creating new issues.
8. If `INDEX.md` is missing, stop and run `kenmark-issues-setup` (or `kenmark-init` with issue tracking) — do not invent a tracker inline.

---

## Step 1 — Collect all known IDs and compute next ID

## Hard ID rule

Issue IDs are global and immutable.

Never reuse an ID.

Before creating a new issue, collect IDs from:

1. `brain/issues/INDEX.md`
2. `brain/issues/[0-9]*.md`
3. `brain/issues/completed/[0-9]*.md`

The next ID is:

```text
max(all IDs found anywhere) + 1
```

Do not use only the active `brain/issues/` folder to determine the next ID.
Completed issues still reserve their IDs forever.

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"

{
  # IDs from active files
  find "$ISSUES_DIR" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" \
    -exec basename {} \; 2>/dev/null | sed 's/-.*//'

  # IDs from completed files
  find "$ISSUES_DIR/completed" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" \
    -exec basename {} \; 2>/dev/null | sed 's/-.*//'

  # IDs from INDEX links/tables
  grep -Eo '\b[0-9]{3}\b' "$ISSUES_DIR/INDEX.md" 2>/dev/null
} | grep -E '^[0-9]{3}$' | sort -n | uniq > /tmp/kenmark_all_issue_ids.txt

LAST_ID="$(tail -1 /tmp/kenmark_all_issue_ids.txt 2>/dev/null || echo 000)"
NEXT_ID="$(printf "%03d" "$((10#$LAST_ID + 1))")"

echo "LAST_ID=$LAST_ID"
echo "NEXT_ID=$NEXT_ID"
```

Read `INDEX.md` **ID Ledger** (`Last Assigned ID`, `Next ID`) and reconcile with the command output. If they disagree, run `kenmark-issues-maintain` before creating issues.

---

## Step 2 — Discover repo layout

Before scanning, infer where code lives:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
ls -la "$REPO_ROOT"
# Common roots — use what exists, ignore the rest:
# apps/, packages/, services/, src/, lib/, cmd/, internal/, api/, web/
```

Read `brain/issues/INDEX.md` **Areas** table (if present) for project-specific
area tags. Prefer paths and patterns from open issues' `files:` frontmatter.

**Default areas** (use the best fit; `unknown` only when triage is unclear):

`frontend`, `backend`, `api`, `database`, `auth`, `security`, `ui`, `testing`,
`performance`, `dx`, `infra`, `docs`, `workflow`, `unknown`.

Use `worker` only when the repo has background jobs (e.g. `**/worker/**`,
`**/jobs/**`, queue consumers, cron). Do not assume workers exist in every repo.

---

## Step 3 — Scan patterns by category

Run targeted Grep searches for common issue patterns. Adapt paths to the repo.
For each search, check if the finding matches an already-filed issue before
creating a new one.

### 3a — API / HTTP handlers

Find route/handler directories (e.g. `**/api/**`, `**/routes/**`, `**/handlers/**`):

```bash
# Example: list route entrypoints
find "$REPO_ROOT" -path '*/node_modules' -prune -o \
  \( -name 'route.ts' -o -name 'routes.ts' -o -name '*Controller.*' \) -print 2>/dev/null | head -40
```

### 3b — Stale references after renames or deletions

When a migration or rename is in flight, search for old symbols/paths mentioned
in open issues or project docs:

```bash
# Replace OLD_TERM with the deprecated name from context
grep -rn "OLD_TERM" --include="*.ts" --include="*.tsx" --include="*.py" \
  "$REPO_ROOT" 2>/dev/null | grep -v node_modules | head -30
```

### 3c — Schema / config vocabulary drift

Search schema, DSL, or config packages for mismatched field names:

```bash
grep -rn "deprecatedField\|legacy_" --include="*.ts" --include="*.sql" \
  "$REPO_ROOT" 2>/dev/null | grep -v node_modules | head -30
```

### 3d — UI components (stale naming, broken links)

```bash
grep -rn "href=\|navigate(\|router\." --include="*.tsx" --include="*.vue" \
  "$REPO_ROOT" 2>/dev/null | grep -v node_modules | head -30
```

### 3e — Database migrations (column/table name mismatches)

```bash
grep -rn "REFERENCES\|FOREIGN KEY\|CREATE TABLE" --include="*.sql" \
  "$REPO_ROOT" 2>/dev/null | head -30
```

### 3f — Security patterns

```bash
# Raw error details in API responses
grep -rn "err\.message\|error\.message\|stack" --include="*.ts" --include="*.py" \
  "$REPO_ROOT" 2>/dev/null | grep -v node_modules | grep -i api | head -20

# Missing auth / rate limiting (adjust for framework)
grep -rn "rateLimit\|rate_limit\|authenticate\|authorize" --include="*.ts" \
  "$REPO_ROOT" 2>/dev/null | grep -v node_modules | head -20
```

### 3g — Missing test coverage

Compare source entrypoints to sibling or mirrored test files:

```bash
find "$REPO_ROOT" -path '*/node_modules' -prune -o \
  -name '*.ts' ! -name '*.test.ts' ! -name '*.spec.ts' -print 2>/dev/null | \
  while read src; do
    base="${src%.ts}"
    [ -f "${base}.test.ts" ] || [ -f "${base}.spec.ts" ] || echo "NO TEST: $src"
  done | head -30
```

### 3h — OAuth / external auth flows

```bash
grep -rn "redirect\|returnTo\|callback\|oauth" --include="*.ts" --include="*.py" \
  "$REPO_ROOT" 2>/dev/null | grep -v node_modules | head -20
```

---

## Step 4 — Deduplicate against existing issues

Before creating any new issue, cross-check against existing titles and evidence:

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"
# List all existing issue titles
grep -h "^title:" "$ISSUES_DIR"/*.md 2>/dev/null | sort -u
```

If a finding matches an existing issue (same file, same bug pattern), skip it.

---

## Step 5 — Create new issue files

Before writing each new issue file, confirm the ID is not already taken:

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"
if find "$ISSUES_DIR" "$ISSUES_DIR/completed" -name "${NEXT_ID}-*.md" 2>/dev/null | grep -q .; then
  echo "ERROR: ID collision for $NEXT_ID. Recompute from INDEX + active + completed."
  exit 1
fi
```

For each unique finding, create a file at `brain/issues/{id}-{slug}.md`:

```markdown
---
id: {next-id}
title: {concise one-liner}
severity: P0|P1|P2
area: frontend|backend|api|database|auth|security|ui|testing|performance|dx|infra|docs|workflow|unknown
source: kenmark-issues-scan
status: open
created: {YYYY-MM-DD}
files:
  - path/to/file1
  - path/to/file2
related:
  - related-issue-id
---

## Summary

{2-3 sentences: what is wrong, where, and why it matters.}

## Evidence

- `file:line` — description of the finding
- `file:line` — description of the finding

## Suggested fix

{Concrete steps to fix the issue.}

## Acceptance criteria

- [ ] {criterion 1}
- [ ] {criterion 2}
```

**Slug rules:** lowercase, hyphens, no numbers in the slug part.
**ID sequence:** 001, 002, 003, … (always 3 digits, zero-padded).

---

## Step 5.5 — Closing completed issues

When an issue is resolved, **move it to `brain/issues/completed/` instead of deleting it**.
This preserves the audit trail and allows the INDEX.md completed table to link to the file.

```bash
# Move a resolved issue to completed/ (use actual filename)
mv brain/issues/042-example-issue-slug.md \
   brain/issues/completed/042-example-issue-slug.md
```

Then update `brain/issues/INDEX.md`:
1. Move the issue entry from the active priority table to the Completed table
2. Add `completed: YYYY-MM-DD` to the issue frontmatter (edit the file directly)
3. Decrement "Active issues" count, increment "Completed" count

**Rule: Never delete an issue file. Always move it to completed/.**

---

## Step 6 — Update INDEX.md

After creating new issues or closing completed ones, update `brain/issues/INDEX.md`:

1. Update **ID Ledger**: set `Last Assigned ID` to the highest ID assigned this run; set `Next ID` to `Last Assigned ID + 1` (3-digit zero-padded)
2. Increment "Active issues" count (new issues) or decrement (closed issues)
3. Add new issues to the correct priority table (P0/P1/P2)
4. Move closed issues to the Completed table with today's date
5. Re-sort by ID within each priority section

Never decrement `Last Assigned ID` when closing issues.

---

## Step 7 — Report

Report:
- How many scans performed
- How many new issues created
- Which IDs were assigned
- Any findings that were deduplicated against existing issues

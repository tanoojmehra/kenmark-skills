---
name: kenmark-issues-list
version: 1.3.0
category: issues
scope: universal
phase: discover
description: "Display all open issues from brain/issues/ in a table grouped by area/type, with columns for ID, Priority, and Title. Requires brain/issues/INDEX.md from kenmark-issues-setup or kenmark-init. Use when asked to \"list issues\", \"show issues\", \"issues dashboard\", or \"show all issues by type\"."
triggers:
  - list issues
  - show issues
  - issues dashboard
  - show all issues by type
  - issues by area
  - issues by priority
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Kenmark Issues List

## Purpose

Read all open issues from `brain/issues/INDEX.md` and display them in a
well-structured table grouped by area (from `brain/issues/INDEX.md` — e.g.
frontend, backend, api, database, auth, security, ui, testing, performance, dx,
infra, docs, workflow, unknown; plus `worker` when the project uses it), sorted
by priority within each group.

If `INDEX.md` is missing, stop and run **`kenmark-issues-setup`** (or **`kenmark-init`**) first.

---

## Step 1 — Read INDEX.md

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"
cat "$ISSUES_DIR/INDEX.md"
```

Parse:
- Each issue's ID, severity (P0/P1/P2), area, and title
- Completed count from the overview table

---

## Step 2 — Display grouped table

Group issues by `area` tag. Within each area group, sort by priority
(P0 → P1 → P2), then by ID ascending.

### Output rules (IDE-safe — follow exactly)

These rules keep the dashboard readable in Cursor, Claude, Gemini, and other chat UIs:

1. **Write plain markdown in the chat response** — never wrap the dashboard in a code fence.
2. **Use GFM pipe tables** (`| col | col |`) — not ASCII columns or box-drawing lines.
3. **Do not use** `═`, `─`, `│`, or space-padded fixed-width layouts.
4. **One area per `###` heading**, then one table immediately below.
5. If an area has no open issues, omit that section (do not print empty tables).
6. If there are zero open issues, say so in one sentence and skip tables.

**Area heading icons** (prefix the `###` heading):

- 🔴 = area has any P0 issues (critical — fix first)
- 🟡 = area has P1/P2 only (high/medium priority)
- ⚪ = area has no open issues (only when listing all areas including empty)

**Example output** — your chat response must match this structure as **plain markdown** (do not wrap it in a code fence). The block below is reference only:

```markdown
## Issues dashboard — {YYYY-MM-DD}

**Total open:** {N} · **Completed:** {M}

### 🔴 api (1 P0 · 0 P1 · 0 P2)

| ID | Prio | Title |
|----|------|-------|
| 001 | P0 | POST /users returns 500 when email already exists |

### 🟡 database (0 P0 · 1 P1 · 0 P2)

| ID | Prio | Title |
|----|------|-------|
| 002 | P1 | Migration missing index on foreign key column |

### 🟡 security (1 P0 · 1 P1 · 0 P2)

| ID | Prio | Title |
|----|------|-------|
| 003 | P0 | Auth middleware bypassed on nested route |
| 004 | P1 | Error responses leak stack traces in production |

### 🟡 ui (0 P0 · 0 P1 · 2 P2)

| ID | Prio | Title |
|----|------|-------|
| 005 | P2 | Settings form missing accessible labels |
| 006 | P2 | Empty state lacks primary action |
```

Use middle dots (`·`) in count summaries, not pipe (`|`), so counts are not parsed as table syntax.

---

## Step 3 — Workstream summary

At the bottom, show a compact workstream view grouping cross-area issues
by root cause (derive from issue titles, `related:` frontmatter, and shared
file paths — do not use a hardcoded template).

Use a `### Workstreams` heading and a single GFM table. Example (plain markdown in chat, not fenced):

```markdown
### Workstreams

| Workstream | Issues |
|------------|--------|
| Auth & session handling | 003, 004 |
| Database schema / migrations | 002 |
| UI accessibility | 005, 006 |
```

If no workstreams apply, omit this section.

---

## Read-only reminder

This skill is read-only. If the list appears inconsistent with files on disk, do not infer missing IDs from folders. Run `kenmark-issues-maintain`.

---
name: kenmark-tracker-list
version: 1.0.0
category: workflow
scope: universal
phase: discover
description: "Display all open issues and/or active plans from brain/issues/ and brain/plans/ in grouped tables. Accepts a tracker-type parameter (issues, plans, or both). Requires INDEX.md from kenmark-tracker-setup or kenmark-init. Use when asked to list issues, show issues, issues dashboard, show all issues by type, list plans, show plans, plans dashboard, or show all plans by status."
triggers:
  - list issues
  - show issues
  - issues dashboard
  - show all issues by type
  - issues by area
  - issues by priority
  - list plans
  - show plans
  - plans dashboard
  - show all plans by status
  - plans by tier
  - plans by status
  - list trackers
  - show trackers
  - tracker dashboard
  - kenmark-tracker-list
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Kenmark Tracker List

## Purpose

Read all open issues from `brain/issues/INDEX.md` and/or active plans from `brain/plans/INDEX.md` and display them in well-structured tables.

Accepts a `tracker-type` parameter:
- `issues` — show only issues
- `plans` — show only plans
- `both` (default) — show both

If `INDEX.md` is missing, read-only enumeration of existing files is still possible. Flag the missing ledger and propose non-destructive tracker maintenance; never initialize `001` over existing artifacts.

---

## Step 1 — Read INDEX.md

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
ISSUES_DIR="$REPO_ROOT/brain/issues"
PLANS_DIR="$REPO_ROOT/brain/plans"
```

For each enabled tracker, read its INDEX.md:

```bash
[ -f "$ISSUES_DIR/INDEX.md" ] && cat "$ISSUES_DIR/INDEX.md"
[ -f "$PLANS_DIR/INDEX.md" ] && cat "$PLANS_DIR/INDEX.md"
```

Parse:
- For issues: each issue's ID, severity (P0/P1/P2), area, and title; completed count
- For plans: each plan's ID, tier, status, and title; completed count

---

## Step 2 — Display issues (if enabled)

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
```

Use middle dots (`·`) in count summaries, not pipe (`|`), so counts are not parsed as table syntax.

### Workstream summary

At the bottom, show a compact workstream view grouping cross-area issues by root cause (derive from issue titles, `related:` frontmatter, and shared file paths — do not use a hardcoded template).

Use a `### Workstreams` heading and a single GFM table. If no workstreams apply, omit this section.

---

## Step 2b — Display plans (if enabled)

Output format (example — populate from actual INDEX.md data):

```
PLANS DASHBOARD — {date}
════════════════════════════════════════════════════════════════════

📋 Proposed (2)
─────────────────────────────────────────────────────────────────
 ID   Tier           Title
───  ─────────────  ─────────────────────────────────────────────
001  full-feature   Add user notification preferences
002  quick          Fix broken link in README

✅ Approved (1)
─────────────────────────────────────────────────────────────────
 ID   Tier           Title
───  ─────────────  ─────────────────────────────────────────────
003  dig-deep       Migrate auth to session-based tokens

🔄 In progress (1)
─────────────────────────────────────────────────────────────────
 ID   Tier           Title
───  ─────────────  ─────────────────────────────────────────────
004  prototype      Spike WebSocket presence indicator

════════════════════════════════════════════════════════════════════
Total active: {N} | Completed: {M}
```

**Status icons:**
- 📋 = proposed
- ✅ = approved
- 🔄 = in progress

### Tier summary

At the bottom, show a compact tier breakdown:

```
BY TIER (active only)
─────────────────────────────────────────────────────────────────
 quick          1
 prototype      1
 full-feature   1
 dig-deep       1
 ultrathink     0
════════════════════════════════════════════════════════════════════
```

---

## Read-only reminder

This skill is read-only. If the list appears inconsistent with files on disk, do not infer missing IDs from folders. Run **`kenmark-tracker-maintain`**.


## Brain 2.0 portable consistency contract

- Files and Git are canonical. Studio/MongoDB/indexing/embeddings/network are never required for this skill.
- Issues and plans keep investigations, hypotheses, tests, implementation history and milestones. KB contains verified durable knowledge, updated only after source evidence demonstrates an existing fact changed.
- On no-op KB checks report `KB already consistent`; do not append meaningless changelog entries.
- Positive numeric IDs use complete >=3-digit prefixes and scale beyond 999; never reuse a reserved number or delete history merely to reconcile an index.
- Coordinate concurrent tracker/KB writers and keep legacy Brain files unchanged by default; commit/push/merge only when authorized.

Cross-check INDEX tables against active/completed artifacts, show every duplicate numeric ID with all file paths, flag missing/dangling entries, and sort by numeric ID, not filename string.

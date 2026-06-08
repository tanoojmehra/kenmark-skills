---
name: kenmark-plans-list
version: 1.0.0
category: plans
scope: universal
phase: discover
description: "Display all active plans from brain/plans/ in a table grouped by status and tier. Requires brain/plans/INDEX.md from kenmark-plans-setup or kenmark-init. Use when asked to \"list plans\", \"show plans\", \"plans dashboard\", or \"show all plans by status\"."
triggers:
  - list plans
  - show plans
  - plans dashboard
  - show all plans by status
  - plans by tier
  - plans by status
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Kenmark Plans List

## Purpose

Read all active plans from `brain/plans/INDEX.md` and display them in a
well-structured table grouped by **status** (proposed, approved, in-progress),
with tier and title columns. Within each status group, sort by ID ascending.

If `INDEX.md` is missing, stop and run **`kenmark-plans-setup`** (or **`kenmark-init`**) first.

---

## Step 1 — Read INDEX.md

```bash
PLANS_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/plans"
cat "$PLANS_DIR/INDEX.md"
```

Parse:

- Each plan's ID, tier, status, and title
- Completed count from the overview table

---

## Step 2 — Display grouped table

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

---

## Step 3 — Tier summary

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

This skill is read-only. If the list appears inconsistent with files on disk, do not infer missing IDs from folders. Run **`kenmark-plans-maintain`**.

---
name: kenmark-tracker-maintain
version: 1.1.0
category: workflow
scope: universal
phase: maintain
description: "Read-only-by-default tracker integrity audit; detect ledger drift, malformed IDs, duplicates and conflicting statuses, with explicitly approved non-destructive repairs."
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
  - tracker health
  - audit trackers
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

**Default: report-only.** Never delete, rename, merge or renumber documents just because numeric IDs match.

## Audit

1. Enumerate `brain/issues/` or `brain/plans/`, including `completed/` and optional `archive/`. Parse complete positive numeric filename prefixes of width at least 3; flag malformed and legacy noncanonical names. Sort numerically.
2. Read only `Last Assigned ID`, `Next ID` and structurally identified ID-column rows from INDEX; do **not** grep every three-digit number from prose, titles or dates.
3. Group all records by numeric ID. Preserve and review **every** duplicate path, reading content, lifecycle state, frontmatter and Git history; distinguish identical, contradictory, and unrelated historical records. Kenmark Skills itself has historical duplicates `001` and `002` that must be preserved.
4. Identify missing INDEX rows, dangling INDEX entries, invalid/missing frontmatter, status/folder mismatches, corrupted ledger, and missing but previously reserved IDs. Git/filesystem remain canonical; INDEX is a derived projection/high-water reservation.
5. Present evidence and a safe repair plan **before** any modification. Never remove an artifact solely because its ID appears twice. Completed history stays intact.

## Approved repairs only

After explicit user approval and exclusive tracker write ownership, re-read the current filesystem and ledger; add verified missing INDEX entries, correct provably wrong statuses, or rebuild missing ledgers without deleting files or lowering previously reserved high-water IDs. Ambiguous conflicts remain flagged. Deletion/identity reassignment requires separate explicit destructive authorization. For allocation, lock, rescan, reserve high-water **before** exclusively creating the new file, and leave gaps rather than reuse IDs if a write fails. Cross-clone concurrency requires Git serialization beyond local locks.

Optional helper when included in a source checkout: `node scripts/brain-tracker.js audit issues|plans|both [repoRoot]`. Independent coding agents can use Read/Grep/Glob/Bash/Git without Studio or any additional infrastructure.

## Report

Include active/completed counts, highest observed/ledger IDs, duplicates with all paths, malformed names, status conflicts, missing/dangling rows, exact non-destructive repair proposals and approvals required. Never commit/push automatically.

---
name: kenmark-repo-docs-fix
version: 1.0.0
category: workflow
scope: universal
phase: maintain
description: "Apply approved documentation fixes from a kenmark-repo-docs audit. Edits README, docs, and brain/kb only after explicit approval."
triggers:
  - fix docs
  - apply docs audit
  - update docs from audit
  - kenmark-repo-docs-fix
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - AskUserQuestion
risk: write-files
disable-model-invocation: true
---

# Kenmark Repo Docs Fix

Apply documentation edits **only after** the user approves specific changes from a **`kenmark-repo-docs`** audit.

## Workflow

1. Confirm which files and sections are approved for edit.
2. Update README, `docs/`, or `brain/kb/` to match repo reality.
3. Cross-check env vars, scripts, and setup steps against code.
4. Recommend **`kenmark-kb-sync`** when code behavior changed materially.

## Safety

- Do not rewrite broad doc surfaces without an approved change list.
- Do not delete historical `brain/` content without approval.

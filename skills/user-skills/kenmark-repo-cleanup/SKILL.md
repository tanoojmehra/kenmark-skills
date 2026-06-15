---
name: kenmark-repo-cleanup
version: 1.0.0
category: workflow
scope: universal
phase: maintain
description: "Execute an approved repo cleanup plan from kenmark-repo-hygiene. Moves/deletes/updates files only after explicit approval."
triggers:
  - execute repo cleanup
  - approved cleanup
  - apply cleanup plan
  - kenmark-repo-cleanup
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - AskUserQuestion
risk: destructive-possible
disable-model-invocation: true
---

# Kenmark Repo Cleanup

Execute an **approved** cleanup plan from **`kenmark-repo-hygiene`**. Do not run without explicit user approval of specific paths and actions.

## Preconditions

- User has reviewed a hygiene audit report and approved actions.
- If secrets are involved, route to **`kenmark-repo-secrets`** first.

## Approved actions

### Move to temp

```bash
mkdir -p temp/kenmark-repo-hygiene
mv "path/to/file" "temp/kenmark-repo-hygiene/"
```

### Convert Markdown to brain

```bash
mkdir -p brain/kb/features brain/kb/decisions
```

Then write/merge into appropriate KB file.

### Update gitignore

Only add patterns tied to approved findings.

### Delete

Use `rm` only for explicitly approved paths. Show exact command list before execution.

## Safety

- Never delete or move files beyond the approved list.
- Never rewrite git history unless explicitly requested.
- Prefer **`kenmark-commit`** after cleanup for grouped commits.

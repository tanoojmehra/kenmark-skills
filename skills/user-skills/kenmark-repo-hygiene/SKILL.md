---
name: kenmark-repo-hygiene
version: 1.1.0
category: workflow
scope: universal
phase: audit
description: "Audit a repository for clutter: scattered markdown, orphan assets, dumps, backups, generated files, and gitignore gaps. Produces a cleanup plan; moves/deletes only after explicit approval. For deep secrets use kenmark-repo-secrets; for public publish gate use kenmark-repo-public."
triggers:
  - repo hygiene
  - clean repo
  - sanitize repo clutter
  - audit dirty repo
  - cleanup files
  - find unused files
  - audit markdown files
  - repo cleanup
  - dirty repo
  - scattered markdown
  - orphan assets
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - TodoWrite
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Kenmark Repo Hygiene

## Purpose

Use this skill when the user wants to audit a repository for **file clutter and organization**:

- scattered Markdown files
- random notes or docs outside the intended docs/brain structure
- unconnected assets
- SQL dumps
- backups
- generated files
- build artifacts
- temporary files
- old archives
- gitignore gaps for local-only patterns

**Delegate to specialists:**

| User intent | Use instead |
| --- | --- |
| Deep secret/key/token scan | **`kenmark-repo-secrets`** |
| Safe to make repo public | **`kenmark-repo-public`** |

**Scope:** file clutter and organization only — not a public-publish or open-source safety gate.

**Do not use this skill** when the user wants public-repo readiness (even if they say "sanitize repo"). Load **`kenmark-repo-public`** instead.

Default behavior is **audit and recommend only**.

In audit mode, do not use Write unless the user asks to create a report file.

Do not delete, move, rewrite, or commit anything unless the user explicitly approves the cleanup plan.

---

## Core principle

```text
Find → Classify → Risk-score → Recommend → Ask → Act only if approved
```

This skill must be safe for production and public-release preparation.

---

## Operating modes

| Mode               | Use when                          | Behavior                                  |
| ------------------ | --------------------------------- | ----------------------------------------- |
| `quick-audit`      | User wants a fast check           | Obvious clutter + git status              |
| `standard-audit`   | Normal repo cleanup               | Full categorized report                   |
| `cleanup-plan`     | User wants actions                | Recommend move/delete/convert actions     |
| `approved-cleanup` | User approved specific actions    | Execute only approved changes             |

If the user asks about **making the repo public**, **open-sourcing**, **publish safety**, or **secrets**, stop and use the specialist instead of this skill:

| Phrases (examples) | Use |
| --- | --- |
| can I make this public, safe to publish, public repo readiness, prepare for public, open source this repo, before public push | **`kenmark-repo-public`** |
| check secrets, find keys, credential scan, secrets audit | **`kenmark-repo-secrets`** |

If they say **"sanitize repo"** without clutter context, ask whether they mean **clutter cleanup** (this skill) or **public publish prep** (**`kenmark-repo-public`**).

---

## Safety rules

- Default to read-only investigation.
- Never print full secrets. Redact values.
- Never delete files without explicit approval.
- Never move files without explicit approval.
- Never alter `.gitignore` without explicit approval.
- Never rewrite git history unless the user explicitly requests it and understands the risk.
- If filename scan suggests secrets, recommend **`kenmark-repo-secrets`** — do not run full content grep here.
- If secrets are found in tracked files or git history, recommend rotation and history cleanup (see `kenmark-repo-secrets`).
- If unsure whether a file is useful, mark as `review` instead of `delete`.

---

## Step 1 — Resolve repo root

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
echo "REPO_ROOT=$REPO_ROOT"
```

Check whether this is a git repo:

```bash
git rev-parse --is-inside-work-tree 2>/dev/null || true
```

---

## Step 2 — Collect repo state

Run safe read-only checks:

```bash
git status --short
git branch --show-current
git remote -v
```

List tracked files:

```bash
git ls-files
```

List untracked non-ignored files:

```bash
git ls-files --others --exclude-standard
```

List ignored files only if needed:

```bash
git status --ignored --short
```

Do not scan huge folders by default:

```text
.git/
node_modules/
vendor/
dist/
build/
.next/
.nuxt/
.cache/
coverage/
temp/
tmp/
logs/
```

---

## Step 3 — Classify findings

Classify files into these buckets:

| Bucket            | Examples                                                 | Default recommendation                              |
| ----------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `safe-doc`        | README, CLAUDE, AGENTS, LICENSE, CHANGELOG               | keep                                                |
| `scattered-md`    | random `.md` outside root/docs/brain                     | convert to brain/kb, move to docs, or delete        |
| `brain-candidate` | planning notes, architecture notes, implementation notes | convert/move into `brain/kb/`                       |
| `asset`           | images, PDFs, design files, screenshots                  | keep if referenced; move to assets/docs/temp if not |
| `orphan-asset`    | unused screenshots, test files, exported images          | move to `temp/` or delete                           |
| `dump`            | `.sql`, `.dump`, `.bak`, `.backup`, DB exports           | move to `temp/`, ignore, or delete                  |
| `archive`         | `.zip`, `.tar`, `.gz`, `.rar`, `.7z`                     | move/delete unless intentionally versioned          |
| `generated`       | build outputs, cache, coverage, compiled files           | ignore/delete                                       |
| `secret-risk`     | env files, keys, certs, tokens, credentials              | investigate, rotate if real, remove from repo       |
| `unknown`         | unclear purpose                                          | review manually                                     |

---

## Step 4 — Markdown audit

Find Markdown files:

```bash
find . \
  -path './.git' -prune -o \
  -path './node_modules' -prune -o \
  -path './temp' -prune -o \
  -name '*.md' -print
```

Allowed/common Markdown locations:

```text
README.md
CLAUDE.md
AGENTS.md
GEMINI.md
CHANGELOG.md
LICENSE.md
docs/**/*.md
brain/**/*.md
.github/**/*.md
```

For other Markdown files:

1. Read the title and first section.
2. Decide whether it is:
   - useful documentation
   - outdated note
   - duplicate note
   - project planning artifact
   - temporary scratch
3. Recommend:
   - keep where it is
   - move to `docs/`
   - convert to `brain/kb/`
   - merge into existing KB file
   - delete after approval

### Brain conversion recommendation

If useful as long-term project knowledge:

```text
brain/kb/features/NNN-feature-name.md
brain/kb/decisions/NNN-decision-name.md
brain/kb/11-known-risks-and-decisions.md
brain/kb/07-features.md
```

Do not convert everything blindly. Only convert durable knowledge.

---

## Step 5 — Asset audit

Find common assets:

```bash
find . \
  -path './.git' -prune -o \
  -path './node_modules' -prune -o \
  -path './temp' -prune -o \
  \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.gif' -o -iname '*.svg' -o -iname '*.pdf' -o -iname '*.fig' -o -iname '*.psd' -o -iname '*.ai' -o -iname '*.sketch' \) \
  -print
```

For each asset, check if referenced:

```bash
grep -R --line-number --fixed-strings "filename.ext" . \
  --exclude-dir=.git \
  --exclude-dir=node_modules \
  --exclude-dir=temp
```

Recommend:

| Case                              | Recommendation                             |
| --------------------------------- | ------------------------------------------ |
| Referenced by app/docs            | keep                                       |
| Reference unclear                 | review                                     |
| Temporary screenshot/export       | move to `temp/`                            |
| Design/source file needed by team | move to `docs/assets/` or `assets/source/` |
| Duplicate/obsolete                | delete after approval                      |

---

## Step 6 — Dumps, backups, and archives

Find risky clutter:

```bash
find . \
  -path './.git' -prune -o \
  -path './node_modules' -prune -o \
  \( -iname '*.sql' -o -iname '*.dump' -o -iname '*.bak' -o -iname '*.backup' -o -iname '*.old' -o -iname '*.orig' -o -iname '*.zip' -o -iname '*.tar' -o -iname '*.tar.gz' -o -iname '*.tgz' -o -iname '*.rar' -o -iname '*.7z' \) \
  -print
```

Default recommendation:

```text
Tracked dump/archive/backups → remove from repo, move to secure storage, add gitignore
Untracked dump/archive/backups → move to temp/ or delete
Needed sample data → sanitize and move to fixtures/
```

Never assume a DB dump is safe. Treat as sensitive until proven otherwise.

---

## Step 7 — Sensitive filename pre-check (light)

Quick filename scan only — **not** a full secrets audit:

```bash
find . \
  -path './.git' -prune -o \
  -path './node_modules' -prune -o \
  \( -iname '.env' -o -iname '.env.*' -o -iname '*.pem' -o -iname '*.key' -o -iname '*.p12' -o -iname '*.pfx' \) \
  -print 2>/dev/null | head -50
```

If any hits look real (not `.env.example` with placeholders), note in the report and recommend **`kenmark-repo-secrets`** for deep scan and redacted findings. Do not run full `grep` secret patterns in this skill.

---

## Step 8 — Gitignore audit

Read `.gitignore` if present.

Check whether it includes common local-only patterns:

```gitignore
# local env
.env
.env.*
!.env.example

# temp/scratch
/temp/
/tmp/
/logs/
*.log

# dumps/backups
*.sql
*.dump
*.bak
*.backup
*.old
*.orig
*.zip
*.tar
*.tar.gz
*.tgz
*.rar
*.7z

# certs/keys
*.pem
*.key
*.p12
*.pfx
*.jks

# OS/editor
.DS_Store
.vscode/*
!.vscode/extensions.json
```

Do not blindly add all of these. Recommend additions based on actual findings.

---

## Step 9 — Produce report

Create a report in chat. For complex audits, offer to write:

```text
brain/reports/kenmark-repo-hygiene-YYYY-MM-DD.md
```

Report format:

```markdown
# Repo Hygiene Audit

## Summary

| Category | Count | Risk |
| --- | ---: | --- |
| Scattered Markdown | 0 | Low/Med/High |
| Brain candidates | 0 | Low |
| Orphan assets | 0 | Low/Med |
| Dumps/backups | 0 | Med/High |
| Generated files | 0 | Low |
| Secret risks | 0 | High |
| Gitignore gaps | 0 | Med |

## High-risk findings

| File | Reason | Status | Recommendation |
| --- | --- | --- | --- |

## Markdown cleanup

| File | Classification | Recommendation |
| --- | --- | --- |

## Asset cleanup

| File | Referenced? | Recommendation |
| --- | --- | --- |

## Dumps / backups / archives

| File | Tracked? | Recommendation |
| --- | --- | --- |

## Secret risk findings

| File | Type | Tracked? | Recommendation |
| --- | --- | --- | --- |

Do not include raw secret values.

## Gitignore recommendations

# suggested additions
...

## Recommended cleanup plan

### Safe to keep

- ...

### Move to `brain/kb/`

- ...

### Move to `temp/`

- ...

### Delete after approval

- ...

### Requires secret rotation / history cleanup

- ...

## Commands to apply after approval

# only include commands after the user approves
```

---

## Step 10 — Ask before cleanup

Ask the user to choose:

```text
What should I do next?

1. Report only — no changes
2. Create brain/reports/kenmark-repo-hygiene-YYYY-MM-DD.md
3. Move selected files to temp/
4. Convert selected Markdown into brain/kb/
5. Update .gitignore suggestions
6. Delete selected files
7. Route to kenmark-repo-public or kenmark-repo-secrets (report only)
```

Never assume approval.

---

## Optional approved cleanup actions

Only after approval:

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

Only add patterns tied to real findings.

### Delete

Use `rm` only for explicitly approved paths.

Prefer showing exact command list before execution.

---

## Before public push

Do not run the full public checklist here. Use **`kenmark-repo-public`** (verdict + blockers) and **`kenmark-repo-secrets`** (credentials).

---

## Anti-patterns

- Do not delete "random" files just because they look messy.
- Do not move documentation to `brain/` if it belongs in public `docs/`.
- Do not print secret values.
- Do not call a repo clean if secret history still exists.
- Do not add broad `.gitignore` rules that hide important source files.
- Do not rewrite git history without explicit instruction.
- Do not treat all images/assets as unused without checking references.

---

## Related skills

| Situation | Prefer |
| --- | --- |
| Deep secrets, keys, tokens | `kenmark-repo-secrets` |
| Safe to make repo public | `kenmark-repo-public` |
| Update brain after feature work | `kenmark-repo-kb` |
| Docs quality | `kenmark-repo-docs` |
| Folder layout / structure | `kenmark-repo-structure` |
| Package bloat / deps | `kenmark-repo-deps` |
| App security review (auth, injection, SSRF) | `kenmark-security-review` |
| Performance review (slow routes, bundle, hydration) | `kenmark-performance` |
| npm publish / release | `kenmark-repo-release` |
| Inventory installed agent skills (not repo files) | `kenmark-maintain` |
| Pick which skill to run | `kenmark-router` |
| Bootstrap `brain/` layout | `kenmark-init` |
| Grouped commits after cleanup | `kenmark-commit` |

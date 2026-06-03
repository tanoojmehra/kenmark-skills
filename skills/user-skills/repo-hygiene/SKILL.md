---
name: repo-hygiene
version: 1.0.0
category: workflow
scope: universal
phase: audit
description: "Audit a repository for dirty/unwanted files, scattered markdown, unconnected assets, dumps, backups, generated files, and possible secrets before commit or public push. Produces a cleanup plan and only moves/deletes files after explicit approval."
triggers:
  - repo hygiene
  - clean repo
  - sanitize repo
  - audit dirty repo
  - public repo readiness
  - check before public push
  - cleanup files
  - find secrets
  - find unused files
  - audit markdown files
  - repo cleanup
  - dirty repo
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

# Repo Hygiene — Dirty Repo / Public Push Audit Skill

## Purpose

Use this skill when the user wants to audit a repository for:

- scattered Markdown files
- random notes or docs outside the intended docs/brain structure
- unconnected assets
- SQL dumps
- backups
- generated files
- build artifacts
- temporary files
- old archives
- certificates, keys, tokens, credentials, or other sensitive material
- files that should be ignored before pushing to a public repository

Default behavior is **audit and recommend only**.

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
| `quick-audit`      | User wants a fast check           | Check obvious risky files and git status  |
| `standard-audit`   | Normal repo cleanup               | Full categorized report                   |
| `public-readiness` | Before public GitHub push/release | Strong secret + dump + ignored-file audit |
| `cleanup-plan`     | User wants actions                | Recommend move/delete/convert actions     |
| `approved-cleanup` | User approved specific actions    | Execute only approved changes             |

If the user says "sanitize before public repo", use `public-readiness`.

---

## Safety rules

- Default to read-only investigation.
- Never print full secrets. Redact values.
- Never delete files without explicit approval.
- Never move files without explicit approval.
- Never alter `.gitignore` without explicit approval.
- Never rewrite git history unless the user explicitly requests it and understands the risk.
- If secrets are found in tracked files or git history, tell the user that deleting/moving the file is not enough. Recommend secret rotation and history cleanup.
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

## Step 7 — Secret and credential audit

Search filenames first:

```bash
find . \
  -path './.git' -prune -o \
  -path './node_modules' -prune -o \
  \( -iname '.env' -o -iname '.env.*' -o -iname '*.pem' -o -iname '*.key' -o -iname '*.p12' -o -iname '*.pfx' -o -iname '*.crt' -o -iname '*.cer' -o -iname '*.jks' -o -iname '*secret*' -o -iname '*credential*' -o -iname '*token*' -o -iname '*private*' \) \
  -print
```

Then search likely secret patterns, redacting output:

```bash
grep -RInE \
  '(BEGIN (RSA |OPENSSH |EC |DSA |PRIVATE )?PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]+|xox[baprs]-[A-Za-z0-9-]+|sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{30,}|mongodb(\+srv)?:\/\/|mysql:\/\/|postgres:\/\/|DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|PRIVATE_KEY|CLIENT_SECRET|API_KEY|ACCESS_TOKEN|SECRET_KEY)' \
  . \
  --exclude-dir=.git \
  --exclude-dir=node_modules \
  --exclude-dir=temp \
  --exclude='*.lock' \
  --exclude='package-lock.json' \
  --exclude='pnpm-lock.yaml' \
  --exclude='yarn.lock' \
  2>/dev/null
```

Do not paste full secret values into the report.

Report as:

```text
path/to/file.js: possible API key on line 42 — value redacted
```

### If secrets are found

Classify:

| State                            | Action                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| Untracked secret                 | move to `temp/` or delete; add `.gitignore`                                                      |
| Tracked secret in current commit | remove file, rotate secret, add `.gitignore`                                                     |
| Secret committed in history      | rotate secret, remove from history with `git filter-repo` or BFG, force push only if appropriate |
| Certificate/private key          | treat as compromised if public or shared                                                         |

Important note:

```text
Removing the file from the working tree does not remove it from git history.
```

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
brain/reports/repo-hygiene-YYYY-MM-DD.md
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
2. Create brain/reports/repo-hygiene-YYYY-MM-DD.md
3. Move selected files to temp/
4. Convert selected Markdown into brain/kb/
5. Update .gitignore suggestions
6. Delete selected files
7. Prepare public-repo cleanup checklist
```

Never assume approval.

---

## Optional approved cleanup actions

Only after approval:

### Move to temp

```bash
mkdir -p temp/repo-hygiene
mv "path/to/file" "temp/repo-hygiene/"
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

## Public repo readiness checklist

Before pushing public:

```text
- No private keys, certs, tokens, `.env`, DB URLs, or credentials
- No production DB dumps
- No customer/client data
- No internal screenshots with sensitive info
- No private infrastructure IPs unless intentionally public
- No accidental zip/backups
- No generated build artifacts
- README is safe for public
- LICENSE is present if publishing open-source
- .gitignore covers local/temp/secret patterns
- Git history checked if secrets were ever committed
```

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
| Inventory installed agent skills (not repo files) | `skills-maintain` |
| Pick which skill to run | `skills-router` |
| Bootstrap `brain/` layout | `init-brain` |
| Grouped commits after cleanup | `commit-push` |

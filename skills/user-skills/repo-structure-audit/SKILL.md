---
name: repo-structure-audit
version: 1.0.0
category: workflow
scope: universal
phase: audit
description: "Read-only review of folder structure, naming, misplaced files, module boundaries, root clutter, and dead directories. Outputs Keep/Move/Merge/Rename/Delete recommendations. Use when the repo layout is confusing or before a refactor."
triggers:
  - structure audit
  - folder structure
  - repo layout
  - confusing repo
  - misplaced files
  - repo-structure-audit
  - architecture folders
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Repo Structure Audit — Layout and Boundaries (Read-Only)

## Purpose

Review **architecture and folder layout**:

- Confusing or inconsistent folder names
- Duplicate utilities across directories
- Misplaced components (server vs client, shared vs app-specific)
- Random files at repository root
- Dead or empty folders
- Wrong asset locations
- Poor module boundaries

Especially useful for Next.js (`app/`, `components/`, `lib/`) and monorepos (`apps/`, `packages/`).

**Read-only** — no moves without user approval (then use normal refactor or `repo-hygiene` for clutter).

---

## Core principle

```text
Map tree → Compare to conventions → Recommend structure changes
```

---

## Step 1 — Resolve repo root and top-level map

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
ls -la
find . -maxdepth 2 -type d ! -path './.git*' ! -path './node_modules' 2>/dev/null | head -60
```

Detect stack hints: `package.json`, `next.config.*`, `apps/`, `packages/`, `src/`, `internal/`.

---

## Step 2 — Root clutter

Flag non-standard root files (not README, LICENSE, config manifests, lockfiles):

- Loose scripts, images, PDFs, notes
- Duplicate config (`config.json` + `config/`)

Recommend **Move** to `scripts/`, `docs/`, `assets/`, or `temp/`.

---

## Step 3 — Naming consistency

Check for mixed conventions in the same layer:

- `utils` vs `utilities` vs `helpers`
- `components` vs `Components`
- `api` vs `API` vs `routes`

Recommend **Rename** or **Merge** when duplicates serve the same role.

---

## Step 4 — Boundary smells (framework-aware)

### Next.js / React

- Server-only code under `app/` without `"use client"` discipline
- Client hooks imported from `lib/` used only on server
- Massive flat `components/` with no feature grouping

### Monorepo

- Shared code duplicated in two `packages/` instead of one `shared/`
- App-specific code in root `lib/`

```bash
find . -name '*.tsx' -path '*/components/*' 2>/dev/null | wc -l
find . -name '*.ts' -path '*/lib/*' 2>/dev/null | wc -l
```

---

## Step 5 — Dead folders

```bash
find . -type d -empty ! -path './.git/*' 2>/dev/null | head -20
```

Recommend **Delete after approval** if empty and unreferenced.

---

## Step 6 — Architecture note (optional)

If findings are significant, recommend a short addition to `brain/kb/01-architecture.md` (do not write unless user approves KB update — or use **`repo-kb-sync`**).

---

## Report template

```markdown
# Structure Audit

## Summary

<one paragraph>

## Keep

- …

## Move

| From | To | Reason |
| --- | --- | --- |

## Merge

- …

## Rename

- …

## Delete (after approval)

- …

## Module boundary notes

- …
```

Optional: `brain/reports/repo-structure-audit-YYYY-MM-DD.md`

---

## Related skills

| Situation | Prefer |
| --- | --- |
| Random clutter, dumps, secrets filenames | `repo-hygiene` |
| KB architecture doc update | `repo-kb-sync` |
| Dependency overlap (multiple UI libs) | `repo-dependency-audit` |

---

## Anti-patterns

- Do not mandate a greenfield structure that fights existing team conventions.
- Do not move files in this skill — recommendations only.
- Do not delete folders with tracked files without explicit approval.

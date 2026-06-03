---
name: repo-docs-audit
version: 1.0.0
category: workflow
scope: universal
phase: audit
description: "Audit documentation quality: README setup, env vars, scripts, deployment and API docs, brain/kb freshness, broken links. Outputs docs health score and stale/missing lists. Use when asked if docs are good, accurate, or ready for handoff."
triggers:
  - docs audit
  - are docs good
  - documentation audit
  - readme accuracy
  - stale docs
  - repo-docs-audit
  - check documentation
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Repo Docs Audit — Documentation Quality (Audit-First)

## Purpose

Audit **documentation quality** (not file clutter — use **`repo-hygiene`** for scattered notes).

Checks:

- README accuracy and setup steps
- Environment variables documented vs used in code
- `package.json` / Makefile scripts vs README commands
- Local dev and deployment docs
- API and architecture docs
- `brain/kb/` freshness vs recent code changes
- Broken internal links in markdown

**Default:** report only. Edit docs only after explicit approval.

---

## Core principle

```text
Read docs → Cross-check code/config → Score → List gaps → Fix only if approved
```

---

## Step 1 — Resolve repo root

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
```

---

## Step 2 — Inventory doc surfaces

| Surface | Paths |
| --- | --- |
| Root | `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md` |
| Docs tree | `docs/**/*.md` |
| Brain | `brain/kb/**/*.md`, `brain/INDEX.md` |
| API | `docs/api/`, OpenAPI, route READMEs |

```bash
find . -path './.git' -prune -o -path './node_modules' -prune -o -name 'README.md' -print 2>/dev/null | head -30
```

---

## Step 3 — README vs reality

Read README setup/install sections. Verify:

- Required runtime (Node/Python version) matches config files
- Install command (`npm`/`pnpm`/`pip`) matches lockfiles present
- Dev server command exists in `package.json` scripts or documented alternative
- Env section mentions vars that appear in `.env.example` or code

```bash
test -f package.json && npm run 2>/dev/null | head -25
test -f .env.example && echo "has .env.example"
grep -RIn 'process\.env\.' --include='*.ts' --include='*.js' . 2>/dev/null | grep -v node_modules | head -20
```

---

## Step 4 — Env documentation gap

List `process.env` / `os.environ` / `ENV[` usages (sample). Compare to `.env.example` and README. Flag:

- Used in code, missing from `.env.example`
- Documented but unused (stale)

---

## Step 5 — brain/kb freshness

If `brain/kb/` exists:

```bash
git log -1 --format='%ci' -- brain/kb/ 2>/dev/null
git log -1 --format='%ci' -- src/ app/ lib/ 2>/dev/null | head -1
```

If code changed recently but KB did not, flag stale KB. Recommend **`repo-kb-sync`**.

---

## Step 6 — Broken links (markdown)

```bash
grep -RInE '\]\([^)]+\)' --include='*.md' README.md docs/ brain/ 2>/dev/null | head -40
```

Flag relative links to missing files. For `http(s)://` links, optional spot-check with curl (same-origin or critical only).

---

## Step 7 — Docs health score

Simple rubric (count findings):

| Score | Meaning |
| --- | --- |
| **A** | README matches repo; env documented; KB reasonably fresh |
| **B** | Minor stale sections or missing optional docs |
| **C** | Missing setup/env docs or KB clearly behind code |
| **F** | README wrong or missing; blocks onboarding |

---

## Report template

```markdown
# Docs Audit

## Docs health score

A | B | C | F

## Missing docs

- …

## Stale docs

- …

## Update before handoff / public release

- …

## Env documentation gaps

- …

## Broken links

- …
```

Optional: `brain/reports/repo-docs-audit-YYYY-MM-DD.md`

---

## Related skills

| Situation | Prefer |
| --- | --- |
| Update KB after code change | `repo-kb-sync` |
| Scattered random markdown files | `repo-hygiene` |
| Public publish | `repo-public-readiness` |
| Release ship gate | `repo-release-readiness` |

---

## Anti-patterns

- Do not rewrite README without approval.
- Do not treat `brain/kb` as substitute for user-facing `docs/` when both are needed.
- Do not fail the audit because external blog links 404 (note as low priority).

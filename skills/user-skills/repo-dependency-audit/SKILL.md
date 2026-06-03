---
name: repo-dependency-audit
version: 1.0.0
category: workflow
scope: universal
phase: verify
description: "Read-only package health audit: unused or duplicate dependencies, heavy packages, lockfile and package-manager consistency, risky or outdated deps. Use for dependency bloat, npm vs pnpm mix, or before a dependency cleanup."
triggers:
  - dependency audit
  - unused dependencies
  - package bloat
  - outdated packages
  - repo-dependency-audit
  - check dependencies
  - duplicate libraries
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Repo Dependency Audit — Package Health (Read-Only)

## Purpose

Audit **dependency health** without removing packages (removal can break builds).

For Node:

- `dependencies` vs `devDependencies` placement
- Unused dependencies (heuristic)
- Duplicate libraries (multiple UI, date, HTTP clients)
- Heavy packages (icon sets, moment + dayjs, etc.)
- Lockfile vs package manager mismatch (`npm` + `pnpm` artifacts)
- Deprecated or risky package names (flag for review)

Adapt checks for Python (`pyproject.toml`, `requirements.txt`), Go (`go.mod`), Rust (`Cargo.toml`) when present.

---

## Core principle

```text
Detect ecosystem → Inspect manifests + lockfiles → Heuristic usage grep → Rank findings
```

---

## Step 1 — Resolve repo root and detect ecosystem

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
ls package.json pnpm-lock.yaml package-lock.json yarn.lock pyproject.toml go.mod Cargo.toml 2>/dev/null
```

| File | Ecosystem |
| --- | --- |
| `package.json` | Node |
| `pyproject.toml` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |

---

## Step 2 — Node.js checks

### Package manager consistency

| Finding | Severity |
| --- | --- |
| Both `pnpm-lock.yaml` and `package-lock.json` | High — pick one |
| `yarn.lock` + `package-lock.json` | High |
| Only `package.json`, no lockfile | Medium — warn for apps |

### Duplicate library patterns (grep package.json)

Flag if multiple entries suggest overlap:

- UI: `mui` + `@mui/material` + heavy headless duplicates
- Dates: `moment` + `dayjs` + `date-fns`
- HTTP: `axios` + `got` + native fetch wrappers
- Icons: `@mui/icons-material` + `lucide-react` + large icon packs (info if intentional)

```bash
node -e "const p=require('./package.json'); const d={...p.dependencies,...p.devDependencies}; console.log(Object.keys(d).sort().join('\n'))" 2>/dev/null
```

### Unused deps (heuristic)

For each dependency name, sample import usage:

```bash
# Example for package "lodash" — repeat for suspicious deps
grep -RIn "from ['\"]lodash" --include='*.{ts,tsx,js,jsx}' . 2>/dev/null | grep -v node_modules | head -3
```

Mark **unused-candidate** only when zero imports and not a CLI/binary dep (`bin` in package).

### Heavy / risky flags

- `node_modules` size sample: `du -sh node_modules 2>/dev/null | head -1`
- Packages with `deprecated` in `npm view` (optional, network) — skip if offline

### Prisma / DB drivers

Flag multiple ORMs or conflicting Mongo drivers if both appear in dependencies.

---

## Step 3 — Python / Go / Rust (brief)

- **Python:** separate prod vs dev deps in `pyproject.toml`; pin files consistent
- **Go:** `go.mod` `require` vs actual imports (spot-check)
- **Rust:** workspace members vs orphan crates

---

## Step 4 — Ranked report

```markdown
# Dependency Audit

## Ecosystem

Node (pnpm) | …

## Critical

- …

## High

- …

## Medium

- …

## Info

- …

## Suggested commands (do not run without approval)

- `npx depcheck` (Node)
- `npm outdated` / `pnpm outdated`
- `go mod tidy` (dry review only)
```

Optional: `brain/reports/repo-dependency-audit-YYYY-MM-DD.md`

---

## Related skills

| Situation | Prefer |
| --- | --- |
| Release before publish | `repo-release-readiness` |
| Structure / duplicate utils folders | `repo-structure-audit` |
| Stack documented in KB | `repo-kb-sync` / `init-brain` |

---

## Anti-patterns

- Do not `npm uninstall` packages in this skill.
- Do not mark deps unused based on one grep miss (CLI, dynamic import, config plugins).
- Do not upgrade major versions without user request.

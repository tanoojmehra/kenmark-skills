---
name: repo-quality-gates
version: 1.0.0
category: workflow
scope: universal
phase: verify
description: "Detect and run repo quality gates for dev/runtime/build/typecheck/TSX/lint/format errors. Discovers available scripts, runs safe checks in order, classifies failures, and produces a fix plan without auto-editing."
triggers:
  - repo quality gates
  - check build errors
  - check dev errors
  - check runtime errors
  - check tsx errors
  - check typescript errors
  - check lint errors
  - check formatting errors
  - run quality checks
  - verify repo
  - diagnose build failure
  - diagnose lint failure
  - diagnose type errors
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - TodoWrite
  - AskUserQuestion
risk: shell
disable-model-invocation: false
---

# Repo Quality Gates — Dev / Runtime / Build / Type / Lint / Format Check Skill

## Purpose

Use this skill when the user wants to check a repository for quality-gate failures, including:

- dev server startup errors
- runtime errors
- build errors
- TypeScript / TSX errors
- lint errors
- formatting errors
- test command failures
- package/script/config issues that prevent verification

This skill is universal. It must not assume a specific framework, package manager, language, or repo layout.

Default behavior is **diagnose and report**. Do not edit files unless the user explicitly asks for fixes after the report.

---

## Core principle

```text
Discover commands → Run safe checks → Capture output → Classify failures → Recommend fixes → Ask before editing
```

Do not jump straight into code edits. First identify which gate fails and why.

---

## Operating modes

| Mode             | Use when                             | Behavior                                                       |
| ---------------- | ------------------------------------ | -------------------------------------------------------------- |
| `quick-check`    | User wants a fast check              | Obvious install-state, typecheck/build/lint                    |
| `standard-check` | Normal repo verification             | Discover scripts and run selected gates in safe order          |
| `deep-diagnosis` | Build/dev/runtime failure is unclear | Inspect configs, dependency versions, entry points, and errors |
| `ci-parity`      | User asks to match CI                | Prefer CI workflow commands over guessed local scripts         |
| `fix-plan`       | Checks already failed                | Produce ranked fixes, do not edit without approval             |

If the user says “check everything,” use `standard-check` unless the repo is large or commands are expensive; then ask before running long-running tests.

---

## Safety rules

- Prefer read-only commands and deterministic checks.
- Do not run destructive commands.
- Do not run migrations, seed scripts, deploy scripts, publish scripts, reset scripts, or cleanup scripts unless the user explicitly asks.
- Do not start a long-running dev server without a timeout or clear stopping plan.
- Do not expose secret values from logs or `.env` files.
- Do not auto-fix lint/format errors unless the user approves.
- If a command may modify files (`format`, `lint --fix`, codegen), first run its check-only variant when available.
- If a command fails, preserve the exact error summary and the command used.

---

## Step 1 — Resolve repo root and state

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
echo "REPO_ROOT=$REPO_ROOT"
git status --short 2>/dev/null || true
```

Record whether the repo is already dirty. Do not mix pre-existing changes with fixes unless the user approves.

---

## Step 2 — Discover ecosystem and package manager

Inspect common files:

```bash
find . -maxdepth 3 -type f \( \
  -name package.json -o \
  -name pnpm-lock.yaml -o \
  -name package-lock.json -o \
  -name yarn.lock -o \
  -name bun.lockb -o \
  -name tsconfig.json -o \
  -name next.config.js -o -name next.config.mjs -o -name next.config.ts -o \
  -name vite.config.js -o -name vite.config.ts -o \
  -name eslint.config.js -o -name eslint.config.mjs -o -name .eslintrc -o -name .eslintrc.js -o -name .eslintrc.json -o \
  -name prettier.config.js -o -name prettier.config.mjs -o -name .prettierrc -o -name .prettierrc.json \
\) -print
```

For Node repos, choose package manager by lockfile:

| Lockfile            | Package manager |
| ------------------- | --------------- |
| `pnpm-lock.yaml`    | `pnpm`          |
| `yarn.lock`         | `yarn`          |
| `bun.lockb`         | `bun`           |
| `package-lock.json` | `npm`           |

If multiple lockfiles exist, flag this as a warning.

---

## Step 3 — Read available scripts

For Node repos:

```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts||{}, null, 2))" 2>/dev/null || true
```

Classify scripts:

| Gate          | Script names to look for                         |
| ------------- | ------------------------------------------------ |
| typecheck     | `typecheck`, `type-check`, `tsc`, `check-types`  |
| build         | `build`, `compile`                               |
| lint          | `lint`, `eslint`                                 |
| format check  | `format:check`, `prettier:check`, `check-format` |
| tests         | `test`, `test:unit`, `test:ci`, `vitest`, `jest` |
| dev           | `dev`, `start:dev`                               |
| start/runtime | `start`, `preview`                               |

Do not run scripts with risky names unless explicitly requested:

```text
publish, deploy, release, migrate, migration, seed, reset, clean, wipe, prune, drop, destroy, db:push, db:migrate, db:seed
```

---

## Step 4 — Choose check order

Recommended default order:

```text
1. Package manager / install-state sanity
2. TypeScript / TSX typecheck
3. Lint
4. Format check
5. Build
6. Tests
7. Dev server / runtime smoke check
```

---

## Step 5 — Run safe commands

Use the detected package manager.

| Package manager | Run script          |
| --------------- | ------------------- |
| pnpm            | `pnpm run <script>` |
| npm             | `npm run <script>`  |
| yarn            | `yarn <script>`     |
| bun             | `bun run <script>`  |

Examples:

```bash
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
pnpm test
```

If only `tsc` is available and TypeScript exists:

```bash
npx tsc --noEmit
```

If ESLint config exists but no lint script:

```bash
npx eslint .
```

If Prettier config exists but no format check script:

```bash
npx prettier . --check
```

Do not run `--fix` or `--write` without approval.

---

## Step 6 — Dev/runtime smoke checks

Only run dev/runtime commands if:

- the user asked for dev/runtime errors, or
- build passes but runtime behavior is suspected, or
- the failure happens on startup.

Before starting a dev server, check likely occupied ports:

```bash
lsof -iTCP -sTCP:LISTEN -n -P | head -50 2>/dev/null || true
```

Run with timeout where available:

```bash
timeout 20s pnpm dev 2>&1 | tee temp/repo-quality-dev.log
```

On macOS where `timeout` may not exist:

```bash
mkdir -p temp
(pnpm dev > temp/repo-quality-dev.log 2>&1 & echo $! > temp/repo-quality-dev.pid)
sleep 20
kill "$(cat temp/repo-quality-dev.pid)" 2>/dev/null || true
cat temp/repo-quality-dev.log | tail -120
```

Do not leave background dev servers running.

---

## Step 7 — Classify failures

| Class         | Examples                                                    | Typical fix path                               |
| ------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| `dependency`  | module not found, peer mismatch, lockfile mismatch          | sync package manager, fix versions             |
| `typescript`  | TS2322, TS2307, missing types                               | type fixes, imports, tsconfig, generated types |
| `tsx/jsx`     | invalid component props, JSX syntax, client/server mismatch | component API, props, React/Next boundary      |
| `lint`        | unused vars, hooks rules, no-explicit-any                   | targeted cleanup or config adjustment          |
| `format`      | prettier/check format failure                               | run approved formatter or patch formatting     |
| `build`       | bundler/compiler failure, route errors                      | inspect framework output and entry file        |
| `runtime`     | dev server crash, env missing, port conflict                | env docs, port/process, config                 |
| `test`        | failing assertions, missing mocks, env setup                | isolate failing test                           |
| `config`      | invalid tsconfig/eslint/prettier/next/vite config           | config correction                              |
| `environment` | missing Node version, command not found                     | toolchain/version setup                        |

---

## Step 8 — Output report

Use this template for the report (fill in rows and sections from the run):

```markdown
# Repo Quality Gates Report

## Summary

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| package manager | ... | pass/fail/skip | ... |
| typecheck | ... | pass/fail/skip | ... |
| lint | ... | pass/fail/skip | ... |
| format | ... | pass/fail/skip | ... |
| build | ... | pass/fail/skip | ... |
| test | ... | pass/fail/skip | ... |
| dev/runtime | ... | pass/fail/skip | ... |

## Highest-priority failures

1. **Gate:** ...
   - Class:
   - Evidence:
   - Likely cause:
   - Suggested fix:
   - Confidence:

## Error details

Include concise error excerpts. Do not paste huge logs. Prefer first error + final summary.

## Recommended fix order

1. Fix dependency/toolchain issues first.
2. Fix TypeScript errors before build errors.
3. Fix lint/format separately.
4. Re-run the smallest failing gate after each fix.
5. Run full build/test once targeted gates pass.

## Commands to rerun

(paste a separate fenced `bash` block with the exact rerun commands)

## Files likely involved

- ...
```

---

## Step 9 — Ask before fixes

After reporting, ask what the user wants:

```text
Choose next step:
1. Fix only the first failing gate
2. Fix all TypeScript/TSX errors
3. Fix lint errors only
4. Apply formatter
5. Fix build/runtime startup
6. Just give me the report, no changes
```

Do not modify files unless the user chooses a fix path.

---

## Step 10 — Optional KB update

If this skill reveals durable project knowledge, recommend updating `brain/kb/` via `repo-kb-sync`.

Examples:

- New required env var found during runtime check
- Build command differs from README
- Known lint/typecheck caveat
- Required Node/package manager version
- Dev server port or startup behavior

---

## Anti-patterns

- Do not run `npm audit fix`, `pnpm update`, or dependency upgrades without approval.
- Do not run format/write/fix commands without approval.
- Do not treat build failure and TypeScript failure as separate root causes if build is only surfacing the same type error.
- Do not paste entire logs when the first actionable error is enough.
- Do not start multiple dev servers on different ports.
- Do not hide skipped gates. Always say why a gate was skipped.

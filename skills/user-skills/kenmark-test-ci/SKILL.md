---
name: kenmark-test-ci
version: 1.0.0
category: testing
scope: universal
phase: ship
description: "Wire tests into CI/CD and release gates: install, typecheck, lint, format, unit, integration, E2E, coverage, build, artifact, and prepublish/predeploy checks."
triggers:
  - kenmark-test-ci
  - test ci
  - ci tests
  - github actions tests
  - gitlab ci tests
  - prepublish tests
  - predeploy tests
  - quality pipeline
  - test workflow
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
  - Edit
  - TodoWrite
  - AskUserQuestion
risk: write-files
disable-model-invocation: true
---

# Kenmark Test CI

## Purpose

Before writing or running tests, follow the shared testing contract: `skills/shared/testing-contract.md`.

Use this skill to make tests run reliably in CI/CD.

It covers:

- GitHub Actions
- GitLab CI
- package scripts
- prepublish/predeploy gates
- test matrix
- caching
- environment variables
- browser install for Playwright
- DB service containers for integration tests

---

## Package manager rule

Detect package manager from lockfile:

| Lockfile | Package manager |
| --- | --- |
| `pnpm-lock.yaml` | `pnpm` |
| `yarn.lock` | `yarn` |
| `bun.lockb` | `bun` |
| `package-lock.json` | `npm` |

Prefer package scripts and repo-local binaries before `npx`.

Do not use `npx` to fetch tools unless:
- the tool is already listed in dependencies/devDependencies, or
- the user approves adding/fetching it.

---

## Testing safety contract

- Do not use production data or production credentials.
- Do not hit paid/external services unless explicitly approved.
- Do not add new frameworks when the repo already has a good one.
- Prefer existing scripts and conventions.
- Run the smallest relevant test first.
- Document any env vars or setup needed.
- Update `brain/kb/` when testing setup changes materially.

---

## Core principle

```text
CI should catch the same failures users/deployments would hit, without being painfully slow.
```

---

## Step 1 — Detect CI

```bash
find . -maxdepth 4 -type f \( \
  -path "./.github/workflows/*.yml" -o \
  -path "./.github/workflows/*.yaml" -o \
  -name ".gitlab-ci.yml" -o \
  -name "bitbucket-pipelines.yml" \
\) -print
```

Read package scripts.

---

## Step 2 — Choose gates

Recommended order:

```text
install
typecheck
lint
format check
unit tests
integration tests
build
E2E tests
coverage/report
pack/publish dry-run
```

For most repos, CI should start with:

```text
typecheck + lint + test + build
```

Add E2E only for mature apps or critical flows.

---

## Standard CI templates

### GitHub Actions (Node)

Adapt install/cache steps to detected package manager:

| Lockfile | Setup | Install |
| --- | --- | --- |
| `pnpm-lock.yaml` | `pnpm/action-setup` + `actions/setup-node` with `cache: pnpm` | `pnpm install --frozen-lockfile` |
| `package-lock.json` | `actions/setup-node` with `cache: npm` | `npm ci` |
| `yarn.lock` | `actions/setup-node` with `cache: yarn` | `yarn install --frozen-lockfile` |
| `bun.lockb` | `oven-sh/setup-bun` | `bun install --frozen-lockfile` |

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck --if-present
      - run: npm run lint --if-present
      - run: npm test --if-present
      - run: npm run build --if-present
```

Replace `npm ci` / `cache: npm` with the detected package manager from the table above. Prefer `--if-present` for optional gates.

---

## Monorepo guidance

For monorepos:

- detect package manager workspace config
- run affected/package-specific tests when available
- avoid running every expensive E2E job on every PR unless needed

---

## Step 3 — Update CI safely

Do not add secrets to repo.

Use repository secrets for:

```text
DATABASE_URL_TEST
API keys
OAuth credentials
payment sandbox credentials
```

---

## Output format

```markdown
# Test CI Summary

## CI files changed

## Gates added

## Commands

## Required secrets

## Runtime/caching notes

## Failure behavior
```

---

## Related skills

**Verify gates:** After creating/changing tests, run **`kenmark-repo-quality`** to verify test/type/lint/build gates.

**KB updates:** If this changes the test framework, scripts, CI gates, fixtures, env vars, coverage policy, or setup instructions, update `brain/kb/10-testing-and-quality.md` via **`kenmark-repo-kb`**.

---

## Anti-patterns

- Do not run production deploy from test workflow.
- Do not expose secrets in logs.
- Do not make every PR run extremely heavy E2E unless necessary.
- Do not skip install lockfile consistency.

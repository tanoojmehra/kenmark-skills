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
disable-model-invocation: false
---

# Kenmark Test CI

## Purpose

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

## Anti-patterns

- Do not run production deploy from test workflow.
- Do not expose secrets in logs.
- Do not make every PR run extremely heavy E2E unless necessary.
- Do not skip install lockfile consistency.

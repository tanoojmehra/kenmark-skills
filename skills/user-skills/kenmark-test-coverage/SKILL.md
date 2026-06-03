---
name: kenmark-test-coverage
version: 1.0.0
category: testing
scope: universal
phase: audit
description: "Audit test coverage and meaningful risk coverage. Identify untested critical paths, weak assertions, missing edge cases, and propose pragmatic coverage thresholds."
triggers:
  - kenmark-test-coverage
  - coverage audit
  - test coverage
  - improve coverage
  - missing tests
  - coverage gaps
  - weak tests
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - TodoWrite
  - AskUserQuestion
risk: read-only
disable-model-invocation: false
---

# Kenmark Test Coverage

## Purpose

Use this skill to audit whether the repo has meaningful test coverage.

It checks:

- which critical areas lack tests
- whether assertions are meaningful
- whether coverage thresholds exist
- whether tests cover risk, not just lines
- whether E2E flows cover core journeys

---

## Core principle

```text
Coverage percentage is a signal, not the goal.
```

---

## Step 1 — Discover coverage tooling

```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts||{}, null, 2))" 2>/dev/null || true
find . -maxdepth 4 -type f \( -name "coverage-final.json" -o -name "lcov.info" -o -name "vitest.config.*" -o -name "jest.config.*" \) -print
```

---

## Step 2 — Run coverage only if safe

Use existing command:

```bash
npm run test:coverage
pnpm test:coverage
npm run coverage
```

If no coverage command exists, recommend one instead of forcing it.

---

## Step 3 — Audit critical paths

Map code to tests:

```text
auth
permissions
payments
data writes
API contracts
forms
file upload
background jobs
external integrations
error handling
```

---

## Output format

```markdown
# Coverage Audit

## Current coverage setup

## Coverage gaps by risk

| Area | Risk | Existing tests | Gap | Recommendation |
| --- | --- | --- | --- | --- |

## Weak tests

## Suggested thresholds

## Next tests to write
```

---

## Anti-patterns

- Do not recommend 100% coverage as default.
- Do not treat snapshots as meaningful coverage by themselves.
- Do not ignore high-risk untested flows because global coverage is high.

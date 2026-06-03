---
name: kenmark-test-plan
version: 1.0.0
category: testing
scope: universal
phase: plan
description: "Create a practical test strategy for a repo or feature: choose unit, integration, E2E, mocks, coverage, CI gates, and the minimum meaningful test suite before implementation."
triggers:
  - kenmark-test-plan
  - test plan
  - testing strategy
  - plan tests
  - what tests should we write
  - testing suite
  - test architecture
  - coverage strategy
  - qa plan
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - TodoWrite
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Kenmark Test Plan

## Purpose

Use this skill to design a practical test strategy before writing tests.

This skill decides:

- which layers need tests
- which framework is already present
- what commands should exist
- which tests are highest ROI
- what mocks/fixtures are needed
- what should run locally vs CI
- what should block release

Do not write tests by default. Produce a plan first.

---

## Core principle

```text
Test behavior, boundaries, and risk — not implementation noise.
```

---

## Step 1 — Inspect existing test setup

Run read-only discovery:

```bash
find . -maxdepth 4 -type f \( \
  -name package.json -o \
  -name "vitest.config.*" -o \
  -name "jest.config.*" -o \
  -name "playwright.config.*" -o \
  -name "cypress.config.*" -o \
  -name "tsconfig.json" -o \
  -name ".github" \
\) -print 2>/dev/null

find . -type f \( \
  -name "*.test.*" -o \
  -name "*.spec.*" -o \
  -path "*/tests/*" -o \
  -path "*/__tests__/*" \
\) -not -path "*/node_modules/*" | head -100
```

Read scripts:

```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts||{}, null, 2))" 2>/dev/null || true
```

---

## Step 2 — Classify project

Identify:

```text
frontend app
backend API
full-stack app
library/package
CLI
monorepo
mobile app
infra/tooling repo
```

For Next.js/Tailwind/ShadCN/Prisma/MongoDB stacks, prefer:

```text
unit: Vitest + Testing Library
integration: API/service tests with test DB/mocks
E2E: Playwright
coverage: Vitest coverage
CI: typecheck + lint + test + build
```

But adapt to existing repo tools. Do not force new tools if good ones already exist.

---

## Step 3 — Choose test layers

Output:

| Layer       | Should exist? | Why | Tool |
| ----------- | ------------- | --- | ---- |
| Unit        | yes/no        | ... | ...  |
| Integration | yes/no        | ... | ...  |
| E2E         | yes/no        | ... | ...  |
| Coverage    | yes/no        | ... | ...  |
| CI          | yes/no        | ... | ...  |

---

## Step 4 — Prioritize tests

Rank by risk:

```text
P0: auth, payments, permissions, data loss, public API contracts
P1: core user flows, forms, DB writes, background jobs
P2: UI states, utility functions, edge cases
```

---

## Output format

```markdown
# Test Plan

## Current test setup

## Recommended test stack

## Test layers

## Priority test matrix

| Area | Risk | Test layer | Test to write |
| --- | --- | --- | --- |

## Scripts to add/update

## Files likely involved

## Mocks/fixtures needed

## CI gates

## Acceptance criteria
```

---

## Anti-patterns

- Do not chase 100% coverage blindly.
- Do not add E2E tests for behavior better covered by unit/integration tests.
- Do not write brittle tests that assert implementation details.
- Do not introduce a second test framework without a good reason.

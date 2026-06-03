---
name: kenmark-test-e2e
version: 1.0.0
category: testing
scope: universal
phase: implement
description: "Add or improve end-to-end tests for critical user journeys using Playwright, Cypress, or the repo's existing browser automation framework."
triggers:
  - kenmark-test-e2e
  - e2e tests
  - end to end tests
  - playwright tests
  - cypress tests
  - browser tests
  - test user flow
  - test journey
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

# Kenmark Test E2E

## Purpose

Use this skill to test complete user journeys.

Good targets:

- sign up / login
- checkout / payment sandbox
- create/edit/delete workflows
- onboarding
- dashboard flows
- file upload
- search/filter
- critical admin actions

---

## Core principle

```text
E2E tests should cover critical journeys, not every small component.
```

---

## Preferred tools

Use existing framework first.

If none exists:

```text
Playwright for modern web apps
Cypress only if repo already uses it or team prefers it
```

---

## Step 1 — Detect app startup

Inspect scripts:

```bash
node -e "const p=require('./package.json'); console.log(p.scripts)" 2>/dev/null || true
```

Find:

```text
dev
start
build
preview
test:e2e
playwright
cypress
```

---

## Step 2 — Choose journey

Each E2E test needs:

```text
precondition
user action path
expected visible result
data cleanup strategy
```

Prefer stable selectors:

```text
role/name
label text
test ids only when needed
```

---

## Step 3 — Run safely

Use existing commands:

```bash
npm run test:e2e
pnpm test:e2e
npx playwright test
npx cypress run
```

If a server is required, use the framework's webServer config when possible.

---

## Output format

```markdown
# E2E Test Summary

## Journey covered

## Files added/changed

## Setup required

## Commands run

## Result

## Flake risks
```

---

## Anti-patterns

- Do not test implementation details.
- Do not depend on external production services.
- Do not use arbitrary sleeps when wait-for conditions exist.
- Do not write broad fragile flows that fail for unrelated UI copy changes.

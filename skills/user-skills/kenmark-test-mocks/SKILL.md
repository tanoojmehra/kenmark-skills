---
name: kenmark-test-mocks
version: 1.0.0
category: testing
scope: universal
phase: support
description: "Create and maintain test fixtures, factories, mocks, stubs, fake adapters, MSW handlers, seeded test data, and deterministic test helpers."
triggers:
  - kenmark-test-mocks
  - mocks
  - fixtures
  - factories
  - test data
  - msw handlers
  - mock api
  - fake adapter
  - seed test data
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

# Kenmark Test Mocks

## Purpose

Use this skill to create reliable test support infrastructure:

- fixtures
- factories
- fake adapters
- MSW handlers
- seeded test data
- mock auth/session helpers
- deterministic time/random helpers
- test DB seed/cleanup utilities

---

## Core principle

```text
Mocks should make tests deterministic without lying about real behavior.
```

---

## Step 1 — Identify dependency type

Classify what must be mocked:

```text
network API
database
auth/session
time/date
random/uuid
filesystem/storage
email/SMS
payment provider
queue/job
browser API
```

---

## Step 2 — Choose approach

| Dependency        | Preferred approach                    |
| ----------------- | ------------------------------------- |
| HTTP API          | MSW or framework request mocking      |
| DB                | test DB or repository fake            |
| Auth              | test session helper                   |
| Time              | fake timers / fixed clock             |
| UUID/random       | deterministic generator               |
| Payment/email/SMS | fake adapter                          |
| Storage           | temp directory / fake storage adapter |

---

## Step 3 — Create reusable helpers

Common locations:

```text
tests/fixtures/
tests/factories/
tests/mocks/
src/test/
test-utils/
```

Follow existing repo convention.

---

## Output format

```markdown
# Test Support Summary

## Helpers added

## How to use

## Tests updated

## Safety notes
```

---

## Anti-patterns

- Do not mock the behavior being tested.
- Do not create fixtures with real customer data.
- Do not make factories overcomplicated.
- Do not hide meaningful errors behind too-powerful mocks.

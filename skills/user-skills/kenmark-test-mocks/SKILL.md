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
Mocks should make tests deterministic without lying about real behavior.
```

---

## Decision rule

- Prefer real dependencies for integration tests when safe.
- Prefer mocks for unstable, paid, slow, or external dependencies.
- Do not mock the same boundary that the test is supposed to verify.

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

## Factory rules

Factories should:

- use fake/synthetic data only
- accept overrides
- avoid hidden global state
- avoid real customer/client data
- produce valid defaults

---

## MSW detail

For HTTP mocks:

- prefer MSW when already present
- centralize handlers
- test error and latency states
- avoid one-off inline fetch mocks unless the repo already uses them

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

## Related skills

**Verify gates:** After creating/changing tests, run **`kenmark-repo-quality`** to verify test/type/lint/build gates.

**KB updates:** If this changes the test framework, commands, CI gates, fixtures, env vars, or coverage policy, update `brain/kb/10-testing-and-quality.md` via **`kenmark-repo-kb`**.

---

## Anti-patterns

- Do not mock the behavior being tested.
- Do not create fixtures with real customer data.
- Do not make factories overcomplicated.
- Do not hide meaningful errors behind too-powerful mocks.

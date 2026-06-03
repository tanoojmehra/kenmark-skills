---
name: kenmark-test-integration
version: 1.0.0
category: testing
scope: universal
phase: implement
description: "Add integration tests for APIs, database operations, services, auth boundaries, queues, and module interactions using safe test databases, mocks, or containers."
triggers:
  - kenmark-test-integration
  - integration tests
  - api tests
  - database tests
  - service tests
  - test api route
  - test prisma
  - test mongodb
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

# Kenmark Test Integration

## Purpose

Use this skill to test interactions between modules.

Good targets:

- API routes
- auth/session boundaries
- DB reads/writes
- Prisma/MongoDB queries
- service + repository layers
- webhook handlers
- queues/jobs
- filesystem/storage adapters

---

## Core principle

```text
Integration tests should verify real boundaries without touching production data.
```

---

## Safety rules

- Never use production DB URLs.
- Never run destructive tests against real services.
- Prefer test DBs, isolated schemas, in-memory adapters, test containers, or mocks.
- Ensure cleanup after each test.
- Verify `.env.test` / test env separation before running DB tests.

---

## Step 1 — Identify boundary

Classify target:

```text
API
database
auth
external service
queue/job
file/storage
multi-module workflow
```

---

## Step 2 — Determine test environment

Look for:

```bash
find . -maxdepth 3 -type f \( -name ".env.test" -o -name "docker-compose*.yml" -o -name "prisma.schema" -o -name "schema.prisma" \) -print
```

For Prisma/MongoDB:

```text
Use DATABASE_URL_TEST or isolated test DB.
Never reuse DATABASE_URL without explicit confirmation.
```

---

## Step 3 — Write integration test

A good integration test includes:

```text
setup
action
assertion
cleanup
```

For APIs:

```text
status code
response body
auth behavior
validation errors
DB side effects
```

For DB:

```text
insert/write
query/read
constraint/validation
cleanup
```

---

## Output format

```markdown
# Integration Test Summary

## Boundary tested

## Test environment

## Files added/changed

## Commands run

## Result

## Data safety notes
```

---

## Anti-patterns

- Do not hit production APIs.
- Do not require a developer's personal database.
- Do not make tests order-dependent.
- Do not leave test data behind.

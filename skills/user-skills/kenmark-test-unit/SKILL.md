---
name: kenmark-test-unit
version: 1.0.0
category: testing
scope: universal
phase: implement
description: "Add or improve unit tests for functions, components, hooks, utilities, validators, reducers, services, and isolated behavior using the repo's existing test framework where possible."
triggers:
  - kenmark-test-unit
  - unit tests
  - write unit tests
  - test this function
  - test this component
  - test this hook
  - vitest tests
  - jest tests
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

# Kenmark Test Unit

## Purpose

Use this skill to write focused unit tests.

Good targets:

- pure functions
- validators
- formatters
- hooks
- reducers
- utility modules
- components with deterministic UI states
- service methods with dependencies mocked

---

## Core principle

```text
Unit tests should be fast, deterministic, isolated, and behavior-focused.
```

---

## Step 1 — Detect framework

Prefer existing setup:

```bash
cat package.json 2>/dev/null | grep -E '"(test|vitest|jest)"' || true
find . -maxdepth 3 -type f \( -name "vitest.config.*" -o -name "jest.config.*" \) -print
```

If no framework exists, recommend before adding:

```text
Vitest for modern TS/Next/Vite projects
Jest only if already used or required
Testing Library for React components
```

---

## Step 2 — Choose test file location

Follow repo convention:

```text
same folder: thing.test.ts
same folder: component.test.tsx
__tests__/ folder if existing
tests/unit/ only if repo already uses it
```

Do not invent a new convention if one exists.

---

## Step 3 — Write tests

Each unit test should include:

```text
happy path
edge case
failure/error path
important regression case
```

For React components:

```text
render state
user interaction
accessibility labels/roles
loading/empty/error states
```

---

## Step 4 — Run smallest command

Run the narrowest test command first:

```bash
npm test -- path/to/file.test.ts
pnpm test path/to/file.test.ts
npx vitest run path/to/file.test.ts
npx jest path/to/file.test.ts
```

Then broader test command if needed.

---

## Output format

```markdown
# Unit Test Summary

## Files added/changed

## Behaviors covered

## Commands run

## Results

## Remaining gaps
```

---

## Anti-patterns

- Do not mock the function under test.
- Do not snapshot everything.
- Do not assert private implementation details.
- Do not make tests depend on order/time/network unless controlled.

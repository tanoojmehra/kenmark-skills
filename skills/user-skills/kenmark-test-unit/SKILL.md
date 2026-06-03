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

## Before writing tests

- Read the target file.
- Read nearest existing tests.
- Match naming/import conventions.
- Identify public behavior.
- Identify dependencies to mock.

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

## React component testing rules

- Prefer Testing Library queries by role, label, text.
- Avoid testing internal state directly.
- Mock network boundaries, not UI behavior.
- Include accessible-name checks for interactive elements.

---

## Hook testing rules

- Use Testing Library `renderHook` or existing repo pattern.
- Test state transitions and cleanup.
- Control timers when testing debounce/throttle.

---

## Utility testing rules

- Cover boundary values.
- Cover invalid input.
- Cover regression examples from bugs/issues.

---

## Step 4 — Run smallest command

**Hard rule:** Run the narrowest test first. Do **not** run the full suite until the targeted test passes.

Run the narrowest test command first (use detected package manager — see Package manager rule):

```bash
$PM test -- path/to/file.test.ts
./node_modules/.bin/vitest run path/to/file.test.ts
./node_modules/.bin/jest path/to/file.test.ts
```

Only after the targeted test passes, run a broader test command if needed.

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

## Related skills

**Verify gates:** After creating/changing tests, run **`kenmark-repo-quality`** to verify test/type/lint/build gates.

**KB updates:** If this changes the test framework, commands, CI gates, fixtures, env vars, or coverage policy, update `brain/kb/10-testing-and-quality.md` via **`kenmark-repo-kb`**.

---

## Anti-patterns

- Do not mock the function under test.
- Do not snapshot everything.
- Do not assert private implementation details.
- Do not make tests depend on order/time/network unless controlled.

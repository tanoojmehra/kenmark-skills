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

Before writing or running tests, follow `skills/shared/testing-contract.md`.

Use this skill to audit whether the repo has meaningful test coverage.

It checks:

- which critical areas lack tests
- whether assertions are meaningful
- whether coverage thresholds exist
- whether tests cover risk, not just lines
- whether E2E flows cover core journeys

---

---

## Core principle

```text
Coverage percentage is a signal, not the goal.
```

---

## Meaningful threshold guidance

Suggested defaults:

- New/changed critical files: meaningful tests required.
- Global line coverage: do not enforce aggressively at first.
- Critical modules: higher branch coverage than UI glue.
- Avoid coverage gates that block useful refactors without improving quality.

---

## Weak test detection

Weak test patterns:

- test only renders without assertions
- snapshots with no behavioral assertions
- mocks everything including the unit under test
- asserts implementation details
- no negative/error cases
- tests duplicate code instead of behavior

---

## Step 1 — Discover coverage tooling

```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts||{}, null, 2))" 2>/dev/null || true
find . -maxdepth 4 -type f \( -name "coverage-final.json" -o -name "lcov.info" -o -name "vitest.config.*" -o -name "jest.config.*" \) -print
```

---

## Step 2 — Run coverage only if safe

**Command safety:** Run coverage only if the command exists and does not require production services. If the coverage command is absent, propose scripts/config instead of running arbitrary tools.

Use existing command (detect package manager — see `skills/shared/testing-contract.md`):

```bash
$PM run test:coverage
$PM run coverage
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

## Related skills

**Verify gates:** After creating/changing tests, run **`kenmark-repo-quality`** to verify test/type/lint/build gates.

**KB updates:** If this changes the test framework, scripts, CI gates, fixtures, env vars, coverage policy, or setup instructions, update `brain/kb/10-testing-and-quality.md` via **`kenmark-repo-kb`**.

---

## Anti-patterns

- Do not recommend 100% coverage as default.
- Do not treat snapshots as meaningful coverage by themselves.
- Do not ignore high-risk untested flows because global coverage is high.

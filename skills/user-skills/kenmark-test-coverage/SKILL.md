---
name: kenmark-test-coverage
version: 1.1.0
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

## Step 4 — Optional mutation confidence

Line coverage can be high while tests fail to protect behavior. For critical logic, add a **mutation-confidence** lens.

Prefer an already-configured mutation-testing tool (for example Stryker, mutmut, PIT, or the ecosystem equivalent). Discover existing config/scripts first; do not install new tooling automatically.

```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts||{}, null, 2))" 2>/dev/null || true
find . -maxdepth 3 -type f \( -name 'stryker.conf.*' -o -name '.stryker-tmp' -o -name 'mutmut-config*' -o -name 'pitest*' \) -print 2>/dev/null
```

When a configured mutation command exists and is safe/local, run it against a narrow critical module. Otherwise, report **candidate mutations** without changing tracked source:

- invert a permission/authorization condition
- change `>` to `>=` (or the reverse) at an important threshold
- remove a required guard/validation branch
- replace a success/error branch return value
- skip an idempotency or ownership check

A strong test suite should fail for behavior-changing mutations. If these changes would survive, the gap is **behavioral protection**, even if percentage coverage is high.

**Safety:** this skill remains read-only. Do not directly edit tracked source to simulate mutations. If the user explicitly wants manual mutation experiments, use a disposable copy/worktree or a configured mutation runner and restore/verify state before reporting.

---

## Output format

```markdown
# Coverage Audit

## Current coverage setup

## Coverage gaps by risk

| Area | Risk | Existing tests | Gap | Recommendation |
| --- | --- | --- | --- | --- |

## Weak tests

## Mutation confidence

- Configured mutation tooling: yes/no
- Critical modules sampled: ...
- Surviving/high-risk candidate mutations: ...

## Suggested thresholds

## Next tests to write
```

---

## Related skills

**Verify gates:** After creating/changing tests, run **`kenmark-repo-quality`** to verify test/type/lint/build gates.

**KB updates:** If this changes the test framework, scripts, CI gates, fixtures, env vars, coverage policy, or setup instructions, update `brain/kb/10-testing-and-quality.md` via **`kenmark-kb-sync`**.

---

## Anti-patterns

- Do not recommend 100% coverage as default.
- Do not treat snapshots as meaningful coverage by themselves.
- Do not ignore high-risk untested flows because global coverage is high.

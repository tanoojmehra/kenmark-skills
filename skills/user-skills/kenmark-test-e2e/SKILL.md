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
disable-model-invocation: true
---

# Kenmark Test E2E

## Purpose

Before writing or running tests, follow the shared testing contract: `skills/shared/testing-contract.md`.

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

**Journey budget:** A first E2E suite should usually cover **1–3 critical journeys**, not the whole app.

---

## Flake prevention

- Prefer role/label selectors.
- Avoid arbitrary sleeps.
- Use wait-for-visible/network-idle only when meaningful.
- Seed deterministic test data.
- Avoid relying on external third-party services.
- Clean up data after test.

---

## Auth state guidance

For authenticated flows:

- Prefer test login helper or storage state.
- Do not use personal credentials.
- Use test users only.

---

## Browser install safety

Do not run `npx playwright install` or download browsers unless the user approves or CI already requires it.

---

## Step 3 — Run safely

Use existing commands (detect package manager — see Package manager rule):

```bash
$PM run test:e2e
./node_modules/.bin/playwright test
./node_modules/.bin/cypress run
```

Replace `$PM` with `npm`, `pnpm`, `yarn`, or `bun` based on lockfile.

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

## Related skills

**Verify gates:** After creating/changing tests, run **`kenmark-repo-quality`** to verify test/type/lint/build gates.

**KB updates:** If this changes the test framework, scripts, CI gates, fixtures, env vars, coverage policy, or setup instructions, update `brain/kb/10-testing-and-quality.md` via **`kenmark-repo-kb`**.

---

## Anti-patterns

- Do not test implementation details.
- Do not depend on external production services.
- Do not use arbitrary sleeps when wait-for conditions exist.
- Do not write broad fragile flows that fail for unrelated UI copy changes.

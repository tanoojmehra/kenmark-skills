# Skills layout

The Kenmark CLI installs skills from **flat** directories only: each skill is
`<dir>/<skill-name>/SKILL.md`. Nested category folders are not used on disk
because `listKenmarkBundledSkillNames()` scans direct children of
`skills/user-skills/`.

Use **frontmatter** for logical grouping instead:

| Field | Values |
| --- | --- |
| `category` | `onboarding`, `workflow`, `git`, `issues`, `plans`, `admin`, `testing` |
| `scope` | `universal` (default install via `setup`) or `project-specific` (excluded from `setup`; maintain in the target repo) |
| `project` | Optional when `scope: project-specific` — target repo or product id |

## Logical map (flat on disk)

```
skills/user-skills/          ← bundled universal skills (46)
  kenmark-init/                category: onboarding
  kenmark-setup/
  kenmark-router/             category: workflow (manual)
  kenmark-plan/               category: plans (phase: plan; writes brain/plans/)
  kenmark-subagents/          category: workflow (phase: orchestrate; manual)
  kenmark-output/             category: workflow (phase: verify)
  kenmark-troubleshoot/       category: workflow (phase: diagnose)
  kenmark-troubleshoot-deep/  category: workflow (phase: diagnose; manual)
  kenmark-repo-hygiene/       category: workflow (phase: audit)
  kenmark-repo-cleanup/       category: workflow (phase: maintain; manual)
  kenmark-repo-secrets/
  kenmark-repo-public/
  kenmark-security-review/         category: workflow (phase: audit)
  kenmark-performance/             category: workflow (phase: audit)
  kenmark-repo-kb/              category: workflow (phase: maintain)
  kenmark-repo-docs/
  kenmark-repo-docs-fix/      category: workflow (phase: maintain; manual)
  kenmark-repo-structure/
  kenmark-repo-deps/     category: workflow (phase: verify)
  kenmark-repo-quality/        category: workflow (phase: verify)
  kenmark-repo-release/    category: workflow (phase: ship)
  kenmark-test-plan/             category: testing (phase: plan)
  kenmark-test-unit/             category: testing (phase: implement)
  kenmark-test-integration/      category: testing (phase: implement)
  kenmark-test-e2e/              category: testing (phase: implement)
  kenmark-test-mocks/            category: testing (phase: support)
  kenmark-test-coverage/         category: testing (phase: audit)
  kenmark-test-ci/               category: testing (phase: ship)
  kenmark-commit/               category: git
  kenmark-issues-setup/              category: issues (bootstrap brain/issues/ docs)
  kenmark-issues-list/
  kenmark-issues-check/
  kenmark-issues-scan/               category: issues (scan codebase, file issues)
  kenmark-audit-loop/                category: issues (multi-pass audit until converged)
  kenmark-simplify-scan/             category: issues (manual)
  kenmark-issues-maintain/
  kenmark-issues-fix-and-ship/   category: workflow (phase: ship)
  kenmark-plans-setup/               category: plans (bootstrap brain/plans/ docs)
  kenmark-plans-list/
  kenmark-plans-check/
  kenmark-plans-maintain/
  kenmark-plans-execute/
  kenmark-packs/ category: admin
  kenmark-update/
  kenmark-maintain/
  kenmark-agents/
  recommended-catalog.json
```

All bundled skills use `scope: universal`. Skills marked `scope: project-specific`
in frontmatter are skipped by `kenmark-skills setup` if they ever appear under
`user-skills/`; project-only skills should live in that repo’s IDE skills folder,
not in this package.

## Repo skill family (routing)

| User says | Skill |
| --- | --- |
| Repo is dirty, scattered docs, dumps | `kenmark-repo-hygiene` |
| Can I make this public? | `kenmark-repo-public` |
| Check for keys/secrets | `kenmark-repo-secrets` |
| Update brain after this feature | `kenmark-repo-kb` |
| Are docs good? | `kenmark-repo-docs` |
| Is this ready to publish/release? | `kenmark-repo-release` |
| Repo layout is confusing | `kenmark-repo-structure` |
| Dependency bloat / monorepo drift / unused packages | `kenmark-repo-deps` |
| Dev/build/type/lint/format errors | `kenmark-repo-quality` |
| Security review, auth bypass, RBAC, injection, SSRF, CORS, rate limits | `kenmark-security-review` |
| Performance bottlenecks, slow routes, DB queries, bundle, hydration, caching | `kenmark-performance` |

## Testing suite (routing)

| User says | Skill |
| --- | --- |
| Need test strategy? | `kenmark-test-plan` |
| Need unit tests? | `kenmark-test-unit` |
| Need API/service/db tests? | `kenmark-test-integration` |
| Need browser/user-flow tests? | `kenmark-test-e2e` |
| Need mocks/fixtures/factories? | `kenmark-test-mocks` |
| Need coverage audit? | `kenmark-test-coverage` |
| Need CI test pipeline? | `kenmark-test-ci` |

`kenmark-repo-quality` **runs/checks** test commands (and build/lint/type gates). The `kenmark-test-*` skills **create/improve** the test suite.

## Bundled skills (reference)

| Skill | Purpose |
| --- | --- |
| `kenmark-plan` | Tiered planning; always writes `brain/plans/` |
| `kenmark-output` | Enforce complete final outputs and deliverables |
| `kenmark-subagents` | Split complex work into specialist tracks (explicit) |
| `kenmark-repo-hygiene` | Read-only clutter audit; cleanup plan only |
| `kenmark-repo-cleanup` | Execute approved hygiene cleanup (explicit) |
| `kenmark-repo-secrets` | Deep read-only secret/key/token scan with redaction |
| `kenmark-repo-public` | Safe-to-publish gate before open-sourcing |
| `kenmark-repo-kb` | Update `brain/kb/` after code changes |
| `kenmark-repo-docs` | README, setup, env docs, KB freshness, broken links (read-only) |
| `kenmark-repo-docs-fix` | Apply approved doc fixes (explicit) |
| `kenmark-repo-structure` | Folder layout and module boundaries |
| `kenmark-repo-deps` | Package health, monorepo drift, lockfile/PM consistency, UI overlap |
| `kenmark-repo-quality` | Dev/runtime/build/typecheck/lint/format gates; diagnose without auto-editing |
| `kenmark-security-review` | Read-only secure-code review (auth, injection, SSRF, uploads) |
| `kenmark-performance` | Slow pages/routes, N+1, bundle/hydration, caching, API latency |
| `kenmark-repo-release` | Pre-release version, changelog, tests, meta consistency |
| `kenmark-test-plan` | Test strategy: layers, tools, ROI, CI gates before writing tests |
| `kenmark-test-unit` | Unit tests for functions, components, hooks, utilities |
| `kenmark-test-integration` | API, DB, service, and module boundary tests |
| `kenmark-test-e2e` | Browser/user-journey tests (Playwright, Cypress, etc.) |
| `kenmark-test-mocks` | Fixtures, factories, MSW handlers, fake adapters |
| `kenmark-test-coverage` | Coverage and risk-gap audit (read-only) |
| `kenmark-test-ci` | Wire tests into CI/CD and release gates |

See each `skills/user-skills/<name>/SKILL.md` for full workflows. The root [README](../README.md) lists all bundled skills and [Skill activation tiers](../README.md#skill-activation-tiers).

## Recommended day-to-day order

| Situation | Skill |
| --- | --- |
| Problem unclear? | `kenmark-troubleshoot` |
| Need a plan (writes `brain/plans/`)? | `kenmark-plan` |
| Need parallel/specialist tracks? | `kenmark-subagents` (explicit) |
| Need complete final deliverable? | `kenmark-output` |
| Need issue tracker docs (`brain/issues/`)? | `kenmark-issues-setup` (or `kenmark-init`) |
| Find bugs/gaps to file as issues? | `kenmark-issues-scan` |
| Multi-pass audit until no new issues? | `kenmark-audit-loop` (explicit) |
| Code clarity / simplification scan? | `kenmark-simplify-scan` (explicit) |
| Scan, fix, commit, and ship issues? | `kenmark-issues-fix-and-ship` (explicit) |
| Need plan tracker docs (`brain/plans/`)? | `kenmark-plans-setup` (or `kenmark-init`) |
| Execute an approved plan? | `kenmark-plans-execute` (explicit) |
| Need skill choice? | `kenmark-router` (explicit) |
| Repo health (see table above) | `kenmark-repo-*` family |
| Security review / auth / RBAC / injection / SSRF? | `kenmark-security-review` |
| Performance / slow routes / DB / bundle / hydration? | `kenmark-performance` |
| Testing (see testing table above) | `kenmark-test-*` family |
| Installed skills inventory? | `kenmark-maintain` |
| Need commit? | `kenmark-commit` (explicit) |

See the root [README](../README.md) for trigger examples and setup steps.

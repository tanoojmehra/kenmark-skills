# Feature 006 — Skill activation optimization

**Status:** shipped (2026-06-15); plan-lite removed 2026-06-15

## Summary

Reduced accidental skill activation by splitting heavy universal skills, making ship/orchestration skills manual-only, and aligning `allowed-tools` with default read-only audit behavior.

**Planning:** Single `kenmark-plan` — always writes indexed files to `brain/plans/` (no chat-only plan skill).

## Skill changes

| Before | After |
| --- | --- |
| `kenmark-plan` (monolith) | Split then consolidated: **`kenmark-plan`** only (brain/plans/) |
| `kenmark-troubleshoot` (heavy) | `kenmark-troubleshoot` (read-only) + `kenmark-troubleshoot-deep` (manual) |
| `kenmark-router` (fat body) | Thin manual router + `references/` |
| `kenmark-simplify` | `kenmark-simplify-scan` (manual) |
| `kenmark-repo-hygiene` (write frontmatter) | Read-only audit + `kenmark-repo-cleanup` |
| `kenmark-repo-docs` (write frontmatter) | Read-only audit + `kenmark-repo-docs-fix` |

**Manual-only (`disable-model-invocation: true`):** `kenmark-router`, `kenmark-troubleshoot-deep`, `kenmark-subagents`, `kenmark-audit-loop`, `kenmark-plans-execute`, `kenmark-issues-fix-and-ship`, `kenmark-commit`, `kenmark-init`, `kenmark-issues-maintain`, `kenmark-plans-maintain`, `kenmark-simplify-scan`, `kenmark-repo-cleanup`, `kenmark-repo-docs-fix`, `kenmark-test-e2e`, `kenmark-test-ci`.

**Shared:** `skills/shared/testing-contract.md` referenced by `kenmark-test-*`.

## Bundled count

**46** skills (`validate-repo.js` enforces consistency).

## Core auto skills (recommended)

`kenmark-plan`, `kenmark-troubleshoot`, `kenmark-output`, `kenmark-repo-quality`, `kenmark-repo-secrets`, `kenmark-repo-public`, `kenmark-security-review`, `kenmark-performance`, `kenmark-repo-deps`, `kenmark-repo-structure`, `kenmark-repo-release`, `kenmark-test-plan`, `kenmark-test-unit`, `kenmark-test-integration`, `kenmark-test-mocks`, `kenmark-test-coverage`.

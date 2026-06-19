# Feature 006 — Skill activation optimization

**Status:** shipped (2026-06-15); plan-lite removed 2026-06-15

## Summary

Reduced accidental skill activation by splitting heavy universal skills, making ship/orchestration skills manual-only, and aligning `allowed-tools` with default read-only audit behavior.

**Planning:** **`kenmark-plan`** — manual-only; always writes indexed files to `brain/plans/` when explicitly invoked.

**Manual-only (`disable-model-invocation: true`):** `kenmark-router`, `kenmark-plan`, `kenmark-troubleshoot-deep`, `kenmark-subagents`, `kenmark-audit-loop`, `kenmark-plans-execute`, `kenmark-tracker-check`, `kenmark-tracker-setup`, `kenmark-issues-fix-and-ship`, `kenmark-commit`, `kenmark-init`, `kenmark-tracker-maintain`, `kenmark-repo-cleanup`, `kenmark-repo-docs-fix`, `kenmark-test-e2e`, `kenmark-test-ci`.

**Shared:** `skills/shared/testing-contract.md` referenced by `kenmark-test-*` (duplicate sections removed from skill bodies).

## Core auto skills (recommended)

`kenmark-troubleshoot`, `kenmark-output`, `kenmark-repo-quality`, `kenmark-repo-secrets`, `kenmark-repo-public`, `kenmark-security-review`, `kenmark-performance`, `kenmark-repo-deps`, `kenmark-repo-hygiene`, `kenmark-repo-release`, `kenmark-test-plan`, `kenmark-test-unit`, `kenmark-test-integration`, `kenmark-test-mocks`, `kenmark-test-coverage`, `kenmark-tracker-list`.

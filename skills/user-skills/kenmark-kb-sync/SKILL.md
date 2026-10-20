---
name: kenmark-kb-sync
version: 1.1.0
category: workflow
scope: universal
phase: maintain
description: "Verify whether durable Brain knowledge needs a targeted update after meaningful source changes; otherwise report KB already consistent."
triggers:
  - update brain
  - sync kb
  - brain kb sync
  - update knowledge base
  - feature completed update docs
  - kenmark-kb-sync
  - sync brain after change
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Glob
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Kenmark KB Sync — verified knowledge consistency

KB is durable verified knowledge, **not** a development diary. Transient debugging attempts, unverified hypotheses, investigation notes and implementation checkpoints belong in `brain/issues/` and `brain/plans/`, not KB.

1. Inspect specific meaningful source changes and their evidence (tests, code, commits, approved decisions). Identify contracts and canonical facts that might be affected; do not assume every code change merits documentation.
2. Read existing relevant `brain/kb/`, `brain/kb/features/` and `brain/kb/decisions/` including legacy names. Search canonical feature identities and links before allocating a new KB feature ID. Preserve old Markdown and missing metadata.
3. Compare documented claims to verified source and tests. Newer code timestamps, internal refactors, test additions or intermediate attempts alone do not prove that a KB page is wrong.
4. If no durable fact changed, report **KB already consistent** with paths checked and a brief reason. Do **not** edit `brain/kb/` or append a no-op `brain/CHANGELOG.md` entry.
5. If a verified architectural decision, API/schema/authentication contract, invariant, deployment guarantee or important feature behavior actually changed, make the smallest targeted correction to its existing canonical article. Create a new feature or decision only when it is genuinely distinct, verified, and not already documented. IDs use a minimum three-digit width and scale past 999.
6. Source evidence and optional `related_issues`, `related_plans`, `source_paths`, `verified_at_commit` must be grounded. Do not elevate assumptions to facts, invent API endpoints, create empty TODO fillers or auto-rewrite legacy frontmatter.
7. Update `brain/CHANGELOG.md` only when verified durable knowledge changed or explicit project changelog policy separately warrants it.
8. Report the exact source/KB paths, evidence, edits (if any), no-op reasoning and remaining unknowns.

| Verified change | Expected KB outcome |
| --- | --- |
| Type fix, formatting, existing behavior test, non-behavior refactor | Usually no edit |
| Regression fix with no durable new contract | Issue and tests may suffice |
| Documented API, schema, auth, security invariant changed | Targeted canonical edit |
| Confirmed architectural decision or technical limitation | Verified durable entry |
| Temporary hypothesis / failed attempt | Issues or plans only |
| Established feature already correctly documented | KB already consistent |

Freshness categories: `current`, `potentially-stale`, `needs-review`, `unknown`; never infer stale from age alone. No dependency on Studio, MongoDB, network, embeddings or an invented `brain_search` tool. Use ordinary Read/Grep/Glob/Bash/Git and optional authorized index retrieval. No commit/push without user authorization.

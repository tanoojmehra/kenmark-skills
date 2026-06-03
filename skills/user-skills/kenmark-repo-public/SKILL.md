---
name: kenmark-repo-public
version: 1.0.0
category: workflow
scope: universal
phase: audit
description: "Strict read-only checklist before making a repository public: secrets, env files, keys, dumps, client data, internal assets, license, README, package metadata, and git history risk. Outputs Safe to publish Yes/No/Conditional. Use when asked if a repo is safe to open-source or push publicly."
triggers:
  - make repo public
  - public repo readiness
  - public repository readiness
  - prepare repo for public
  - before making public
  - before public push
  - open source readiness
  - ready to open source
  - safe to publish
  - open source this repo
  - check before public push
  - can I make this public
  - sanitize before public
  - publish repo publicly
  - github public readiness
  - kenmark-repo-public
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Repo Public Readiness — Publish Safety Gate (Read-Only)

## Purpose

Use when the user is **about to make a repository public** (GitHub public, open-source release, external share). Stricter than `kenmark-repo-hygiene` clutter audit.

**Not** for scattered docs, dumps, or file clutter alone — use **`kenmark-repo-hygiene`** for organization cleanup after publish blockers are cleared.

Checks:

- Secrets, keys, tokens, certs (delegate deep scan to `kenmark-repo-secrets`)
- `.env` and env variants
- DB dumps and backups
- Customer/client names and proprietary docs
- Private IPs, internal domains, internal screenshots
- LICENSE, README, package metadata
- Git history risk if secrets were ever committed

**Output:** `Safe to publish: Yes | No | Conditional` plus blockers, warnings, and cleanup list.

**Never** modify files in this skill.

---

## Core principle

```text
Assume hostile reader → Block on secrets/data leaks → Warn on polish gaps
```

---

## Step 0 — Secrets baseline

If `kenmark-repo-secrets` was not run in this session, run its filename + content scans (Steps 2–4 of that skill) before scoring publish safety. Do not duplicate full grep output — summarize findings with redaction.

---

## Step 1 — Resolve repo root

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
```

---

## Step 2 — Sensitive files and data

| Check | How |
| --- | --- |
| Env files | `find` for `.env*`; verify `.gitignore`; flag tracked `.env` |
| Keys/certs | `*.pem`, `*.key`, `*.p12`, `*.pfx` |
| DB dumps | `*.sql`, `*.dump`, `*.bak`, large archives |
| Client/customer data | Grep for emails, `@company.com`, `client`, `customer` in docs/exports (sample only) |
| Private infra | Internal hostnames, `10.`, `192.168.`, `172.16.` in non-test files |
| Internal screenshots | Images under `docs/`, root, or `assets/` — note if filenames suggest internal UI |

---

## Step 3 — Legal and metadata

| Check | Action |
| --- | --- |
| LICENSE | Present at repo root? SPDX appropriate for intent? |
| README | No internal-only instructions; no private URLs with credentials |
| package.json / pyproject / etc. | `private: true` removed if publishing; author/license fields sane |
| Proprietary docs | `NDA`, `confidential`, `internal only` in tracked files |

---

## Step 4 — Git history risk

If any secret or dump was ever committed:

```bash
git log --oneline --all -- "*.env" ".env*" "*.pem" "*.sql" 2>/dev/null | head -15
```

Set **History rewrite needed?** Yes/No with brief evidence.

---

## Step 5 — Verdict

| Verdict | When |
| --- | --- |
| **Yes** | No blockers; warnings only optional |
| **No** | Any tracked secret, dump, private key, or confirmed history leak |
| **Conditional** | Fixable issues (missing LICENSE, README needs scrub, untracked secrets on disk) |

**Blockers** (any → No): tracked secrets/keys, production DB dumps, committed credentials in history, irrecoverable proprietary data in tree.

**Warnings**: stale README, missing CONTRIBUTING, broad `.env.example` gaps, internal screenshots without PII but odd branding.

---

## Step 6 — Report template

```markdown
# Public Readiness Report

## Safe to publish

Yes | No | Conditional

## Blockers

- …

## Warnings

- …

## Recommended cleanup

1. …

## History rewrite needed?

Yes | No — …

## Related audits completed

- kenmark-repo-secrets: yes/no
```

Optional: `brain/reports/kenmark-repo-public-YYYY-MM-DD.md`

---

## Related skills

| Situation | Prefer |
| --- | --- |
| Deep secret scan only | `kenmark-repo-secrets` |
| File clutter, move/delete after approval | `kenmark-repo-hygiene` |
| Docs quality before handoff | `kenmark-repo-docs` |
| npm publish / release tag | `kenmark-repo-release` |

---

## Anti-patterns

- Do not mark **Yes** if secrets audit was skipped and filename scan found `.env` tracked.
- Do not rewrite git history without explicit user request.
- Do not publish full secret values in the report.

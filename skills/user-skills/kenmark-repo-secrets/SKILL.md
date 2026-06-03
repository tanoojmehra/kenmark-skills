---
name: kenmark-repo-secrets
version: 1.0.0
category: workflow
scope: universal
phase: audit
description: "Deep read-only scan for secrets, keys, env files, certs, tokens, and connection strings. Redacts all values; recommends rotation and git history cleanup when tracked or committed. Use when asked to check for keys, secrets, credentials, leaked tokens, or .env in the repo."
triggers:
  - check for secrets
  - find secrets
  - secrets audit
  - scan for keys
  - leaked token
  - credential scan
  - api key in repo
  - .env tracked
  - kenmark-repo-secrets
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Repo Secrets Audit — Deep Credential Scan (Read-Only)

## Purpose

Use this skill when the user wants a **focused, deep** audit for:

- `.env`, `.env.local`, and env variants
- `.pem`, `.key`, `.p12`, `.pfx`, `.crt`, certificates
- `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, API keys, access tokens
- AWS keys, GitHub tokens, Slack tokens, OpenAI keys, Firebase keys
- Mongo/Postgres/MySQL connection strings
- Stripe, Razorpay, and similar payment keys

This is the **canonical** secret-scan skill. Other repo skills delegate here instead of duplicating full grep workflows.

**Default behavior:** investigate and report only. Never modify files, never print full secret values.

---

## Core principle

```text
Find → Classify (tracked/untracked/history-risk) → Redact → Recommend rotation/cleanup
```

---

## Safety rules

- **Never** print full secret values in chat or reports.
- **Never** delete, move, or edit files unless the user explicitly switches to a cleanup skill (`kenmark-repo-hygiene` with approval).
- **Never** rewrite git history unless the user explicitly requests it and understands force-push risk.
- If secrets appear in **git history**, recommend rotation **and** `git filter-repo` or BFG — removing the file from the working tree is not enough.
- Treat certificates and private keys as **compromised** if the repo was or will be public.

---

## Step 1 — Resolve repo root

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
echo "REPO_ROOT=$REPO_ROOT"
git rev-parse --is-inside-work-tree 2>/dev/null || echo "not a git repo"
```

---

## Step 2 — Filename scan

```bash
find . \
  -path './.git' -prune -o \
  -path './node_modules' -prune -o \
  -path './vendor' -prune -o \
  \( -iname '.env' -o -iname '.env.*' -o -iname '*.pem' -o -iname '*.key' -o -iname '*.p12' -o -iname '*.pfx' -o -iname '*.crt' -o -iname '*.cer' -o -iname '*.jks' -o -iname '*secret*' -o -iname '*credential*' -o -iname '*token*' -o -iname '*private*' \) \
  -print 2>/dev/null | head -200
```

For each hit, check if tracked:

```bash
git ls-files --error-unmatch "path/to/file" 2>/dev/null && echo tracked || echo untracked-or-ignored
```

Allow `.env.example` only when it contains **fake placeholders** (verify by reading — no real secrets).

---

## Step 3 — Content pattern scan (redact in report)

```bash
grep -RInE \
  '(BEGIN (RSA |OPENSSH |EC |DSA |PRIVATE )?PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]+|xox[baprs]-[A-Za-z0-9-]+|sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{30,}|mongodb(\+srv)?:\/\/[^[:space:]]+|mysql:\/\/[^[:space:]]+|postgres(ql)?:\/\/[^[:space:]]+|DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|PRIVATE_KEY|CLIENT_SECRET|API_KEY|ACCESS_TOKEN|SECRET_KEY|stripe_(live|test)_[A-Za-z0-9]+|rzp_(live|test)_[A-Za-z0-9]+)' \
  . \
  --exclude-dir=.git \
  --exclude-dir=node_modules \
  --exclude-dir=vendor \
  --exclude-dir=temp \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude-dir=.next \
  --exclude='*.lock' \
  --exclude='package-lock.json' \
  --exclude='pnpm-lock.yaml' \
  --exclude='yarn.lock' \
  2>/dev/null | head -100
```

Report each match as:

```text
path/to/file:line — <type> — value redacted
```

Skip lockfiles and known test fixtures that use obvious fakes (`test`, `example`, `changeme`, `xxx`).

---

## Step 4 — Git history risk (when git repo)

If current tree has secret hits or user asked about history:

```bash
git log --all --full-history -- "*.env" ".env*" "*.pem" "*.key" 2>/dev/null | head -20
```

If a secret was ever committed, set **History cleanup required: Yes** and recommend:

1. Rotate/revoke the credential immediately
2. Remove from history: `git filter-repo` (preferred) or BFG Repo-Cleaner
3. Force-push only with team agreement; coordinate with hosting provider

---

## Step 5 — Classify findings

| State | Recommendation |
| --- | --- |
| Untracked secret file | Add to `.gitignore`; do not commit; rotate if value was shared |
| Tracked in current tree | Remove from repo, rotate secret, update `.gitignore` |
| In git history only | Rotate + history rewrite; file removal alone insufficient |
| Certificate / private key | Treat as compromised if repo public or shared |
| `.env.example` with real values | Replace with placeholders; rotate exposed secrets |

---

## Step 6 — Produce report

Use this template in chat. For complex audits, offer `brain/reports/kenmark-repo-secrets-YYYY-MM-DD.md` when `brain/` exists.

```markdown
# Secrets Audit

## Summary

| Severity | Count |
| --- | ---: |
| Critical (tracked secrets / keys) | 0 |
| High (untracked sensitive files) | 0 |
| Medium (pattern matches — verify) | 0 |
| Low (filename matches — review) | 0 |

## Findings

| File | Type | Tracked? | Line | Recommendation |
| --- | --- | --- | --- | --- |
| path | API key / env / cert / URL | yes/no | N | value redacted — … |

## Rotation required

- List credentials that must be rotated (no values).

## History cleanup required?

Yes / No — <brief reason>

## Recommended next steps

1. …
```

---

## Related skills

| Situation | Prefer |
| --- | --- |
| Clutter, scattered MD, dumps, approved cleanup | `kenmark-repo-hygiene` |
| Safe to make repo public (full gate) | `kenmark-repo-public` |
| Docs accuracy, README setup | `kenmark-repo-docs` |
| Before npm publish / GitHub release | `kenmark-repo-release` |
| Pick skill | `kenmark-router` |

---

## Anti-patterns

- Do not paste grep output verbatim if it contains secret substrings.
- Do not call the repo clean after deleting a tracked secret file without history check.
- Do not run `git filter-repo` without explicit user approval.

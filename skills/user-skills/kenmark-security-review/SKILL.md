---
name: kenmark-security-review
version: 1.0.0
category: workflow
scope: universal
phase: audit
description: "Read-only secure-code review for auth bypass, RBAC mistakes, injection risks, unsafe uploads, SSRF, open redirects, exposed admin routes, insecure CORS, dependency/security config, and API abuse/rate-limit gaps. Use for application security review. For secrets use kenmark-repo-secrets; for public-publish readiness use kenmark-repo-public."
triggers:
  - security review
  - secure code review
  - app security audit
  - auth bypass
  - rbac review
  - check authorization
  - injection risks
  - unsafe file upload
  - ssrf
  - open redirect
  - insecure cors
  - exposed admin routes
  - rate limit gaps
  - kenmark-security-review
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - TodoWrite
  - AskUserQuestion
risk: read-only
disable-model-invocation: false
---

# Kenmark Security Review

## Purpose

Use this skill for a **general, read-only secure-code review** of application security risks in the codebase.

This skill is **not** a secrets-scanning skill. Delegate secrets, keys, credentials, `.env` values, and token detection to **`kenmark-repo-secrets`**.

This skill is **not** a public-publish readiness skill. Delegate open-source / public-repo safety gates to **`kenmark-repo-public`**.

**Default behavior:** investigate and report only. Do not modify files unless the user explicitly asks for fixes after the report.

---

## Boundary with other skills

| User intent | Use |
| --- | --- |
| Secrets, keys, credentials, `.env`, tokens | `kenmark-repo-secrets` |
| Safe to make repo public/open-source | `kenmark-repo-public` |
| General secure-code review | `kenmark-security-review` |
| Dependency bloat / unused packages | `kenmark-repo-deps` |
| Dev/build/type/lint failures | `kenmark-repo-quality` |
| Production incident / unclear failure | `kenmark-troubleshoot` |

If the user asks to "sanitize before public," route to **`kenmark-repo-public`** (often with **`kenmark-repo-secrets`**) — not this skill alone.

---

## Core principle

```text
Assume malicious input → Verify authorization at every boundary → Report evidence without changing code
```

---

## Operating modes

| Mode | Use when | Behavior |
| --- | --- | --- |
| `quick-review` | Fast pre-merge or spot check | Auth on changed routes, obvious injection/upload/SSRF patterns |
| `standard-review` | Normal security review | Steps 2–10 for detected stack |
| `deep-review` | High-risk app or pre-release | Full surface map + cross-file data-flow checks |
| `api-focused` | REST/GraphQL/tRPC/API routes | Auth, RBAC, injection, rate limits, CORS, SSRF on outbound calls |
| `auth-focused` | Login/session/RBAC concerns | Middleware, role checks, cookies, CSRF, session config |
| `upload-focused` | File upload features | Type/size validation, storage paths, public bucket mistakes |

If the user does not specify a mode, use `standard-review`.

---

## Safety rules

- **Read-only by default.** Do not edit code, configs, or dependencies unless the user explicitly requests fixes after the report.
- **Never** print secrets, tokens, passwords, session values, or full connection strings. Redact in reports (`[REDACTED]`).
- **Never** run exploit payloads against production or user-supplied live URLs without explicit approval.
- **Never** exfiltrate data from running services. Static code review and safe local greps only.
- Prefer evidence from source files over assumptions. Mark unverified items as **Needs verification**.
- If `kenmark-repo-secrets` was not run and the review touches env/config, note that a secrets audit is recommended — do not duplicate full secret greps here.

---

## Finding classification

Every finding must include:

| Field | Required |
| --- | --- |
| **Severity** | Critical \| High \| Medium \| Low \| Info |
| **Confidence** | Confirmed vulnerability \| Likely issue \| Needs verification \| Hardening recommendation |
| **Evidence** | File path, line or snippet (no secrets) |
| **Why it matters** | Brief impact |
| **Exploit scenario** | Plain-English attack path |
| **Recommended fix** | Concrete remediation |
| **Verification step** | How to confirm fix or false positive |
| **Tests** | Yes/No — whether automated tests should be added |

---

## Step 1 — Resolve repo root

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
echo "REPO_ROOT=$REPO_ROOT"
git rev-parse --is-inside-work-tree 2>/dev/null || echo "not a git repo"
```

Record the review mode and any user-specified scope (e.g. `src/api/` only).

---

## Step 2 — Detect stack and attack surface

Inspect manifests and common entry points:

```bash
ls package.json pnpm-lock.yaml pyproject.toml go.mod Cargo.toml 2>/dev/null
find . -maxdepth 4 \( \
  -path '*/middleware*' -o -path '*/auth*' -o -path '*/routes*' -o \
  -path '*/api/*' -o -name '*upload*' -o -name 'next.config.*' -o \
  -name 'vite.config.*' -o -name 'docker-compose*' \
\) 2>/dev/null | grep -v node_modules | head -80
```

Build an attack-surface checklist from what exists:

| Area | Look for |
| --- | --- |
| Auth / session | login handlers, JWT/session libs, NextAuth, Passport, Lucia, Supabase auth |
| Middleware | `middleware.ts`, Express/Fastify hooks, Django middleware, Rails `before_action` |
| API routes | `app/api/`, `pages/api/`, `routes/`, controllers, server actions, tRPC routers |
| Admin / internal | `/admin`, `/debug`, `/internal`, dashboard routes, GraphQL playground |
| DB access | ORM raw queries, `$queryRaw`, `.raw(`, Mongo operators in user input |
| Uploads | multer, formidable, S3/GCS SDK upload handlers, presigned URL flows |
| Outbound HTTP | `fetch(`, `axios`, `got`, `request(`, webhook dispatchers |
| Config | CORS, helmet, rate-limit, cookie settings, CSRF middleware |

Note frameworks detected (Next.js, Express, Django, Rails, Laravel, etc.) and narrow checks accordingly.

---

## Step 3 — Auth and RBAC checks

Search for routes and handlers missing auth:

```bash
grep -RInE '(router\.(get|post|put|patch|delete)|app\.(get|post|put|patch|delete)|export async function (GET|POST|PUT|PATCH|DELETE))' \
  --include='*.{ts,tsx,js,jsx}' . 2>/dev/null | grep -v node_modules | head -40
```

Review patterns:

| Pattern | Risk |
| --- | --- |
| Admin/dashboard routes without auth middleware | Critical |
| Role check only in UI, not server | High |
| `if (user)` without verifying role/tenant on server | High |
| IDOR: resource fetched by user-supplied ID without ownership check | Critical |
| Missing auth on internal/debug routes in production builds | High |
| JWT accepted without signature/audience/issuer validation | Critical |
| Service-to-service routes exposed without mTLS/API key | High |

Grep helpers:

```bash
grep -RInE '(isAdmin|requireRole|authorize|checkPermission|RBAC|forbidden|403)' \
  --include='*.{ts,tsx,js,jsx,py,rb,go}' . 2>/dev/null | grep -v node_modules | head -30
grep -RInE '(/admin|/internal|/debug|__debug__|graphiql|playground)' \
  --include='*.{ts,tsx,js,jsx,py,rb,go,json}' . 2>/dev/null | grep -v node_modules | head -30
```

For each sensitive route, confirm: **authentication** present? **authorization** (role/tenant/ownership) present at the server boundary?

---

## Step 4 — Injection checks

### SQL / NoSQL / raw query injection

```bash
grep -RInE '(\$queryRaw|queryRawUnsafe|\.raw\(|execute\(|sequelize\.query|knex\.raw|pg\.query\(|cursor\.execute)' \
  --include='*.{ts,tsx,js,jsx,py,rb,go}' . 2>/dev/null | grep -v node_modules | head -40
grep -RInE '\$\{.*\}.*(SELECT|INSERT|UPDATE|DELETE)|["'\''`].*\+.*(SELECT|INSERT)' \
  --include='*.{ts,tsx,js,jsx,py}' . 2>/dev/null | grep -v node_modules | head -20
grep -RInE '(\$where|\$regex|\$gt|\$ne|\$or|findOne\(\s*req\.|find\(\s*req\.)' \
  --include='*.{ts,tsx,js,jsx}' . 2>/dev/null | grep -v node_modules | head -30
```

Flag string concatenation or template literals feeding SQL/NoSQL. Prefer ORM parameterization; flag `raw` with user input.

### Command injection

```bash
grep -RInE '(exec\(|execSync|spawn\(|spawnSync|system\(|popen\(|subprocess\.|shell=True)' \
  --include='*.{ts,tsx,js,jsx,py,rb,go}' . 2>/dev/null | grep -v node_modules | head -30
```

Flag user-controlled strings passed to shell commands.

### Template injection

```bash
grep -RInE '(eval\(|new Function\(|dangerouslySetInnerHTML|render_template_string|\.compile\()' \
  --include='*.{ts,tsx,js,jsx,py,rb}' . 2>/dev/null | grep -v node_modules | head -30
```

---

## Step 5 — File upload checks

```bash
grep -RInE '(multer|formidable|busboy|upload\.|presigned|putObject|createWriteStream|move_uploaded_file)' \
  --include='*.{ts,tsx,js,jsx,py,rb,go}' . 2>/dev/null | grep -v node_modules | head -30
```

| Check | Risk |
| --- | --- |
| No file type / MIME validation | High |
| Extension trust only (`.jpg` rename) | High |
| No file size limit | Medium |
| User-controlled filename used in path | Critical (path traversal) |
| Uploads served from same origin as app | Medium |
| Public bucket ACL on private files | Critical |
| Missing virus scan (if required by domain) | Info / Needs verification |

Path traversal patterns:

```bash
grep -RInE '(\.\./|path\.join\(.*req\.|filename.*req\.|originalname|user.*path)' \
  --include='*.{ts,tsx,js,jsx,py,rb}' . 2>/dev/null | grep -v node_modules | head -25
```

---

## Step 6 — SSRF and outbound request checks

```bash
grep -RInE '(fetch\(|axios\.(get|post|request)|got\(|http\.request|urllib|requests\.(get|post))' \
  --include='*.{ts,tsx,js,jsx,py,rb,go}' . 2>/dev/null | grep -v node_modules | head -40
grep -RInE '(webhook|callbackUrl|redirect_uri|targetUrl|proxyUrl|fetchUrl|url.*req\.|req\.(query|body).*url)' \
  --include='*.{ts,tsx,js,jsx,py,rb}' . 2>/dev/null | grep -v node_modules | head -30
```

| Pattern | Risk |
| --- | --- |
| User-supplied URL fetched server-side without allowlist | Critical (SSRF) |
| Webhook URL fully user-controlled | High |
| Access to `169.254.169.254`, `localhost`, internal IPs via user URL | Critical |
| No timeout / redirect limit on outbound HTTP | Medium |

Note mitigations observed: URL allowlists, block private IP ranges, DNS rebinding guards.

---

## Step 7 — Open redirect checks

```bash
grep -RInE '(redirect\(|res\.redirect|NextResponse\.redirect|window\.location|returnUrl|next=|redirect_uri|continue=)' \
  --include='*.{ts,tsx,js,jsx,py,rb}' . 2>/dev/null | grep -v node_modules | head -30
```

Flag redirects where the target is taken from query/body without same-origin or allowlist validation.

---

## Step 8 — CORS, cookies, sessions, CSRF

```bash
grep -RInE '(cors\(|Access-Control-Allow-Origin|credentials:\s*true|sameSite|httpOnly|secure:\s*false|csrf|CSRF)' \
  --include='*.{ts,tsx,js,jsx,py,rb,json}' . 2>/dev/null | grep -v node_modules | head -30
```

| Pattern | Risk |
| --- | --- |
| `Access-Control-Allow-Origin: *` with credentials | Critical |
| Session cookie missing `httpOnly` or `secure` in production | High |
| `sameSite: none` without `secure` | High |
| State-changing POST without CSRF token (cookie session apps) | High |
| Long-lived session with no rotation | Medium |

Read session/JWT config files; do not print secret values.

---

## Step 9 — API abuse and rate limiting

```bash
grep -RInE '(rateLimit|rate-limit|throttle|slowDown|express-rate-limit|@upstash/ratelimit|limiter)' \
  --include='*.{ts,tsx,js,jsx,py,rb}' . 2>/dev/null | grep -v node_modules | head -20
```

| Surface | Expect |
| --- | --- |
| Login / password reset | Strict rate limits |
| Public API / webhooks | Abuse protection |
| File upload / search | Limits to prevent DoS |
| Admin mutations | Auth + optional IP allowlist |

Flag sensitive unauthenticated endpoints with no rate limiting as **Medium** or **High** depending on impact.

---

## Step 10 — Dependency/security config review

Review security-relevant config **without printing secrets**:

```bash
grep -RInE '(helmet|hsts|contentSecurityPolicy|trust proxy|NODE_TLS|rejectUnauthorized:\s*false|DEBUG\s*=\s*true)' \
  --include='*.{ts,tsx,js,jsx,json,env.example,yml,yaml}' . 2>/dev/null | grep -v node_modules | head -30
grep -RInE '(stack trace|err\.message|error\.stack|internal server error).*(res\.|return|send)' \
  --include='*.{ts,tsx,js,jsx,py,rb}' . 2>/dev/null | grep -v node_modules | head -20
```

| Check | Risk |
| --- | --- |
| `rejectUnauthorized: false` on outbound TLS | High |
| Verbose errors returned to clients in production | Medium |
| Missing Helmet / security headers (Express/Next custom server) | Medium |
| Debug mode enabled in prod config samples | High |
| Security env vars documented in `.env.example` without values | Info — verify not committed |

For **known-vulnerable dependency versions**, note summary only and suggest **`kenmark-repo-deps`** (npm audit / outdated) — do not run `npm audit fix` in this skill.

Unsafe error handling:

```bash
grep -RInE '(catch\s*\([^)]*\)\s*\{[^}]*res\.(status|json|send).*err)' \
  --include='*.{ts,tsx,js,jsx}' . 2>/dev/null | grep -v node_modules | head -15
```

---

## Step 11 — Report template

Use this template in chat. For large reviews, offer `brain/reports/kenmark-security-review-YYYY-MM-DD.md` when `brain/` exists.

```markdown
# Security Review Report

## Verdict

Secure enough to proceed: Yes | No | Conditional

## Summary

<2–4 sentences: scope, stack, highest-risk themes>

## Critical findings

| Confidence | Finding | Path | Exploit scenario | Fix | Verify | Tests? |
| --- | --- | --- | --- | --- | --- | --- |
| … | … | … | … | … | … | Yes/No |

## High findings

(same table or bullet list with all required fields)

## Medium findings

…

## Low / hardening findings

…

## Positive security controls observed

- …

## Files inspected

- …

## Not inspected / unknowns

- …

## Recommended fix order

1. …

## Verification plan

1. …

## Suggested tests

- …

## Related audits recommended

- kenmark-repo-secrets: yes/no — …
- kenmark-repo-public: yes/no — …
```

### Verdict guidance

| Verdict | When |
| --- | --- |
| **Yes** | No Critical/High confirmed issues; Medium items are optional hardening |
| **No** | Any confirmed Critical or exploitable High without compensating control |
| **Conditional** | Issues are fixable before merge/release; no confirmed active secret leak (use `kenmark-repo-secrets` if unsure) |

---

## Related skills

| Situation | Prefer |
| --- | --- |
| Deep secret scan | `kenmark-repo-secrets` |
| Public / open-source gate | `kenmark-repo-public` |
| Dependency CVE / bloat | `kenmark-repo-deps` |
| Add security tests | `kenmark-test-integration`, `kenmark-test-e2e` |
| Pick skill | `kenmark-router` |

---

## Anti-patterns

- Do not treat absence of grep hits as "secure" — mark coverage gaps in **Not inspected**.
- Do not paste env values or tokens into the report.
- Do not auto-patch vulnerabilities without explicit user approval.
- Do not conflate this review with a secrets audit or public-readiness gate.

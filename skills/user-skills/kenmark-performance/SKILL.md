---
name: kenmark-performance
version: 1.0.0
category: workflow
scope: universal
phase: audit
description: "Read-only performance review for slow pages/routes, DB query patterns, N+1 queries, bundle size, image loading, caching, API latency, server memory/CPU, and hydration/client-render bloat. Use when asked to find performance bottlenecks or optimize a repo. For build/type/lint/test failures use kenmark-repo-quality."
triggers:
  - performance review
  - performance audit
  - optimize app
  - slow pages
  - slow routes
  - api latency
  - database performance
  - n+1 queries
  - bundle size
  - hydration bloat
  - image performance
  - caching review
  - memory cpu review
  - kenmark-performance
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

# Kenmark Performance

## Purpose

Use this skill for a **general, read-only performance review** of modern web and full-stack apps — especially **Next.js**, **Node.js**, **MongoDB**, **Prisma**, **React**, **Tailwind**, and **ShadCN-style** projects.

Find where the app is likely **slow, wasteful, over-rendering, over-querying, or expensive to run** — before or after users complain.

This skill is **not** the same as **`kenmark-repo-quality`**.

| Skill | Question |
| --- | --- |
| **`kenmark-repo-quality`** | Are build/type/lint/test/dev/runtime **quality gates passing**? |
| **`kenmark-performance`** | Where is this app likely **slow, wasteful, or expensive**? |

**Default behavior:** investigate and report only. Do not modify code unless the user explicitly asks for fixes after the report.

---

## Boundary with other skills

| User intent | Use |
| --- | --- |
| Build/type/lint/test/dev server failures | `kenmark-repo-quality` |
| Dependency bloat/package overlap | `kenmark-repo-deps` |
| General performance bottlenecks | `kenmark-performance` |
| Production incident / unclear root cause | `kenmark-troubleshoot` |

For **duplicate heavy libraries** (moment + dayjs, multiple HTTP clients), note in the report and suggest **`kenmark-repo-deps`** — do not uninstall packages here.

---

## Core principle

```text
Measure when possible, but inspect safely first. Do not optimize blindly.
```

**Inspection order:**

1. **Static inspection** — routes, components, queries, config (default)
2. **Lightweight commands** — greps, script listing, small read-only checks
3. **Optional profiling** — bundle analyze, dev trace, query logging — **only with user approval**

---

## Operating modes

| Mode | Use when | Behavior |
| --- | --- | --- |
| `quick-review` | Pre-merge or spot check | Changed routes/APIs + obvious N+1/bundle/hydration flags |
| `standard-review` | Normal performance audit | Steps 2–11 for detected stack |
| `deep-review` | Pre-scale or pre-release | Full surface map + cross-file request/data-flow |
| `nextjs-focused` | App Router / Pages / RSC concerns | Server vs client boundaries, caching, revalidation, images |
| `api-db-focused` | API latency, Prisma/Mongo hot paths | Query patterns, indexes, payloads, repeated work |
| `frontend-bundle-focused` | UI jank, bundle weight | Client components, imports, hydration, list rendering |

If the user does not specify a mode, use `standard-review`.

---

## Safety rules

- **Read-only by default.** Do not edit code unless the user explicitly requests fixes after the report.
- **Do not blindly run benchmarks or load tests.** No k6/Artillery/ab against prod/staging without explicit approval.
- **Avoid expensive commands** (`next build`, full bundle analyze, long test suites) unless the user approves — note cost/time first.
- Prefer **static inspection** → **lightweight greps** → **optional profiling** (in that order).
- Do not use production credentials or production traffic.
- Do not claim measured latency without evidence — use **Needs measurement**.
- Redact secrets in logs/config snippets.

---

## Finding classification

Every finding must include:

| Field | Required |
| --- | --- |
| **Impact** | P0 \| P1 \| P2 \| P3 |
| **Confidence** | Confirmed bottleneck \| Likely bottleneck \| Needs measurement \| Optimization opportunity |
| **Evidence** | File path, line, route, or snippet |
| **Affected route/module/file** | User-visible path or module name |
| **Why it matters** | Technical cost (CPU, memory, DB, network) |
| **Likely user impact** | Slow page, jank, timeout, high bill — plain English |
| **Recommended fix** | Concrete remediation |
| **Measurement / verification** | How to confirm before/after |
| **Risk of the fix** | Low / Medium / High — breaking change, cache staleness, etc. |

### Impact levels

| Level | Meaning |
| --- | --- |
| **P0** | Severe production risk — timeouts, OOM, runaway cost, core journey blocked |
| **P1** | High user-visible impact — slow LCP, API p95, obvious jank |
| **P2** | Medium optimization opportunity — scales poorly, wasteful at moderate load |
| **P3** | Low polish / future improvement — micro-opts, cold paths |

---

## Step 1 — Resolve repo root

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
echo "REPO_ROOT=$REPO_ROOT"
git rev-parse --is-inside-work-tree 2>/dev/null || echo "not a git repo"
```

Record review mode and user scope (e.g. `app/dashboard/` only).

---

## Step 2 — Detect stack

Inspect manifests and perf-relevant config:

```bash
ls package.json pnpm-lock.yaml next.config.* 2>/dev/null
node -e "const p=require('./package.json'); console.log(JSON.stringify({deps:Object.keys(p.dependencies||{}).slice(0,30), scripts:p.scripts}, null, 2))" 2>/dev/null || true
find . -maxdepth 5 \( \
  -path '*/app/*' -o -path '*/pages/*' -o -path '*/api/*' -o \
  -name 'schema.prisma' -o -name 'prisma.schema' -o \
  -name 'middleware.ts' -o -name 'middleware.js' \
\) 2>/dev/null | grep -v node_modules | head -80
```

| Signal | Inspect |
| --- | --- |
| `package.json` | `next`, `react`, `@prisma/client`, `mongodb`, `tailwindcss`, `@radix-ui/*` |
| Next.js config | `next.config.js/mjs/ts` — images, headers, experimental, bundle analyzer |
| Routes | `app/`, `pages/`, `src/app/` — layouts, loading, dynamic segments |
| API routes | `app/api/`, `pages/api/`, route handlers, server actions |
| Prisma | `schema.prisma`, migrations — indexes, relations, `@relation` |
| MongoDB | `mongoose`, native driver, aggregation pipelines |
| Images | `next/image`, `<img>`, remote patterns, sharp |
| Caching | `revalidate`, `cache`, `unstable_cache`, `fetch(..., { cache })`, Redis |
| RSC boundaries | `'use client'`, `'use server'`, server components in client trees |
| Bundle/analyze | `analyze`, `@next/bundle-analyzer`, `webpack-bundle-analyzer` scripts |
| Monitoring | OpenTelemetry, Sentry performance, `instrumentation.ts` |

Note framework versions when relevant (Next 13+ App Router vs Pages).

---

## Step 3 — Route/page performance

Review **slow pages/routes** and server render cost:

```bash
grep -RInE "('use client'|export default async function|generateStaticParams|dynamic\s*=|revalidate\s*=|fetch\()" \
  --include='*.{tsx,ts,jsx,js}' app pages src/app src/pages 2>/dev/null | grep -v node_modules | head -40
grep -RInE '(await fetch|await prisma|await db\.|Promise\.all)' \
  --include='*.{tsx,ts}' app pages 2>/dev/null | grep -v node_modules | head -30
```

| Pattern | Impact |
| --- | --- |
| Page awaits many serial fetches (waterfall) | P1 — Needs measurement |
| `dynamic = 'force-dynamic'` on mostly static pages | P2 |
| Missing `loading.tsx` / Suspense on slow segments | P2 — UX |
| Heavy sync work in layout affecting all child routes | P1 |
| Fetching large lists in page without pagination | P1 |
| No static/ISR where content is public and stable | P2 |

Flag **waterfall requests**: parent layout fetch → child page fetch → client fetch for same data.

---

## Step 4 — API latency and server work

Review **slow API routes** and per-request server work:

```bash
grep -RInE '(export async function (GET|POST|PUT|PATCH|DELETE)|Route Handler|NextResponse\.json)' \
  --include='*.{ts,tsx,js}' app/api pages/api 2>/dev/null | grep -v node_modules | head -40
grep -RInE '(JSON\.stringify|readFile|readFileSync|bcrypt|crypto\.pbkdf2|sharp\(|pdf|zip)' \
  --include='*.{ts,tsx,js}' app/api pages/api 2>/dev/null | grep -v node_modules | head -25
grep -RInE '(console\.(log|debug|info)|pino\.|winston\.|logger\.)' \
  --include='*.{ts,tsx,js}' app/api middleware 2>/dev/null | grep -v node_modules | head -20
```

| Pattern | Impact |
| --- | --- |
| API handler does heavy CPU (hash, image transform) inline | P1 |
| Large JSON responses without pagination/compression | P1 |
| Serial awaits where independent work could parallelize | P2 |
| Verbose logging on hot path | P2 — per-request overhead |
| Missing timeout on outbound fetch from API | P2 |
| Repeated auth/DB lookup on every sub-call in same request | P1 |

Review **background/job performance** when present:

```bash
grep -RInE '(bull|agenda|queue\.|cron|schedule|worker|Inngest|trigger\.dev)' \
  --include='*.{ts,tsx,js}' . 2>/dev/null | grep -v node_modules | head -20
```

Flag unbounded concurrency, polling loops, and jobs re-doing full table scans.

---

## Step 5 — Database/query review

### Prisma

```bash
grep -RInE '(prisma\.|findMany|findFirst|findUnique|include:|select:|$queryRaw|$executeRaw)' \
  --include='*.{ts,tsx,js}' . 2>/dev/null | grep -v node_modules | head -40
grep -RInE '@@(index|unique|id)' schema.prisma prisma/schema.prisma 2>/dev/null
```

| Pattern | Impact |
| --- | --- |
| `findMany` without `take`/`cursor` on list endpoints | P1 |
| Deep `include` trees loading unused relations | P1 |
| `$queryRaw` with string interpolation | P0/P1 — also security |
| Filter/sort on field with no `@@index` | P1 — Needs measurement |
| Missing connection pool / datasource URL limits | P2 |

Read `schema.prisma` for indexes on foreign keys and common `where`/`orderBy` fields.

### MongoDB

```bash
grep -RInE '(mongoose\.|collection\.find|aggregate\(|\.populate\(|createIndex)' \
  --include='*.{ts,tsx,js}' . 2>/dev/null | grep -v node_modules | head -30
```

| Pattern | Impact |
| --- | --- |
| Unindexed queries on large collections | P1 |
| `$lookup` / populate in loops | P1 — N+1 |
| Returning full documents when projection suffices | P2 |
| Missing pagination on list queries | P1 |

---

## Step 6 — N+1 and repeated request work

```bash
grep -RInE '(for\s*\(|\.map\s*\(|\.forEach\s*\()' \
  --include='*.{ts,tsx,js}' . 2>/dev/null | grep -v node_modules | head -15
grep -RInE '(await prisma\.|await db\.|await fetch\(|\.populate\()' \
  --include='*.{ts,tsx,js}' . 2>/dev/null | grep -v node_modules | head -40
```

| Pattern | Impact |
| --- | --- |
| Await DB/API inside loop over user list | P0/P1 — classic N+1 |
| Same entity fetched in layout + page + client hook | P1 — repeated work |
| Resolver per row without DataLoader/batch | P1 |
| Re-computing expensive derived data every request | P2 |

For GraphQL/tRPC, check field resolvers and procedure batching.

---

## Step 7 — Bundle and dependency impact

Review **bundle size** and **unnecessary dependencies** increasing client/runtime cost:

```bash
grep -RInE "(import .* from ['\"]lodash|import .* from ['\"]moment|import \* as|from '@mui/|from 'antd'|from 'chart\.js')" \
  --include='*.{ts,tsx,js,jsx}' . 2>/dev/null | grep -v node_modules | head -25
grep -RInE "(import .* from ['\"]@radix-ui|from 'lucide-react'|from '@/components/ui)" \
  --include='*.{ts,tsx}' . 2>/dev/null | grep -v node_modules | head -20
grep -RInE '"(analyze|build:analyze|bundle-analyzer)"' package.json 2>/dev/null
```

| Pattern | Impact |
| --- | --- |
| Full library import instead of subpath/destructuring | P2 |
| Heavy chart/editor SDK in root layout or `_app` | P1 |
| Server-only dep imported in `'use client'` file | P1 |
| Duplicate date/UI/HTTP libs | P2 — suggest `kenmark-repo-deps` |
| Missing dynamic `import()` for heavy modals/editors | P2 |

**Optional (user approval):** `pnpm run analyze` / `npm run build` with analyzer — summarize largest chunks only; do not run by default.

---

## Step 8 — Hydration/client-render bloat

Review **excessive client components** and **hydration bloat**:

```bash
grep -RIn "'use client'" --include='*.{tsx,ts,jsx,js}' app components src 2>/dev/null | grep -v node_modules | wc -l
grep -RIn "'use client'" --include='*.{tsx,ts}' app components src 2>/dev/null | grep -v node_modules | head -30
grep -RInE '(useEffect\(\s*\(\)\s*=>\s*\{[^}]*fetch|useState\(.*\[\]|createContext)' \
  --include='*.{tsx,jsx}' . 2>/dev/null | grep -v node_modules | head -25
```

| Pattern | Impact |
| --- | --- |
| `'use client'` on layout or large page shells | P1 — hydration cost |
| Client fetch for data available on server | P1 |
| Entire page client when only button needs interactivity | P2 |
| Large context providers forcing wide re-renders | P2 |
| Missing `React.memo` / stable refs on expensive lists | P2 — Needs measurement |

Prefer server components for data fetching; isolate client islands (ShadCN pattern).

---

## Step 9 — Image/static asset review

Review **image loading** and static assets:

```bash
grep -RInE '(<img |next/image|Image from|sizes=|priority|placeholder=|blurDataURL|remotePatterns|domains:)' \
  --include='*.{tsx,jsx,ts,js,mjs}' . 2>/dev/null | grep -v node_modules | head -30
grep -RInE '(unoptimized|quality=\{100\}|width=\{[0-9]{4})' \
  --include='*.{tsx,jsx}' . 2>/dev/null | grep -v node_modules | head -15
```

| Pattern | Impact |
| --- | --- |
| Raw `<img>` for large hero images in Next app | P2 |
| Missing `sizes` on responsive `next/image` | P2 |
| `priority` on many images | P2 |
| Unoptimized remote images / huge dimensions | P1 |
| No lazy loading below fold | P2 |
| Large SVGs/fonts loaded globally | P2 |

Check `next.config` `images.remotePatterns` and static asset caching headers.

---

## Step 10 — Caching/revalidation review

Review **caching opportunities** and **revalidation strategy**:

```bash
grep -RInE '(revalidate\s*=|revalidate:|unstable_cache|cache:\s*['\''"]force-cache|cache:\s*['\''"]no-store|stale-while-revalidate|Cache-Control|redis|ioredis|@upstash/redis)' \
  --include='*.{ts,tsx,js,mjs}' . 2>/dev/null | grep -v node_modules | head -30
grep -RInE "(fetch\([^)]+,\s*\{[^}]*cache:\s*'no-store')" \
  --include='*.{ts,tsx}' app 2>/dev/null | grep -v node_modules | head -15
```

| Pattern | Impact |
| --- | --- |
| `cache: 'no-store'` / `force-dynamic` on public read-heavy routes | P1 |
| No ISR/revalidate on semi-static marketing/content | P2 |
| Missing HTTP cache headers on API read endpoints | P2 |
| Redis/cache layer absent on expensive repeated queries | P1 — at scale |
| Over-aggressive caching without invalidation plan | P2 — risk of stale data |

Document **risk of the fix** when recommending longer cache (staleness vs speed).

---

## Step 11 — Memory/CPU risk review

Review **server memory/CPU risks** and **expensive loops**:

```bash
grep -RInE '(readFileSync|JSON\.parse\(await|Buffer\.from\(.*whole|\.flatMap|\.reduce\()' \
  --include='*.{ts,tsx,js}' . 2>/dev/null | grep -v node_modules | head -20
grep -RInE '(while\s*\(|for\s*\(.*length|Array\([0-9]{5,}\)|new Array)' \
  --include='*.{ts,tsx,js}' . 2>/dev/null | grep -v node_modules | head -15
grep -RInE '(setInterval|global\.|process\.memoryUsage|heap)' \
  --include='*.{ts,tsx,js}' . 2>/dev/null | grep -v node_modules | head -15
```

| Pattern | Impact |
| --- | --- |
| Loading entire file/DB result into memory | P0/P1 |
| O(n²) loops on user-controlled list size | P1 |
| Unbounded in-memory caches (Map without eviction) | P0/P1 |
| Sync crypto/hash on every login without rate limit | P1 |
| Missing stream for large uploads/downloads | P1 |

Note observability gaps (no APM, no slow-query logging) as **P3** recommendations.

---

## Step 12 — Report template

Use this template in chat. For large reviews, offer `brain/reports/kenmark-performance-YYYY-MM-DD.md` when `brain/` exists.

```markdown
# Performance Review Report

## Verdict

Performance risk: Low | Medium | High | Critical

## Summary

<2–4 sentences: stack, scope, top themes>

## Highest-impact findings

| Impact | Confidence | Route/module | Finding | User impact | Fix | Measure | Fix risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0/P1 | … | … | … | … | … | … | Low/Med/High |

## Route/page findings

…

## API/server findings

…

## Database/query findings

…

## Frontend/bundle findings

…

## Caching/image findings

…

## Positive performance controls observed

- …

## Files inspected

- …

## Not inspected / unknowns

- …

## Recommended fix order

1. …

## Measurement plan

1. …

## Suggested tests / monitoring

- …
```

### Verdict guidance

| Verdict | When |
| --- | --- |
| **Low** | P3/P2 only; no P0/P1 on critical journeys |
| **Medium** | P1 likely issues or multiple P2 on core routes |
| **High** | Confirmed/likely P1 on checkout, auth, dashboard, or API hot paths |
| **Critical** | P0 — timeouts, OOM risk, unbounded N+1 on production-scale data |

---

## Related skills

| Situation | Prefer |
| --- | --- |
| Build/type/lint/test failures | `kenmark-repo-quality` |
| Package overlap / unused deps | `kenmark-repo-deps` |
| Production incident | `kenmark-troubleshoot` |
| Add perf regression tests | `kenmark-test-integration`, `kenmark-test-e2e` |
| Pick skill | `kenmark-router` |

---

## Anti-patterns

- Do not conflate failing `npm run build` with performance review — use **`kenmark-repo-quality`**.
- Do not run `next build`, load tests, or bundle analyze without user approval.
- Do not claim ms/p95 numbers without measurement — use **Needs measurement**.
- Do not optimize cold paths while P0/P1 issues exist on core routes.
- Do not uninstall deps here — route to **`kenmark-repo-deps`**.

---
name: kenmark-repo-deps
version: 1.2.0
category: workflow
scope: universal
phase: verify
description: "Read-only package health audit: unused or duplicate dependencies, monorepo workspace drift, lockfile and packageManager consistency, overrides/resolutions, UI-library overlap, bundle/side-effect risks, semver/peer issues, and npm audit summary. Use for dependency bloat, npm vs pnpm vs bun mix, or before cleanup. For app-level CVE/config review use kenmark-security-review."
triggers:
  - dependency audit
  - unused dependencies
  - package bloat
  - outdated packages
  - kenmark-repo-deps
  - check dependencies
  - duplicate libraries
  - npm audit
  - peer dependency
  - lockfile mismatch
  - monorepo dependencies
  - workspace drift
  - duplicate react version
  - overrides resolutions
  - ui library overlap
  - bundle size dependencies
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

# Kenmark Repo Deps

## Purpose

Audit **dependency health** without removing packages (removal can break builds).

For Node:

- `dependencies` vs `devDependencies` placement
- Unused dependencies (heuristic — **candidates only**, not facts unless proven)
- Duplicate libraries (multiple UI, date, HTTP clients)
- Heavy packages (icon sets, moment + dayjs, etc.)
- Lockfile vs package manager mismatch (`npm` + `pnpm` + `yarn` + `bun` artifacts)
- `packageManager` field vs actual lockfile/CI
- Monorepo workspace dependency drift
- Duplicate React / Next.js / major versions across workspaces
- Loose semver (`*`, `latest`, overly wide ranges)
- Peer dependency conflicts (from lockfile / install warnings)
- `overrides` / `resolutions` / `pnpm.overrides` review (flag stale masks — **never remove automatically**)
- UI-library overlap (MUI + Radix/ShadCN + Chakra + Ant Design + Mantine, multiple icon/chart libs)
- Bundle / side-effect risk (broad imports, client/server boundary mistakes)
- Optional `npm audit` / `pnpm audit` summary (read-only; no `audit fix`)
- Deprecated or risky package names (flag for review)

Adapt checks for Python (`pyproject.toml`, `requirements.txt`), Go (`go.mod`), Rust (`Cargo.toml`) when present.

This skill covers **package and lockfile health**, not application auth/injection review. For secure-code patterns (middleware, RBAC, SSRF), use **`kenmark-security-review`**. For runtime perf patterns in code, use **`kenmark-performance`**.

**Default behavior:** investigate and report only. Do not uninstall, upgrade, edit `package.json`, or run fix commands unless the user explicitly approves after the report.

---

## Core principle

```text
Detect ecosystem → Inspect manifests + lockfiles → Heuristic usage grep → Classify findings → Rank report
```

---

## Operating modes

| Mode | Use when | Behavior |
| --- | --- | --- |
| `quick-audit` | Pre-merge sanity | Lockfile + packageManager consistency + obvious duplicates |
| `standard-audit` | Normal dependency review | Full Steps 1–8 for detected ecosystem |
| `deep-audit` | Before major cleanup or upgrade | Usage grep for all deps + workspace version matrix + audit summary |
| `node-focused` | JS/TS monorepo or app | Node sections only |
| `monorepo-focused` | Turborepo/pnpm workspaces | Steps 4–7 emphasis |
| `python-focused` | Python service | pyproject/requirements sections |

If the user does not specify a mode, use `standard-audit`.

---

## Finding classification

| Field | Required |
| --- | --- |
| **Severity** | Critical \| High \| Medium \| Low \| Info |
| **Confidence** | Confirmed \| Likely \| Needs verification \| Recommendation |
| **Evidence** | Manifest/lockfile path, package name |
| **Why it matters** | Build risk, bloat, security advisory, drift |
| **Recommended action** | Pin, remove candidate, consolidate, audit fix (with approval) |
| **Verification** | Command or grep to confirm after change |

---

## Safety rules

- **Read-only by default.** Do not edit `package.json`, lockfiles, or overrides unless the user explicitly approves after the report.
- Do not `npm uninstall`, `pnpm remove`, or `yarn remove` in this skill.
- Do not run `npm audit fix`, `pnpm audit --fix`, or major version upgrades without explicit user approval.
- Do not remove or edit **overrides** / **resolutions** / **pnpm.overrides** automatically — flag stale masks only.
- Do not mark deps **unused** from a single grep miss (CLI tools, dynamic import, config plugins, peer-only packages).
- Mark unused packages only as **remove candidates**, not facts, unless usage is proven absent across the repo.
- Skip network commands (`npm view`, `npm audit`) when offline — note in report.
- Summarize audit CVEs by severity count; do not paste long advisory text.

---

## Step 1 — Resolve repo root and detect ecosystem

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
ls package.json \
  pnpm-lock.yaml package-lock.json yarn.lock bun.lock bun.lockb \
  pnpm-workspace.yaml turbo.json lerna.json nx.json rush.json \
  pyproject.toml go.mod Cargo.toml 2>/dev/null
```

| File | Role |
| --- | --- |
| `package.json` | Root Node manifest |
| `pnpm-lock.yaml` | pnpm lockfile |
| `package-lock.json` | npm lockfile |
| `yarn.lock` | Yarn lockfile |
| `bun.lock` / `bun.lockb` | Bun lockfile |
| `pnpm-workspace.yaml` | pnpm workspace packages |
| `turbo.json` | Turborepo pipeline config |
| `lerna.json` | Lerna monorepo config |
| `nx.json` | Nx monorepo config |
| `rush.json` | Rush monorepo config |
| `pyproject.toml` / `requirements*.txt` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |

| File | Ecosystem |
| --- | --- |
| `package.json` | Node |
| `pyproject.toml` / `requirements*.txt` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |

Detect package manager from lockfile **and** `packageManager` field:

| Lockfile | Implied PM |
| --- | --- |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `bun.lock` / `bun.lockb` | bun |
| `package-lock.json` | npm |

```bash
node -e "try{const p=require('./package.json'); console.log('packageManager:', p.packageManager||'(none)');}catch(e){}" 2>/dev/null
grep -RIn '"packageManager"' package.json packages/*/package.json apps/*/package.json 2>/dev/null | head -10
```

Flag when `packageManager` disagrees with the lockfile present, or when CI/docs reference a different PM.

---

## Step 2 — Node.js checks

### Package manager consistency

| Finding | Severity |
| --- | --- |
| Both `pnpm-lock.yaml` and `package-lock.json` | High — pick one |
| `yarn.lock` + `package-lock.json` | High |
| `bun.lock(b)` + another PM lockfile | High |
| Lockfile present but CI/docs use different PM | Medium |
| `packageManager` field ≠ lockfile on disk | High |
| Child workspace package declares conflicting `packageManager` | High |
| Only `package.json`, no lockfile (app repo) | Medium — warn for apps |
| Root lockfile missing in monorepo workspace | High — Needs verification |

```bash
ls -la pnpm-lock.yaml package-lock.json yarn.lock bun.lock bun.lockb 2>/dev/null
grep -RIn '"packageManager"' package.json 2>/dev/null || true
```

### Manifest hygiene

```bash
node -e "
const p=require('./package.json');
const prod=Object.keys(p.dependencies||{});
const dev=Object.keys(p.devDependencies||{});
const overlap=prod.filter(x=>dev.includes(x));
console.log('prod:', prod.length, 'dev:', dev.length);
if(overlap.length) console.log('overlap prod+dev:', overlap.join(', '));
const loose=[...prod,...dev].filter(n=>{
  const v=(p.dependencies||{})[n]||(p.devDependencies||{})[n];
  return v==='*'||v==='latest'||/^[\^~]?[\d.]+$/.test(v)===false&&/x|latest|\*/.test(v);
});
if(loose.length) console.log('review ranges:', loose.slice(0,20).join(', '));
" 2>/dev/null
```

| Finding | Severity |
| --- | --- |
| Same package in `dependencies` and `devDependencies` | Medium |
| `*` or `latest` version range | High |
| Build/test tools in `dependencies` | Medium — **move to devDependencies candidate** |
| Runtime libs in `devDependencies` for deployed app | High |
| Type-only / test libs in `dependencies` | Medium — **move to devDependencies candidate** |

### Duplicate library patterns (root manifest)

Flag if multiple entries suggest overlap:

- UI: `mui` + `@mui/material` + heavy headless duplicates
- Dates: `moment` + `dayjs` + `date-fns` + `luxon`
- HTTP: `axios` + `got` + `node-fetch` + `ky` wrappers
- Icons: `@mui/icons-material` + `lucide-react` + `react-icons` (info if intentional)
- State: `redux` + `zustand` + `jotai` (info if migrating)

```bash
node -e "const p=require('./package.json'); const d={...p.dependencies,...p.devDependencies}; console.log(Object.keys(d).sort().join('\n'))" 2>/dev/null
```

### Unused deps (heuristic)

For each suspicious dependency, sample import usage:

```bash
# Example for package "lodash" — repeat for suspicious deps
grep -RIn "from ['\"]lodash" --include='*.{ts,tsx,js,jsx}' . 2>/dev/null | grep -v node_modules | head -3
grep -RIn "require\(['\"]lodash" --include='*.{ts,tsx,js,jsx}' . 2>/dev/null | grep -v node_modules | head -3
```

Also check: `bin` field in package (CLI dep), `config` plugins, dynamic `import()`, framework presets, workspace-internal references.

Mark **remove candidate** only when zero imports across all workspace packages and not a CLI/binary/config/peer dep. Otherwise **Needs verification**.

### Heavy / risky flags

```bash
du -sh node_modules 2>/dev/null | head -1
grep -RInE '"postinstall"|"preinstall"|"prepare"' package.json packages/*/package.json 2>/dev/null | head -10
```

| Finding | Severity |
| --- | --- |
| Very large `node_modules` (context-dependent) | Info/Medium |
| Many packages with lifecycle scripts | Medium — review |
| Multiple ORMs or conflicting DB drivers | High |
| `@types/*` in `dependencies` | Low — move to devDependencies candidate |

### Peer dependencies

```bash
grep -RInE '"peerDependencies"' package.json packages/*/package.json 2>/dev/null | head -10
# If npm — optional, when node_modules exists:
npm ls 2>&1 | head -40
```

Flag unmet peer warnings — especially duplicate React/Next peers across workspaces.

### Audit summary (optional, network)

Read-only only — **do not** run fix:

```bash
npm audit --json 2>/dev/null | head -5
# or: pnpm audit --json 2>/dev/null | head -5
```

Report counts by severity. For **exploitable app impact** of advisories, note that **`kenmark-security-review`** should assess runtime exposure.

### Deprecated packages (optional, network)

```bash
# Example — skip if offline
npm view lodash deprecated 2>/dev/null
```

---

## Step 3 — Python / Go / Rust

### Python

- Prod vs dev separation in `pyproject.toml` / `requirements-dev.txt`
- Unpinned `requirements.txt` in apps (`==` vs bare names)
- Duplicate tools (`pip-tools` vs manual pins)
- Multiple env files vs lock/poetry.lock consistency

```bash
ls pyproject.toml poetry.lock requirements.txt requirements-dev.txt Pipfile Pipfile.lock 2>/dev/null
grep -RInE '^(django|flask|fastapi|sqlalchemy)' requirements*.txt pyproject.toml 2>/dev/null | head -15
```

### Go

- `go.mod` `require` vs spot-check imports
- Indirect dependency explosion (`go mod graph | wc -l`)
- Replace directives review

```bash
head -40 go.mod 2>/dev/null
go mod graph 2>/dev/null | wc -l
```

### Rust

- Workspace members vs orphan crates
- Duplicate versions in workspace `Cargo.lock`

```bash
grep -E '^\[workspace\]|^members' Cargo.toml 2>/dev/null
```

---

## Step 4 — Monorepo and workspaces

Detect monorepo tooling and list workspace package manifests:

```bash
grep -RIn '"workspaces"' package.json pnpm-workspace.yaml lerna.json 2>/dev/null
cat pnpm-workspace.yaml 2>/dev/null | head -20
ls turbo.json nx.json rush.json lerna.json 2>/dev/null
find . -name package.json ! -path '*/node_modules/*' ! -path '*/.next/*' 2>/dev/null | head -40
```

### Workspace / monorepo checks

| Check | How |
| --- | --- |
| List workspace manifests | All `package.json` paths under `apps/`, `packages/`, `services/` |
| Duplicate React versions | Compare `react` / `react-dom` semver across manifests + lockfile |
| Duplicate Next.js versions | Compare `next` across apps |
| Duplicate major versions | Important shared deps: `typescript`, `@types/node`, `eslint`, UI libs |
| Local package mismatches | Workspace `workspace:*` vs published semver for internal packages |
| Root-only vs package-level deps | Dep declared at root but duplicated/conflicting in child |
| PM mismatch root vs child | Child has different lockfile or `packageManager` than root |

Helper — collect React/Next versions across workspaces:

```bash
find . -name package.json ! -path '*/node_modules/*' -print0 2>/dev/null | \
  xargs -0 grep -H '"react"' 2>/dev/null | head -30
find . -name package.json ! -path '*/node_modules/*' -print0 2>/dev/null | \
  xargs -0 grep -H '"next"' 2>/dev/null | head -20
```

| Finding | Severity |
| --- | --- |
| Multiple React major/minor across workspaces (not intentional) | High |
| Multiple Next.js versions across apps | High |
| Inconsistent lockfile per package vs root-only lock | High |
| Same dep at conflicting versions across packages | Medium |
| Internal package not linked via workspace protocol | Needs verification |
| Root hoists dep child also pins differently | Medium — workspace drift |
| `turbo.json` / `nx.json` present but inconsistent build deps | Info — review |

---

## Step 5 — Overrides / resolutions

Identify override mechanisms — **report only; never remove automatically**:

```bash
node -e "
const p=require('./package.json');
console.log('overrides:', JSON.stringify(p.overrides||null));
console.log('resolutions:', JSON.stringify(p.resolutions||null));
console.log('pnpm.overrides:', JSON.stringify(p.pnpm?.overrides||null));
" 2>/dev/null
grep -RInE '"(overrides|resolutions)"' package.json packages/*/package.json 2>/dev/null
```

| Check | Action |
| --- | --- |
| Root `overrides` (npm) | List pinned packages; explain if comment/README hints why |
| `resolutions` (Yarn) | Same |
| `pnpm.overrides` | Same |
| Stale override masking conflict | Flag when overridden package no longer appears in tree or conflict resolved upstream |
| Override pins React/Next/types | Note intentional dedupe vs risky pin |
| Deep override chains | Info — may hide transitive vulnerabilities |

If the reason is not obvious, mark **Needs verification** and suggest checking git history or team docs.

---

## Step 6 — UI library overlap

Scan root **and workspace** manifests for overlapping UI systems:

| Package pattern | Notes |
| --- | --- |
| `@mui/material`, `@mui/icons-material` | MUI system |
| `@radix-ui/*` | Headless primitives (often ShadCN base) |
| `components/ui`, `@/components/ui` | ShadCN-style (grep imports too) |
| `antd` | Ant Design |
| `@chakra-ui/*` | Chakra |
| `@mantine/*` | Mantine |
| `lucide-react` | Icon pack |
| `react-icons` | Large icon pack |
| `framer-motion` | Animation (heavy if duplicated with other motion libs) |
| `chart.js`, `recharts`, `@nivo/*`, `echarts`, `victory` | Multiple charting libraries |

```bash
node -e "
const fs=require('fs');const path=require('path');
const patterns=['@mui/material','@mui/icons-material','antd','@chakra-ui/react','@mantine/core','lucide-react','react-icons','framer-motion','chart.js','recharts','echarts','@radix-ui/react-dialog'];
function scan(f){try{const p=JSON.parse(fs.readFileSync(f,'utf8'));const d={...p.dependencies,...p.devDependencies};return patterns.filter(x=>Object.keys(d).some(k=>k.startsWith(x.replace('/*',''))||k===x));}catch{return[]}}
console.log('root:', scan('package.json'));
" 2>/dev/null
grep -RInE "from ['\"]@mui/|from ['\"]antd|from ['\"]@chakra-ui|from ['\"]@mantine|from ['\"]lucide-react|from ['\"]react-icons|components/ui" \
  --include='*.{tsx,ts,jsx,js}' . 2>/dev/null | grep -v node_modules | head -20
```

| Finding | Severity |
| --- | --- |
| MUI + ShadCN/Radix + Chakra + Ant + Mantine without clear migration story | High — unnecessary UI surface |
| Multiple major UI systems in same app package | High |
| Two icon packs at scale (`@mui/icons-material` + `react-icons`) | Medium |
| Two+ chart libraries | Medium |
| Radix + ShadCN only (intentional stack) | Info — **Keep / intentional** |

Also flag **unnecessary UI libraries**: declared in manifest but zero imports in that workspace.

---

## Step 7 — Bundle and side-effect risks

### Broad imports and heavy packages

```bash
grep -RInE "(import .* from ['\"]lodash['\"]|import \* as|from '@mui/icons-material'|from 'react-icons/|from 'moment'|from 'chart\.js')" \
  --include='*.{ts,tsx,js,jsx}' . 2>/dev/null | grep -v node_modules | head -25
grep -RInE '"sideEffects"' package.json packages/*/package.json 2>/dev/null
```

| Pattern | Severity |
| --- | --- |
| Whole icon library import | Medium — bundle bloat |
| `import * as` from heavy SDK | Medium |
| Package used once but very heavy (editor, maps, pdf) | Medium — remove candidate if unused |
| Missing tree-shake friendly imports | Low/Medium |
| `sideEffects: false` absent on custom library package | Info |

Known **bundle-heavy** packages to flag when in client/`dependencies`: `moment`, full `lodash`, `@mui/icons-material`, `aws-sdk` v2, `firebase` full import, `monaco-editor`, `pdfjs-dist`, `three`.

### Client / server boundary mistakes

Server-only packages accidentally in client code:

```bash
grep -RIn "'use client'" --include='*.{tsx,ts,jsx,js}' . 2>/dev/null | grep -v node_modules | head -5
grep -RInE "('use client'[^]*|from ['\"])(@prisma/client|mongoose|pg|mysql2|ioredis|nodemailer|fs|path|crypto|bcrypt|sharp|@aws-sdk)" \
  --include='*.{tsx,ts,jsx,js}' . 2>/dev/null | grep -v node_modules | head -20
```

Browser-only packages in server code:

```bash
grep -RInE "(from ['\"])(react-dom/client|window\.|document\.|localStorage|@stripe/react-stripe-js)" \
  --include='*.{ts,tsx}' app pages src 2>/dev/null | grep -v node_modules | grep -v "'use client'" | head -15
```

| Pattern | Severity |
| --- | --- |
| `'use client'` file imports `@prisma/client`, `fs`, DB drivers | High |
| Server component/route imports browser-only APIs | High |
| Server-only dep listed only because of mistaken client import | Medium — fix import boundary |
| Heavy server package in root `dependencies` used only in scripts | Medium — devDependencies candidate |

Cross-check with **`kenmark-performance`** for runtime impact; this step focuses on **dependency placement and import boundaries**.

---

## Step 8 — Ranked report

Use this template in chat. For complex audits, offer `brain/reports/kenmark-repo-deps-YYYY-MM-DD.md` when `brain/` exists.

```markdown
# Dependency Audit

## Verdict

Healthy enough to proceed: Yes | No | Conditional

## Ecosystem

Node (pnpm) + Turborepo | …

## Summary

<2–3 sentences>

## Critical

| Confidence | Finding | Package / file | Action | Verify |
| --- | --- | --- | --- | --- |
| … | … | … | … | … |

## High

…

## Medium

…

## Low

…

## Info

…

## Workspace / monorepo findings

- …

## Package manager consistency

- Lockfiles present: …
- `packageManager` field: …
- Mismatches: …

## Duplicate version risks

| Package | Versions found | Locations | Severity |
| --- | --- | --- | --- |
| react | … | … | … |
| next | … | … | … |

## Overrides / resolutions

| Mechanism | Package | Pinned version | Notes |
| --- | --- | --- | --- |
| pnpm.overrides | … | … | stale mask? intentional dedupe? |

## UI library overlap

- …

## Bundle and side-effect risks

- …

## Remove candidates

| Package | Workspace | Evidence | Confidence |
| --- | --- | --- | --- |
| … | … | zero imports | Likely / Needs verification |

## Move to devDependencies candidates

| Package | Reason |
| --- | --- |
| … | test/build/types only |

## Keep / intentional dependencies

- …

## Positive observations

- …

## Suggested commands (do not run without approval)

- `npx depcheck` (Node unused heuristic)
- `npm outdated` / `pnpm outdated`
- `npm audit` / `pnpm audit` (read-only review)
- `pnpm why <package>` / `npm ls <package>` (duplicate trace)
- `go mod tidy` (review diff only)

## Related audits

- kenmark-security-review: yes/no — for runtime exposure of advisories
- kenmark-performance: yes/no — for client bundle / import hot paths
```

### Verdict guidance

| Verdict | When |
| --- | --- |
| **Yes** | Single PM + lockfile; no Critical; duplicates documented as intentional |
| **No** | Conflicting lockfiles, `*` ranges on prod deps, duplicate React/Next breaking workspaces, Critical audit with known exploit path |
| **Conditional** | Fixable drift; remove candidates need verification; stale overrides to review |

---

## Related skills

| Situation | Prefer |
| --- | --- |
| App security (auth, SSRF, injection) | `kenmark-security-review` |
| Release before publish | `kenmark-repo-release` |
| Structure / duplicate utils folders | `kenmark-repo-hygiene` (structure-audit mode) |
| Performance / bundle patterns in code | `kenmark-performance` |
| Stack documented in KB | `kenmark-kb-sync` / `kenmark-init` |

---

## Anti-patterns

- Do not `npm uninstall` packages in this skill.
- Do not edit `package.json` or overrides unless the user explicitly approves.
- Do not mark deps unused based on one grep miss (CLI, dynamic import, config plugins, other workspace packages).
- Do not remove overrides/resolutions automatically — flag only.
- Do not upgrade major versions without user request.
- Do not treat npm audit alone as a full security review — delegate app context to **`kenmark-security-review`**.

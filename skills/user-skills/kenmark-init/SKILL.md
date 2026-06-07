---
name: kenmark-init
version: 1.3.0
category: onboarding
scope: universal
phase: setup
description: "Initialize brain/ (numbered KB under brain/kb/, modular rules) and optionally bootstrap brain/issues/ issue-tracker docs and install cross-IDE pointer stubs (or full embed) in CLAUDE.md, AGENTS.md, .cursorrules, .cursor/rules/, GEMINI.md. On init, inspect the repo and document confirmed facts in brain/kb/. Use when applying workspace rules, creating project standards, or enforcing team conventions."
triggers:
  - init brain
  - initialize brain
  - apply workspace rules
  - project standards
  - setup cursor rules
  - kenmark-init
  - kenmark-init skill
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Kenmark Init

Bootstrap the project **brain** knowledge base, then **ask the user** which agent entry files to create or update. Do not create every file by default.

## Architecture (multi-IDE, no hooks)

| Layer | Path | Role |
| --- | --- | --- |
| **Canonical (core)** | `brain/rules/standards.md` | Lean universal rules — read every session |
| **Canonical (modular)** | `brain/rules/stack.md`, `workflow.md`, `testing.md`, `ui.md`, `deployment.md` | Read only when the task needs them |
| **Knowledge base** | `brain/kb/` (numbered `00`–`11`, `features/`, `decisions/`) | Project documentation — facts, assumptions, unknowns |
| **Entry stubs** | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/project-standards.mdc`, `.cursorrules` | Same short pointer block per harness (default) |
| **Optional embed** | Same files, `sync-full` mode | Paste `standards.md` inside markers — use only when Read is unreliable |

**Default sync mode:** `stub` — identical pointer prose in each selected file; agents **Read** `brain/rules/standards.md` first, then other rule files only when relevant.

**Optional sync mode:** `sync-full` — embed lean `brain/rules/standards.md` inside markers (not the full modular set; opt-in only).

Do not use Cursor hooks as part of this skill. Hooks are IDE-specific and not portable.

---

## Optional sync targets (user picks)

| ID | Tool | File(s) | Role |
| --- | --- | --- | --- |
| `claude` | Claude Code | `CLAUDE.md` | Primary project instructions |
| `codex` | Codex / OpenAI agents | `AGENTS.md` | Harnesses that read `AGENTS.md` (widest reach) |
| `cursor-mdc` | Cursor (current) | `.cursor/rules/project-standards.mdc` | Always-on rule with frontmatter |
| `cursor-legacy` | Cursor (legacy) | `.cursorrules` | Root rules file in older setups |
| `gemini` | Gemini CLI | `GEMINI.md` | Gemini CLI project instructions |

The user may select **one, several, or none**. If they select none, stop after Step 1 (brain only).

For multi-IDE repos, recommend **`codex`** (`AGENTS.md`) plus any other harnesses in use.

---

## Step 0 — Resolve repo root

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
echo "REPO_ROOT=$REPO_ROOT"
```

Before writing, read only the agent files the user selected (if they already exist). Preserve content **outside** the `init-brain` merge markers.

---

## Step 1 — Create brain scaffold

```bash
mkdir -p brain/rules brain/kb/features brain/kb/decisions brain/issues/completed temp
touch temp/.gitkeep
```

### `brain/INDEX.md`

Create or refresh:

```markdown
# Brain Index

Project knowledge base for humans and AI agents.

| Path | Purpose |
| --- | --- |
| [rules/standards.md](rules/standards.md) | Lean universal rules (read every session) |
| [rules/stack.md](rules/stack.md) | Stack-specific conventions (Next.js, Prisma, etc.) |
| [rules/workflow.md](rules/workflow.md) | Coding flow, scope, git branch policy |
| [rules/testing.md](rules/testing.md) | Testing policy |
| [rules/ui.md](rules/ui.md) | UI / design guidance |
| [rules/deployment.md](rules/deployment.md) | Deployment notes (optional; customize per project) |
| [kb/00-project-overview.md](kb/00-project-overview.md) | Project summary, purpose, users, major modules |
| [kb/01-architecture.md](kb/01-architecture.md) | App architecture, boundaries, folders, data flow |
| [kb/02-stack-and-dependencies.md](kb/02-stack-and-dependencies.md) | Frameworks, packages, runtime, tooling |
| [kb/03-data-model.md](kb/03-data-model.md) | DB models, schemas, migrations, persistence |
| [kb/04-auth-and-permissions.md](kb/04-auth-and-permissions.md) | Auth, roles, sessions, access control |
| [kb/05-api-and-integrations.md](kb/05-api-and-integrations.md) | APIs, webhooks, third-party integrations |
| [kb/06-ui-and-routes.md](kb/06-ui-and-routes.md) | Pages, routes, layouts, components |
| [kb/07-features.md](kb/07-features.md) | Feature index linking to `kb/features/` |
| [kb/08-flows-and-workflows.md](kb/08-flows-and-workflows.md) | User journeys and business workflows |
| [kb/09-infra-and-deployment.md](kb/09-infra-and-deployment.md) | Hosting, CI/CD, env vars, deployment notes |
| [kb/10-testing-and-quality.md](kb/10-testing-and-quality.md) | Test strategy and quality gates |
| [kb/11-known-risks-and-decisions.md](kb/11-known-risks-and-decisions.md) | Risks, tradeoffs, architecture decisions |
| [CHANGELOG.md](CHANGELOG.md) | Versioned log of brain, KB, and standards changes |
| [issues/INDEX.md](issues/INDEX.md) | Active/completed issue tracker (optional; created in Step 1b or via `kenmark-issues-setup`) |

## Maintenance

- **Code and KB move together** — update `brain/kb/` after every meaningful feature, API, schema, auth, UI, workflow, deploy, or test-strategy change.
- Edit rules under `brain/rules/` — keep `standards.md` lean; put stack/workflow/testing detail in the modular files.
- Re-run **kenmark-init** to refresh IDE pointer stubs (or `sync-full` embeds) after changing standards or stub template.
- Never delete the `brain/` folder.
```

### `brain/rules/` (modular)

For each file below, **create only if missing** (do not overwrite existing repo rules unless the user asks to reset or modularize). Templates: [Modular rule files](#modular-rule-files).

| File | When agents should read it |
| --- | --- |
| `standards.md` | Every non-trivial task (required) |
| `stack.md` | Stack/framework/database work |
| `workflow.md` | Multi-file changes, scope, dev servers, protected deployment branches |
| `testing.md` | Tests, QA, verification |
| `ui.md` | UI, layout, design polish |
| `deployment.md` | Deploy, CI/CD, hosting |

### `brain/CHANGELOG.md`

If missing, create with a header `# CHANGELOG`. Append a new version entry (see Step 6).

### `temp/`

Ensure `temp/` exists for scratch scripts and downloads. Add to `.gitignore` if not already present:

```gitignore
# kenmark-init
/temp/
```

---

## Step 1.5 — Inspect project and create numbered KB (required)

After the scaffold exists, **inspect the repository** and create or refresh `brain/kb/`. Document only **confirmed facts** from files you actually read. Put guesses in **Assumptions** and gaps in **Unknowns / documentation gaps**. Never invent architecture you did not inspect.

### Detection signals (read what exists)

| Signal | Typical paths |
| --- | --- |
| Node / package manager | `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json` |
| Next.js | `next.config.*`, `app/`, `src/app/`, `pages/` |
| Data layer | `prisma/schema.prisma`, `drizzle/`, `migrations/`, `supabase/` |
| API / server | `app/api/`, `pages/api/`, `api/`, `server/`, `routes/` |
| UI | `components/`, `src/components/`, `styles/` |
| Auth | middleware, `auth.ts`, NextAuth, Clerk, Supabase auth config |
| Infra | `Dockerfile`, `docker-compose.*`, `.github/workflows/`, `vercel.json`, `fly.toml` |
| Tests | `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `**/*.test.*`, `e2e/` |

Use **Read**, **Grep**, and **Glob** on the repo root (`$REPO_ROOT`). If a numbered KB file already exists, **merge** new findings; do not wipe user-written content unless the user asked to reset the KB.

### Files to create if missing

- `brain/kb/00-project-overview.md`
- `brain/kb/01-architecture.md`
- `brain/kb/02-stack-and-dependencies.md`
- `brain/kb/03-data-model.md`
- `brain/kb/04-auth-and-permissions.md`
- `brain/kb/05-api-and-integrations.md`
- `brain/kb/06-ui-and-routes.md`
- `brain/kb/07-features.md`
- `brain/kb/08-flows-and-workflows.md`
- `brain/kb/09-infra-and-deployment.md`
- `brain/kb/10-testing-and-quality.md`
- `brain/kb/11-known-risks-and-decisions.md`

Ensure directories exist: `brain/kb/features/`, `brain/kb/decisions/`.

### Per-file template

Use this structure for each numbered KB file (adjust the `#` title):

```markdown
# <Title>

Last updated: YYYY-MM-DD
Status: draft|reviewed|needs-update

## Confirmed facts

(Bullet facts backed by files you read — cite paths where helpful.)

## Important files inspected

- `path/to/file` — one-line note

## Assumptions

(Reasonable inferences not directly verified.)

## Unknowns / documentation gaps

(Open questions, areas not yet read.)

## Maintenance notes

(What to update when this area of the product changes.)
```

### Feature and decision files

- When the repo has distinct product features, add `brain/kb/features/NNN-short-name.md` (e.g. `001-authentication.md`) and link them from `brain/kb/07-features.md`.
- For significant architecture choices discovered during inspection, add `brain/kb/decisions/NNN-short-name.md` and link from `11-known-risks-and-decisions.md`.

### `brain/kb/07-features.md` minimum content

Include a **Feature index** table:

```markdown
| ID | Feature | Doc |
| --- | --- | --- |
| 001 | (name) | [features/001-name.md](features/001-name.md) |
```

If no features are documented yet, list discovered modules from the codebase and mark rows as `draft` or `TODO`.

### Rule (non-negotiable)

When initializing brain, inspect the current repository and document the project as a numbered KB under `brain/kb/`. Separate confirmed facts from assumptions and unknowns.

---

## Step 1b — Optional issue tracking (`brain/issues/`)

**Ask the user:** "Need issue tracking?" unless they already specified in the same request:

- "with issues", "including issue tracker", "bootstrap issues" → **yes**
- "brain only" / "just the brain folder" with no mention of issues → ask (default **no** if they decline)

| Answer | Action |
| --- | --- |
| **Yes** and `brain/issues/INDEX.md` is **missing** | Follow **`kenmark-issues-setup`** Steps 2–4 (write full `INDEX.md` template). Step 1 already created `brain/issues/` and `brain/issues/completed/`. |
| **Yes** and `INDEX.md` **exists** | Skip setup; report existing tracker. |
| **No** | Leave empty dirs only; do not write `INDEX.md`. |

**Not for discovering bugs** — filing issues from the codebase is **`kenmark-issues-scan`**, after tracker docs exist.

---

## Step 2 — Ask targets and sync mode (required)

**Do not create or update any agent config file until the user chooses.**

### Sync mode

| Mode | When | Behavior |
| --- | --- | --- |
| `stub` | **Default** | Same pointer block in each selected file (see [Pointer stub](#pointer-stub-identical-in-all-targets)) |
| `sync-full` | User asks to embed / full sync | Paste full `brain/rules/standards.md` inside markers |

Infer mode from the request:

- "embed standards", "full sync", "sync-full" → `sync-full`
- Otherwise → `stub`

If mode is unclear and targets are chosen, default to **`stub`**.

### When to skip the questions

Skip only if the user already specified in the same request:

- "init brain for Claude and Cursor" → `claude` + `cursor-mdc`, mode `stub`
- "brain only" / "just the brain folder" → **no targets**, Step 1 only
- "sync AGENTS.md with full standards" → `codex`, mode `sync-full`

### When to ask

If targets are unclear, use **AskUserQuestion** with `allow_multiple: true`:

| Option ID | Label |
| --- | --- |
| `claude` | Claude Code — `CLAUDE.md` |
| `codex` | Codex / agents — `AGENTS.md` (recommended for multi-IDE) |
| `cursor-mdc` | Cursor — `.cursor/rules/project-standards.mdc` |
| `cursor-legacy` | Cursor legacy — `.cursorrules` |
| `gemini` | Gemini CLI — `GEMINI.md` |

If targets are chosen but mode is unclear, ask: **stub (pointer, default)** or **sync-full (embed entire standards)**.

If AskUserQuestion is unavailable, ask in chat and wait for a reply.

### After selection

- Record chosen target IDs and sync mode (`stub` or `sync-full`).
- If **no** agent files, skip Step 3; go to Step 4 and Step 6.
- If both `claude` and `codex` are selected, use the **same** marked block in both files.

---

## Pointer stub (identical in all targets)

Use this **exact** markdown inside `<!-- init-brain:START -->` / `<!-- init-brain:END -->` for mode `stub`:

```markdown
## Project standards

- **Canonical:** `brain/rules/` (edit rules there only)
- **Index:** `brain/INDEX.md`

**Required — start of every new conversation:** Before non-trivial work, **Read** `brain/rules/standards.md` first. **Read** relevant `brain/kb/` files for the task (numbered `00`–`11` and any `kb/features/` entry). **Read** additional rule files (`stack.md`, `workflow.md`, `testing.md`, `ui.md`, `deployment.md`) only when relevant.

**After meaningful changes:** Update the matching `brain/kb/` files and `brain/CHANGELOG.md` — code and KB move together.
```

---

## Step 3 — Sync selected agent files (merge markers)

**Only process targets chosen in Step 2.**

Replace **only** content between markers on re-run. Insert the marked block after any existing custom preamble if markers are missing (do not delete user content above the markers).

### Mode `stub`

Paste the [pointer stub](#pointer-stub-identical-in-all-targets) in every selected file.

### Mode `sync-full`

Inside markers, paste the full contents of `brain/rules/standards.md` from disk, prefixed with:

```markdown
# Project Standards

```

### `CLAUDE.md` — if `claude` selected

```markdown
# Claude Code — Project Instructions

Rules live in `brain/rules/`. Edit there; re-run **kenmark-init** to refresh stubs or embeds.

- Brain index: [brain/INDEX.md](brain/INDEX.md)
- Changelog: [brain/CHANGELOG.md](brain/CHANGELOG.md)

<!-- init-brain:START -->
(pointer stub OR sync-full body)
<!-- init-brain:END -->
```

### `AGENTS.md` — if `codex` selected

```markdown
# Agent Instructions (Codex & compatible harnesses)

Rules live in `brain/rules/`. Keep the `init-brain` block in parity with `CLAUDE.md` when both exist.

<!-- init-brain:START -->
(same marked body as CLAUDE.md)
<!-- init-brain:END -->
```

### `.cursor/rules/project-standards.mdc` — if `cursor-mdc` selected

```markdown
---
description: Project standards — canonical brain/rules/ (read standards.md first)
alwaysApply: true
---

<!-- init-brain:START -->
(same marked body as other targets)
<!-- init-brain:END -->
```

`alwaysApply: true` keeps the Read instruction in every Cursor session.

### `.cursorrules` — if `cursor-legacy` selected

```markdown
# Cursor rules (legacy — prefer .cursor/rules/project-standards.mdc)

Canonical rules: `brain/rules/`

<!-- init-brain:START -->
(same marked body)
<!-- init-brain:END -->
```

### `GEMINI.md` — if `gemini` selected

```markdown
# Gemini CLI — Project Instructions

Canonical rules: `brain/rules/`

<!-- init-brain:START -->
(same marked body)
<!-- init-brain:END -->
```

---

## Step 4 — Verify

```bash
test -f brain/rules/standards.md && test -f brain/rules/stack.md && test -f brain/rules/workflow.md && test -f brain/rules/testing.md && test -f brain/rules/ui.md && test -f brain/INDEX.md && test -f brain/kb/00-project-overview.md && test -f brain/kb/07-features.md && echo "brain ok"
```

For each **selected** target, confirm `init-brain:START` exists (e.g. `grep -l "init-brain:START" AGENTS.md`).

Report to the user:

- Brain paths created vs updated (including `brain/kb/` files created or refreshed)
- KB inspection summary: files read, major gaps, feature docs created
- Sync mode (`stub` or `sync-full`)
- Which agent files were updated (selected targets only)
- Skipped targets
- Whether issue tracking was bootstrapped (`brain/issues/INDEX.md` created or skipped)
- Whether `brain/issues/` dirs were left empty (no INDEX)
- Reminder: edit rules under `brain/rules/` and KB under `brain/kb/`; re-run kenmark-init to refresh stubs/embeds

---

## Step 5 — Idempotency rules

- **Re-runnable:** Only replace content between `init-brain:START` and `init-brain:END` in **selected** files.
- **Do not** create agent files the user did not select.
- **Do not** remove user sections outside markers.
- **Do not** delete `brain/` or issue files under `brain/issues/`.
- If any `brain/rules/*.md` already exists, **keep the repo file** unless the user asks to reset or modularize; sync from disk for `sync-full` (embeds `standards.md` only).
- **Reset / modularize:** If the user asks to reset standards or migrate from a monolithic `standards.md`, replace `standards.md` with the lean template and add missing modular files from [Modular rule files](#modular-rule-files); offer to archive old content into `stack.md` / `workflow.md` if still useful. If `workflow.md` exists but lacks **Git branch policy**, merge that section from the template without wiping other content.
- On re-run, **ask again** for targets and mode unless the user specified them in the request.
- Switching `stub` ↔ `sync-full` replaces only the marked block.

---

## Step 6 — Changelog entry

Append to `brain/CHANGELOG.md`:

```markdown
## vYYYY.MM.DD-HHMM-kenmark-init
- Initialized or refreshed brain/ scaffold (INDEX, modular rules/, numbered kb/).
- KB: <created | refreshed> — list key `brain/kb/` files touched.
- Sync mode: <stub | sync-full>.
- Updated entry files: <comma-separated list, or "none (brain only)">.
```

Use local timestamp in the version id.

---

## Modular rule files

When a file under `brain/rules/` does not exist yet, write the template below. **Do not overwrite** existing files unless the user asks to reset or modularize. For `sync-full`, embed only `standards.md`.

Keep templates **lean** — no mandatory MCP servers, sub-agents, vision models, or browser automation. Agents use tools that exist in the session.

### `brain/rules/standards.md` (required — lean universal)

```markdown
# Project standards

Universal rules for this repo. Stack, workflow, testing, UI, and deploy details live in sibling files under `brain/rules/`.

## Scope and quality

- Prefer the smallest correct change; do not refactor unrelated code.
- In code you touch: complete behavior, real data shapes, and sensible error handling — not mocks, TODO stubs, or placeholder APIs unless the user asked for a spike.
- Read surrounding code before editing; match naming, types, and patterns already in the repo.

## Project layout

- Never delete the `brain/` folder — project knowledge base.
- Use `temp/` for scratch scripts and downloads (gitignored).
- Update `brain/` and `brain/CHANGELOG.md` after meaningful changes; version changelog entries.

## Brain KB maintenance

- The project knowledge base lives under `brain/kb/` (numbered `00`–`11`, plus `features/` and `decisions/`).
- Before starting a non-trivial task, read the relevant KB files.
- After every meaningful feature, bug fix, refactor, workflow change, API change, DB change, UI change, or deployment/config change, update the relevant KB file.
- If the change adds a new feature, create or update `brain/kb/features/NNN-feature-name.md` and link it from `brain/kb/07-features.md`.
- If the change affects architecture, data model, auth, API, UI routes, deployment, or testing, update the matching numbered KB file.
- Update `brain/CHANGELOG.md` with what changed in the KB.
- **Code and KB move together** — undocumented feature changes are incomplete work.
- If unsure which file to update, update `brain/kb/07-features.md` and add a TODO under “Documentation gaps.”

## Packages and docs

- Node.js: prefer **pnpm** over npm when this repo uses Node.
- Other ecosystems: use the repo’s existing package manager.
- For unfamiliar APIs in this codebase, read project docs and source first; use external docs only when needed.

## Safety on changed code

- On files you modify: watch for null/undefined access, missing error handling, injection/XSS in user-facing paths, and leaked secrets in commits.
- Do not run broad “audit entire codebase” passes unless the user requests it.
```

### `brain/rules/stack.md`

```markdown
# Stack conventions

Customize for this repo. Default template assumes Next.js + Tailwind + shadcn/ui + Prisma + MongoDB.

## Next.js

- Prefer App Router patterns already used in the repo (`app/`, `src/app/`, etc.).
- Server vs client components: follow existing file conventions; add `"use client"` only when needed.
- Data fetching: match existing patterns (Server Components, Route Handlers, server actions).

## Styling

- **Tailwind** utility classes; reuse design tokens and spacing from existing components.
- **shadcn/ui**: compose from `components/ui/`; do not duplicate primitives already in the repo.

## Data layer

- **Prisma**: schema changes via migrations; keep models aligned with API and UI types.
- **MongoDB**: respect ObjectId/string conventions used in the codebase; index fields used in hot queries.

## Dependencies

- Add packages only when necessary; prefer libraries already in `package.json`.
```

### `brain/rules/workflow.md`

```markdown
# Development workflow

## Git branch policy

Protected **deployment branches** — pushing here usually triggers CI/CD. Do not commit or push directly unless a human explicitly approves and understands pipelines may run.

### Protected deployment branches

Customize this table for your repo. Remove rows you do not use; add branches (e.g. `release/*` patterns) as needed.

| Branch | Purpose | Direct commit/push |
| --- | --- | --- |
| `main` | Production CI/CD | no |
| `master` | Production CI/CD (legacy name) | no |
| `dev` | Test / staging CI/CD | no |
| `develop` | Test / staging CI/CD (legacy name) | no |
| `staging` | Staging environment CI/CD | no |
| `production` | Production environment CI/CD | no |

**Typical layouts:** `main` + `dev` only; or `production` + `develop`; or `main` + `staging` + `production`. Keep the table aligned with your remotes and CI config.

### Workflow

- Use feature branches for normal work (`feature/…`, `fix/…`, `docs/…`, `test/…`).
- Merge through PR/MR unless explicitly approved for direct push.
- **kenmark-commit** reads this section first; branches listed here override skill defaults.

### Explicit override

Direct commit/push to a protected branch only when the user explicitly says so (e.g. “commit directly to dev”) and accepts that CI/CD may run.

## Planning

- Multi-file or ambiguous tasks: outline steps briefly before large edits (todo list optional — do not over-plan simple fixes).

## Scope

- Change only what the task requires; ask before expanding scope.
- When fixing one area, do not rewrite adjacent modules unless broken or requested.

## Local dev

- Before starting a dev server, check if one is already running and reuse it.
- On port conflict, stop the existing process on that port rather than spawning endless new ports.

## KB update requirement

For every meaningful change:

1. Identify impacted KB areas: feature behavior, route/page/component, API/integration, database/schema, auth/permissions, workflow/business logic, deployment/config, testing/quality.
2. Update existing KB files when the concept already exists.
3. Create a new feature file under `brain/kb/features/` when the feature is new.
4. Add a short entry to `brain/CHANGELOG.md`.
5. In the final response, mention: code files changed, KB files changed, tests/checks run.
```

### `brain/rules/testing.md`

```markdown
# Testing policy

## When to test

- Add or update tests when the user asks, or when tests clearly guard non-trivial behavior you changed.
- Skip tests that only assert implementation details or obvious framework behavior.

## Web / UI

- Prefer unit and integration tests already used in the repo (e.g. Vitest, Jest, Playwright in CI).
- Manual or visual UI checks only when doing UI work and the user wants verification — not required every session.
- Responsive layouts: spot-check breakpoints when you change layout-critical CSS, if practical.

## Commands

- Run the repo’s documented test command(s) after substantive changes when feasible; report failures honestly.
```

### `brain/rules/ui.md`

```markdown
# UI and design

## When this file applies

- Layout, visual design, components, accessibility, motion, or UX copy.

## Impeccable skill

- For substantial UI design, redesign, or polish, use the **impeccable** skill when installed.

## Baseline

- Preserve existing design system tokens, spacing, and component patterns.
- Accessible defaults: semantic HTML, labels on forms, visible focus, sufficient contrast.
- Responsive behavior should match patterns already in the repo.
```

### `brain/rules/deployment.md` (optional)

```markdown
# Deployment

Optional — fill in per project.

## Environments

- Document staging/production URLs here when known.
- **Branch → environment mapping** lives in [workflow.md](workflow.md) (Git branch policy table); keep both files consistent.

## CI/CD

- Note pipeline entry points (GitHub Actions, Vercel, etc.) and required env vars — never commit secrets.

## Releases

- Describe versioning, migration steps, and rollback expectations for this repo.
```

---

## Related skills

- `kenmark-commit` — reads `brain/rules/workflow.md` Git branch policy for protected deployment branches
- `kenmark-issues-setup` — standalone bootstrap for `brain/issues/` docs (Step 1b runs the same workflow when user opts in)
- `kenmark-issues-scan` — scan codebase and **create issue files** (requires `INDEX.md`; not setup)
- `kenmark-issues-check` — move resolved issues to `completed/` and refresh index

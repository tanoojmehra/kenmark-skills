---
name: kenmark-commit
version: 2.2.0
category: git
scope: universal
phase: ship
description: "Systematically group working-tree changes by feature or area, create meaningful conventional commits, and push to the remote. Never adds Co-authored-by or other attribution trailers. Use when asked to \"commit and push\", \"commit by feature\", \"split commits\", \"ship my changes\", \"commit logically\", or \"push commits\"."
triggers:
  - commit and push
  - commit by feature
  - split commits
  - ship my changes
  - commit logically
  - push commits
  - systematic commit
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - AskUserQuestion
risk: git-write
disable-model-invocation: false
---

# Kenmark Commit

## Purpose

Turn a messy working tree into one or more **focused commits** grouped by feature
or area, write messages that explain **why**, push to the tracking remote — and
**never** add co-author or tool attribution.

Only run when the user explicitly asks to commit and/or push. Do not commit
opportunistically after unrelated edits.

---

## Hard rules (non-negotiable)

1. **No co-author attribution**
   - Never add `Co-authored-by:`, `Made-with:`, `Signed-off-by:` for an AI/tool, or
     similar trailers to commit messages.
   - Never pass `--trailer` with co-author metadata.
   - If a hook rewrites the message to add co-author lines, **abort the commit**,
     fix or bypass the hook only if the user explicitly requests it, and retry
     with a clean message.
   - After each commit, verify with `git log -1 --format=%B` that no attribution
     trailer was injected.

2. **No git config changes** — do not run `git config` (local or global).

3. **No destructive git** — no `push --force`, `reset --hard`, or skipping hooks
   (`--no-verify`) unless the user explicitly asks.

4. **No direct commits or pushes to protected deployment branches by default**
   - **Core protected branches:** `main`, `master`, `dev`, `develop`.
   - **Extended default protected branches:** `staging`, `production` (environment-named
     deploy branches — also protected unless `brain/rules/workflow.md` narrows the list).
   - Treat `main`/`master`/`production` as production CI/CD branches.
   - Treat `dev`/`develop`/`staging` as test/staging CI/CD branches.
   - If currently on a protected branch, create a feature branch first, derive its
     name from the dominant change, then commit and push with `-u origin HEAD`.
   - Only commit/push directly to a protected branch when the user explicitly says
     to do so after being warned that CI/CD may run.

5. **Do not blindly commit to an old or mismatched feature branch**
   - Always check the current branch name and recent branch history before staging.
   - If the current branch name clearly does not match the current change, stop and
     create or ask to create a better-named branch before committing.
   - If the branch already has unrelated local/unpushed commits, do not stack new
     unrelated work on top of it without explicit user approval.

6. **No secrets in commits** — never stage `.env`, credentials, keys, or token
   files. Warn if the user asked to commit them.

---

## Step 1 — Gather context (parallel)

Run these in parallel:

```bash
git status --short
git diff --stat
git diff --cached --stat
git branch -vv
git log --oneline -12
git rev-parse --abbrev-ref HEAD
git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || true
```

Resolve default branch: strip `origin/` from `origin/HEAD`, or use `main`.

Also resolve protected deployment branches.

**Read `brain/rules/workflow.md` first when present** — its Git branch policy table
overrides or replaces the defaults below.

**Default protected deployment branches** (when workflow.md is missing or has no table):

```text
# Core (branch-name conventions)
main
master
dev
develop

# Extended default (environment-named deploy branches)
staging
production
```

If other project docs (`CLAUDE.md`, `AGENTS.md`, `brain/rules/standards.md`) define
protected/deploy branches, merge with the defaults (workflow.md wins on conflict).

If the working tree is clean, report nothing to commit and stop.

---

## Step 2 — Branch safety and intent check

Before staging or committing, determine whether the current branch is safe and
appropriate for the current work.

Run:

```bash
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
DEFAULT_REF="$(git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's#^origin/##')"
DEFAULT_BRANCH="${DEFAULT_REF:-main}"
git branch -vv
git log --oneline "${DEFAULT_BRANCH}..HEAD" 2>/dev/null || true
```

Resolve the protected list from `brain/rules/workflow.md` (Git branch policy table) when
present; otherwise use the default list from Step 1 (core + extended).

### Protected branch rule

Default protected deployment branches (core):

```text
main
master
dev
develop
```

Extended defaults (also protected unless `workflow.md` narrows): `staging`, `production`.

If `CURRENT_BRANCH` is protected:

1. Stop before staging.
2. Explain the branch role:
   - `main`/`master`/`production` usually triggers production CI/CD.
   - `dev`/`develop`/`staging` usually triggers test/staging CI/CD.
3. Create a feature branch unless the user explicitly approved direct commit/push.

Suggested branch naming:

```bash
git switch -c feature/<short-change-summary>
```

Examples:

```text
feature/add-antigravity-target
fix/cleanup-broken-symlinks
test/harden-e2e-suite
docs/update-testing-skills
```

Only remain on the protected branch if the user explicitly says something like:

```text
Commit directly to dev.
Push directly to main.
I understand this will trigger CI/CD.
```

### Existing branch suitability rule

If already on a non-protected branch, still check whether the branch matches the
current work.

Use these signals:

- Current branch name (`CURRENT_BRANCH`).
- Dominant changed paths from `git status --short` and `git diff --stat`.
- Dominant change type: `feat`, `fix`, `test`, `docs`, `chore`, `ci`, `build`,
  `refactor`, or `perf`.
- Recent branch commits from `git log --oneline "${DEFAULT_BRANCH}..HEAD"`.
- Ahead/behind and upstream info from `git branch -vv`.

Treat the branch as **probably appropriate** when:

- The branch name matches the dominant area or feature.
- Recent branch commits are related to the current change.
- The branch is new/empty and has no unrelated local commits.

Treat the branch as **stale or mismatched** when:

- The branch name points to an older feature or bug unrelated to current changes.
- Recent branch commits are about a different area.
- The branch has unpushed unrelated commits.
- The branch is named generically (`dev`, `temp`, `test`, `changes`, `wip`) and
  does not describe the current work.

If the branch is stale/mismatched:

1. Stop before staging.
2. Summarize why the branch looks wrong.
3. Propose a better branch name.
4. Ask the user before switching if there are existing branch commits.
5. If there are no unrelated local commits, create the better branch with
   `git switch -c <type>/<short-change-summary>`.

Do not rename/delete the old branch unless the user explicitly asks.

### Branch decision output

Before grouping commits, output a short branch decision:

```text
Current branch: old-login-fix
Branch assessment: mismatched — current changes are Antigravity IDE target support
Decision: create fix/add-antigravity-target before staging
```

or:

```text
Current branch: fix/add-antigravity-target
Branch assessment: appropriate
Decision: commit on current branch
```

---

## Step 3 — Group changes by feature / area

Partition **staged + unstaged + untracked** files into logical commit groups.
Prefer **file-level** grouping (do not use `git add -p`).

### Generic path buckets (default)

Classify each changed file into the **first matching** bucket below. Use the
bucket name as the conventional-commit **scope** when it fits (`feat(web)`,
`fix(api)`, `chore(config)`, etc.). When several buckets change for one feature,
keep them in **one commit** if they ship together; split only when concerns are
unrelated.

| Bucket | Path patterns (glob-style) | Typical types |
|--------|----------------------------|---------------|
| **frontend** | `app/**`, `pages/**`, `components/**`, `styles/**` | feat, fix, refactor |
| **backend** | `api/**`, `server/**`, `routes/**`, `controllers/**`, `services/**` | feat, fix, refactor |
| **database** | `prisma/**`, `migrations/**`, `schema.prisma` | feat, fix |
| **config** | `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `tsconfig*.json`, `.eslintrc*`, `eslint.config.*`, `next.config.*`, `tailwind.config.*`, `vite.config.*`, `vitest.config.*`, `jest.config.*`, `.prettierrc*`, `biome.json` | chore, build, ci |
| **docs** | `README*`, `docs/**`, `brain/**` | docs, chore |
| **tests** | `*.test.*`, `*.spec.*`, `__tests__/**`, `**/__tests__/**` | test |

**Matching notes:**

- Paths may appear at repo root or under prefixes (`src/`, `apps/web/`, etc.) —
  match on the **suffix** (e.g. `src/app/page.tsx` → frontend).
- **Tests** normally ship with the code they cover (same commit). Use a separate
  `test(scope):` commit only when tests are large or land after the feature commit.
- Files outside these buckets: use the **dominant directory** as scope
  (`packages/foo` → `foo`, `cmd/bar` → `bar`).
- Read `CLAUDE.md`, `AGENTS.md`, or `brain/rules/standards.md` first if they
  define scopes or grouping — project rules override generic buckets.

### Optional project profiles

If the user names a profile, or repo markers make one obvious, apply **profile
scopes** on top of generic buckets:

| Profile | When to use | Scope / grouping |
|---------|-------------|------------------|
| **next-fullstack** | Next.js app (`next.config.*`, `app/` or `pages/`) | `web` (frontend buckets), `api` (route handlers under `app/api/**` or `pages/api/**`), `db`, `config`, `docs` |
| **monorepo** | `apps/*`, `packages/*`, or workspace `package.json` | One scope per **app or package directory** (`web`, `worker`, `shared`, …); config at root → `config` or `chore` |
| **package-library** | Single publishable package (`src/`, `lib/`, no app shell) | `lib` or package name; `config` for tooling; `docs` for README/API docs |
| **docs-only** | Only docs/brain/config changed | Single `docs` or `chore` commit; skip code buckets |

Infer profile when not specified:

- `next.config.*` + `app/` or `pages/` → **next-fullstack**
- `apps/` or `packages/` workspaces → **monorepo**
- `src/index.ts` / `lib/` without app routes → **package-library**
- Only `docs/**`, `brain/**`, `README*` → **docs-only**

Ask the user to pick a profile only when markers conflict (e.g. monorepo + Next app).

Rules:

- **Tests** go with the code they cover (same commit group).
- **Renames/moves** stay with the feature they belong to.
- **Unrelated concerns** → separate commits (sweet spot: 2–4 commits; avoid
  10+ micro-commits).
- If one file mixes unrelated concerns, commit it with the **dominant** group and
  note the remainder for a follow-up — do not hunk-split.

Output a short plan before committing:

```
Profile: next-fullstack (inferred)
Commit plan:
1. feat(web): … — app/(dashboard)/page.tsx, components/… (N files)
2. fix(api): … — app/api/users/route.ts (M files)
3. docs(brain): … — brain/CHANGELOG.md (K files)
```

Use **AskUserQuestion** (or ask in chat) only when grouping is ambiguous and
stakes are high (e.g., half-finished feature vs ready-to-ship).

---

## Brain KB check before commit

Before committing, check whether the code change required a KB update. Read
`brain/rules/standards.md` and `brain/rules/workflow.md` when present — they
define KB maintenance for this repo.

```bash
git diff --name-only
git diff --cached --name-only
```

If changed files affect behavior, verify at least one relevant file under
`brain/kb/` or `brain/CHANGELOG.md` was updated in the same batch. If no KB
update is needed, state why in the commit body or plan (typo-only, formatting-only,
or internal refactor with no behavior/API/workflow impact).

**Requires KB update (examples):**

- New feature or changed feature behavior
- New or changed API route / integration
- Schema / model change
- Auth or permission change
- UI route / page change
- Deployment / config / env change
- Testing strategy change

**Usually does not require KB update:**

- Typo-only or formatting-only edits
- Comment-only changes
- Internal refactor with no behavior, API, or workflow impact

When KB updates are required, include `brain/kb/` paths in the same commit (or a
dedicated `docs(brain):` commit in the push batch). **Code and KB move together.**

---

## Step 4 — Message convention

Priority:

1. Project docs (`CLAUDE.md`, `AGENTS.md`) if loaded and they specify format.
2. Recent `git log` on this branch — match dominant pattern.
3. Default: **Conventional Commits** — `type(scope): imperative subject`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

- **Subject**: imperative, ≤72 chars, explains **why** / user impact, not a file list.
- **Body**: optional blank line + 1–3 sentences for non-obvious motivation,
  trade-offs, or issue IDs. Omit for trivial single-purpose changes.

Examples:

```
feat(auth): add password reset flow with rate limiting
fix(api): return 404 when resource is soft-deleted
test(core): cover edge cases in pagination helper
docs(brain): record API versioning decision
```

Bad:

```
update files
fix stuff
WIP
feat: changes (co-authored by …)   ← NEVER
```

---

## Step 5 — Commit each group (sequential)

For each group:

```bash
git add path/to/file1 path/to/file2 ...
git commit -m "$(cat <<'EOF'
type(scope): subject focused on why

Optional body when the change is not self-evident.
EOF
)"
git log -1 --format=%B   # verify NO Co-authored-by / Made-with trailers
```

If pre-commit hook **modifies** files: fix issues, `git add` the hook changes,
create a **new** commit (do not `--amend` unless user rules allow amend).

If commit **fails**: read hook output, fix, new commit — never amend a failed commit.

After all groups:

```bash
git status
```

Working tree should be clean (or only intentionally excluded files remain).

---

## Step 6 — Push

Only push when this skill was invoked (user asked to commit **and** push) or
explicitly said "push".

```bash
# Ensure upstream exists
git rev-parse --abbrev-ref @{upstream} 2>/dev/null || git push -u origin HEAD
git push
```

If push is rejected (non-fast-forward):

- Report the error; suggest `git pull --rebase` only if the user asks.
- **Never** force-push to protected deployment branches (`main`, `master`, `dev`,
  `develop`, `staging`, `production`, or any branch listed in `brain/rules/workflow.md`).

Report: branch name, commit SHAs + subjects, remote URL if useful, push result.

---

## Step 7 — Post-commit hygiene

If the repo uses `brain/` (standards + KB):

- Confirm the [Brain KB check](#brain-kb-check-before-commit) was satisfied for
  each commit that touched behavioral code.
- Include `brain/kb/` and/or `brain/CHANGELOG.md` updates in the same push batch
  when required.
- When no `brain/` convention exists, skip this step.

---

## Quick reference — do / don't

| Do | Don't |
|----|--------|
| Generic buckets + optional profile | One giant "misc" commit |
| `git add` explicit paths | `git add -A` blindly |
| Verify message has no trailers | Co-authored-by anywhere |
| Create feature branches off protected branches (`main`, `dev`) | Commit directly on protected deployment branches |
| Switch away from stale/mismatched feature branches when appropriate | Stack unrelated work onto an old branch |
| `git push -u origin HEAD` first time | Force push |
| HEREDOC for messages | `-m "line1\nline2"` escaping mistakes |

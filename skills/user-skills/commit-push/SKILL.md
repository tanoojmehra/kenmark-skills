---
name: commit-push
version: 1.0.0
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

# Commit & Push — Feature-Grouped, Meaningful Commits

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

4. **No push to main/master by default** — if on the default branch, create a
   feature branch first (derive name from the dominant change), then commit and
   push with `-u origin HEAD`.

5. **No secrets in commits** — never stage `.env`, credentials, keys, or token
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

If the working tree is clean, report nothing to commit and stop.

---

## Step 2 — Group changes by feature / area

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

## Step 3 — Message convention

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

## Step 4 — Commit each group (sequential)

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

## Step 5 — Push

Only push when this skill was invoked (user asked to commit **and** push) or
explicitly said "push".

```bash
# Ensure upstream exists
git rev-parse --abbrev-ref @{upstream} 2>/dev/null || git push -u origin HEAD
git push
```

If push is rejected (non-fast-forward):

- Report the error; suggest `git pull --rebase` only if the user asks.
- **Never** force-push to `main`/`master`.

Report: branch name, commit SHAs + subjects, remote URL if useful, push result.

---

## Step 6 — Post-commit hygiene

If the repo uses a knowledge base or changelog under project rules:

- When `brain/CHANGELOG.md` (or equivalent) is required after code changes, include
  it in the relevant commit or add a small follow-up `docs(brain): …` commit in
  the same push batch.
- When no such convention exists, skip this step.

---

## Quick reference — do / don't

| Do | Don't |
|----|--------|
| Generic buckets + optional profile | One giant "misc" commit |
| `git add` explicit paths | `git add -A` blindly |
| Verify message has no trailers | Co-authored-by anywhere |
| Feature branch off main | Commit directly on main |
| `git push -u origin HEAD` first time | Force push |
| HEREDOC for messages | `-m "line1\nline2"` escaping mistakes |

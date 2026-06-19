---
name: kenmark-repo-release
version: 1.0.1
category: workflow
scope: universal
phase: ship
description: "Can we publish / deploy / tag / hand off this repo? Read-only pre-release checklist for version, changelog, tags, package metadata, docs/legal, git cleanliness, and meta consistency. If build/type/lint/runtime is the main blocker, use kenmark-repo-quality first."
triggers:
  - release readiness
  - ready to publish
  - npm publish
  - github release
  - client handoff
  - production deploy checklist
  - kenmark-repo-release
  - tag release
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Kenmark Repo Release

**One-liner:** Can we publish / deploy / tag / hand off this repo?

## Purpose

Use before:

- `npm publish` / package registry release
- GitHub release / tag
- Client handoff
- Production deploy
- Public repo push (also run **`kenmark-repo-public`** when exposure is public)

### Boundary vs `kenmark-repo-quality`

| This skill (`kenmark-repo-release`) | `kenmark-repo-quality` |
| --- | --- |
| Version, changelog, tags, publish metadata, LICENSE, README accuracy, git/tag policy, handoff checklist | Typecheck, lint, format, build, tests, dev/runtime diagnosis |
| **Can we publish / deploy / tag / hand off this repo?** | **Are the code quality gates passing right now?** |

If the main blocker is build, typecheck, lint, format, test, or runtime failure, use **`kenmark-repo-quality`** first for discovery, classification, and a fix plan. Re-run this skill once those gates pass.

---

## Core principle

```text
Verify metadata ↔ code ↔ docs ↔ CI — Block on failing gates — Warn on drift
```

---

## Step 1 — Resolve repo root

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
git status --short
git branch --show-current
```

---

## Step 2 — Version and changelog

| Check | How |
| --- | --- |
| Version bumped | `package.json` / `pyproject.toml` / `Cargo.toml` vs last tag |
| CHANGELOG | Unreleased section cleared or version section added |
| Git tag | `git tag -l` — next tag matches policy |

```bash
test -f CHANGELOG.md && head -40 CHANGELOG.md
test -f package.json && node -e "console.log(require('./package.json').version)" 2>/dev/null
```

---

## Step 3 — Package / publish metadata (Node example)

When `package.json` exists:

```bash
node -e "
const p=require('./package.json');
console.log('name:',p.name);
console.log('version:',p.version);
console.log('private:',p.private);
console.log('files:',p.files);
console.log('exports:',!!p.exports);
console.log('bin:',p.bin);
"
```

| Check | Pass criteria |
| --- | --- |
| `private` | `false` if publishing to npm |
| `files` / `.npmignore` | Ship only intended artifacts |
| `exports` / `main` | Entry points exist on disk |
| `bin` | Referenced CLI files exist |

---

## Step 4 — Docs and legal

- README install/run instructions match actual scripts
- LICENSE present if distributing
- README version pin examples match current release (warn if stale)

---

## Step 5 — Quality gates (smoke only)

Confirm gates **pass** for release; do not deep-diagnose failures here.

```bash
npm run 2>/dev/null | head -30
```

| Script | Run when present |
| --- | --- |
| `test` | `npm test` |
| `build` | `npm run build` |
| `lint` | `npm run lint` |

Record pass/fail; do not fix automatically in this skill. If any gate fails, stop and hand off to **`kenmark-repo-quality`** for root-cause classification and a fix plan, then re-run this checklist.

---

## Step 6 — Meta consistency

Compare claims across:

- README (command counts, skill counts, feature lists)
- CHANGELOG unreleased vs shipped
- `package.json` description vs CLI help (`node cli.js --help` or package `bin`)

Flag mismatches as **warnings** or **blockers** (wrong user-facing counts = blocker for publish).

---

## Step 7 — Git cleanliness

| Check | Blocker if |
| --- | --- |
| Uncommitted changes | User expects clean release (unless intentional) |
| Wrong branch | Release policy says `main` only |
| Untracked secrets | Recommend `kenmark-repo-secrets` |

---

## Step 8 — Public exposure

If release implies **public** visibility, note: run **`kenmark-repo-public`** before push.

---

## Report template

```markdown
# Release Readiness

## Ready to release

Yes | No | Conditional

## Blockers

- …

## Warnings

- …

## Checks run

| Check | Result |
| --- | --- |
| version/changelog | … |
| test | pass/fail/skip |
| build | pass/fail/skip |
| lint | pass/fail/skip |
| git clean | … |
| meta consistency | … |

## Recommended before tag

1. …
```

Optional: `brain/reports/kenmark-repo-release-YYYY-MM-DD.md`

---

## Appendix — Kenmark-skills examples (illustrative only)

When auditing **this** package, watch for patterns like:

- README skill/command count vs actual `skills/user-skills/` directories or CLI subcommands
- CHANGELOG **Unreleased** still holding shipped items
- `npm test` depending on local doctor/MCP state
- Stale `npx kenmark-skills@X.Y.Z` pin in README

Do not hardcode these checks into other repos — use as a template for meta consistency.

---

## Related skills

| Situation | Prefer |
| --- | --- |
| Failing build / type / lint / test / runtime | `kenmark-repo-quality` (first) |
| Public open-source gate | `kenmark-repo-public` |
| Secrets | `kenmark-repo-secrets` |
| Docs drift | `kenmark-repo-docs` |
| Commits and push | `kenmark-commit` |
| KB updates | `kenmark-kb-sync` |

---

## Anti-patterns

- Do not publish with failing tests if the repo treats them as release gates.
- Do not bump version without CHANGELOG entry when the project uses one.
- Do not skip public readiness when `private: false` and repo goes public.

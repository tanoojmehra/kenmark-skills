---
name: repo-release-readiness
version: 1.0.0
category: workflow
scope: universal
phase: ship
description: "Read-only pre-release checklist: version, changelog, README, license, tests, build, lint, package exports, clean git status, tag readiness, and metadata consistency. Use before npm publish, GitHub release, client handoff, or production deploy."
triggers:
  - release readiness
  - ready to publish
  - npm publish
  - github release
  - client handoff
  - production deploy checklist
  - repo-release-readiness
  - tag release
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Repo Release Readiness — Pre-Ship Checklist (Read-Only)

## Purpose

Use before:

- `npm publish` / package registry release
- GitHub release / tag
- Client handoff
- Production deploy
- Public repo push (also run **`repo-public-readiness`** when exposure is public)

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

## Step 5 — Quality gates (run if scripts exist)

```bash
npm run 2>/dev/null | head -30
```

| Script | Run when present |
| --- | --- |
| `test` | `npm test` |
| `build` | `npm run build` |
| `lint` | `npm run lint` |

Record pass/fail; do not fix automatically in this skill.

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
| Untracked secrets | Recommend `repo-secrets-audit` |

---

## Step 8 — Public exposure

If release implies **public** visibility, note: run **`repo-public-readiness`** before push.

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

Optional: `brain/reports/repo-release-readiness-YYYY-MM-DD.md`

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
| Public open-source gate | `repo-public-readiness` |
| Secrets | `repo-secrets-audit` |
| Docs drift | `repo-docs-audit` |
| Commits and push | `commit-push` |
| KB updates | `repo-kb-sync` |

---

## Anti-patterns

- Do not publish with failing tests if the repo treats them as release gates.
- Do not bump version without CHANGELOG entry when the project uses one.
- Do not skip public readiness when `private: false` and repo goes public.

# Skills layout

The Kenmark CLI installs skills from **flat** directories only: each skill is
`<dir>/<skill-name>/SKILL.md`. Nested category folders are not used on disk
because `listKenmarkBundledSkillNames()` scans direct children of
`skills/user-skills/`.

Use **frontmatter** for logical grouping instead:

| Field | Values |
| --- | --- |
| `category` | `onboarding`, `workflow`, `git`, `issues`, `admin` |
| `scope` | `universal` (default install via `setup`) or `project-specific` (excluded from `setup`; maintain in the target repo) |
| `project` | Optional when `scope: project-specific` — target repo or product id |

## Logical map (flat on disk)

```
skills/user-skills/          ← bundled universal skills (26)
  kenmark-init/                category: onboarding
  kenmark-setup/
  kenmark-router/             category: workflow
  kenmark-plan/               category: workflow (phase: plan)
  kenmark-subagents/          category: workflow (phase: orchestrate)
  kenmark-output/             category: workflow (phase: verify)
  kenmark-troubleshoot/              category: workflow (phase: diagnose)
  kenmark-repo-hygiene/              category: workflow (phase: audit)
  kenmark-repo-secrets/
  kenmark-repo-public/
  kenmark-repo-kb/              category: workflow (phase: maintain)
  kenmark-repo-docs/
  kenmark-repo-structure/
  kenmark-repo-deps/     category: workflow (phase: verify)
  kenmark-repo-quality/        category: workflow (phase: verify)
  kenmark-repo-release/    category: workflow (phase: ship)
  kenmark-commit/               category: git
  kenmark-issues-setup/              category: issues
  kenmark-issues-list/
  kenmark-issues-check/
  kenmark-issues-scan/
  kenmark-issues-maintain/
  kenmark-packs/ category: admin
  kenmark-update/
  kenmark-maintain/
  kenmark-agents/
  recommended-catalog.json
```

All bundled skills use `scope: universal`. Skills marked `scope: project-specific`
in frontmatter are skipped by `kenmark-skills setup` if they ever appear under
`user-skills/`; project-only skills should live in that repo’s IDE skills folder,
not in this package.

## Repo skill family (routing)

| User says | Skill |
| --- | --- |
| Repo is dirty, scattered docs, dumps | `kenmark-repo-hygiene` |
| Can I make this public? | `kenmark-repo-public` |
| Check for keys/secrets | `kenmark-repo-secrets` |
| Update brain after this feature | `kenmark-repo-kb` |
| Are docs good? | `kenmark-repo-docs` |
| Is this ready to publish/release? | `kenmark-repo-release` |
| Repo layout is confusing | `kenmark-repo-structure` |
| Dependency bloat / unused packages | `kenmark-repo-deps` |
| Dev/build/type/lint/format errors | `kenmark-repo-quality` |

## Bundled skills (reference)

| Skill | Purpose |
| --- | --- |
| `kenmark-plan` | Plan complex work before implementation |
| `kenmark-output` | Enforce complete final outputs and deliverables |
| `kenmark-subagents` | Split complex work into specialist investigation tracks |
| `kenmark-repo-hygiene` | Audit clutter, scattered docs, orphan assets, dumps; cleanup after approval |
| `kenmark-repo-secrets` | Deep read-only secret/key/token scan with redaction |
| `kenmark-repo-public` | Safe-to-publish gate before open-sourcing |
| `kenmark-repo-kb` | Update `brain/kb/` after code changes |
| `kenmark-repo-docs` | README, setup, env docs, KB freshness, broken links |
| `kenmark-repo-structure` | Folder layout and module boundaries |
| `kenmark-repo-deps` | Package health, duplicates, lockfile consistency |
| `kenmark-repo-quality` | Dev/runtime/build/typecheck/lint/format gates; diagnose without auto-editing |
| `kenmark-repo-release` | Pre-release version, changelog, tests, meta consistency |

See each `skills/user-skills/<name>/SKILL.md` for full workflows. The root [README](../README.md) lists all bundled skills.

## Recommended day-to-day order

| Situation | Skill |
| --- | --- |
| Problem unclear? | `kenmark-troubleshoot` |
| Need a plan before work? | `kenmark-plan` |
| Need parallel/specialist tracks? | `kenmark-subagents` |
| Need complete final deliverable? | `kenmark-output` |
| Need issue tracking? | `kenmark-issues-setup` / `kenmark-issues-scan` |
| Need skill choice? | `kenmark-router` |
| Repo health (see table above) | `repo-*` family |
| Installed skills inventory? | `kenmark-maintain` |
| Need commit? | `kenmark-commit` |

See the root [README](../README.md) for trigger examples and setup steps.

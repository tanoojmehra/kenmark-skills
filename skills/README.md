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
skills/user-skills/          ← bundled universal skills (23)
  init-brain/                category: onboarding
  skills-init/
  skills-router/             category: workflow
  troubleshoot/              category: workflow (phase: diagnose)
  repo-hygiene/              category: workflow (phase: audit)
  repo-secrets-audit/
  repo-public-readiness/
  repo-kb-sync/              category: workflow (phase: maintain)
  repo-docs-audit/
  repo-structure-audit/
  repo-dependency-audit/     category: workflow (phase: verify)
  repo-quality-gates/        category: workflow (phase: verify)
  repo-release-readiness/    category: workflow (phase: ship)
  commit-push/               category: git
  issues-setup/              category: issues
  issues-list/
  issues-check/
  issues-scan/
  issues-maintenance/
  skills-install-recommended/ category: admin
  skills-update/
  skills-maintain/
  subagents-maintain/
  recommended-catalog.json
```

All bundled skills use `scope: universal`. Skills marked `scope: project-specific`
in frontmatter are skipped by `kenmark-skills setup` if they ever appear under
`user-skills/`; project-only skills should live in that repo’s IDE skills folder,
not in this package.

## Repo skill family (routing)

| User says | Skill |
| --- | --- |
| Repo is dirty, scattered docs, dumps | `repo-hygiene` |
| Can I make this public? | `repo-public-readiness` |
| Check for keys/secrets | `repo-secrets-audit` |
| Update brain after this feature | `repo-kb-sync` |
| Are docs good? | `repo-docs-audit` |
| Is this ready to publish/release? | `repo-release-readiness` |
| Repo layout is confusing | `repo-structure-audit` |
| Dependency bloat / unused packages | `repo-dependency-audit` |
| Dev/build/type/lint/format errors | `repo-quality-gates` |

## Bundled skills (reference)

| Skill | Purpose |
| --- | --- |
| `repo-hygiene` | Audit clutter, scattered docs, orphan assets, dumps; cleanup after approval |
| `repo-secrets-audit` | Deep read-only secret/key/token scan with redaction |
| `repo-public-readiness` | Safe-to-publish gate before open-sourcing |
| `repo-kb-sync` | Update `brain/kb/` after code changes |
| `repo-docs-audit` | README, setup, env docs, KB freshness, broken links |
| `repo-structure-audit` | Folder layout and module boundaries |
| `repo-dependency-audit` | Package health, duplicates, lockfile consistency |
| `repo-quality-gates` | Dev/runtime/build/typecheck/lint/format gates; diagnose without auto-editing |
| `repo-release-readiness` | Pre-release version, changelog, tests, meta consistency |

See each `skills/user-skills/<name>/SKILL.md` for full workflows. The root [README](../README.md) lists all bundled skills.

## Recommended day-to-day order

| Situation | Skill |
| --- | --- |
| Problem unclear? | `troubleshoot` |
| Need issue tracking? | `issues-setup` / `issues-scan` |
| Need skill choice? | `skills-router` |
| Repo health (see table above) | `repo-*` family |
| Installed skills inventory? | `skills-maintain` |
| Need commit? | `commit-push` |

See the root [README](../README.md) for trigger examples and setup steps.

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
skills/user-skills/          ← bundled universal skills (15)
  init-brain/                category: onboarding
  skills-init/
  skills-router/             category: workflow
  troubleshoot/              category: workflow (phase: diagnose)
  repo-hygiene/              category: workflow (phase: audit)
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

## Bundled skills (reference)

| Skill | Purpose |
| --- | --- |
| `repo-hygiene` | Audit dirty repos, scattered docs, orphan files, dumps, backups, and secret risks before commit/public push |

See each `skills/user-skills/<name>/SKILL.md` for full workflows. The root [README](../README.md) lists all bundled skills.

## Recommended day-to-day order

| Situation | Skill |
| --- | --- |
| Problem unclear? | `troubleshoot` |
| Need issue tracking? | `issues-setup` / `issues-scan` |
| Need skill choice? | `skills-router` |
| Repo clutter, secrets, public push prep? | `repo-hygiene` |
| Installed skills inventory? | `skills-maintain` |
| Need commit? | `commit-push` |

See the root [README](../README.md) for trigger examples and setup steps.

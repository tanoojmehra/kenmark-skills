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
skills/user-skills/          ← bundled universal skills (13)
  init-brain/                category: onboarding
  skills-init/
  skills-router/             category: workflow
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

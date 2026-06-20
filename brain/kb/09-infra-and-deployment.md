# Infra and deployment

Last updated: 2026-06-07
Status: reviewed

## Confirmed facts

- **Hosting:** npm registry (public package); GitHub source repo.
- **CI:** No `.github/workflows/` in repo at init time — quality gates via local `npm test` and `prepublishOnly`.
- **Publish gate:** `prepublishOnly` runs `test:all` + `pack:check` (`npm pack --dry-run`).
- **npm `files`:** Whitelists scripts, skills, config, CHANGELOG — not `brain/`, tests, or IDE dotfolders.

### Maintainer test matrix

| When | Command |
| --- | --- |
| Fast dev | `npm test` |
| Before publish | `npm run test:all && npm run pack:check` |
| Repo invariants | `npm run validate` |

## Important files inspected

- `package.json` — scripts, `files`, `prepublishOnly`
- `.npmignore`

## Unknowns / documentation gaps

- External CI for the GitHub repo (if added later) should mirror `npm test`.

## Organizational defaults (for consumer projects)

This file documents the **kenmark-skills repo's own deployment**. For consumer-project deployment defaults, see `brain/rules/standards.md` → **Organizational defaults**:

- **Target:** Ubuntu VPS + PM2 (not Vercel-first).

## Maintenance notes

- Add GitHub Actions workflow doc here if CI is added.

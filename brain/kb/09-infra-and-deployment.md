# Infra and deployment

Last updated: 2026-10-29
Status: reviewed

## Confirmed facts

- **Hosting:** npm registry (public package); GitHub source repo.
- **CI:** `.github/workflows/brain2-regression.yml` runs on `main` push and PRs on Node 22: `npm run validate`, `npm test`, `npm run test:all`, `npm run pack:check` (`contents: read`).
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

- No release/tag automation: tagging (`vX.Y.Z`) and `npm publish` remain manual.

## Organizational defaults (for consumer projects)

This file documents the **kenmark-skills repo's own deployment**. For consumer-project deployment defaults, see `brain/rules/standards.md` → **Organizational defaults**:

- **Target:** Ubuntu VPS + PM2 (not Vercel-first).

## Maintenance notes

- `brain/` and IDE dotfolders stay out of the npm tarball; update this file when `files` or CI jobs change.

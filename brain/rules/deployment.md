# Deployment

## npm publish

- Public package: `@tanoojmehra/kenmark-skills` on npm (`publishConfig.access: public`).
- **prepublishOnly:** `npm run test:all && npm run pack:check`.
- Manual: `npm run publish:public`.

## Versioning

- Semver in `package.json`; document in root `CHANGELOG.md`.
- Skill versions are independent per `SKILL.md` frontmatter — bump when skill behavior changes materially.

## What ships

- `package.json` `files` whitelist — scripts, skills, config, root CHANGELOG.
- `brain/` is git-tracked for repo contributors but excluded from npm via `.npmignore`.

## Rollback

- npm unpublish policy applies; prefer patch releases for fixes.

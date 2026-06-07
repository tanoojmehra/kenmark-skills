# Testing policy

## Commands

| Command | Purpose |
| --- | --- |
| `npm run validate` | Repo invariants (skills, catalog JSON, package.json, forbidden terms) |
| `npm test` | validate + `test:cli` + `test:packs-verify` |
| `npm run test:all` | Full gate before publish |
| `npx kenmark-skills doctor` | Local install diagnostics (after `init` on a machine) |

`npx kenmark-skills validate` runs `scripts/validate.js` → `validate-repo.js` (same checks as `npm run validate`).

## When to test

- Run `npm run validate` after any change to skills, catalog, scripts, or package metadata.
- Run `npm run test:all` before version bumps intended for npm publish.
- Add regression tests in `scripts/test-*.js` for CLI behavior changes.

## doctor vs validate

- **validate** — repo/package only; safe in CI and fresh clones.
- **doctor** — checks `~/.kenmark`, IDE links, MCP on PATH; not for CI.

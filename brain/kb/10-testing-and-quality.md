# Testing and quality

Last updated: 2026-06-07
Status: reviewed

## Confirmed facts

### validate-repo (`scripts/validate-repo.js`)

Checks include:

- All bundled skills have required frontmatter fields and valid categories/scopes.
- Skill count consistency with package description / docs.
- `recommended-catalog.json` schema, presets, pack IDs, install/verify commands.
- `package.json` `files` entries exist on disk.
- Forbidden terms and legacy rename map (`LEGACY_SKILL_RENAMES` from hub).

### Test scripts

| Script | Purpose |
| --- | --- |
| `test-cli-smoke.js` | CLI dispatch and dry-run assertions |
| `test-packs-verify-skip.js` | Catalog verify logic |
| `test-install-temp-home.js` | Install with temp HOME |
| `test-pack.js` | npm pack contents |
| `test-broken-symlink-cleanup.js` | Cleanup broken symlinks |
| `test-cleanup-temp-home.js` | Cleanup kenmark/packs modes |
| `test-skill-portability.js` | Path rewrite in store |

### doctor (`scripts/doctor.js`)

Local machine checks: store presence, manifest, MCP CLI tools on PATH, IDE symlinks, hash drift, non-portable skill paths, WSL hints.

Flags: `--soft`, `--no-fail`, `--json <path>`.

## Important files inspected

- `package.json` scripts
- `scripts/validate-repo.js` (header and requires)

## Maintenance notes

- New validation rules: extend `validate-repo.js` and document here.

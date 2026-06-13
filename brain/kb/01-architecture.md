# Architecture

Last updated: 2026-06-07
Status: reviewed

## Confirmed facts

### CLI routing (`scripts/cli.js`)

| Command | Handler |
| --- | --- |
| `init` | `kenmark-setup.js` |
| `setup` | `setup-skills.js` (legacy; stderr deprecation hint) |
| `uninstall` | `setup-skills.js --uninstall` |
| `mcp uninstall` | `setup-skills.js --uninstall --mcp-only` |
| `inventory` | `skills-inventory.js` |
| `subagents-inventory` | `subagents-inventory.js` |
| `install-recommended` | `kenmark-packs.js` |
| `update` | `kenmark-update.js` |
| `adopt` | `skills-adopt.js` |
| `validate` | `validate.js` → `validate-repo.js` |
| `doctor` | `doctor.js` |
| `cleanup` | `kenmark-cleanup.js` |

### Kenmark hub store model (`scripts/kenmark-hub.js`)

| Path | Role |
| --- | --- |
| `~/.kenmark/store/skills/<name>/` | Canonical skill content |
| `~/.kenmark/store/mcp.json` | Selected MCP server definitions |
| `~/.kenmark/manifest.json` | Install metadata |
| `~/.kenmark/cache/skills-registry.json` | Runtime cache (kenmark-router) |

**Flow:** Bundled skills copy from package → store → symlink (or copy on Windows) into IDE paths. **Adopt** consolidates catalog skills already on disk into the store and relinks.

Default IDE targets for new installs: **cursor**, **claude**, **codex** (`DEFAULT_AGENT_IDES` in hub).

### Interactive vs non-interactive

- Terminal TTY (stdin **and** stdout) → interactive wizards (`scripts/interactive.js`).
- Pseudo-TTY with EOF (agent subprocesses) → `assertInteractiveStdin()` exits non-zero with `-y` / flag guidance.
- Flags + `-y` or `KENMARK_SKILLS_NONINTERACTIVE=1` → scripted installs (see `kb/05-api-and-integrations.md`).

## Important files inspected

- `scripts/cli.js`, `scripts/kenmark-hub.js`, `scripts/kenmark-setup.js`
- `config/mcp-servers.json`, `config/mcp-profiles.json`

## Assumptions

- `init` is the long-term primary entry; `setup` retained for `--copy`, `--force`, `--skip-adopt` flags not exposed on `init`.

## Unknowns / documentation gaps

- Full adopt source-priority rules when store and IDE copies diverge (partially documented in README/hub).

## Maintenance notes

- New CLI commands: add route in `cli.js`, usage in `printUsage()`, KB `05`, root CHANGELOG.

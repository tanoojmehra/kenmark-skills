# CLI commands and integrations

Last updated: 2026-06-08
Status: reviewed

## Confirmed facts

### Commands (12 user-facing + help/version)

| Command | Description |
| --- | --- |
| `init` | **Recommended first install** — Kenmark skills + optional packs + IDE + MCP wizard |
| `setup` | Legacy: Kenmark skills only via `setup-skills.js` |
| `uninstall` | Remove Kenmark links from IDE paths; optional `--keep-store`; removes Kenmark MCP unless `--mcp-only` |
| `mcp uninstall` | Remove MCP from IDE MCP configs + clear store MCP manifest |
| `install-recommended` | Install curated third-party packs from catalog |
| `update` | Refresh Kenmark and/or recommended installs |
| `adopt` | Consolidate adoptable catalog skills on disk into store + relink |
| `validate` | Repo/package invariants |
| `doctor` | Local install health (store, symlinks, MCP tools, hash drift) |
| `cleanup` | Surgical removal: broken symlinks, legacy paths, kenmark-*, catalog packs |
| `inventory` | Report installed skills (keep/dedupe/remove) |
| `subagents-inventory` | Same for sub-agents (`agents-inventory` alias) |

### init vs setup vs update vs cleanup vs uninstall

| | `init` | `setup` | `update` | `cleanup` | `uninstall` |
| --- | --- | --- | --- | --- | --- |
| **When** | First install | Legacy skills-only | Refresh existing | Hygiene / selective removal | Remove all Kenmark links |
| **Packs** | Optional wizard | No | Optional refresh | `--recommended` / `--packs` | No (packs stay unless cleanup) |
| **MCP** | Opt-in wizard/flags | Opt-in flags | Can refresh MCP | No | Yes (unless `--mcp-only` on uninstall) |
| **CLI package** | Optional upgrade when global install is stale | No | Optional `npm install -g @latest` | No | No |
| **Store** | Populates | Populates | Updates | Optional `--include-store` | `--keep-store` default |

### Common flags

| Flag | Purpose |
| --- | --- |
| `--global` / `--project` | User home vs current repo IDE paths |
| `--ide <target>` | `cursor`, `claude`, `codex`, `antigravity-cli`, `antigravity`, `antigravity-ide`, `all`, comma-separated |
| `-y` | Skip interactive prompts |
| `--skip-recommended` | Kenmark skills only on `init` |
| `--skip-npm` | Skip CLI version check / global upgrade on `init`; skip npm step on `update` |
| `--upgrade-cli` | Non-interactive `init`: upgrade global package to npm `@latest` before installing skills |
| `--skip-adopt` | Skip post-install adopt pass |
| `--mcp-servers <list>` | MCP by name: `playwright`, `context7`, `fetch`, `sequential-thinking`, `browsermcp` |
| `--mcp-profile <name>` | `none`, `web`, `research`, `deep`, `all` |
| `--with-mcp` | Profile `all` |
| `--skip-mcp` | Skip MCP even when profile/servers set |
| `--copy` / `--symlink` | Windows copy vs junction (setup / packs) |
| `--force` / `--adopt-overwrite` | Overwrite differing store content on adopt |
| `--dry-run` | cleanup preview |
| `--kenmark` / `--recommended` / `--all-managed` / `--full` | cleanup categories |

### IDE skill directories (global)

| IDE | Path |
| --- | --- |
| Cursor | `~/.cursor/skills` |
| Codex / agents | `~/.agents/skills` |
| Claude Code | `~/.claude/skills` |
| Gemini CLI | `~/.gemini/skills` (or `~/.agents/skills` when Codex is also selected — Gemini aliases both) |
| Antigravity CLI | `~/.gemini/antigravity-cli/skills` (or deduped away from `~/.gemini/skills` when Gemini is also selected) |
| Antigravity 2.0 Manager | `~/.gemini/antigravity/skills` |
| Antigravity IDE (standalone app) | `~/.gemini/antigravity-ide/skills` |
| OpenCode | `~/.opencode/skills` |
| Kiro | `~/.kiro/skills` |
| Trae / Trae CN | `~/.trae/skills`, `~/.trae-cn/skills` |
| Rovo Dev | `~/.rovodev/skills` |
| Qoder | `~/.qoder/skills` |
| MiniMax Code | `~/.minimax/skills` |

Project scope: same relative paths under repo root (`.cursor/skills`, `.agents/skills`, etc.).

**Antigravity surfaces:** CLI, 2.0 Manager (`antigravity`), and standalone IDE (`antigravity-ide`) all default to **copy** (not symlink) because Antigravity does not discover symlinked skill dirs.

**Antigravity 2.0 project:** Kenmark links to `.agent/skills` and mirrors `.agents/skills` for CLI compatibility.

**Antigravity IDE project:** Kenmark links to `.agents/skills` and mirrors `.agent/skills` for backward compatibility.

**Gemini + Codex:** Gemini CLI discovers both `~/.gemini/skills` and `~/.agents/skills` and prefers the latter. When `--ide` includes both `codex` and `gemini`, Kenmark links once to `~/.agents/skills` and removes Kenmark-managed duplicates from `~/.gemini/skills` to avoid startup conflict warnings.

**Antigravity CLI + Gemini:** Antigravity CLI also reads `~/.gemini/skills` as a shared path. When both are in `--ide`, Kenmark links once to `~/.gemini/antigravity-cli/skills` and prunes duplicates from `~/.gemini/skills`.

### MCP (JSON mcpServers IDEs)

**MCP-capable:** cursor, claude, gemini, antigravity-cli, antigravity, antigravity-ide, kiro, trae, trae-cn, rovo, qoder. Codex, OpenCode, and minimax receive skills only until format adapters land.

**Bundled servers** (`config/mcp-servers.json`):

| Server | Transport |
| --- | --- |
| `playwright` | `npx -y @playwright/mcp@latest` |
| `context7` | `npx -y @upstash/context7-mcp` |
| `sequential-thinking` | `npx -y @modelcontextprotocol/server-sequential-thinking` |
| `fetch` | `uvx mcp-server-fetch` (requires uv) |
| `browsermcp` | `npx -y @browsermcp/mcp@latest` |

**Profiles** (`config/mcp-profiles.json`): `none` (default), `web`, `research`, `deep`, `all`.

**Config merge targets:** see [features/003-mcp-integration.md](features/003-mcp-integration.md) for per-IDE global/project paths.

Interactive `init`/`setup`/`update` prompt for individual server names. Non-interactive: `--mcp-servers playwright,context7` or `--mcp-profile web`.

### Non-interactive agents / CI

Set `KENMARK_SKILLS_NONINTERACTIVE=1` or pass `-y` with explicit flags.

Examples:

```bash
npx kenmark-skills init --global --skip-recommended -y
npx kenmark-skills init --global --ide cursor --skip-recommended --mcp-servers playwright,context7 -y
npx kenmark-skills init --global --ide antigravity-cli --mcp-profile web -y
npx kenmark-skills init --global --ide antigravity-ide --mcp-profile web -y
npx kenmark-skills init --project --ide antigravity --mcp-servers playwright,context7 -y
npx kenmark-skills update --both --global -y
npx kenmark-skills install-recommended --ids impeccable,simplify --global -y
```

## Important files inspected

- `scripts/cli.js`, `package.json` scripts
- `config/mcp-servers.json`, `config/mcp-profiles.json`
- `scripts/kenmark-hub.js` (IDE + MCP paths)

## Assumptions

- Codex, OpenCode, and minimax in `--ide all` receive skill links but not MCP merges until TOML/schema adapters exist.

## Maintenance notes

- New flags: update this file, README agents section (brief), root CHANGELOG.

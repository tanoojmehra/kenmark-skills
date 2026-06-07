# CLI commands and integrations

Last updated: 2026-06-07
Status: reviewed

## Confirmed facts

### Commands (12 user-facing + help/version)

| Command | Description |
| --- | --- |
| `init` | **Recommended first install** — Kenmark skills + optional packs + IDE + MCP wizard |
| `setup` | Legacy: Kenmark skills only via `setup-skills.js` |
| `uninstall` | Remove Kenmark links from IDE paths; optional `--keep-store`; removes Kenmark MCP unless `--mcp-only` |
| `mcp uninstall` | Remove MCP from Cursor/Claude configs + clear store MCP manifest |
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
| **Store** | Populates | Populates | Updates | Optional `--include-store` | `--keep-store` default |

### Common flags

| Flag | Purpose |
| --- | --- |
| `--global` / `--project` | User home vs current repo IDE paths |
| `--ide <target>` | `cursor`, `claude`, `codex`, `all`, comma-separated |
| `-y` | Skip interactive prompts |
| `--skip-recommended` | Kenmark skills only on `init` |
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
| Gemini CLI | `~/.gemini/skills` |
| OpenCode | `~/.opencode/skills` |
| Kiro | `~/.kiro/skills` |
| Trae / Trae CN | `~/.trae/skills`, `~/.trae-cn/skills` |
| Rovo Dev | `~/.rovodev/skills` |
| Qoder | `~/.qoder/skills` |
| MiniMax Code | `~/.minimax/skills` |

Project scope: same relative paths under repo root (`.cursor/skills`, etc.).

### MCP (Cursor + Claude only)

**Bundled servers** (`config/mcp-servers.json`):

| Server | Transport |
| --- | --- |
| `playwright` | `npx -y @playwright/mcp@latest` |
| `context7` | `npx -y @upstash/context7-mcp` |
| `sequential-thinking` | `npx -y @modelcontextprotocol/server-sequential-thinking` |
| `fetch` | `uvx mcp-server-fetch` (requires uv) |
| `browsermcp` | `npx -y @browsermcp/mcp@latest` |

**Profiles** (`config/mcp-profiles.json`): `none` (default), `web`, `research`, `deep`, `all`.

**Config merge targets:**

| Scope | Cursor | Claude Code |
| --- | --- | --- |
| Global | `~/.cursor/mcp.json` | `~/.claude.json` → `mcpServers` |
| Project | `.cursor/mcp.json` | `.mcp.json` at repo root |

Interactive `init`/`setup`/`update` prompt for individual server names. Non-interactive: `--mcp-servers playwright,context7` or `--mcp-profile web`.

### Non-interactive agents / CI

Set `KENMARK_SKILLS_NONINTERACTIVE=1` or pass `-y` with explicit flags.

Examples:

```bash
npx kenmark-skills init --global --skip-recommended -y
npx kenmark-skills init --global --ide cursor --skip-recommended --mcp-servers playwright,context7 -y
npx kenmark-skills update --both --global -y
npx kenmark-skills install-recommended --ids impeccable,code-review-skill --global -y
```

## Important files inspected

- `scripts/cli.js`, `package.json` scripts
- `config/mcp-servers.json`, `config/mcp-profiles.json`
- `scripts/kenmark-hub.js` (IDE + MCP paths)

## Assumptions

- Other IDEs in `--ide all` receive skill links but not MCP config merges yet.

## Maintenance notes

- New flags: update this file, README agents section (brief), root CHANGELOG.

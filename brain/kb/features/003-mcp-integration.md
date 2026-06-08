# MCP integration

Last updated: 2026-06-08
Status: reviewed

## Summary

Five bundled MCP servers, opt-in on `init` / legacy `setup` / `update`. Installed into JSON `mcpServers`-compatible IDE configs; canonical copy in `~/.kenmark/store/mcp.json`.

**MCP-capable IDEs:** cursor, claude, gemini, antigravity-cli, antigravity, kiro, trae, trae-cn, rovo, qoder.

**Not yet:** codex (TOML `~/.codex/config.toml`), opencode (different `mcp` schema), minimax — skills only.

## Servers (`config/mcp-servers.json`)

| Name | Command |
| --- | --- |
| `playwright` | `npx -y @playwright/mcp@latest` |
| `context7` | `npx -y @upstash/context7-mcp` |
| `sequential-thinking` | `npx -y @modelcontextprotocol/server-sequential-thinking` |
| `fetch` | `uvx mcp-server-fetch` |
| `browsermcp` | `npx -y @browsermcp/mcp@latest` |

## Profiles (`config/mcp-profiles.json`)

| Profile | Servers |
| --- | --- |
| `none` | (default) — no install |
| `web` | playwright, browsermcp |
| `research` | context7, fetch |
| `deep` | sequential-thinking, context7, fetch |
| `all` | every bundled server |

## Selection UX

- **Interactive:** pick individual servers by name in init/setup/update wizards.
- **Non-interactive:** `--mcp-servers playwright,context7` or `--mcp-profile web` or `--with-mcp` (all).
- **Skip:** `--skip-mcp` or omit flags (default none).

## Config paths

| IDE | Global | Project | Kind |
| --- | --- | --- | --- |
| cursor | `~/.cursor/mcp.json` | `.cursor/mcp.json` | standalone |
| claude | `~/.claude.json` | `.mcp.json` | nested `mcpServers` |
| gemini | `~/.gemini/settings.json` | `.gemini/settings.json` | nested |
| antigravity-cli | `~/.gemini/antigravity-cli/mcp_config.json` | `.agents/mcp_config.json` | standalone |
| antigravity | `~/.gemini/config/mcp_config.json` | `.agent/mcp_config.json` | standalone |
| kiro | `~/.kiro/settings/mcp.json` | `.kiro/settings/mcp.json` | standalone |
| trae | `~/.trae/mcp.json` | `.trae/mcp.json` | standalone |
| trae-cn | `~/.trae-cn/mcp.json` | `.trae-cn/mcp.json` | standalone |
| rovo | `~/.rovodev/mcp.json` | `.rovodev/mcp.json` | standalone |
| qoder | `~/.qoder/settings.json` | `.qoder/settings.local.json` | nested |

Merge behavior: existing server entries with same name left unchanged unless `--force`. Nested configs preserve other settings keys.

**Gemini + Codex:** Skills dedupe to `~/.agents/skills`, but MCP still merges into `~/.gemini/settings.json` when both are in `--ide`.

## Uninstall MCP only

```bash
npx kenmark-skills mcp uninstall --global --ide cursor -y
npx kenmark-skills uninstall --mcp-only --global -y
```

Skills and store skills are untouched.

## Maintenance

Update when adding servers, MCP-capable IDEs, or changing merge targets in `kenmark-hub.js` (`MCP_CAPABLE_IDES`, `buildMcpGlobalTargets`).

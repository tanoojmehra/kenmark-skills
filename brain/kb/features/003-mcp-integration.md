# MCP integration

Last updated: 2026-06-07
Status: reviewed

## Summary

Five bundled MCP servers, opt-in on `init` / legacy `setup` / `update`. Installed into **Cursor** and **Claude Code** configs only; canonical copy in `~/.kenmark/store/mcp.json`.

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

| Scope | Cursor | Claude |
| --- | --- | --- |
| Global | `~/.cursor/mcp.json` | `~/.claude.json` |
| Project | `.cursor/mcp.json` | `.mcp.json` |

Merge behavior: existing server entries with same name left unchanged unless `--force`.

## Uninstall MCP only

```bash
npx kenmark-skills mcp uninstall --global --ide cursor -y
npx kenmark-skills uninstall --mcp-only --global -y
```

Skills and store skills are untouched.

## Maintenance

Update when adding servers or changing merge targets in `kenmark-hub.js`.

# Flows and workflows

Last updated: 2026-06-08
Status: reviewed

## Confirmed facts

### Human first-time setup

1. `npx kenmark-skills init` — wizard selects Kenmark skills, optional packs, IDE targets, MCP servers. When running from a **global** install that lags npm `latest`, init prompts to upgrade the CLI first (or use `--upgrade-cli -y` / `npx kenmark-skills@latest init`).
2. Restart IDE if skills/MCP do not appear.
3. In a **project repo**, run **kenmark-init** in agent chat to bootstrap that repo's `brain/`.

### Day-to-day skill routing (bundled)

| Situation | Skill |
| --- | --- |
| Problem unclear | `kenmark-troubleshoot` |
| Plan before coding | `kenmark-plan` |
| Parallel investigation | `kenmark-subagents` |
| Complete deliverable | `kenmark-output` |
| Pick right skill | `kenmark-router` |
| Commit grouped changes | `kenmark-commit` |
| Refresh installs | `kenmark-update` (CLI) / skill |
| Inventory skills | `kenmark-maintain` |

See [features/002-skills-catalog.md](features/002-skills-catalog.md) for full catalog and activation tiers.

### Refresh cycle

```bash
npx kenmark-skills update          # interactive
npx kenmark-skills update --both --global -y   # non-interactive
```

Do **not** re-run `init` for routine skill refreshes — use `update`. Re-run `init` when you want the first-install wizard again or after upgrading a stale global CLI.

### Adopt workflow

After install or when `doctor` reports non-portable paths:

```bash
npx kenmark-skills adopt --global -y
npx kenmark-skills adopt --global --adopt-overwrite -y   # when review-required
```

### Cleanup vs uninstall

- **cleanup** — pick scope (global home vs project repo), then categories (broken links, legacy, kenmark-*, packs only). Interactive scope prompt: "Where should cleanup run?"
- **uninstall** — remove all Kenmark bundled skill links from selected IDE dirs; MCP removed unless `--mcp-only`.

### Skill activation tiers (policy)

- **Core daily:** router, troubleshoot, plan, output, init, repo-quality, commit, maintain, security-review, performance, etc.
- **Specialist:** repo-docs, test-*, issues-*, repo-release, etc. — only when task matches.
- **Explicit admin:** setup, packs, update, agents — only when user asks.

Documented in `kenmark-router` skill; see feature 002.

## Important files inspected

- `skills/user-skills/kenmark-router/SKILL.md`
- `README.md` (workflow tables, being moved here)

## Maintenance notes

- Update when init/update wizard steps change.

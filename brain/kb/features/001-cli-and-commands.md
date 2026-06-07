# CLI and commands

Last updated: 2026-06-08
Status: reviewed

## Summary

Twelve-command CLI routed through `scripts/cli.js`. Human default: interactive `init` (checks npm `latest` when running from a global install). Agents/CI: explicit flags + `-y`; use `--skip-npm` or `--upgrade-cli` for CLI package behavior.

## Entry points

```bash
npx kenmark-skills init          # humans — wizard
npx kenmark-skills <command>     # all commands
kenmark-skills                   # if npm install -g
kenmark-skills-setup             # legacy setup bin only
```

## Command reference

See [../05-api-and-integrations.md](../05-api-and-integrations.md) for full tables (flags, MCP, IDE paths, init vs update vs cleanup vs uninstall).

## validate vs doctor

| | validate | doctor |
| --- | --- | --- |
| Scope | Repo/package | Local `~/.kenmark` + IDE links |
| CI | Yes | No |
| Entry | `npm run validate`, `npx kenmark-skills validate` | `npx kenmark-skills doctor` |

## Maintenance

Update when adding commands or changing flag behavior.

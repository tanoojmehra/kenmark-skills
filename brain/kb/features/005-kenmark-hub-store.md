# Kenmark hub store

Last updated: 2026-06-07
Status: reviewed

## Summary

Single canonical store under `~/.kenmark/` with symlinks (or copies) into per-IDE skill directories.

## Paths

| Path | Role |
| --- | --- |
| `~/.kenmark/store/skills/<name>/` | Canonical skill trees |
| `~/.kenmark/store/mcp.json` | Selected MCP definitions |
| `~/.kenmark/manifest.json` | Install metadata (versions, targets) |
| `~/.kenmark/backups/legacy-cleanup/` | Backups from cleanup legacy mode |
| `~/.kenmark/cache/skills-registry.json` | kenmark-router runtime cache |

## Install flow

1. Copy bundled skills from npm package → store.
2. Link store entries → IDE paths (`cursor`, `claude`, `codex` by default).
3. Run **adopt** to pull adoptable catalog skills from IDE disk into store and relink (unless `--skip-adopt`).
4. Optional: merge selected MCP servers into IDE MCP configs.

## Adopt

Consolidates skills already on disk (e.g. Impeccable from upstream CLI) into store. Does not download packs.

- Hash mismatch → **review-required** until `adopt --adopt-overwrite` / `--force`.
- When store already matches source, adopt still runs **portability refresh** (`store-current`) — rewrites non-portable paths without recopying.
- Summary line reports **adopted** and **portability-refreshed** separately (e.g. `Adopt pass: 0 adopted, 39 portability-refreshed of 39 candidate(s)`).
- Repairs non-portable paths (`.cursor/skills/foo/` → `./` in SKILL.md).

## Portability rewrite

When copying to store, hardcoded IDE anchor paths in `SKILL.md` and `scripts/*.{js,mjs}` rewrite to `./` for multi-IDE links.

## Uninstall vs keep store

```bash
npx kenmark-skills uninstall --keep-store   # remove links only
npx kenmark-skills uninstall                # links + MCP; store skills remain unless user deletes ~/.kenmark
```

## Maintenance

Hub logic lives in `scripts/kenmark-hub.js` — update this doc when store layout changes.

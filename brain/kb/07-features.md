# Features index

Last updated: 2026-06-15
Status: reviewed

## Feature index

| ID | Feature | Doc |
| --- | --- | --- |
| 001 | CLI and commands | [features/001-cli-and-commands.md](features/001-cli-and-commands.md) |
| 002 | Bundled skills catalog | [features/002-skills-catalog.md](features/002-skills-catalog.md) |
| 003 | MCP integration | [features/003-mcp-integration.md](features/003-mcp-integration.md) |
| 004 | Recommended packs | [features/004-recommended-packs.md](features/004-recommended-packs.md) |
| 005 | Kenmark hub store | [features/005-kenmark-hub-store.md](features/005-kenmark-hub-store.md) |

## Confirmed facts

- 53 bundled Kenmark skills under `skills/user-skills/` (flat directories).
- `kenmark-storage` — unified consumer SDK skill for hosting project assets on Kenmark Storage (uploads, signed downloads, conversion). Installable kit includes `SKILL.md`, `KIT.md`, and `reference.md`.
- 10 optional catalog pack IDs: `impeccable`, `simplify`, `ponytail`, `improve`, `drawio-skill`, `graphify`, `seo-geo-selected`, `seo-geo-full`, `ecc`, `headroom`.
- Default catalog selection: **impeccable** + **simplify** only.

## Documentation gaps

- Per-skill trigger phrase detail remains in each `SKILL.md` — not duplicated here.

## Maintenance notes

- Add a new `features/NNN-*.md` when introducing a major product area; link here.

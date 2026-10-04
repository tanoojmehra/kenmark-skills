# Features index

Last updated: 2026-10-04
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

- 43 bundled Kenmark skills under `skills/user-skills/` (flat directories).
- `kenmark-storage` — API-only consumer skill for Kenmark Storage: proxied REST routes (upload, list, serve, visibility, soft delete/restore), shared monorepo package, `@kenmark/storage/server` only. Kit: `SKILL.md`, `KIT.md`, `reference.md`. Version `1.3.2` — registry-first install; when unpublished, vendor-copy SDK in-repo (`packages/` or `vendor/`) — plus operational guide from `1.3.1` (thin-route runtime, CMS modules).
- 11 optional catalog pack IDs: `impeccable`, `ponytail`, `simplify`, `improve`, `vercel-react-best-practices`, `improve-codebase-architecture`, `constraint-driven-development`, `adverse-review`, `drawio-skill`, `seo-geo-selected`, `seo-geo-full`.
- Default catalog selection: **impeccable** + **ponytail**; Simplify is optional.

## Documentation gaps

- Per-skill trigger phrase detail remains in each `SKILL.md` — not duplicated here.

## Maintenance notes

- Add a new `features/NNN-*.md` when introducing a major product area; link here.

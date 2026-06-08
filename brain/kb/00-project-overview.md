# Project overview

Last updated: 2026-06-07
Status: reviewed

## Confirmed facts

- **kenmark-skills** is a public npm package (MIT) that ships **41 first-party Kenmark agent skills** and a **12-command CLI** for Cursor, Claude Code, Codex, and other harnesses that read `SKILL.md` files.
- Current version: **2.3.10** in `package.json`.
- Binaries: `kenmark-skills` → `scripts/cli.js`, `kenmark-skills-setup` → `scripts/setup-skills.js` (legacy).
- Recommended first install for humans: `npx kenmark-skills init` (interactive wizard).
- Skills install to `~/.kenmark/store/skills/` and link into IDE skill directories; optional third-party packs from `recommended-catalog.json`.
- MCP server install is **opt-in** (Cursor and Claude Code configs only in this package).
- Authors: Kenmark ITan Solutions; contributors Tanooj Mehra, Adwait Date.
- Repository: https://github.com/tanoojmehra/kenmark-skills

## Important files inspected

- `package.json` — version, scripts, npm `files` list
- `README.md` — user-facing quick start (being simplified)
- `scripts/cli.js` — command routing
- `skills/README.md` — flat skill layout and categories
- `skills/user-skills/recommended-catalog.json` — optional pack catalog v5

## Assumptions

- Most users install via `npx` without global npm install.
- Consumer application repos run **kenmark-init** skill to create their own `brain/` — separate from this package's dev `brain/`.

## Unknowns / documentation gaps

- npm download counts and supported IDE list beyond paths in `kenmark-hub.js` may evolve without doc updates.

## Maintenance notes

- Update skill count if bundled skills added/removed (validate-repo enforces consistency).
- Update version line when releasing.

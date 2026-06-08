# Known risks and decisions

Last updated: 2026-06-08 (Antigravity platform support)
Status: reviewed

## Confirmed facts / decisions

| Decision | Rationale |
| --- | --- |
| Flat `skills/user-skills/` layout | CLI scans direct children only — no nested category folders |
| `init` over `setup` | Single recommended path; setup kept for legacy flags |
| MCP opt-in default | Avoid mutating IDE MCP configs without consent |
| MCP JSON IDEs only (10 targets) | cursor, claude, gemini, antigravity-cli, antigravity, kiro, trae, trae-cn, rovo, qoder; Codex/OpenCode need format adapters |
| Antigravity IDE copy default | IDE does not discover symlinked skills — Kenmark copies into `~/.gemini/antigravity/skills` unless `--symlink` |
| Antigravity IDE dual project paths | Project install links both `.agent/skills` and `.agents/skills` when `antigravity` is in `--ide` |
| Windows copy default | Symlinks often fail; copy/junction fallback in hub |
| Catalog v5 selectable installs | Default lean (impeccable + code-review); heavy packs opt-in |
| `validate` vs `doctor` split | CI-safe repo checks vs local install diagnostics |
| brain/ in git, not npm | Dev KB for this repo; consumers get their own brain via kenmark-init |

## Known risks

- **TTY + EOF:** `init`/`update` may exit 0 with "Nothing selected" when stdin is TTY but EOF (agent subprocesses) — see `brain/issues/` tracker if present.
- **WSL vs native Windows:** Installs into WSL home are invisible to native Windows IDEs — doctor warns.
- **Adopt overwrite:** Hash mismatches require explicit `--adopt-overwrite` / `--force`.
- **Impeccable script paths:** Upstream `SKILL.md` uses `node ./scripts/*.mjs` (skill-relative). Agents run shell from project CWD — kenmark adopt rewrites these to absolute store paths; re-run `npx kenmark-skills adopt --global --ide all -y` after upgrading kenmark-skills if impeccable setup still fails.
- **Legacy cleanup scope:** `listLegacyKenmarkSkillPaths()` must not include canonical bundled names when `kenmark-${old}` equals the rename target (fixed issue 010).
- **Gemini/Codex duplicate skills (fixed 011):** Installing to both `~/.agents/skills` and `~/.gemini/skills` caused Gemini CLI conflict warnings — dedupe on link + prune duplicates on setup/adopt.
- **Antigravity CLI/Gemini shared path:** Antigravity CLI reads `~/.gemini/skills` alongside `~/.gemini/antigravity-cli/skills` — dedupe when both `antigravity-cli` and `gemini` are in `--ide`.
- **Antigravity IDE symlinks:** Symlinked skills under `~/.gemini/antigravity/skills` may not load — doctor warns; use `--copy` or add absolute `~/.agents/skills` in IDE Skill Custom Paths.

## Important files inspected

- `skills/user-skills/recommended-catalog.json` — `installRules.overlapCaps`
- `scripts/interactive.js`, `scripts/kenmark-setup.js` (TTY behavior)

## Maintenance notes

- Record new architecture decisions in `kb/decisions/` when significant.

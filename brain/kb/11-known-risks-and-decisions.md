# Known risks and decisions

Last updated: 2026-06-11 (Antigravity IDE target)
Status: reviewed

## Confirmed facts / decisions

| Decision | Rationale |
| --- | --- |
| Flat `skills/user-skills/` layout | CLI scans direct children only — no nested category folders |
| `init` over `setup` | Single recommended path; setup kept for legacy flags |
| MCP opt-in default | Avoid mutating IDE MCP configs without consent |
| MCP JSON IDEs only (11 targets) | cursor, claude, gemini, antigravity-cli, antigravity, antigravity-ide, kiro, trae, trae-cn, rovo, qoder; Codex/OpenCode need format adapters |
| Antigravity copy default | CLI/2.0/IDE do not discover symlinked skills — Kenmark copies into Antigravity skill dirs unless `--symlink` |
| Antigravity 2.0 dual project paths | `antigravity` project install links `.agent/skills` and mirrors `.agents/skills` |
| Antigravity IDE dual project paths | `antigravity-ide` project install links `.agents/skills` and mirrors `.agent/skills` |
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
- **Antigravity symlinks:** Symlinked skills under any Antigravity skill root may not load — doctor warns; copy is default; or add an absolute skill path in Antigravity Settings → Skill Custom Paths.
- **Three Antigravity surfaces:** `antigravity-cli` (terminal), `antigravity` (2.0 Manager harness), `antigravity-ide` (standalone VS Code app at `~/.gemini/antigravity-ide/skills`) — pass all needed targets in `--ide`.

## Important files inspected

- `skills/user-skills/recommended-catalog.json` — `installRules.overlapCaps`
- `scripts/interactive.js`, `scripts/kenmark-setup.js` (TTY behavior)

## Maintenance notes

- Record new architecture decisions in `kb/decisions/` when significant.

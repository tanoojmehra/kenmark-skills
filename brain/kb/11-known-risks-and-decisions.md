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
| Org: small=single-app, complex=monorepo | Pragmatic split — monorepo adds overhead; single app is simpler for small projects |
| Org: mixed Radix/Base UI via shadcn-style composition | Best-of-both: Radix for complex a11y, Base UI for lightweight composite components |
| Org: MongoDB primary DB | Existing team expertise; document model suits most app shapes |
| Org: Prisma v6.x or Mongoose for MongoDB | Prisma v7 MongoDB support not yet shipped; verify connector status before standardizing |
| Org: state management tiered (local→server→global→realtime→offline) with decision rules | Agents need clear tier guidance per project — not a one-size-fits-all pick |
| Org: Ubuntu VPS + PM2 (not Vercel-first) | Full control, no platform lock-in, known stack |
| Antigravity copy default | CLI/2.0/IDE do not discover symlinked skills — Kenmark copies into Antigravity skill dirs unless `--symlink` |
| Global-only installs | Kenmark CLI rejects `--project`; catalog v7 is global-only |
| Windows copy default | Symlinks often fail; copy/junction fallback in hub |
| Catalog v6 selectable installs | Default lean (impeccable + simplify); heavy packs opt-in |
| `validate` vs `doctor` split | CI-safe repo checks vs local install diagnostics |
| brain/ in git, not npm | Dev KB for this repo; consumers get their own brain via kenmark-init |

## Known risks

- **TTY + EOF (fixed 006):** `assertInteractiveStdin()` and stricter `wantsInteractive()` exit non-zero with re-run guidance when stdin is TTY but EOF (agent subprocesses).
- **WSL vs native Windows:** Installs into WSL home are invisible to native Windows IDEs — doctor warns.
- **Adopt overwrite:** Hash mismatches require explicit `--adopt-overwrite` / `--force`.
- **Impeccable script paths:** Upstream `SKILL.md` uses `node ./scripts/*.mjs` (skill-relative). Agents run shell from project CWD — kenmark adopt rewrites these to absolute store paths; re-run `npx kenmark-skills adopt --ide all -y` after upgrading kenmark-skills if impeccable setup still fails.
- **Legacy cleanup scope:** `listLegacyKenmarkSkillPaths()` must not include canonical bundled names when `kenmark-${old}` equals the rename target (fixed issue 010).
- **Gemini/Codex duplicate skills (fixed 011):** Installing to both `~/.agents/skills` and `~/.gemini/skills` caused Gemini CLI conflict warnings — dedupe on link + prune duplicates on setup/adopt.
- **Antigravity CLI/Gemini shared path:** Antigravity CLI reads `~/.gemini/skills` alongside `~/.gemini/antigravity-cli/skills` — when both `antigravity-cli` and `gemini` are in `--ide`, link once to `~/.gemini/skills` (Gemini cannot read the antigravity-cli path).
- **Antigravity symlinks:** Symlinked skills under any Antigravity skill root may not load — doctor warns; copy is default; or add an absolute skill path in Antigravity Settings → Skill Custom Paths.
- **Three Antigravity surfaces:** `antigravity-cli` (terminal), `antigravity` (2.0 Manager harness), `antigravity-ide` (standalone VS Code app at `~/.gemini/antigravity-ide/skills`) — pass all needed targets in `--ide`.

## Important files inspected

- `skills/user-skills/recommended-catalog.json` — `installRules.overlapCaps`
- `scripts/interactive.js`, `scripts/kenmark-setup.js` (TTY behavior)

## Maintenance notes

- Record new architecture decisions in `kb/decisions/` when significant.

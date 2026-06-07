# Known risks and decisions

Last updated: 2026-06-07
Status: reviewed

## Confirmed facts / decisions

| Decision | Rationale |
| --- | --- |
| Flat `skills/user-skills/` layout | CLI scans direct children only — no nested category folders |
| `init` over `setup` | Single recommended path; setup kept for legacy flags |
| MCP opt-in default | Avoid mutating Cursor/Claude configs without consent |
| MCP limited to Cursor + Claude | No standard MCP path documented for other IDEs in this package |
| Windows copy default | Symlinks often fail; copy/junction fallback in hub |
| Catalog v5 selectable installs | Default lean (impeccable + code-review); heavy packs opt-in |
| `validate` vs `doctor` split | CI-safe repo checks vs local install diagnostics |
| brain/ in git, not npm | Dev KB for this repo; consumers get their own brain via kenmark-init |

## Known risks

- **TTY + EOF:** `init`/`update` may exit 0 with "Nothing selected" when stdin is TTY but EOF (agent subprocesses) — see local `brain/issues/` (gitignored).
- **WSL vs native Windows:** Installs into WSL home are invisible to native Windows IDEs — doctor warns.
- **Adopt overwrite:** Hash mismatches require explicit `--adopt-overwrite` / `--force`.
- **Impeccable script paths:** Upstream `SKILL.md` uses `node ./scripts/*.mjs` (skill-relative). Agents run shell from project CWD — kenmark adopt rewrites these to absolute store paths; re-run `npx kenmark-skills adopt --global --ide all -y` after upgrading kenmark-skills if impeccable setup still fails.
- **ECC / SEO full packs:** High bloat; overlap caps in catalog JSON.

## Important files inspected

- `skills/user-skills/recommended-catalog.json` — `installRules.overlapCaps`
- `scripts/interactive.js`, `scripts/kenmark-setup.js` (TTY behavior)

## Maintenance notes

- Record new architecture decisions in `kb/decisions/` when significant.

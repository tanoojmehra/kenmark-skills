# Project standards

Universal rules for **kenmark-skills** (npm CLI + bundled skills). Stack, workflow, testing, and release details live in sibling files under `brain/rules/`.

## Scope and quality

- Prefer the smallest correct change; do not refactor unrelated code.
- Match existing patterns in `scripts/` and skill frontmatter before adding new conventions.
- Bundled skills live under `skills/user-skills/<name>/SKILL.md` — flat layout only (no nested category folders on disk).

## Project layout

- **Canonical skills:** `skills/user-skills/` (41 Kenmark skills + `recommended-catalog.json`).
- **CLI:** `scripts/cli.js` dispatches to focused modules (`setup-skills.js`, `kenmark-hub.js`, etc.).
- **Config:** `config/mcp-servers.json`, `config/mcp-profiles.json`.
- Never delete the `brain/` folder — project knowledge base for this repo.
- Use `temp/` for scratch scripts (gitignored).
- Update `brain/kb/` and `brain/CHANGELOG.md` after meaningful CLI, catalog, MCP, or skill changes.

## Brain KB maintenance

- Read relevant `brain/kb/` files before non-trivial work.
- After every meaningful change, update the matching numbered KB file or `kb/features/` entry.
- Keep `README.md` lean; move new long-form docs to `brain/kb/`.
- Package `CHANGELOG.md` and version in `package.json` must move with user-facing CLI or skill changes.

## Packages and docs

- Node.js **18+**; no runtime npm dependencies in the published package.
- Use `npm run validate` before commits that touch skills, catalog, or scripts.
- Consumer repos use `npx kenmark-skills init` — this repo documents that CLI, it does not require a local `~/.kenmark` install to develop.

## Safety

- Do not commit secrets, tokens, or local IDE folders (`.cursor/`, `.claude/`, `.agents/`).
- `brain/issues/` and `brain/plans/` are part of the tracked brain — commit them with other `brain/` docs. Teams may add local `.gitignore` entries if they choose not to push trackers.

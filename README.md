# kenmark-skills

## Quick install

```bash
npx kenmark-skills init
```

No global install required — `npx` downloads and runs the CLI (or uses your npm cache).

The **init** wizard walks you through Kenmark skills, optional curated packs, IDE targets, and MCP server selection — all interactively. To refresh an existing install, use **`update`** (do not run `init` again for upgrades).

**41 first-party skills**, a **12-command CLI**, and a **curated catalog** of optional third-party packs. Agent skills and CLI for Cursor, Codex, Claude Code, Antigravity CLI/IDE, Gemini CLI, OpenCode, and other harnesses that read `SKILL.md` files.

Published by [Kenmark ITan Solutions](https://github.com/tanoojmehra/kenmark-skills). Created by **Tanooj Mehra** and **Adwait Date**.

---

## Table of contents

- [At a glance](#at-a-glance)
- [Quick start](#quick-start)
- [Requirements](#requirements)
- [Suggested workflow](#suggested-workflow)
- [Documentation (brain/)](#documentation-brain)
- [Agents and automation](#agents-and-automation-non-interactive)
- [Contributing](#contributing)
- [License](#license)

---

## At a glance

| Asset | Count | Detail |
| --- | ---: | --- |
| Kenmark skills | 41 | Bundled in `skills/user-skills/` |
| CLI commands | 12 | [brain/kb/05-api-and-integrations.md](brain/kb/05-api-and-integrations.md) |
| Recommended packs | 6 | Impeccable, code review, Graphify, SEO, ECC — [brain/kb/features/004-recommended-packs.md](brain/kb/features/004-recommended-packs.md) |
| MCP servers | 5 | Opt-in; 8 JSON IDE targets — [brain/kb/features/003-mcp-integration.md](brain/kb/features/003-mcp-integration.md) |

Skills install once under `~/.kenmark/store` and link into each IDE's skills directory. See [brain/kb/features/005-kenmark-hub-store.md](brain/kb/features/005-kenmark-hub-store.md).

---

## Quick start

```bash
# Guided install (humans)
npx kenmark-skills init

# Refresh later — do not re-run init
npx kenmark-skills update
```

Optional: `npm install -g kenmark-skills` for the shorter `kenmark-skills` command.

In a **project repo** (agent chat): *"Run kenmark-init on this repo"* to bootstrap that repo's `brain/` (standards, numbered KB, optional IDE stubs).

For scripts, CI, and agents, see [Agents and automation](#agents-and-automation-non-interactive).

---

## Requirements

- **Node.js** 18+
- An agent environment that discovers skills from disk (Cursor, Codex CLI, Claude Code, Antigravity CLI/IDE, Gemini CLI, OpenCode, etc.)

### Windows note

Run `npx kenmark-skills init` from **PowerShell** or **CMD** if you use native Windows Cursor/Claude. WSL installs into `/home/...`, which native Windows IDEs usually will not read. Kenmark copies skills on Windows by default (not symlinks). Confirm with `npx kenmark-skills doctor`.

---

## Suggested workflow

**Setup (once):** `npx kenmark-skills init` → **kenmark-init** in your project repo.

**Day-to-day:** start with **kenmark-troubleshoot** when the problem is unclear; **kenmark-plan** before large work (tiered plans saved to `brain/plans/`); **kenmark-plans-execute** to implement an approved plan; **kenmark-subagents** for parallel specialist tracks; **kenmark-output** for complete deliverables; **kenmark-router** when the domain is clear but the skill is not; **kenmark-commit** when shipping changes. Issue and plan trackers live under `brain/issues/` and `brain/plans/` (bootstrapped by **kenmark-init**).

Full skill catalog, activation tiers, and routing tables: [brain/kb/features/002-skills-catalog.md](brain/kb/features/002-skills-catalog.md) and [brain/kb/08-flows-and-workflows.md](brain/kb/08-flows-and-workflows.md).

---

## Documentation (brain/)

Long-form reference lives in **`brain/`** (this repo's dev knowledge base — not shipped on npm).

| Topic | Where |
| --- | --- |
| Brain index | [brain/INDEX.md](brain/INDEX.md) |
| Project overview | [brain/kb/00-project-overview.md](brain/kb/00-project-overview.md) |
| Architecture & CLI routing | [brain/kb/01-architecture.md](brain/kb/01-architecture.md) |
| CLI commands, flags, MCP, IDE paths | [brain/kb/05-api-and-integrations.md](brain/kb/05-api-and-integrations.md) |
| init / update / adopt / cleanup / uninstall | [brain/kb/08-flows-and-workflows.md](brain/kb/08-flows-and-workflows.md) |
| Skills catalog & tiers | [brain/kb/features/002-skills-catalog.md](brain/kb/features/002-skills-catalog.md) |
| Recommended packs | [brain/kb/features/004-recommended-packs.md](brain/kb/features/004-recommended-packs.md) |
| Kenmark hub store | [brain/kb/features/005-kenmark-hub-store.md](brain/kb/features/005-kenmark-hub-store.md) |
| Testing & validate | [brain/kb/10-testing-and-quality.md](brain/kb/10-testing-and-quality.md) |
| Agent standards | [brain/rules/standards.md](brain/rules/standards.md) |

---

## Agents and automation (non-interactive)

Pass explicit flags and **`-y`** to skip TTY prompts. Set **`KENMARK_SKILLS_NONINTERACTIVE=1`** to force non-interactive behavior without `-y`.

Full flag tables and MCP profiles: [brain/kb/05-api-and-integrations.md](brain/kb/05-api-and-integrations.md).

### First install

```bash
npx kenmark-skills init --skip-recommended -y
npx kenmark-skills init --ide cursor --skip-recommended -y
npx kenmark-skills init --ids impeccable,simplify -y
```

### MCP (non-interactive)

Plain install does not touch MCP configs. Opt in with:

```bash
npx kenmark-skills init --skip-recommended --mcp-servers playwright,context7 -y
npx kenmark-skills init --skip-recommended --mcp-profile web -y
npx kenmark-skills init --with-mcp --skip-recommended -y   # all servers
```

### Update, packs, adopt, cleanup, uninstall

```bash
npx kenmark-skills update --both -y
npx kenmark-skills install-recommended --ids impeccable,simplify -y
npx kenmark-skills adopt -y
npx kenmark-skills doctor --json ./doctor.json --no-fail
npx kenmark-skills cleanup --recommended -y
npx kenmark-skills uninstall -y
npx kenmark-skills mcp uninstall --ide cursor -y
```

Legacy **`setup`** remains for `--copy`, `--force`, `--skip-adopt` not exposed on `init`:

```bash
npx kenmark-skills setup --ide cursor --copy --skip-adopt -y
```

Migration: `setup -y` → `init --skip-recommended -y`. Legacy `setup` runs **Install 41 Kenmark skills** via `setup-skills.js`.

| | `init` | `setup` |
| --- | --- | --- |
| **Installs** | Kenmark + optional packs | 41 Kenmark skills |
| **Later refreshes** | Use `update` | Use `update` |

### Testing skills (links)

[`kenmark-test-plan`](skills/user-skills/kenmark-test-plan/SKILL.md) · [`kenmark-test-unit`](skills/user-skills/kenmark-test-unit/SKILL.md) · [`kenmark-test-integration`](skills/user-skills/kenmark-test-integration/SKILL.md) · [`kenmark-test-e2e`](skills/user-skills/kenmark-test-e2e/SKILL.md) · [`kenmark-test-mocks`](skills/user-skills/kenmark-test-mocks/SKILL.md) · [`kenmark-test-coverage`](skills/user-skills/kenmark-test-coverage/SKILL.md) · [`kenmark-test-ci`](skills/user-skills/kenmark-test-ci/SKILL.md)

### Repository layout

```text
kenmark-skills/
├── README.md
├── brain/                  # dev KB (git only; see brain/INDEX.md)
├── scripts/cli.js          # kenmark-skills binary
└── skills/user-skills/     # 41 universal skills + recommended-catalog.json
```

---

## Contributing

1. Edit skills under `skills/user-skills/<skill-name>/SKILL.md`.
2. Use the shared frontmatter schema (`name`, `version`, `category`, `scope`, `phase`, `description`, `triggers`, `allowed-tools`, `risk`, `disable-model-invocation`). See [`skills/README.md`](skills/README.md).
3. Run `npm run validate` (or `npm test`).
4. Add a dated entry to [`CHANGELOG.md`](CHANGELOG.md).
5. Update matching `brain/kb/` docs for CLI or catalog changes.
6. Open a PR.

**Maintainers:** `npm test` · `npm run test:all` · `npm run pack:check` · `npm run publish:public`

---

## License

MIT — Kenmark ITan Solutions ([`package.json`](package.json)).

**Links:** [Repository](https://github.com/tanoojmehra/kenmark-skills) · [Issues](https://github.com/tanoojmehra/kenmark-skills/issues)

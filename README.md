# kenmark-skills

```bash
npx kenmark-skills init
```

No global install required — `npx` downloads and runs the CLI (or uses your npm cache). For Kenmark skills only, non-interactive: `npx kenmark-skills setup --global -y`.

**Agent skills and CLI for Cursor, Codex, Claude Code, and other harnesses that read `SKILL.md` files.**

Published by [Kenmark ITan Solutions](https://github.com/tanoojmehra/kenmark-skills). Created by **Tanooj Mehra** and **Adwait Date**.

---

## Table of contents

- [Overview](#overview)
- [Quick start](#quick-start)
- [Requirements](#requirements)
- [Skills catalog](#skills-catalog)
- [Skill activation tiers](#skill-activation-tiers)
- [CLI reference](#cli-reference)
- [Installation](#installation)
- [Kenmark hub](#kenmark-hub)
- [Operations](#operations)
- [Uninstall](#uninstall)
- [Using skills in chat](#using-skills-in-chat)
- [Repository layout](#repository-layout)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

`kenmark-skills` ships **36 first-party skills**, an **11-command CLI**, and a **curated catalog** of optional third-party packs. Skills install once under `~/.kenmark/store` and link into each IDE’s skills directory.

| Asset | Count | Notes |
| --- | ---: | --- |
| Kenmark skills | 36 | Bundled in `skills/user-skills/` |
| CLI commands | 11 | See [CLI reference](#cli-reference) |
| Bundled sub-agents | 0 | Inventory/maintain skills only |
| Recommended packs | 6 | Impeccable, code review, Graphify, SEO selected/full, ECC |

**Suggested workflow**

**Setup (once)**

1. **Install** — `npx kenmark-skills init` (or `setup` for Kenmark-only).
2. **Onboard a repo** — run **`kenmark-init`** in the agent.

**Day-to-day (pick the first row that fits)**

| Situation | Skill |
| --- | --- |
| Problem unclear? | **`kenmark-troubleshoot`** |
| Need a plan before work? | **`kenmark-plan`** |
| Need parallel/specialist tracks? | **`kenmark-subagents`** |
| Need complete final deliverable? | **`kenmark-output`** |
| Need issue tracking? | **`kenmark-issues-setup`** / **`kenmark-issues-scan`** |
| Scan, fix, commit, and ship issues? | **`kenmark-issues-fix-and-ship`** |
| Need skill choice? | **`kenmark-router`** |
| Repo clutter / scattered docs? | **`kenmark-repo-hygiene`** |
| Secrets / keys / tokens? | **`kenmark-repo-secrets`** |
| Make repo public? | **`kenmark-repo-public`** |
| Update brain after code change? | **`kenmark-repo-kb`** |
| Docs quality? | **`kenmark-repo-docs`** |
| Release / npm publish? | **`kenmark-repo-release`** |
| Build/type/lint/format/dev errors? | **`kenmark-repo-quality`** |
| Security review / auth / RBAC / injection / SSRF? | **`kenmark-security-review`** |
| Performance / slow routes / DB / bundle / hydration? | **`kenmark-performance`** |
| Need test strategy? | **`kenmark-test-plan`** |
| Need unit/API/E2E tests? | **`kenmark-test-unit`** / **`kenmark-test-integration`** / **`kenmark-test-e2e`** |
| Need test fixtures/mocks? | **`kenmark-test-mocks`** |
| Need coverage or CI test gates? | **`kenmark-test-coverage`** / **`kenmark-test-ci`** |
| Installed skills inventory? | **`kenmark-maintain`** |
| Need commit? | **`kenmark-commit`** |

**Maintain** — periodic **`kenmark-update`**, **`kenmark-maintain`**, **`kenmark-agents`**.

**Troubleshoot trigger examples:** "kenmark-troubleshoot my Cursor slowdown", "diagnose this production issue", "find root cause of this deployment failure", "build a test plan before fixing".

Many skills expect a project **`brain/`** directory (standards, numbered **KB** under **`brain/kb/`**, changelog, optional issues). That layout is created in *your* repos via **`kenmark-init`**, which inspects the codebase and seeds `brain/kb/00`–`11` plus optional `features/` and `decisions/` — not shipped inside this package. Rules live under **`brain/rules/`** (lean **`standards.md`** plus optional **`stack.md`**, **`workflow.md`**, etc.); IDE entry files get a short **Read-first stub** by default (multi-IDE, no hooks). **`kenmark-commit`** enforces KB updates alongside behavioral code changes.

---

## Quick start

No global install required — `npx` downloads and runs the CLI each time (or uses your npm cache).

```bash
# Guided install: Kenmark skills + optional curated packs
npx kenmark-skills init

# Kenmark skills only, non-interactive (defaults to cursor, claude, codex when no IDE dirs are found)
npx kenmark-skills setup --global -y

# Or target those three explicitly:
# npx kenmark-skills setup --global --ide cursor,claude,codex -y

# In a project repo (agent chat)
# "Run kenmark-init on this repo"
```

Optional: `npm install -g kenmark-skills` if you want the shorter `kenmark-skills` command without `npx`.

**Agents and CI:** pass explicit flags and **`-y`** to skip TTY prompts (see [CLI reference](#cli-reference)).

---

## Requirements

- **Node.js** 18+ (npm install / publish only)
- An agent environment that discovers skills from disk (Cursor, Codex CLI, Claude Code, Gemini CLI, OpenCode, etc.)

### Windows note

Run `npx kenmark-skills setup` from **PowerShell** or **CMD** if you use native Windows Cursor/Claude. Running from **WSL** installs into the WSL home directory (`/home/...`), which native Windows IDEs usually will not read.

On Windows, Kenmark copies skills into IDE folders by default (not symlinks). For an explicit copy install:

```powershell
npx kenmark-skills setup --global --ide cursor --copy --skip-adopt -y
```

Confirm install path:

```powershell
node -p "process.platform + ' ' + require('os').homedir()"
Test-Path "$env:USERPROFILE\.cursor\skills\kenmark-init\SKILL.md"
```

`kenmark-skills doctor` warns when it detects WSL and prints your home directory for debugging.

---

## Skills catalog

Skills are grouped by use case. Open each `SKILL.md` for full workflows and trigger phrases.

### Onboard

| Skill | Purpose |
| --- | --- |
| [`kenmark-init`](skills/user-skills/kenmark-init/SKILL.md) | Bootstrap `brain/` + numbered `brain/kb/` from repo inspection; install cross-IDE pointer stubs (optional full embed) |
| [`kenmark-setup`](skills/user-skills/kenmark-setup/SKILL.md) | First-time CLI wizard (`npx kenmark-skills init`) |

### While coding

| Skill | Purpose |
| --- | --- |
| [`kenmark-router`](skills/user-skills/kenmark-router/SKILL.md) | Search installed skills and auto-assign the best match for the current task |
| [`kenmark-plan`](skills/user-skills/kenmark-plan/SKILL.md) | Plan complex work before implementation |
| [`kenmark-subagents`](skills/user-skills/kenmark-subagents/SKILL.md) | Split complex work into specialist investigation tracks |
| [`kenmark-output`](skills/user-skills/kenmark-output/SKILL.md) | Enforce complete final outputs and deliverables |
| [`kenmark-troubleshoot`](skills/user-skills/kenmark-troubleshoot/SKILL.md) | Universal diagnosis: evidence, hypotheses, ranked action plan (read-only first) |
| [`kenmark-repo-hygiene`](skills/user-skills/kenmark-repo-hygiene/SKILL.md) | Audit clutter, scattered docs, orphan assets, dumps; cleanup only after approval |
| [`kenmark-repo-secrets`](skills/user-skills/kenmark-repo-secrets/SKILL.md) | Deep read-only scan for secrets and credentials (redacted report) |
| [`kenmark-repo-public`](skills/user-skills/kenmark-repo-public/SKILL.md) | Safe-to-publish checklist before open-sourcing |
| [`kenmark-repo-kb`](skills/user-skills/kenmark-repo-kb/SKILL.md) | Update `brain/kb/` and changelog after code changes |
| [`kenmark-repo-docs`](skills/user-skills/kenmark-repo-docs/SKILL.md) | Documentation quality, README/env accuracy, broken links |
| [`kenmark-repo-structure`](skills/user-skills/kenmark-repo-structure/SKILL.md) | Folder layout, naming, module boundaries |
| [`kenmark-repo-deps`](skills/user-skills/kenmark-repo-deps/SKILL.md) | Package bloat, monorepo drift, lockfile/PM consistency, UI overlap |
| [`kenmark-repo-quality`](skills/user-skills/kenmark-repo-quality/SKILL.md) | Dev/runtime/build/typecheck/lint/format gates; diagnose without auto-editing |
| [`kenmark-security-review`](skills/user-skills/kenmark-security-review/SKILL.md) | Read-only secure-code review (auth, injection, SSRF, uploads, CORS) |
| [`kenmark-performance`](skills/user-skills/kenmark-performance/SKILL.md) | Slow pages/routes, N+1, bundle/hydration, caching, API latency |
| [`kenmark-repo-release`](skills/user-skills/kenmark-repo-release/SKILL.md) | Pre-release version, changelog, tests, meta consistency |

### Testing (`kenmark-test-*`)

| Skill | Purpose |
| --- | --- |
| [`kenmark-test-plan`](skills/user-skills/kenmark-test-plan/SKILL.md) | Test strategy: layers, tools, ROI, CI gates before writing tests |
| [`kenmark-test-unit`](skills/user-skills/kenmark-test-unit/SKILL.md) | Unit tests for functions, components, hooks, utilities |
| [`kenmark-test-integration`](skills/user-skills/kenmark-test-integration/SKILL.md) | API, DB, service, and module boundary tests |
| [`kenmark-test-e2e`](skills/user-skills/kenmark-test-e2e/SKILL.md) | Browser/user-journey tests (Playwright, Cypress, etc.) |
| [`kenmark-test-mocks`](skills/user-skills/kenmark-test-mocks/SKILL.md) | Fixtures, factories, MSW handlers, fake adapters |
| [`kenmark-test-coverage`](skills/user-skills/kenmark-test-coverage/SKILL.md) | Coverage and risk-gap audit (read-only) |
| [`kenmark-test-ci`](skills/user-skills/kenmark-test-ci/SKILL.md) | Wire tests into CI/CD and release gates |

`kenmark-repo-quality` runs/checks test commands; `kenmark-test-*` skills create/improve the test suite.

### Ship

| Skill | Purpose |
| --- | --- |
| [`kenmark-commit`](skills/user-skills/kenmark-commit/SKILL.md) | Feature-grouped conventional commits and push (no co-author trailers) |

### Issue tracking (`kenmark-issues-*`)

Requires **`kenmark-init`** or at least `brain/issues/` from **`kenmark-issues-setup`**.

| Skill | Purpose |
| --- | --- |
| [`kenmark-issues-setup`](skills/user-skills/kenmark-issues-setup/SKILL.md) | Create `brain/issues/` layout and `INDEX.md` |
| [`kenmark-issues-list`](skills/user-skills/kenmark-issues-list/SKILL.md) | Dashboard of open issues by area and priority |
| [`kenmark-issues-check`](skills/user-skills/kenmark-issues-check/SKILL.md) | Move resolved issues to `completed/`; refresh index |
| [`kenmark-issues-scan`](skills/user-skills/kenmark-issues-scan/SKILL.md) | Discover and file new issues under `brain/issues/` |
| [`kenmark-issues-maintain`](skills/user-skills/kenmark-issues-maintain/SKILL.md) | Audit tracker health (duplicates, stale index, missing files) |
| [`kenmark-issues-fix-and-ship`](skills/user-skills/kenmark-issues-fix-and-ship/SKILL.md) | End-to-end scan → fix → complete → commit → merge orchestrator |

### Skills library (admin)

Pairs with **`npx kenmark-skills`** commands below.

| Skill | Purpose |
| --- | --- |
| [`kenmark-packs`](skills/user-skills/kenmark-packs/SKILL.md) | Install curated third-party packs from the catalog |
| [`kenmark-update`](skills/user-skills/kenmark-update/SKILL.md) | Refresh Kenmark skills and optional recommended packs |
| [`kenmark-maintain`](skills/user-skills/kenmark-maintain/SKILL.md) | Inventory installed skills; recommend keep vs remove (no auto-delete) |
| [`kenmark-agents`](skills/user-skills/kenmark-agents/SKILL.md) | Same for sub-agents across IDEs (no auto-delete) |

---

## Skill activation tiers

Guidance for **humans and agents** on when to invoke bundled skills. This is **not** frontmatter schema — all skills remain installed; tiers describe **how often to reach for each skill**, not whether it exists on disk.

### Core daily skills

May be used freely during normal coding workflows:

- `kenmark-router`
- `kenmark-troubleshoot`
- `kenmark-plan`
- `kenmark-output`
- `kenmark-init`
- `kenmark-repo-quality`
- `kenmark-repo-secrets`
- `kenmark-repo-public`
- `kenmark-repo-kb`
- `kenmark-commit`
- `kenmark-maintain`
- `kenmark-security-review`
- `kenmark-performance`

### Specialist skills

Use only when the task **clearly matches** the domain:

- `kenmark-subagents`
- `kenmark-repo-docs`
- `kenmark-repo-structure`
- `kenmark-repo-deps`
- `kenmark-repo-release`
- `kenmark-repo-hygiene`
- all `kenmark-test-*` skills
- all `kenmark-issues-*` skills

### Explicit admin skills

Run only when the user **explicitly** asks to install, update, audit, or prune skills/agents:

- `kenmark-setup`
- `kenmark-packs`
- `kenmark-update`
- `kenmark-agents`

**`kenmark-router`** applies this policy when auto-assigning skills. See [`kenmark-router`](skills/user-skills/kenmark-router/SKILL.md).

---

## CLI reference

**Entry points:** `npx kenmark-skills <command>` (default) · `kenmark-skills` if installed globally (optional) · `kenmark-skills-setup` (= `setup`, legacy).

In a terminal, commands **prompt by default**. For scripts and agents, pass flags and **`-y`**.

### Commands

| Command | Description |
| --- | --- |
| `init` | First-time wizard: runs `setup` + optional `install-recommended` |
| `setup` | Install 36 Kenmark skills → `~/.kenmark/store` + IDE symlinks |
| `uninstall` | Remove Kenmark links from IDE paths (`--keep-store` optional); also removes Kenmark MCP if installed |
| `mcp` | MCP management (`mcp uninstall` removes Kenmark MCP from IDE configs + `~/.kenmark/store/mcp.json`; skills unchanged) |
| `install-recommended` | Install packs from [`recommended-catalog.json`](skills/user-skills/recommended-catalog.json) |
| `update` | Refresh Kenmark and/or recommended installs |
| `adopt` | Consolidate catalog skills on disk into the store + relink |
| `validate` | Repo/package invariants (skills, catalog JSON, `package.json`, forbidden terms); same checks as `npm test` |
| `doctor` | Diagnose local install: store, manifest, MCP (`npx`/`uvx` on PATH), IDE links, symlinks, hash drift |
| `inventory` | Report on installed skills (keep / dedupe / remove) |
| `subagents-inventory` | Same for sub-agents (alias: `agents-inventory`) |

### Examples

| Audience | Example |
| --- | --- |
| Human | `npx kenmark-skills init` |
| Agent | `npx kenmark-skills init --global --skip-recommended -y` |
| Agent | `npx kenmark-skills setup --global --ide cursor -y` |
| Agent | `npx kenmark-skills install-recommended --ids impeccable,code-review-skill --global -y` |
| Agent | `npx kenmark-skills update --both --global -y` |
| Agent | `npx kenmark-skills inventory --markdown ./report.md -y` |
| Agent | `npx kenmark-skills doctor --json ./doctor.json` |

### `init` vs `setup`

| | `init` | `setup` |
| --- | --- | --- |
| **Use when** | First install; want optional curated packs | Kenmark skills only; re-link IDEs |
| **Installs** | Kenmark + optional catalog packs | 36 Kenmark skills |
| **MCP** | Interactive wizard prompts for profile; `-y` needs `--mcp-profile` | Same (interactive or flags) |
| **Implementation** | `setup` → `install-recommended` | `setup-skills.js` |
| **Later refreshes** | Use `update`, not `init` again | `update` or `setup --force` |

```bash
npx kenmark-skills init                              # full wizard
npx kenmark-skills setup -y                          # Kenmark only
npx kenmark-skills init --skip-recommended -y        # wizard, Kenmark step only
```

### Catalog adoption (`adopt`)

**Adopt** copies adoptable catalog skills (Impeccable, ECC, etc.) **already on disk** into `~/.kenmark/store/skills` and relinks IDE paths. It does not download packs.

| Command | Adopt by default? |
| --- | --- |
| `setup` | Yes (`--skip-adopt` to disable); MCP opt-in (`--with-mcp` or `--mcp-profile`) |
| `init` | Yes (after `setup`; again after packs if selected) |
| `install-recommended` | Yes (`--skip-adopt` to disable) |
| `update` | Yes (`--skip-adopt` to disable) |
| `adopt` | Standalone consolidation |

On a fresh machine, adopt may no-op until catalog skills exist.

When store content already exists but differs from an IDE copy, adopt reports **review-required** and does not overwrite until you run `adopt --adopt-overwrite` (or `--force`). Full source priority (bundled → store → IDE) is not applied yet beyond this guard.

### Common flags

| Flag | Applies to | Purpose |
| --- | --- | --- |
| `--global` / `--project` | install commands | User-wide vs current repo |
| `--ide <target>` | setup, uninstall, adopt | `cursor`, `claude`, `codex`, `all`, … |
| `-y` | most commands | Skip interactive prompts |
| `--skip-adopt` | setup, install-recommended, update | Skip post-install adopt pass |
| `--with-mcp` | setup | Install all bundled MCP servers (profile `all`) |
| `--mcp-profile <name>` | setup | MCP profile: `none`, `web`, `research`, `deep`, `all` (default: none) |
| `--skip-mcp` | setup | Skip MCP even when `--with-mcp` / `--mcp-profile` is set |
| `--strict-targets` | setup | Fail if no IDE skill dir is detected and `--ide` is omitted |
| `--copy` | setup, install-recommended | Copy into IDE paths instead of symlinks |
| `--symlink` | setup, install-recommended | Force symlinks on Windows (junction) instead of copy |
| `--prefer-copy-on-windows` | setup, install-recommended | Copy on Windows (default: on) |
| `--no-prefer-copy-on-windows` | setup, install-recommended | Symlink/junction on Windows instead of copy |
| `--force` | setup, adopt, install-recommended | Overwrite store entries / adopt from IDE when hashes differ |
| `--adopt-overwrite` | adopt, install-recommended | Alias for `--force` on adopt |
| `--keep-store` | uninstall | Remove IDE links; keep `~/.kenmark` |
| `--mcp-only` | uninstall | Remove Kenmark MCP only; leave skill links and store skills intact |
| `--soft` | doctor | Warnings only; exit 0 (e.g. before first `setup`) |
| `--json <path>` | doctor, inventory | Write full JSON report |
| `--no-fail` | doctor | Exit 0 with issues still listed (`ok: false` in `--json`; use `--soft` to downgrade to warnings) |

---

## Installation

### Default: `npx` (no global install)

```bash
npx kenmark-skills init
npx kenmark-skills setup --global -y
```

`npx` fetches the package from npm when needed. Pin a version with `npx kenmark-skills@1.5.0 init` for reproducibility, or use `npx kenmark-skills@latest init` for the newest release.

### Optional: global CLI shorthand

```bash
npm install -g kenmark-skills
kenmark-skills init    # same as npx kenmark-skills init
```

Use this only if you run the CLI often and prefer omitting `npx`.

### Project-scoped skills (`--project`)

Install into the current repo’s IDE folders instead of your home directory:

```bash
npx kenmark-skills setup --project -y
```

### Per-IDE targeting

```bash
npx kenmark-skills setup --global --ide cursor
npx kenmark-skills setup --global --ide claude
npx kenmark-skills setup --global --ide codex
npx kenmark-skills setup --global --ide cursor,claude,codex
```

Restart Claude Code if `/kenmark-*` slash commands do not appear immediately.

### All IDEs (advanced)

Use `--ide all` only when you want every harness path this package knows about (beyond cursor/claude/codex). It can create links in IDE folders you do not use.

```bash
npx kenmark-skills setup --global --ide all -y
```

---

## Kenmark hub

Kenmark and adoptable catalog skills are stored once, then linked into each IDE.

| Path | Role |
| --- | --- |
| `~/.kenmark/store/skills/<name>/` | Canonical skill content |
| `~/.kenmark/store/mcp.json` | Canonical MCP server definitions |
| `~/.kenmark/manifest.json` | Install metadata |

`setup` populates the store, symlinks into IDE skill dirs (copies on Windows when symlinks fail), then runs **adopt** unless `--skip-adopt` is set. **MCP is opt-in:** pass `--with-mcp` or `--mcp-profile <name>` to install bundled servers; plain `setup` does not touch MCP configs.

### Skill path portability

When skills are copied into `~/.kenmark/store` (via `setup`, `update`, or `adopt`), Kenmark rewrites hardcoded IDE anchor paths like `.cursor/skills/<name>/` to `./` in `SKILL.md` and `scripts/*.{js,mjs}`. That keeps bundled scripts and docs working regardless of which IDE path the skill is linked from.

`doctor` scans the same files in linked IDE copies and reports non-portable paths. Repair with:

```bash
npx kenmark-skills adopt --global --ide all -y
```

### Bundled MCP servers (opt-in)

Source: [`config/mcp-servers.json`](config/mcp-servers.json). Profiles: [`config/mcp-profiles.json`](config/mcp-profiles.json). When you opt in, Kenmark copies the selected profile into `~/.kenmark/store/mcp.json` and **merges** those servers into existing configs (existing entries with the same name are left unchanged unless you pass `--force`).

```bash
npx kenmark-skills setup --mcp-profile web --global --ide cursor -y
npx kenmark-skills setup --mcp-profile research --global -y
npx kenmark-skills setup --with-mcp --global -y   # profile: all (default IDEs: cursor, claude, codex)
# Advanced — every detected harness path (may create clutter):
# npx kenmark-skills setup --mcp-profile research --global --ide all -y
# npx kenmark-skills setup --with-mcp --global --ide all -y
```

| Profile | Servers |
| --- | --- |
| `none` | (default) — no MCP install |
| `web` | `playwright`, `browsermcp` |
| `research` | `context7`, `fetch` |
| `deep` | `sequential-thinking`, `context7`, `fetch` |
| `all` | every bundled server |

| Server | Transport |
| --- | --- |
| `playwright` | `npx -y @playwright/mcp@latest` |
| `context7` | `npx -y @upstash/context7-mcp` |
| `sequential-thinking` | `npx -y @modelcontextprotocol/server-sequential-thinking` |
| `fetch` | `uvx mcp-server-fetch` (requires [uv](https://docs.astral.sh/uv/); or install `mcp-server-fetch` via pip and edit the entry) |
| `browsermcp` | `npx -y @browsermcp/mcp@latest` |

| Scope | Cursor | Claude Code |
| --- | --- | --- |
| Global (`--global`) | `~/.cursor/mcp.json` | `~/.claude.json` → `mcpServers` |
| Project (`--project`) | `.cursor/mcp.json` | `.mcp.json` at repo root |

Restart Cursor or Claude Code after setup if MCP tools do not show up. Other IDEs in `--ide all` are unchanged (no standard MCP path in this package yet).

**Remove MCP only** (keeps Kenmark skills installed):

```bash
npx kenmark-skills mcp uninstall --global --ide cursor -y
npx kenmark-skills uninstall --mcp-only --global -y
# npx kenmark-skills uninstall --mcp-only --global --ide all -y   # advanced: all IDE paths
```

Full `uninstall` still removes Kenmark MCP entries when they were installed via `setup --with-mcp` / `--mcp-profile`.

### IDE skill directories

| IDE / runtime | Global skills path |
| --- | --- |
| Cursor | `~/.cursor/skills` |
| Codex / shared agents | `~/.agents/skills` |
| Claude Code | `~/.claude/skills` |
| Gemini CLI | `~/.gemini/skills` |
| OpenCode | `~/.opencode/skills` |
| Kiro | `~/.kiro/skills` |
| Trae / Trae CN | `~/.trae/skills`, `~/.trae-cn/skills` |
| Rovo Dev | `~/.rovodev/skills` |
| Qoder | `~/.qoder/skills` |
| MiniMax Code | `~/.minimax/skills` |

**Claude Code** uses the same `kenmark-*` skill folders under `~/.claude/skills/`. Setup does not create duplicate slash-command wrappers in `~/.claude/commands/` (install/uninstall remove any stale `kenmark-*.md` files from older versions).

---

## Operations

### Recommended packs

Catalog: [`skills/user-skills/recommended-catalog.json`](skills/user-skills/recommended-catalog.json) (v5 **selectable optional installs** with repo-aware suggestions). Default selection is **Impeccable** + **Awesome Code Review** only; heavy packs (Graphify, SEO full, ECC) are opt-in. **Presets** (`lean`, `core-next`, `growth-seo`, …) remain for agents/CI via `--profile` but are not the primary UX.

```bash
npx kenmark-skills install-recommended --suggest          # recommendations only
npx kenmark-skills install-recommended --list             # all optional installs + metadata
npx kenmark-skills install-recommended                    # interactive checklist
npx kenmark-skills install-recommended --ids impeccable,code-review-skill --global -y
npx kenmark-skills install-recommended --profile core-next --global -y   # preset (advanced)
```

In chat: **`kenmark-packs`** (guided), **`kenmark-maintain`** (cleanup, no auto-delete).

### Update

```bash
npx kenmark-skills update
npx kenmark-skills update --both --global -y
npx kenmark-skills update --kenmark-only --global -y
npx kenmark-skills update --recommended-only --global --ids impeccable -y
npx kenmark-skills update --npm-only -y
npx kenmark-skills update --skip-adopt
```

### Inventory

**Skills** — scan IDE paths; keep / dedupe / remove report:

```bash
npx kenmark-skills inventory
npx kenmark-skills inventory --markdown ./skills-report.md --json ./skills.json
npx kenmark-skills inventory --include-plugins
```

**Sub-agents** — same layout; reads `agents/` YAML frontmatter:

```bash
npx kenmark-skills subagents-inventory
npx kenmark-skills subagents-inventory --markdown ./agents-report.md --include-marketplaces
```

Pair CLI output with **`kenmark-maintain`** and **`kenmark-agents`** in chat for guided cleanup.

### On-demand adopt

```bash
npx kenmark-skills adopt --global -y
npx kenmark-skills adopt --global --adopt-overwrite -y   # when setup reported review-required
```

### Validate vs doctor

| Command | Scope | CI / fresh clone |
| --- | --- | --- |
| `validate` | Repo/package invariants (skills, catalog JSON, `package.json`, forbidden terms) | Yes — `npm test` |
| `doctor` | Local install (`~/.kenmark`, manifest, MCP, IDE links, symlinks, hash drift, non-portable skill paths) | No — run after `setup` |
| `doctor --soft` | Same as `doctor`, but warnings only (exit 0) | Optional pre-setup check |
| `doctor --no-fail` | Full issue list; exit 0 (e.g. write `--json` for agents) | Diagnostics / scripting |

**Validation entry points** (equivalent checks; both scripts ship in the npm package):

| How you run it | Script chain |
| --- | --- |
| `npm run validate` or `npm test` | `scripts/validate-repo.js` |
| `npx kenmark-skills validate` | `scripts/validate.js` → `scripts/validate-repo.js` |

`validate.js` is a thin wrapper so the CLI command stays next to other `cli.js` dispatches; npm scripts call `validate-repo.js` directly to avoid an extra hop in CI.

```bash
npx kenmark-skills validate
npm test   # same checks as validate (direct validate-repo.js)
npm run validate

npx kenmark-skills doctor
npx kenmark-skills doctor --soft
npx kenmark-skills doctor --json ./kenmark-doctor.json
npx kenmark-skills doctor --json ./kenmark-doctor.json --no-fail
```

---

## Uninstall

If you installed the CLI globally, `npm uninstall -g kenmark-skills` removes only that binary — not skills already linked into IDE folders. Using `npx` alone does not require any npm uninstall.

```bash
# Global
npx kenmark-skills uninstall --global
npx kenmark-skills uninstall --global --ide claude

# Project-local
npx kenmark-skills uninstall --project -y
# npx kenmark-skills uninstall --project --ide all   # advanced: all IDE paths in this repo

# MCP only (Cursor / Claude configs + ~/.kenmark/store/mcp.json)
npx kenmark-skills mcp uninstall --global --ide cursor -y
```

**Troubleshooting `Unknown command: uninstall`**

```bash
npx kenmark-skills@latest uninstall --global --ide claude
npm cache clean --force   # if npx still serves an old version
```

**Manual fallback (Claude global)**

```bash
rm -rf ~/.claude/skills/{kenmark-init,kenmark-commit,kenmark-router,kenmark-troubleshoot,kenmark-setup,kenmark-packs,kenmark-update,kenmark-maintain,kenmark-issues-setup,kenmark-issues-list,kenmark-issues-check,kenmark-issues-scan,kenmark-issues-maintain}
rm -f ~/.claude/commands/kenmark-*.md
```

---

## Using skills in chat

1. Confirm the skill folder is on the agent’s skill search path (after `setup` / `init`).
2. Name the skill or its trigger phrase — e.g. “Run **kenmark-init**”, “Use **kenmark-commit**”, “**kenmark-issues-list**”.
3. The agent must **read and follow** the full `SKILL.md`, not improvise from the description.

When the problem is unclear, start with **`kenmark-troubleshoot`** (evidence, hypotheses, ranked plan) — not **`kenmark-router`**. Use the router when the task domain is clear but the right specialist skill is not.

For **when to invoke** each bundled skill by default, see [Skill activation tiers](#skill-activation-tiers).

**Troubleshoot examples:** “kenmark-troubleshoot my Cursor slowdown”, “diagnose this production issue”, “find root cause of this deployment failure”, “build a test plan before fixing”.

**`kenmark-router` cache:** the router writes `~/.kenmark/cache/skills-registry.json` at runtime (user-wide, outside the repo).

---

## Repository layout

```text
kenmark-skills/
├── README.md
├── CHANGELOG.md
├── package.json
├── scripts/
│   ├── cli.js              # kenmark-skills binary
│   ├── validate.js         # CLI validate → validate-repo.js
│   ├── validate-repo.js    # npm test / npm run validate; shared implementation
│   └── setup-skills.js     # kenmark-skills-setup
└── skills/
    ├── README.md           # logical categories vs flat on-disk layout
    └── user-skills/        # 36 universal skills + recommended-catalog.json
```

**Not committed here:** `.claude/`, `.cursor/`, `.agents/` (local IDE installs), `brain/` (optional dev workspace). Edit `skills/user-skills/<name>/SKILL.md` for bundled skills.

### Testing (maintainers)

| When | Command | What runs |
| --- | --- | --- |
| **Development** (fast) | `npm test` | `validate` + `test:cli` (repo invariants + CLI smoke) |
| **Before publish** | `npm run test:all && npm run pack:check` | Full gate: above + `test:install` + `test:pack` + `npm pack --dry-run` |

`npm publish` also runs **`prepublishOnly`** (`test:all` then `pack:check`) so the release gate is enforced automatically.

Equivalent: `npm run validate` is the same repo checks as the first step of `npm test`; `npx kenmark-skills validate` goes through `validate.js`.

**Maintainers:** `npm run validate` · `npm test` · `npm run test:all` · `npm run pack:check` · `npx kenmark-skills validate` · `npm run doctor:local` (after setup) · `npm run publish:public`

---

## Contributing

1. Change skills under `skills/user-skills/<skill-name>/SKILL.md`.
2. Use the shared frontmatter schema on every skill: `name`, `version`, `category`, `scope`, `phase`, `description`, `triggers`, `allowed-tools`, `risk`, `disable-model-invocation` (plus `project` when `scope: project-specific`). Categories: `onboarding`, `workflow`, `git`, `issues`, `admin`, `testing`. Bundled skills use `scope: universal`. See [`skills/README.md`](skills/README.md) for the logical folder map — on-disk skill dirs stay flat under `skills/user-skills/`.
3. Add a dated entry to [`CHANGELOG.md`](CHANGELOG.md).
4. Open a PR describing skill changes and new trigger phrases.

---

## License

MIT — Kenmark ITan Solutions ([`package.json`](package.json)).

**Links:** [Repository](https://github.com/tanoojmehra/kenmark-skills) · [Issues](https://github.com/tanoojmehra/kenmark-skills/issues)

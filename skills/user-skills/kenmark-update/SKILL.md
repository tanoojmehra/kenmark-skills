---
name: kenmark-update
version: 1.0.0
category: admin
scope: universal
phase: maintain
description: Updates installed Kenmark skills and optionally refreshes curated recommended packs (Impeccable, ECC, and more). Use when the user says update skills, refresh skills, sync skills, upgrade kenmark-skills, or after pulling a new kenmark-skills release.
triggers:
  - update skills
  - refresh skills
  - sync skills
  - upgrade kenmark-skills
  - refresh kenmark skills
allowed-tools:
  - Bash
risk: shell
disable-model-invocation: true
---

# Kenmark Update

Refresh **Kenmark first-party skills** and optionally **reinstall recommended third-party packs** via npx. No git clone.

Pair with **kenmark-maintain** if the machine has duplicate or stale skill trees before updating.

## When to use

- "Update my skills", "refresh kenmark skills", "sync skills"
- After `npm update -g kenmark-skills` or a new package release
- After editing skills in a local kenmark-skills checkout (re-copy to IDE paths)

## What gets updated

| Target | Action |
| --- | --- |
| **Kenmark skills** | Refresh `~/.kenmark/store/skills` from the package, then relink IDE paths (same as `setup`) |
| **Recommended packs** | Re-run install commands from `recommended-catalog.json` (Impeccable, ECC, Graphify, code review, SEO/GEO — install methods vary) |
| **Adopt** (default) | Copy adoptable catalog skills into the store and relink IDEs (`kenmark-skills adopt`). Includes Kenmark bundled skills and adoptable catalog packs (Impeccable, ECC, and more) when present on disk. |
| **npm package** (optional) | `npm update -g kenmark-skills` when installed globally |

Updating Kenmark skills does **not** remove third-party skills. Re-running recommended installs may overwrite pack files in the chosen scope. Use **`--skip-adopt`** to skip the adopt pass.

## Humans vs agents

| Audience | How to run |
| --- | --- |
| **Human** | `npx kenmark-skills update` — prompts for what to refresh, scope, npm update |
| **Agent** | `npx kenmark-skills update --kenmark-only --ide auto -y` (add `--both`, `--ids` only when needed) |

## Step 1 — Interactive CLI (preferred)

From any directory:

```bash
npx kenmark-skills update
```

Prompts (in order):

1. **What to update** — Kenmark only (default), recommended only, or both
2. **Scope** — global only (`~/.kenmark/store` + IDE home folders)
3. **npm update** — optional `npm update -g kenmark-skills` if the package is installed globally
4. **IDE** — Kenmark target (`cursor`, `claude`, `all`, or empty for auto-detect)
5. **Recommended packs** — ids, `defaults`, or `all` (when refreshing recommended)
6. **Confirm** — then runs the steps (including adopt unless `--skip-adopt`)

## Step 2 — Non-interactive examples

```bash
# Full refresh (Kenmark + default recommended packs), global
npx kenmark-skills update --both -y

# Kenmark skills only, global
npx kenmark-skills update --kenmark-only -y

# Reinstall recommended packs only
npx kenmark-skills update --recommended-only --ids impeccable,ecc -y

# Upgrade global npm package only
npx kenmark-skills update --npm-only -y

# Preview steps
npx kenmark-skills update --dry-run -y

# Refresh without consolidating into ~/.kenmark/store
npx kenmark-skills update --both --skip-adopt -y

# Adopt only (store + relink)
npx kenmark-skills adopt -y
```

From a **local checkout** of this repo:

```bash
node scripts/kenmark-update.js
```

## Step 3 — Manual equivalents

If the CLI is unavailable, run the underlying commands:

```bash
npm update -g kenmark-skills
npx kenmark-skills setup -y
npx kenmark-skills install-recommended --all -y
```

## Step 4 — Verify

1. Confirm Kenmark skill folders exist (e.g. `~/.cursor/skills/kenmark-update`, `kenmark-router`, `kenmark-init`)
2. For Claude Code, confirm `~/.claude/skills/kenmark-*` folders exist; setup removes stale `~/.claude/commands/kenmark-*.md` wrappers (no longer generated)
3. Optional: `npx kenmark-skills inventory --markdown temp/skills-after-update.md`

## Related skills

| Skill | Use when |
| --- | --- |
| **kenmark-maintain** | Audit duplicates before/after a large update |
| **kenmark-packs** | First-time install of curated packs (not just refresh) |
| **kenmark-router** | Pick the right skill after the registry is current |

## Scripts

- `scripts/kenmark-update.js` — orchestrates npm + setup + install-recommended + adopt
- `scripts/kenmark-hub.js` — store, manifest, symlink, adopt
- `scripts/setup-skills.js` — store + link (invoked by update)
- `scripts/skills-adopt.js` — adopt catalog skills (invoked by update)
- `scripts/kenmark-packs.js` — curated packs (invoked by update)

---
name: kenmark-maintain
version: 1.0.0
category: admin
scope: universal
phase: maintain
description: Inventories, groups, and recommends keep vs remove for installed agent skills across Cursor, Claude, Codex, and ~/.agents/skills. Use when cleaning up 100+ skills, finding duplicates, pruning gstack mirrors, or asking which skills to delete.
triggers:
  - clean up my skills
  - audit installed skills
  - prune skills
  - skills inventory
  - find duplicate skills
  - skills maintain
allowed-tools:
  - Bash
risk: shell
disable-model-invocation: true
---

# Kenmark Maintain

Audit **all installed skills** on this machine: list them, group by name and category, flag duplicates and vendored mirrors (e.g. gstack copies under `.cursor/`, `.factory/`, plugins cache), and recommend **keep**, **dedupe**, **review**, or **remove-candidate**.

Pair with **kenmark-setup** for first-time setup (humans: interactive wizard; agents: `init -y`), **kenmark-packs** when adding curated packs after cleanup, and **kenmark-update** when refreshing Kenmark or recommended installs.

**CLI priority:** interactive prompts in a TTY for humans; flags + `-y` for agents (`KENMARK_SKILLS_NONINTERACTIVE=1` also forces non-interactive).

## When to use

- "Clean up my skills", "too many skills", "audit installed skills"
- "What can I delete?", "find duplicate skills", "prune gstack skills"
- Before/after installing large packs (ECC, gstack, impeccable)

## Step 1 — Run inventory (required)

From the **kenmark-skills** repo root (or any cwd; output goes to `temp/` by default):

```bash
node "$(npm root -g)/kenmark-skills/scripts/skills-inventory.js" \
  --markdown temp/skills-inventory-report.md \
  --json temp/skills-inventory.json
```

If the package is a local checkout:

```bash
node scripts/skills-inventory.js \
  --markdown temp/skills-inventory-report.md \
  --json temp/skills-inventory.json
```

**Humans:** run `node scripts/skills-inventory.js` with no output flags — the script prompts for markdown/JSON paths.

**Agents:** pass `--markdown` / `--json` and `-y` to skip prompts.

Optional flags:

| Flag | Purpose |
| --- | --- |
| `--include-plugins` | Also scan `~/.claude/plugins/cache` (large; many plugin-bundled skills) |
| `--roots agents,cursor,claude` | Limit which IDE roots to scan |
| `-y` | Non-interactive; skip path prompts |

Read the generated markdown report and summarize for the user.

## Step 2 — Present findings

Show a short executive summary:

1. Total `SKILL.md` files vs unique skill **names**
2. Count by verdict: remove-candidate, adopt-candidate, dedupe, review, keep
3. Top 10 worst offenders (highest copy count)

Use this table format:

| Verdict | Meaning | User action |
| --- | --- | --- |
| **keep** | Unique or curated — retain | None |
| **dedupe** | Same content on disk, multiple paths | Prefer `~/.kenmark/store` when present; else `~/.agents/skills/` |
| **adopt-candidate** | Catalog skill in IDE but missing or out of sync with store | Run `npx kenmark-skills adopt` |
| **remove-candidate** | Vendored mirrors only (e.g. gstack nested copies) | Safe to delete mirror paths if global copy exists |
| **review** | Multiple distinct copies or unclear | Diff or spot-check before delete |

Always treat these as **keep** (one canonical copy):

- `impeccable`, `kenmark-router`, `find-skills`, `kenmark-init`, `kenmark-commit`, `kenmark-troubleshoot`, Kenmark `repo-*` skills (`kenmark-repo-hygiene`, `kenmark-repo-secrets`, `kenmark-repo-public`, `kenmark-repo-kb`, `kenmark-repo-docs`, `kenmark-repo-structure`, `kenmark-repo-deps`, `kenmark-repo-quality`, `kenmark-repo-release`), `kenmark-security-review`, `kenmark-performance`, Kenmark `issues-*` / `skills-*` skills (including `kenmark-setup`)

## Step 3 — Group by category

From `skills-inventory.json`, aggregate unique names by `category`:

- `design`, `seo`, `testing`, `backend`, `workflow`, `general`

Help the user pick **caps** (e.g. "keep at most 3 SEO audit skills") if they want aggressive cleanup.

## Step 3b — Adopt into Kenmark store (optional)

When the report shows **adopt-candidate** for Kenmark bundled or catalog skills (e.g. `impeccable`):

```bash
npx kenmark-skills adopt --global -y
```

This copies adoptable skills into `~/.kenmark/store/skills` and relinks IDE paths. It does **not** auto-merge arbitrary duplicate trees (e.g. multiple distinct `issues-*` copies).

## Step 4 — Safe deletion rules

**Never delete without explicit user approval.**

When the user approves removals:

1. Prefer deleting **vendored mirror** paths under `gstack/`, `.factory/`, `.cursor/skills/gstack`, etc.
2. For dedupe: keep **`~/.kenmark/store/skills/<name>`** when present; else `~/.agents/skills/<name>`; else `~/.cursor/skills/<name>`
3. Do **not** delete `~/.claude/plugins/cache` unless the user explicitly opts in — plugins may re-fetch
4. Use `rm -rf` only on full skill **directories** that contain `SKILL.md`, never parent `skills/` folders

Example (after approval):

```bash
# Example only — replace with paths from the report
rm -rf ~/.claude/skills/gstack/.cursor/skills/gstack-browse
```

## Step 5 — After cleanup

1. Re-run inventory to confirm counts dropped
2. Suggest **kenmark-packs** if they want a minimal curated set
3. Remind: `npx kenmark-skills update` refreshes Kenmark skills and optional recommended packs; `npx kenmark-skills setup --global -y` syncs Kenmark only (`--ide all` only when every detected harness path is needed)

## Maintenance

- Inventory script: `scripts/skills-inventory.js` (scans `~/.kenmark/store/skills` as `kenmark-store`)
- Adopt: `scripts/skills-adopt.js` / `npx kenmark-skills adopt`
- Extend `KEEP_ALWAYS` in that script when adding Kenmark-first-party skills
- Extend `VENDORED_PREFIXES` for new multi-copy harness layouts

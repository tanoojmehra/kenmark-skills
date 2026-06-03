---
name: kenmark-agents
version: 1.0.0
category: admin
scope: universal
phase: maintain
description: Inventories, groups, and recommends keep vs remove for installed sub-agents across Claude, Cursor, Codex, Gemini, OpenCode, and MiniMax. Use when cleaning up duplicate agents, finding vendored mirrors, pruning gstack copies, or asking which agents to delete.
triggers:
  - clean up my agents
  - audit installed agents
  - prune subagents
  - subagents inventory
  - find duplicate agents
  - subagents maintain
allowed-tools:
  - Bash
risk: shell
disable-model-invocation: true
---

# Kenmark Agents

Audit **all installed sub-agents** on this machine: list them, group by name, flag duplicates and vendored mirrors (gstack copies, plugin marketplace copies), and recommend **keep**, **dedupe**, **review**, or **remove-candidate**.

Pairs with **kenmark-maintain** for the parallel skills cleanup and **kenmark-update** when refreshing Kenmark installs.

**CLI priority:** interactive prompts in a TTY for humans; flags + `-y` for agents (`KENMARK_SKILLS_NONINTERACTIVE=1` also forces non-interactive).

## When to use

- "Clean up my agents", "too many sub-agents", "audit installed agents"
- "What agents can I delete?", "find duplicate agents", "prune gstack agents"
- Before/after installing large packs (ECC, gstack) that bundle their own agents

## Step 1 — Run inventory (required)

From the **kenmark-skills** repo root (or any cwd; output goes to `temp/` by default):

```bash
node "$(npm root -g)/kenmark-skills/scripts/subagents-inventory.js" \
  --markdown temp/subagents-inventory-report.md \
  --json temp/subagents-inventory.json
```

If the package is a local checkout:

```bash
node scripts/subagents-inventory.js \
  --markdown temp/subagents-inventory-report.md \
  --json temp/subagents-inventory.json
```

**Humans:** run `node scripts/subagents-inventory.js` with no output flags — the script prompts for markdown/JSON paths.

**Agents:** pass `--markdown` / `--json` and `-y` to skip prompts.

Optional flags:

| Flag | Purpose |
| --- | --- |
| `--include-plugins` | Also scan `~/.claude/plugins/cache` for vendored copies |
| `--include-marketplaces` | Also scan `~/.claude/plugins/marketplaces` (large; many plugin-bundled agents) |
| `--roots claude,cursor,minimax` | Limit which IDE roots to scan |
| `-y` | Non-interactive; skip path prompts |

**Pair with `kenmark-maintain`** to do the same audit for skills — both inventories use the same output layout.

## Step 2 — Read the report

A short executive summary:

1. Total agent files vs unique agent **names**
2. Count by verdict: remove-candidate, adopt-candidate, dedupe, review, keep
3. Top 10 worst offenders (highest copy count)
4. Vendored mirrors (gstack, plugin cache, marketplaces) flagged per-instance

Verdict meanings:

| Verdict | Meaning | User action |
| --- | --- | --- |
| **keep** | Unique or curated — retain | None |
| **dedupe** | Same content on disk (same inode), multiple paths | Pick one canonical and remove redundant symlinks/copies |
| **adopt-candidate** | Canonical copy in `~/.kenmark/store/agents/` exists but IDE paths differ | Adopt into store and relink (run `kenmark-skills adopt` once the agents hub exists) |
| **remove-candidate** | Vendored mirrors only (gstack, plugin cache, marketplaces) | Safe to delete mirror paths if you have a global install of the same agent |
| **review** | Multiple distinct copies — content differs | Diff or spot-check before deleting |

Always treat these as **keep** (one canonical copy):

- `architect`, `build-error-resolver`, `capacitor-expert`, `chief-of-staff`, `code-reviewer`, `database-reviewer`, `doc-updater`, `e2e-runner`, `expert-documenter-reviewer`, `go-build-resolver`, `go-reviewer`, `harness-optimizer`, `kotlin-build-resolver`, `kotlin-reviewer`, `loop-operator`, `nextjs-fullstack-expert`, `nodejs-expert`, `planner`, `python-reviewer`, `refactor-cleaner`, `research-problem-solver`, `security-reviewer`, `senior-dev-kenmark-troubleshooter`, `tdd-guide`

Extend `KEEP_ALWAYS` in `scripts/subagents-inventory.js` when adding new first-party agents.

## Step 3 — Group by category

From `subagents-inventory.json`, aggregate unique names by `category`:

- `design`, `seo`, `testing`, `backend`, `workflow`, `general`, `planning`, `research`, `security`, `ops`, `docs`

Help the user pick **caps** (e.g. "keep at most 3 review agents") if they want aggressive cleanup.

## Step 4 — Safe deletion rules

**Never delete without explicit user approval.**

When the user approves removals:

1. Prefer deleting **vendored mirror** paths under `plugins/cache/`, `plugins/marketplaces/`, `gstack/`.
2. For dedupe: keep the first non-vendored instance; remove redundant IDE copies.
3. Do **not** delete files inside `~/.claude/plugins/cache/<plugin>/<version>/` — plugins may re-fetch on update.
4. Use `rm` only on individual `.md` files, never on parent `agents/` folders.
5. Hidden overlay files (e.g. `~/.minimax/agents/<subdir>/agent.md`) belong to the harness; removing them disables the corresponding built-in agent.

Example (after approval):

```bash
# Example only — replace with paths from the report
rm -f "$HOME/.claude/plugins/marketplaces/everything-claude-code/agents/coder.md"
```

## Step 5 — Nested overlay agents (Mavis / MiniMax)

The MiniMax / Mavis layout places one `agent.md` overlay per built-in agent inside a named subdir:

```text
~/.minimax/agents/coder/agent.md
~/.minimax/agents/mavis/agent.md
```

The walker detects these by **parent directory name** when the file lacks a YAML `name:` field. Treat each subdir as one logical agent. Removing the file disables that overlay; do not delete the subdir unless you want to drop the entire built-in.

## Step 6 — After cleanup

1. Re-run inventory to confirm counts dropped
2. Suggest **kenmark-maintain** if the skills tree is also bloated
3. Remind: `npx kenmark-skills update` refreshes Kenmark skills; restart your IDE so agent registry changes take effect

## Maintenance

- Inventory script: `scripts/subagents-inventory.js` (scans `~/.kenmark/store/agents` as `kenmark-store` once the agents hub exists)
- Extend `KEEP_ALWAYS` in that script when adding Kenmark first-party agents
- Extend `AGENT_VENDORED_PREFIXES` in `scripts/kenmark-hub.js` for new multi-copy harness layouts

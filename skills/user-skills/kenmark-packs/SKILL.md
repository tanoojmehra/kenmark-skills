---
name: kenmark-packs
version: 2.0.0
category: admin
scope: universal
phase: setup
description: Installs optional third-party skill packs from the Kenmark catalog with repo-aware suggestions. Use when installing recommended skills, impeccable, ECC, graphify, headroom, SEO/GEO, or curating a minimal skill set.
triggers:
  - install recommended skills
  - install impeccable
  - install ECC
  - install graphify
  - install headroom
  - curated skill packs
  - kenmark-packs
  - optional installs
  - suggest packs
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - AskUserQuestion
risk: shell
disable-model-invocation: true
---

# Kenmark Packs

Install **optional third-party skill packs** from a versioned catalog via **npx** (no git clone). Primary UX: **user selects** which packs to install; Kenmark suggests based on repo signals. **Presets** (`lean`, `core-next`, …) are advanced/CI shortcuts via `--profile`.

## Catalog

Read from:

`skills/user-skills/recommended-catalog.json`

**Mode:** `selectable` (v5+)

**Default selection:** `impeccable` + `simplify` only — heavy packs are opt-in.

| Pack | Role |
| --- | --- |
| `impeccable` | UI/design polish (default-on) |
| `simplify` | Post-generation code simplification (default-on) |
| `graphify` | Large-repo navigation |
| `seo-geo-selected` | Six SEO/GEO skills (not full suite) |
| `seo-geo-full` | Full 20-skill SEO/GEO (explicit opt-in) |
| `ecc` | Everything Claude Code — manual install |
| `headroom` | Context compression CLI (proxy, MCP, agent wrap) |

**Presets (advanced):** `lean`, `core-next`, `core-next-agentic`, `growth-seo`, `audit-review`, `experimental-heavy`, …

**Headroom:** optional catalog pack (`install-recommended --ids headroom`). Interactive `init` can also offer `headroom wrap` setup after Kenmark skills install (not default-on). **Usage with built-in models:** [references/headroom-usage.md](references/headroom-usage.md).

```bash
npx kenmark-skills install-recommended --suggest
npx kenmark-skills install-recommended --list
npx kenmark-skills install-recommended --list-presets
```

## When to use

- "Install recommended skills", optional third-party packs, impeccable, ECC, graphify
- After **kenmark-maintain** cleanup when rebuilding a lean set
- For refresh only, use **kenmark-update**

## Install rules (catalog)

Do **not** install multiple overlapping packs for the same purpose unless the user asks:

- Design/UI: max 1 primary pack
- Code review: max 1 primary pack
- SEO/GEO: selected skills by default; full pack only on request
- Agent harness: ECC **minimal** by default
- Navigation: Graphify for medium/large repos
- Context compression: Headroom for tool-heavy agent workflows (optional)

## Humans vs agents

| Audience | How to run |
| --- | --- |
| **Human** | `npx kenmark-skills install-recommended` — checklist + repo suggestions, scope, confirm |
| **Agent** | `npx kenmark-skills install-recommended --ids impeccable,simplify -y` or `--profile core-next` |

## Step 1 — Suggest or list

```bash
npx kenmark-skills install-recommended --suggest
npx kenmark-skills install-recommended --list
npx kenmark-skills install-recommended --explain graphify
```

Interactive flow shows weight, bloat, and stack-specific suggestions before confirming.

## Step 2 — Install selected packs (preferred)

```bash
npx kenmark-skills install-recommended --ids impeccable,simplify -y
npx kenmark-skills install-recommended --ids impeccable,simplify,graphify -y
```

## Step 3 — Presets (advanced / CI)

```bash
npx kenmark-skills install-recommended --profile core-next -y
npx kenmark-skills install-recommended --profile growth-seo -y
npx kenmark-skills install-recommended --profile lean -y
```

## Step 4 — Verify

Use catalog `verify` hints or:

```bash
test -f ~/.agents/skills/impeccable/SKILL.md && echo "impeccable OK"
```

Run **kenmark-maintain** inventory to catch duplicate explosion.

## Step 5 — Kenmark first-party skills

Kenmark skills are the **curator OS** (router, maintain, install-recommended, update, kenmark-init, kenmark-commit, issues-*):

```bash
npx kenmark-skills setup -y
```

## CLI reference

```bash
npx kenmark-skills install-recommended --suggest
npx kenmark-skills install-recommended --list
npx kenmark-skills install-recommended --ids impeccable -y
npx kenmark-skills install-recommended --profile core-next -y
npx kenmark-skills install-recommended   # interactive checklist
```

Adopt relink flags (same as `setup` / `adopt`): `--copy`, `--symlink`, `--prefer-copy-on-windows`, `--no-prefer-copy-on-windows`, `--adopt-overwrite` (or `--force`) when store and IDE copies differ.

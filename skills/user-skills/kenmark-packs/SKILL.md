---
name: kenmark-packs
version: 2.0.0
category: admin
scope: universal
phase: setup
description: Installs Kenmark's curated recommended skill packs by setup profile (lean, core-next, growth-seo, …) or custom pack selection. Use when installing recommended skills, impeccable, ECC, graphify, or curating a minimal skill set.
triggers:
  - install recommended skills
  - install impeccable
  - install ECC
  - install graphify
  - curated skill packs
  - kenmark-packs
  - setup profile lean
  - core-next profile
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - AskUserQuestion
risk: shell
disable-model-invocation: true
---

# Skills Install Recommended

Install **curated skill packs** from a versioned catalog via **npx** (no git clone). Prefer **setup profiles** over picking individual packs — profiles encode intent and avoid bloat.

## Catalog

Read from:

`skills/user-skills/recommended-catalog.json`

**Default profile:** `lean` (Impeccable + code review — fastest daily setup)

**Kenmark stack default:** `core-next` (`core-next-lite` + Graphify)

| Profile | Best for |
| --- | --- |
| `lean` | Daily coding, small projects, slow harnesses |
| `core-next-lite` | Small Next.js sites — Impeccable + review (no Graphify, no ECC) |
| `core-next` | Next.js + Tailwind + ShadCN + Prisma + agency/client work (+ Graphify) |
| `core-next-agentic` | core-next + ECC minimal (manual/plugin install steps) |
| `growth-seo` | Public sites — core-next + 6 selected SEO/GEO skills (not full pack) |
| `audit-review` | Inherited repos, refactors — review + Graphify + ECC minimal (no Impeccable) |
| `experimental-heavy` | Explicit opt-in — ECC core + full SEO pack (confirmation required) |

List profiles:

```bash
npx kenmark-skills install-recommended --list-profiles
```

## When to use

- "Install recommended skills", profile-based setup, impeccable, ECC, graphify
- After **kenmark-maintain** cleanup when rebuilding a lean set
- For refresh only, use **kenmark-update**

## Install rules (catalog)

Do **not** install multiple overlapping packs for the same purpose unless the user asks:

- Design/UI: max 1 primary pack
- Code review: max 1 primary pack
- SEO/GEO: selected skills by default; full pack only on request
- Agent harness: ECC **minimal** by default
- Navigation: Graphify for medium/large repos

## Humans vs agents

| Audience | How to run |
| --- | --- |
| **Human** | `npx kenmark-skills install-recommended` — profile picker, scope, summary, confirm |
| **Agent** | `npx kenmark-skills install-recommended --profile core-next --global -y` |

## Step 1 — Show profiles or catalog

```bash
npx kenmark-skills install-recommended --list-profiles
npx kenmark-skills install-recommended --list
```

Interactive flow shows estimated weight, bloat risk, and what will install before confirming.

## Step 2 — Install by profile (preferred)

```bash
# Default lean stack (global)
npx kenmark-skills install-recommended --profile lean --global -y

# Next.js full-stack (core-next)
npx kenmark-skills install-recommended --profile core-next --global -y

# Public website + selected SEO skills (not full 20-skill pack)
npx kenmark-skills install-recommended --profile growth-seo --global -y

# Codebase audit (no Impeccable)
npx kenmark-skills install-recommended --profile audit-review --global -y

# Preview
npx kenmark-skills install-recommended --profile core-next --dry-run --global
```

## Step 3 — Custom packs (advanced)

```bash
npx kenmark-skills install-recommended --ids impeccable,ecc --ecc-profile minimal --global -y
```

Empty interactive selection **cancels**. Agents must pass `--profile` or `--ids`.

## Step 4 — Verify

Use catalog `verify` hints or:

```bash
test -f ~/.agents/skills/impeccable/SKILL.md && echo "impeccable OK"
```

Run **kenmark-maintain** inventory to catch duplicate explosion.

## Step 5 — Kenmark first-party skills

Kenmark skills are the **curator OS** (router, maintain, install-recommended, update, kenmark-init, kenmark-commit, issues-*):

```bash
npx kenmark-skills setup --global --ide all
```

## CLI reference

```bash
npx kenmark-skills install-recommended --list-profiles
npx kenmark-skills install-recommended --profile lean --global -y
npx kenmark-skills install-recommended --profile growth-seo --project -y
npx kenmark-skills install-recommended   # interactive profile picker
```

Adopt relink flags (same as `setup` / `adopt`): `--copy`, `--symlink`, `--prefer-copy-on-windows`, `--no-prefer-copy-on-windows`, `--adopt-overwrite` (or `--force`) when store and IDE copies differ.

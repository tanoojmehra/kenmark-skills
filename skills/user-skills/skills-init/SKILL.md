---
name: skills-init
version: 1.0.0
category: admin
scope: universal
phase: setup
description: First-time Kenmark skills setup wizard — Kenmark skills plus optional curated packs. Use when onboarding, first install, or the user says init skills, set up kenmark skills, or get started with kenmark-skills.
triggers:
  - init skills
  - set up kenmark skills
  - get started with kenmark-skills
  - first time skills install
  - onboard kenmark skills
allowed-tools:
  - Bash
risk: shell
disable-model-invocation: true
---

# Skills Init

One guided flow for **new users**: install Kenmark skills, optionally install **recommended packs** (Impeccable, ECC, Graphify, and more), pick **scope** and **IDEs**.

## When to use

- First-time setup, "install kenmark skills", "onboard me"
- User wants both Kenmark + curated packs in one step
- Prefer **`skills-update`** only when refreshing an existing install

## Humans vs agents

| Audience | How to run |
| --- | --- |
| **Human** | `npx kenmark-skills init` — interactive prompts in the terminal |
| **Agent** | `npx kenmark-skills init --global --ide all --skip-recommended -y` (or `--project`, `--ids`, `--recommended-only`) |

Set `KENMARK_SKILLS_NONINTERACTIVE=1` to force non-interactive behavior without `-y`.

## Interactive flow (CLI)

```bash
npx kenmark-skills init
```

Prompts (nothing is pre-selected — you must choose each step):

1. Install Kenmark skills? (default **no**)
2. Install curated recommended packs? (default **no**)
3. If packs: pick specific packs (empty cancels that step)
4. Scope — global vs project (**required**)
5. IDE targets — auto, all, or numbered list (**required** when installing Kenmark)
6. Confirm plan (**yes** required to proceed), then runs `setup` + `install-recommended` as chosen

Kenmark skills land in **`~/.kenmark/store/skills`** first; IDE folders are symlinks to that store (or copies when `--copy` is used).

## Agent / CI examples

```bash
# Kenmark skills only, global, all IDEs, no prompts
npx kenmark-skills init --global --ide all --skip-recommended -y

# Kenmark + specific packs
npx kenmark-skills init --global --ide all --ids impeccable,ecc -y

# Kenmark only, project-local, Cursor
npx kenmark-skills init --project --ide cursor --skip-recommended -y

# Recommended packs only (no Kenmark copy)
npx kenmark-skills init --recommended-only --global --ids impeccable -y

# Preview commands
npx kenmark-skills init --dry-run -y
```

From a local checkout:

```bash
node scripts/skills-init.js
```

## After init

1. Restart the IDE if skills do not appear
2. In a project repo, run **`init-brain`** to create `brain/` and install IDE pointer stubs (standards in `brain/rules/standards.md`)
3. While coding: **`troubleshoot`** when the problem is unclear; **`skills-router`** (or `/kenmark-skills-router`) when the domain is clear but the right skill is not

## Related skills

| Skill | Role |
| --- | --- |
| **skills-update** | Refresh existing installs |
| **skills-install-recommended** | Add/change curated packs only |
| **skills-maintain** | Inventory and cleanup recommendations |
| **init-brain** | Project knowledge base (separate from skill install) |

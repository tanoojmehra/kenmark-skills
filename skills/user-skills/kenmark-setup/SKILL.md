---
name: kenmark-setup
version: 1.0.0
category: admin
scope: universal
phase: setup
description: First-time Kenmark skills setup wizard — Kenmark skills plus selectable optional third-party installs with repo-aware suggestions. Use when onboarding, first install, or the user says init skills, set up kenmark skills, or get started with kenmark-skills.
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

# Kenmark Setup

One guided flow for **new users**: install Kenmark skills, optionally install **selectable third-party packs** (defaults: Impeccable + Awesome Code Review only; Graphify, SEO, ECC are opt-in), with **repo-aware suggestions**, then pick **scope** and **IDEs**. No profile/preset is chosen by default.

## When to use

- First-time setup, "install kenmark skills", "onboard me"
- User wants both Kenmark + curated packs in one step
- Prefer **`kenmark-update`** only when refreshing an existing install

## Humans vs agents

| Audience | How to run |
| --- | --- |
| **Human** | `npx kenmark-skills init` — interactive prompts in the terminal |
| **Agent** | `npx kenmark-skills init --global --skip-recommended -y` (or `--project`, `--ide cursor,claude,codex`, `--ids`, `--recommended-only`) |

Set `KENMARK_SKILLS_NONINTERACTIVE=1` to force non-interactive behavior without `-y`.

## Interactive flow (CLI)

```bash
npx kenmark-skills init
```

Prompts (nothing is pre-selected — you must choose each step):

1. Install Kenmark skills? (default **no**)
2. Install optional recommended packs? (default **no**)
3. If packs: checklist with repo suggestions (`--suggest` shows the same analysis non-interactively); Enter accepts defaults (**impeccable**, **code-review-skill**)
4. ECC profile prompt when ECC is selected
5. Scope — global vs project (**required**)
6. IDE targets — auto, all, or numbered list (**required** when installing Kenmark)
7. Confirm plan (**yes** required to proceed), then runs `setup` + `install-recommended` as chosen

Presets (`--profile core-next`, …) are supported for agents/CI only — not shown in the interactive wizard.

Kenmark skills land in **`~/.kenmark/store/skills`** first; IDE folders are symlinks to that store (or copies when `--copy` is used).

## Agent / CI examples

```bash
# Kenmark skills only, global, no prompts (defaults to cursor, claude, codex when none detected)
npx kenmark-skills init --global --skip-recommended -y

# Repo-aware suggestions only (no install)
npx kenmark-skills init --suggest

# Kenmark + specific packs (defaults: impeccable + code-review-skill)
npx kenmark-skills init --global --ids impeccable,code-review-skill -y

# Explicit IDE targets
# npx kenmark-skills init --global --ide cursor,claude,codex --skip-recommended -y

# Advanced — every detected harness path (may create clutter)
# npx kenmark-skills init --global --ide all --skip-recommended -y

# Kenmark only, project-local, Cursor
npx kenmark-skills init --project --ide cursor --skip-recommended -y

# Recommended packs only (no Kenmark copy)
npx kenmark-skills init --recommended-only --global --ids impeccable -y

# Preview commands
npx kenmark-skills init --dry-run -y
```

From a local checkout:

```bash
node scripts/kenmark-setup.js
```

## After init

1. Restart the IDE if skills do not appear
2. In a project repo, run **`kenmark-init`** to create `brain/` and install IDE pointer stubs (standards in `brain/rules/standards.md`)
3. While coding: **`kenmark-troubleshoot`** when the problem is unclear; **`kenmark-router`** when the right skill is not obvious; **`repo-*`** skills for repo health (e.g. **`kenmark-repo-public`** + **`kenmark-repo-secrets`** before a public push, **`kenmark-repo-hygiene`** for clutter, **`kenmark-repo-kb`** after features); **`kenmark-security-review`** for auth/injection/SSRF; **`kenmark-performance`** for slow routes, DB, or bundle issues

## Related skills

| Skill | Role |
| --- | --- |
| **kenmark-update** | Refresh existing installs |
| **kenmark-packs** | Add/change curated packs only |
| **kenmark-maintain** | Inventory and cleanup recommendations |
| **kenmark-init** | Project knowledge base (separate from skill install) |

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
  - install recommended skills
  - install impeccable
  - install ECC
  - install graphify
  - install drawio
  - install drawio-skill
  - install ponytail
  - install improve
  - install headroom
  - curated skill packs
  - kenmark-packs
  - optional installs
  - suggest packs
allowed-tools:
  - Bash
risk: shell
disable-model-invocation: true
---

# Kenmark Setup

One guided flow for **new users**: install Kenmark skills globally, optionally install **selectable third-party packs** (defaults: Impeccable + Simplify only; Graphify, SEO, ECC are opt-in), with **repo-aware suggestions**, then pick **IDEs**. Kenmark installs to `~/.kenmark/store` and links into IDE home folders — not per-repo.

## When to use

- First-time setup, "install kenmark skills", "onboard me"
- User wants both Kenmark + curated packs in one step
- Prefer **`kenmark-update`** only when refreshing an existing install

## Humans vs agents

| Audience | How to run |
| --- | --- |
| **Human** | `npx kenmark-skills init` — interactive prompts in the terminal |
| **Agent** | `npx kenmark-skills init --skip-recommended -y` (or `--ide cursor,claude,codex`, `--ids`, `--recommended-only`) |

Set `KENMARK_SKILLS_NONINTERACTIVE=1` to force non-interactive behavior without `-y`.

## Interactive flow (CLI)

```bash
npx kenmark-skills init
```

Prompts (nothing is pre-selected — you must choose each step):

1. Install Kenmark skills? (default **no**)
2. Install optional recommended packs? (default **no**)
3. If packs: checklist with repo suggestions (`--suggest` shows the same analysis non-interactively); Enter accepts defaults (**impeccable**, **simplify**)
4. ECC profile prompt when ECC is selected
5. Scope — **global only** (no project installs)
6. IDE targets — auto, all, or numbered list (**required** when installing Kenmark)
7. Confirm plan (**yes** required to proceed), then runs `setup` + `install-recommended` as chosen

Presets (`--profile core-next`, …) are supported for agents/CI only — not shown in the interactive wizard.

Kenmark skills land in **`~/.kenmark/store/skills`** first; IDE folders are symlinks to that store (or copies when `--copy` is used).

## Agent / CI examples

```bash
# Kenmark skills only, global, no prompts (defaults to cursor, claude, codex when none detected)
npx kenmark-skills init --skip-recommended -y

# Repo-aware suggestions only (no install)
npx kenmark-skills init --suggest

# Kenmark + specific packs (defaults: impeccable + simplify)
npx kenmark-skills init --ids impeccable,simplify -y

# Explicit IDE targets
# npx kenmark-skills init --ide cursor,claude,codex --skip-recommended -y

# Advanced — every detected harness path (may create clutter)
# npx kenmark-skills init --ide all --skip-recommended -y

# Kenmark only, Cursor
npx kenmark-skills init --ide cursor --skip-recommended -y

# Recommended packs only (no Kenmark copy)
npx kenmark-skills init --recommended-only --ids impeccable -y

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
3. While coding: **`kenmark-troubleshoot`** when the problem is unclear; **`kenmark-router`** when the right skill is not obvious; **`repo-*`** skills for repo health (e.g. **`kenmark-repo-public`** + **`kenmark-repo-secrets`** before a public push, **`kenmark-repo-hygiene`** for clutter, **`kenmark-kb-sync`** after features); **`kenmark-security-review`** for auth/injection/SSRF; **`kenmark-performance`** for slow routes, DB, or bundle issues

## Related skills

| Skill | Role |
| --- | --- |
| **kenmark-update** | Refresh existing installs |
| **kenmark-setup** (packs section) | Add/change curated packs only |
| **kenmark-skills-maintain** | Inventory and cleanup recommendations |
| **kenmark-init** | Project knowledge base (separate from skill install) |

---

## Installing optional packs

Use this section when the user wants to **install optional third-party skill packs** from the Kenmark catalog. This is a sub-mode of the setup skill — the standalone packs skill has been merged into this file.

### Catalog

Read from: `skills/user-skills/recommended-catalog.json`

**Mode:** `selectable` (v5+)

**Default selection:** `impeccable` + `simplify` only — heavy packs are opt-in.

| Pack | Role |
| --- | --- |
| `impeccable` | UI/design polish (default-on) |
| `simplify` | Post-generation code simplification (default-on) |
| `ponytail` | YAGNI / anti-over-engineering (5 skills; opt-in) |
| `improve` | Audit → plan → execute delegation (opt-in; writes `plans/`) |
| `drawio-skill` | draw.io architecture/UML/flow diagrams (opt-in; needs desktop CLI) |
| `graphify` | Large-repo navigation |
| `seo-geo-selected` | Six SEO/GEO skills (not full suite) |
| `seo-geo-full` | Full 20-skill SEO/GEO (explicit opt-in) |
| `ecc` | Everything Claude Code — manual install |
| `headroom` | Context compression CLI (proxy, MCP, agent wrap) |

**Presets (advanced):** `lean`, `core-next`, `core-next-agentic`, `growth-seo`, `audit-review`, `experimental-heavy`, …

### When to use

- "Install recommended skills", optional third-party packs, impeccable, ECC, graphify
- After **kenmark-skills-maintain** cleanup when rebuilding a lean set
- For refresh only, use **kenmark-update**

### Install rules (catalog)

Do **not** install multiple overlapping packs for the same purpose unless the user asks:

- Design/UI: max 1 primary pack
- Code review / minimalism: Simplify (default) or Ponytail (YAGNI ladder) — not both unless asked
- SEO/GEO: selected skills by default; full pack only on request
- Agent harness: ECC **minimal** by default
- Navigation: Graphify for medium/large repos
- Audit / planning: improve for audit-to-plan workflows (repo-root `plans/`)
- Diagrams: draw.io skill for architecture/UML exports (requires draw.io desktop CLI)
- Context compression: Headroom for tool-heavy agent workflows (optional)

| Audience | How to run |
| --- | --- |
| **Human** | `npx kenmark-skills install-recommended` — checklist + repo suggestions, scope, confirm |
| **Agent** | `npx kenmark-skills install-recommended --ids impeccable,simplify -y` or `--profile core-next` |

### Step 1 — Suggest or list

```bash
npx kenmark-skills install-recommended --suggest
npx kenmark-skills install-recommended --list
npx kenmark-skills install-recommended --explain graphify
```

Interactive flow shows weight, bloat, and stack-specific suggestions before confirming.

### Step 2 — Install selected packs (preferred)

```bash
npx kenmark-skills install-recommended --ids impeccable,simplify -y
npx kenmark-skills install-recommended --ids impeccable,simplify,graphify -y
```

### Step 3 — Presets (advanced / CI)

```bash
npx kenmark-skills install-recommended --profile core-next -y
npx kenmark-skills install-recommended --profile growth-seo -y
npx kenmark-skills install-recommended --profile lean -y
```

### Step 4 — Verify

Use catalog `verify` hints or:

```bash
test -f ~/.agents/skills/impeccable/SKILL.md && echo "impeccable OK"
```

Run **kenmark-skills-maintain** inventory to catch duplicate explosion.

### Step 5 — Kenmark first-party skills

Kenmark skills are the **curator OS** (router, maintain, install-recommended, update, kenmark-init, kenmark-commit, tracker-*):

```bash
npx kenmark-skills setup -y
```

### CLI reference

```bash
npx kenmark-skills install-recommended --suggest
npx kenmark-skills install-recommended --list
npx kenmark-skills install-recommended --ids impeccable -y
npx kenmark-skills install-recommended --profile core-next -y
npx kenmark-skills install-recommended   # interactive checklist
```

Adopt relink flags (same as `setup` / `adopt`): `--copy`, `--symlink`, `--prefer-copy-on-windows`, `--no-prefer-copy-on-windows`, `--adopt-overwrite` (or `--force`) when store and IDE copies differ.

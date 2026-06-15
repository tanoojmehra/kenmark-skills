# Recommended catalog packs

Last updated: 2026-06-15
Status: reviewed

## Summary

Optional third-party skills installed via `install-recommended` / `init` wizard. Catalog: `skills/user-skills/recommended-catalog.json` (v7, **selectable**, **global-only**).

## Pack IDs

| ID | Name | Category | Default selected |
| --- | --- | --- | --- |
| `impeccable` | Impeccable | design | yes |
| `simplify` | Simplify | review | yes |
| `graphify` | Graphify | navigation | no |
| `seo-geo-selected` | SEO/GEO (selected skills) | seo | no |
| `seo-geo-full` | SEO/GEO (full suite) | seo | no |
| `ecc` | Everything Claude Code | harness | no (profiles: minimal/core/full) |
| `headroom` | Headroom | context | no (opt-in; interactive init offers `headroom wrap`) |

**Headroom usage (built-in models):** [005-headroom-built-in-usage.md](005-headroom-built-in-usage.md) — also shipped as `kenmark-packs/references/headroom-usage.md`.

## Overlap rules

Catalog `installRules.overlapCaps`: one primary pack per category (design, review, seo, harness, navigation) unless user explicitly asks for more.

## Presets (CI / power users)

`lean`, `core-next-lite`, `core-next`, `core-next-agentic`, `growth-seo`, `audit-review`, `experimental-heavy` — use `--profile` on `install-recommended`; not primary interactive UX.

## Commands

```bash
npx kenmark-skills install-recommended --list
npx kenmark-skills install-recommended --suggest
npx kenmark-skills install-recommended --ids impeccable,simplify -y
npx kenmark-skills install-recommended --profile core-next -y
```

In chat: **kenmark-packs** (guided), **kenmark-maintain** (inventory, no auto-delete).

After install/adopt, Kenmark rewrites impeccable `SKILL.md` script invocations from `./scripts/` to absolute store paths so agents can run setup scripts from any project directory. If impeccable setup fails with missing `scripts/context.mjs`, run `npx kenmark-skills adopt --ide all -y`.

## Cleanup catalog packs

```bash
npx kenmark-skills cleanup --recommended -y
```

Does not remove Kenmark bundled skills unless `--kenmark` or `--all-managed`.

## Maintenance

Update catalog JSON version, pack metadata, and validate-repo when adding packs.

# Recommended catalog packs

Last updated: 2026-06-07
Status: reviewed

## Summary

Optional third-party skills installed via `install-recommended` / `init` wizard. Catalog: `skills/user-skills/recommended-catalog.json` (v5, **selectable** mode).

## Pack IDs

| ID | Name | Category | Default selected |
| --- | --- | --- | --- |
| `impeccable` | Impeccable | design | yes |
| `code-review-skill` | Awesome Code Review | review | yes |
| `graphify` | Graphify | navigation | no |
| `seo-geo-selected` | SEO/GEO (selected skills) | seo | no |
| `seo-geo-full` | SEO/GEO (full suite) | seo | no |
| `ecc` | Everything Claude Code | harness | no (profiles: minimal/core/full) |

## Overlap rules

Catalog `installRules.overlapCaps`: one primary pack per category (design, review, seo, harness, navigation) unless user explicitly asks for more.

## Presets (CI / power users)

`lean`, `core-next-lite`, `core-next`, `core-next-agentic`, `growth-seo`, `audit-review`, `experimental-heavy` — use `--profile` on `install-recommended`; not primary interactive UX.

## Commands

```bash
npx kenmark-skills install-recommended --list
npx kenmark-skills install-recommended --suggest
npx kenmark-skills install-recommended --ids impeccable,code-review-skill --global -y
npx kenmark-skills install-recommended --profile core-next --global -y
```

In chat: **kenmark-packs** (guided), **kenmark-maintain** (inventory, no auto-delete).

## Cleanup catalog packs

```bash
npx kenmark-skills cleanup --global --recommended -y
```

Does not remove Kenmark bundled skills unless `--kenmark` or `--all-managed`.

## Maintenance

Update catalog JSON version, pack metadata, and validate-repo when adding packs.

# Recommended catalog packs

Last updated: 2026-10-06
Status: reviewed

## Summary

Optional third-party skills installed via `install-recommended` / `init` wizard. Catalog: `skills/user-skills/recommended-catalog.json` (v14, **selectable**, **global-only**).

Default selection is **Impeccable + Ponytail**. Simplify remains available as an alternative everyday review/simplification pack, but is no longer default.

## Pack IDs

| ID | Name | Category | Default selected |
| --- | --- | --- | --- |
| `impeccable` | Impeccable | design | yes |
| `ponytail` | Ponytail | review | yes |
| `simplify` | Simplify | review | no |
| `improve` | improve | audit | no |
| `vercel-react-best-practices` | Vercel React Best Practices | framework | no |
| `improve-codebase-architecture` | Improve Codebase Architecture | architecture | no |
| `constraint-driven-development` | Constraint-Driven Development | constraints | no |
| `adverse-review` | Adverse Review | assurance | no |
| `context-engineering` | Context Engineering | context | no |
| `drawio-skill` | draw.io Diagrams | diagram | no |
| `seo-geo-selected` | SEO/GEO (selected skills) | seo | no |
| `seo-geo-full` | SEO/GEO (full suite) | seo | no |

### Specialist boundaries

- **Ponytail** asks whether code/abstraction should exist at all; **Simplify** is an optional behavior-preserving cleanup alternative.
- **Improve** is broad audit → plan; **Improve Codebase Architecture** focuses on module depth, interfaces/seams, testability, and architectural friction.
- **kenmark-performance** remains generic; **Vercel React Best Practices** is the React/Next.js specialist second lens.
- **Constraint-Driven Development** writes durable, measurable project quality floors rather than performing another one-shot audit.
- **Adverse Review** is a heavy assurance pass for substantial/high-risk changes, not a routine review for tiny diffs.
- **Context Engineering** adds deeper context-budget, selective-loading, compression, and restartable-session guidance. It complements native **kenmark-context**; Kenmark remains the task orchestrator.

## Overlap rules

Catalog `installRules.overlapCaps` keeps one primary pack per overlapping purpose unless the user explicitly asks for more. Current categories include design, review, seo, diagram, audit, architecture, framework, constraints, assurance, and context.

Framework/architecture/constraints/assurance packs may complement generic Kenmark audits because their responsibilities are intentionally distinct.

## Presets (CI / power users)

- `lean` — Impeccable + Ponytail.
- `core-next-lite` — lean + Vercel React Best Practices.
- `core-next-agentic` — core-next-lite + Constraint-Driven Development.
- `growth-seo` — core-next-lite + selected SEO/GEO.
- `audit-review` — improve + Improve Codebase Architecture + Adverse Review.
- `experimental-heavy` — broad explicit opt-in bundle.

Use `--profile` on `install-recommended`; presets are not the primary interactive UX.

## Commands

```bash
npx kenmark-skills install-recommended --list
npx kenmark-skills install-recommended --suggest
npx kenmark-skills install-recommended --ids impeccable,ponytail -y
npx kenmark-skills install-recommended --ids vercel-react-best-practices,improve-codebase-architecture -y
npx kenmark-skills install-recommended --ids context-engineering -y
npx kenmark-skills install-recommended --profile core-next-lite -y
```

In chat: **kenmark-setup** (packs section) for guided install and **kenmark-skills-maintain** for inventory/cleanup recommendations.

After install/adopt, Kenmark rewrites Impeccable `SKILL.md` script invocations from `./scripts/` to absolute store paths so agents can run setup scripts from any project directory. If Impeccable setup fails with missing `scripts/context.mjs`, run `npx kenmark-skills adopt --ide all -y`.

## Cleanup catalog packs

```bash
npx kenmark-skills cleanup --recommended -y
```

Does not remove Kenmark bundled skills unless `--kenmark` or `--all-managed`.

## Maintenance

When adding/changing packs:
1. bump catalog JSON version and `updatedAt`
2. update pack metadata/install/verify rules
3. update this KB + `brain/kb/07-features.md` + setup skill examples
4. run `npm run validate` and pack verification tests

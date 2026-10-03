# Recommended catalog packs

Last updated: 2026-10-04
Status: reviewed

## Summary

Optional third-party skills installed via `install-recommended` / `init` wizard. Catalog: `skills/user-skills/recommended-catalog.json` (v13, **selectable**, **global-only**).

The catalog now separates broad Kenmark/native capabilities from specialist third-party packs. Prefer one primary pack per overlap category, but framework/architecture/constraints/adversarial specialists may coexist because they solve different problems.

## Pack IDs

| ID | Name | Category | Default selected | Recommendation |
| --- | --- | --- | --- | --- |
| `impeccable` | Impeccable | design | yes | Primary UI/UX/design specialist |
| `ponytail` | Ponytail | review | no | Preferred YAGNI/minimalism review pack |
| `simplify` | Simplify | review | no | Optional legacy overlap; no longer a default |
| `improve` | improve | audit | no | Broad audit → implementation-plan workflow |
| `architecture` | Improve Codebase Architecture | architecture | no | Deep modules, seams, testability, AI navigability |
| `vercel-react-best-practices` | Vercel React Best Practices | framework | no | React/Next framework-specific performance rules |
| `constraint-driven-development` | Constraint-Driven Development | constraints | no | Durable measurable project quality contract |
| `adverse-review` | Adverse Review | adversarial-review | no | Heavy multi-perspective review for high-risk changes |
| `drawio-skill` | draw.io Diagrams | diagram | no | Architecture/UML/ERD/flow diagrams |
| `graphify` | Graphify | navigation | no | Large-repo knowledge graph/navigation |
| `seo-geo-selected` | SEO/GEO (selected skills) | seo | no | Preferred public-site SEO/GEO subset |
| `seo-geo-full` | SEO/GEO (full suite) | seo | no | Explicit opt-in full suite |
| `ecc` | Everything Claude Code | harness | no | Heavy harness overlay; profiles minimal/core/full |
| `headroom` | Headroom | context | no | Context compression; opt-in |

**Headroom usage (built-in models):** [005-headroom-built-in-usage.md](005-headroom-built-in-usage.md) — also shipped as `kenmark-setup/references/headroom-usage.md`.

## Key specialist boundaries

- **Ponytail vs Simplify:** Ponytail is the preferred primary minimalism/YAGNI review. Simplify remains installable but is not recommended by default. Native `kenmark-issues-scan` simplify mode covers repo-wide complexity discovery.
- **kenmark-performance + Vercel:** Kenmark remains framework-neutral and evidence/measurement driven; Vercel adds current React/Next-specific rules.
- **Architecture:** installs both `codebase-design` and `improve-codebase-architecture` because the survey depends on the shared deep-module vocabulary.
- **Constraints:** intentionally writes a project quality contract (`CONSTRAINTS.md` upstream); review thresholds before treating them as release gates.
- **Adverse Review:** expensive by design; use for large/risky PRs, auth/payment/security work, migrations, release candidates, and risky refactors rather than routine tiny changes.

## Overlap rules

Catalog `installRules.overlapCaps` has one primary per category:

`design`, `review`, `seo`, `harness`, `navigation`, `diagram`, `audit`, `context`, `architecture`, `framework`, `constraints`, `adversarial-review`.

The specialist categories are intentionally distinct, so a Next.js repo may reasonably use Ponytail + improve + Architecture + Vercel + Constraints, while Adverse Review stays an explicit high-cost review choice.

## Presets (CI / power users)

- `lean` — Impeccable + Ponytail.
- `core-next-lite` — Impeccable + Ponytail + Vercel React Best Practices.
- `core-next` — core-next-lite + Graphify.
- `core-next-agentic` — core-next + ECC minimal.
- `growth-seo` — core-next + selected SEO/GEO skills.
- `audit-review` — Ponytail + improve + Architecture + Graphify.
- `experimental-heavy` — broad specialist/harness suite; explicit confirmation required.

Use `--profile` on `install-recommended`; presets are not the primary interactive UX.

## Commands

```bash
npx kenmark-skills install-recommended --list
npx kenmark-skills install-recommended --suggest
npx kenmark-skills install-recommended --ids impeccable,ponytail -y
npx kenmark-skills install-recommended --ids architecture,vercel-react-best-practices,constraint-driven-development -y
npx kenmark-skills install-recommended --profile core-next -y
```

In chat: **kenmark-setup** (packs section) (guided), **kenmark-skills-maintain** (inventory, no auto-delete).

After install/adopt, Kenmark rewrites impeccable `SKILL.md` script invocations from `./scripts/` to absolute store paths so agents can run setup scripts from any project directory. If impeccable setup fails with missing `scripts/context.mjs`, run `npx kenmark-skills adopt --ide all -y`.

## Cleanup catalog packs

```bash
npx kenmark-skills cleanup --recommended -y
```

Does not remove Kenmark bundled skills unless `--kenmark` or `--all-managed`.

## Maintenance

When adding/removing packs:

1. Increment catalog JSON version and `updatedAt`.
2. Add install + verify metadata and repo-aware suggestion signals.
3. Update this KB and user-facing README pack count.
4. Run `npm run validate`; catalog schema/preset/pack-id checks live in `scripts/validate-repo.js`.

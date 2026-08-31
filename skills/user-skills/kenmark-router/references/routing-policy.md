# Routing policy

## Routing algorithm

1. **Parse intent** from the user message:
   - **Domain** (category): git, issues, seo, design, backend, testing, admin, workflow
   - **Phase**: setup, ship, maintain, verify, discover, plan
   - **Stack**: frameworks or tools mentioned (django, react, python, …)
   - **Risk tolerance**: read-only listing vs writes vs destructive ops
   - **Constraints**: explicit tool limits, "don't commit", "read only", etc.

2. **Load registry**: read `~/.kenmark/cache/skills-registry.json` after the runtime bootstrap above completes.

3. **Score candidates** (top 3). Start each skill at 0:

   | Signal | Points |
   | --- | --- |
   | Exact `triggers[]` phrase appears in the user message | +4 |
   | Skill `name` or `/name` appears in the message | +3 |
   | `category` matches parsed domain | +2 |
   | `phase` matches parsed phase | +2 |
   | `stack` overlaps task stack, or skill has `"any"` | +2 |
   | Description keyword overlap (meaningful tokens, not stopwords) | +1 |
   | `allowedTools` includes tools the task needs (e.g. Bash for git) | +1 |
   | Kenmark `source` when tie-breaking equal names | +1 |
   | `category` clearly wrong for the task | −3 |
   | `phase` wrong (e.g. setup skill for a ship task) | −2 |
   | `risk` too high for a read-only request | −2 |
   | `risk` too low for a write/destructive request and no safer alternative | −1 |
   | **Explicit admin** skill (`kenmark-setup`, `kenmark-update`, `kenmark-agents`) without install/update/setup/prune/inventory intent | −6 |
   | **Specialist** skill (`kenmark-subagents`, `kenmark-repo-docs`, `kenmark-repo-deps`, `kenmark-repo-release`, `kenmark-repo-hygiene`, `kenmark-test-*`, `kenmark-issues-scan`, `kenmark-audit-loop`, `kenmark-issues-fix-and-ship`, `kenmark-plan`, `kenmark-plans-execute`, `kenmark-tracker-list`, `kenmark-tracker-check`, `kenmark-tracker-maintain`, `kenmark-storage`) on a broad/unclear coding task | −2 |
   | **Core daily** skill when task is general coding/repo work | +1 |

4. **Tie-break** (in order):
   - Apply [Skill activation tiers](#skill-activation-tiers): prefer **core daily** over specialist; never pick **explicit admin** without explicit user intent
   - Prefer skills with explicit `triggers[]` matches over description-only matches
   - Prefer narrower skills over umbrella skills (`seo-page` over `seo`; `django-tdd` over `coding-standards`)
   - Among `repo-*` skills, prefer the specialist over `kenmark-repo-hygiene` (e.g. `kenmark-repo-secrets` for "find secrets", `kenmark-repo-public` for "make public", "public repo readiness", "sanitize before public", `kenmark-repo-release` for "npm publish")
   - For **auth bypass, RBAC, injection, SSRF, open redirect, CORS, rate limits** → **`kenmark-security-review`** (not `kenmark-repo-secrets` unless they ask for keys/tokens)
   - For **slow routes, N+1, bundle size, hydration bloat, caching, API latency** → **`kenmark-performance`** (not `kenmark-repo-quality` unless build/type/lint/test is failing)
   - For **dependency bloat / duplicate packages** → **`kenmark-repo-deps`**; if the user ties slowness to **heavy deps or bundle weight**, prefer **`kenmark-performance`** and note **`kenmark-repo-deps`** as a follow-up
   - For **Kenmark Storage API, proxied upload/download, asset list, visibility, soft delete, `@kenmark/storage`, app-side conversion** → **`kenmark-storage`**
   - If the task mentions **public**, **open source**, **publish**, or **safe to publish**, prefer **`kenmark-repo-public`** over **`kenmark-repo-hygiene`** even when the user also says "sanitize" or "clean"
   - Prefer `source: kenmark` over `catalog` over `user` when scores are equal
   - Prefer `maturity: stable` over `catalog` over `user`

5. **Load winner**: read the selected skill's `SKILL.md` and follow it for the rest of the task.

6. **Multi-skill tasks**: if two skills score within 1 point and serve **different phases** (e.g. `kenmark-issues-scan` + `kenmark-tracker-check`, or `ce-plan` + `tdd-workflow`), load the primary first and note the secondary for the next phase.

7. **No match (score < 3)**: use `find-skills` to search for installable skills, then proceed with general capabilities.

## Category quick map

| If the task is about… | Prefer skills in category… | Examples |
| --- | --- | --- |
| Commits, pushes, git workflow | `git`   | `kenmark-commit` |
| Issue tracking, brain/issues | `issues` | `kenmark-tracker-list`, `kenmark-tracker-check`, `kenmark-issues-scan`, `kenmark-audit-loop`, `kenmark-issues-fix-and-ship` |
| Plan tracking, brain/plans | `plans` | `kenmark-plan`, `kenmark-tracker-list`, `kenmark-tracker-check`, `kenmark-plans-execute`, `kenmark-tracker-maintain` |
| Search, rankings, metadata, structured data | `seo` | `seo-audit`, `seo-technical`, `seo-schema` |
| UI polish, layout, visual design, MUI | `design` | `impeccable`, `design-taste-frontend` |
| APIs, services, frameworks, languages | `backend` | `backend-patterns`, `django-patterns` |
| Tests, QA, verification, evals | `testing` | `kenmark-test-plan`, `kenmark-test-unit`, `kenmark-test-integration`, `kenmark-test-e2e`, `kenmark-test-mocks`, `kenmark-test-coverage`, `kenmark-test-ci` |
| Skill install, update, packs (explicit admin only) | `admin` | `kenmark-setup`, `kenmark-update`, `kenmark-agents` |
| Agent workflow, discovery, learning | `workflow` | `find-skills`, `continuous-learning`, `kenmark-router` |
| Plan before implementation | `workflow` | `kenmark-plan` |
| Complete final deliverables / no omissions | `workflow` | `kenmark-output` |
| Specialist / parallel investigation | `workflow` | `kenmark-subagents` |
| Troubleshoot, debug, root cause, investigate | `workflow` | `kenmark-troubleshoot` |
| Repo clutter, scattered docs, dumps | `workflow` | `kenmark-repo-hygiene` |
| Secrets, keys, tokens | `workflow` | `kenmark-repo-secrets` |
| Public / open-source safety | `workflow` | `kenmark-repo-public` |
| Brain KB after code change | `workflow` | `kenmark-kb-sync` |
| Documentation quality | `workflow` | `kenmark-repo-docs` |
| Folder layout / structure | `workflow` | `kenmark-repo-hygiene` (structure-audit mode) |
| Package / dependency health | `workflow` | `kenmark-repo-deps` |
| Dev/build/type/lint/format errors | `workflow` | `kenmark-repo-quality` |
| Security review (auth, RBAC, injection, SSRF, CORS, rate limits) | `workflow` | `kenmark-security-review` |
| Performance bottlenecks (slow routes, DB, bundle, hydration, caching) | `workflow` | `kenmark-performance` |
| Kenmark Storage API, proxied assets, list/visibility/delete, app-side conversion | `workflow` | `kenmark-storage` |
| Release, publish, handoff | `workflow` | `kenmark-repo-release` |
| Test strategy before writing tests | `testing` | `kenmark-test-plan` |
| Unit tests | `testing` | `kenmark-test-unit` |
| API/service/db integration tests | `testing` | `kenmark-test-integration` |
| Browser/user-flow E2E tests | `testing` | `kenmark-test-e2e` |
| Mocks, fixtures, factories | `testing` | `kenmark-test-mocks` |
| Coverage audit | `testing` | `kenmark-test-coverage` |
| CI test pipeline | `testing` | `kenmark-test-ci` |

## Output format

After routing, tell the user briefly:

```markdown
**Routed skill:** `<name>` (<category>, <phase>, risk:<risk>)
**Why:** <one sentence citing trigger/category/phase/stack match>
**Next:** <first concrete step from that skill>
```

Then execute using the routed skill — do not stop at the recommendation.


See also **Category quick map** and **Skill activation tiers** in the main router workflows section.

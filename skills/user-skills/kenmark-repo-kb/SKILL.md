---
name: kenmark-repo-kb
version: 1.0.0
category: workflow
scope: universal
phase: maintain
description: "Update brain/kb/ and brain/CHANGELOG.md after code changes: features, API, schema, auth, UI routes, workflows, deployment. Use when a feature is done, API changed, or the user asks to update brain or sync the knowledge base."
triggers:
  - update brain
  - sync kb
  - brain kb sync
  - update knowledge base
  - feature completed update docs
  - kenmark-repo-kb
  - sync brain after change
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Glob
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Repo KB Sync — Keep brain/kb/ Aligned With Code

## Purpose

Use after meaningful work when **code and KB must move together**:

- Feature completed or behavior changed
- Bug fix that changes documented behavior
- API or integration change
- DB schema / data model change
- Auth or permissions change
- UI route or page change
- Workflow or business logic change
- Deployment or infra config change

Updates:

- `brain/kb/07-features.md`
- `brain/kb/features/NNN-feature.md`
- `brain/kb/03-data-model.md`
- `brain/kb/05-api-and-integrations.md`
- `brain/kb/06-ui-and-routes.md`
- `brain/kb/11-known-risks-and-decisions.md`
- Other numbered `00`–`11` files when relevant
- `brain/CHANGELOG.md`

**`kenmark-commit`** enforces KB updates at commit time; this skill is the **how**.

---

## Prerequisite

If `brain/kb/` does not exist, run **`kenmark-init`** first (creates `00`–`11`, `features/`, `decisions/`).

```bash
test -d brain/kb && echo "kb ok" || echo "run kenmark-init first"
```

---

## Core principle

```text
Read code diff → Map to KB files → Update confirmed facts only → Link features → Changelog entry
```

Document **confirmed facts** from files you read. Put guesses in **Assumptions**; gaps in **Documentation gaps**.

---

## Step 1 — Resolve repo root and gather change context

```bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"
git status --short
git diff --stat HEAD 2>/dev/null || git diff --stat
```

Use user description plus changed paths to infer change type.

---

## Step 2 — Map change type → KB targets

| Change type | Primary KB files |
| --- | --- |
| New or changed feature | `07-features.md`, `features/NNN-name.md` |
| Schema / Prisma / models | `03-data-model.md` |
| API routes, webhooks, integrations | `05-api-and-integrations.md` |
| Pages, routes, components (UI) | `06-ui-and-routes.md` |
| Auth, roles, permissions | `04-auth-and-permissions.md` |
| Deploy, CI, env, hosting | `09-infra-and-deployment.md` |
| Test strategy change | `10-testing-and-quality.md` |
| Architecture / major decision | `01-architecture.md`, `11-known-risks-and-decisions.md`, `decisions/NNN-name.md` |
| Stack / new dependency | `02-stack-and-dependencies.md` |
| Unclear | `07-features.md` + TODO under Documentation gaps |

---

## Step 3 — Read before write

Read existing KB sections you will edit. Preserve structure and tone. Do not invent endpoints or tables not seen in code.

---

## Step 4 — Update KB files

### New feature

1. Next ID: highest `brain/kb/features/NNN-*.md` + 1 (3-digit zero-padded).
2. Create `brain/kb/features/NNN-short-name.md` (purpose, entry points, key files, config).
3. Add link row in `07-features.md`.

### Existing feature

Update the feature file and any numbered file affected (API, UI, data model).

### `11-known-risks-and-decisions.md`

Add decisions with date and rationale when the change is architectural.

---

## Step 5 — Changelog

Append to `brain/CHANGELOG.md`:

```markdown
## vYYYY.MM.DD-HHMM-kb-sync
- KB: updated <files> for <short summary of code change>.
```

Use local timestamp in the version id.

---

## Step 6 — Report to user

```markdown
## KB sync complete

**Code areas touched:** …
**KB files updated:** …
**New feature files:** …
**Changelog:** brain/CHANGELOG.md

**Still undocumented (if any):** …
```

---

## Related skills

| Situation | Prefer |
| --- | --- |
| First-time brain scaffold | `kenmark-init` |
| Commit with KB gate | `kenmark-commit` |
| Docs/README accuracy | `kenmark-repo-docs` |
| File clutter | `kenmark-repo-hygiene` |

---

## Anti-patterns

- Do not copy large code blocks into KB — summarize behavior and pointers to paths.
- Do not skip `07-features.md` when adding a feature file.
- Do not document features that were not implemented in the diff.

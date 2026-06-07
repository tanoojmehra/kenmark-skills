# CHANGELOG

Brain knowledge base for the kenmark-skills repository.

## v2026.06.08-legacy-cleanup-canonical

- **kenmark-hub.js:** `listLegacyKenmarkSkillPaths()` excludes canonical bundled names when `kenmark-${old}` equals `LEGACY_SKILL_RENAMES[old]`; keeps intermediate stale paths like `kenmark-init-brain`.
- **test-legacy-cleanup-canonical.js:** Regression — setup + legacy cleanup must retain bundled skills.
- **Issue 010:** Legacy cleanup deletes canonical bundled kenmark-* skills.

## v2026.06.08-cleanup-scope-prompt

- **interactive.js:** `promptScope` accepts `{ purpose: "cleanup" }` with cleanup-specific title and option descriptions; install flows unchanged.
- **kenmark-cleanup.js:** Passes cleanup purpose to scope prompt.
- **test-interactive-scope-prompt.js:** Unit tests for install vs cleanup copy.
- **Issue 009:** Cleanup scope prompt reuses install wording.

## v2026.06.07-adopt-reporting

- **Release:** package **2.3.12** (2026-06-08).

- **kenmark-hub:** `summarizeAdoptResults` / `formatAdoptPassSummary` — adopt logs now count `store-current` as portability-refreshed, not zero work.
- **setup / packs / adopt:** Shared adopt pass summary line; review-required and skipped still surfaced.
- **Issue 008:** Completed — adopt pass misleading zero adopted count.

## v2026.06.07-kenmark-init

- Initialized `brain/` scaffold: INDEX, modular `rules/`, numbered `kb/`, `features/`.
- KB: created `00`–`02`, `05`, `07`–`11` and feature docs for CLI, skills catalog, MCP, recommended packs, hub store.
- Sync mode: none (brain only — no IDE entry stubs in this commit).
- README simplified; long reference moved to `brain/kb/`.
- `.gitignore`: track `brain/` but exclude local `brain/issues/`.

## v2026.06.07-impeccable-cwd

- **kenmark-hub:** Rewrite cwd-relative `node ./scripts/*.mjs` in catalog skill `SKILL.md` / `reference/*.md` to absolute store paths during adopt; doctor flags leftovers.
- **KB:** Updated testing doc, known risks, recommended-packs troubleshooting.
- **Issue 007:** Completed — impeccable setup scripts fail from consumer project CWD.

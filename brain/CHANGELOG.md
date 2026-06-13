# CHANGELOG

Brain knowledge base

## v2026.06.13-drop-global-flag

- **CLI:** Removed documented `--global` flag; `normalizeCliArgv` strips deprecated scope flags for backward compatibility.
- **KB/skills:** Examples updated to omit `--global`.

## v2026.06.13-global-only-install

- **CLI:** Project scope removed; `--project` rejected. Interactive scope prompts removed.
- **recommended-catalog.json (v7):** Global install/verify only for all packs.
- **KB:** `05-api-and-integrations`, `004-recommended-packs`, `11-known-risks-and-decisions` updated.

## v2026.06.13-simplify-catalog

- **recommended-catalog.json (v6):** Replaced default `code-review-skill` (Awesome Code Review) with `simplify` (brianlovin/claude-config). Defaults and presets now `impeccable` + `simplify`.
- **KB:** `004-recommended-packs`, `05-api-and-integrations`, `07-features`, `11-known-risks-and-decisions` updated.
- **Skills:** `kenmark-setup`, `kenmark-packs` default pack references updated.

## v2026.06.11-antigravity-ide

- **kenmark-hub.js:** `antigravity-ide` target (`~/.gemini/antigravity-ide/skills`, MCP at `mcp_config.json`). `ANTIGRAVITY_COPY_IDES` covers CLI, 2.0, and IDE. `antigravity` relabeled as 2.0 Manager in prompts.
- **interactive.js:** IDE labels for all three Antigravity surfaces.
- **test-antigravity-dedupe.js:** Global/project antigravity-ide coverage.
- **KB:** `05-api-and-integrations`, `003-mcp-integration`, `11-known-risks-and-decisions` updated.

## v2026.06.08-antigravity-platform

- **kenmark-hub.js:** `antigravity-cli` and `antigravity` IDE targets in `buildGlobalTargets`, `buildProjectTargets`, `buildMcp*Targets`, `MCP_CAPABLE_IDES`. Antigravity-cli+Gemini alias dedupe; IDE copy-default and dual project paths (`.agent/skills` + `.agents/skills`).
- **setup/packs/adopt:** `removeAliasDuplicateLinks`, `projectDir` for extra IDE paths.
- **test-antigravity-dedupe.js** in `test:cli`.
- **KB:** `003-mcp-integration`, `05-api-and-integrations`, `11-known-risks-and-decisions` updated.

## v2026.06.08-mcp-ide-expansion

- **kenmark-hub.js:** `MCP_CAPABLE_IDES`, `MCP_IDE_CONFIG_KIND`, expanded `buildMcp*Targets`, `readMcpServersFromIdeConfig` / `writeMcpServersToIdeConfig`.
- **setup-skills.js:** MCP filters from requested `--ide` list (gemini MCP when codex+gemini selected).
- **KB:** `003-mcp-integration`, `05-api-and-integrations`, `11-known-risks-and-decisions` updated.

## v2026.06.08-gemini-codex-dedupe

- **kenmark-hub.js:** `dedupeAliasTargetIdes`, `removeGeminiCodexDuplicateLinks`; doctor warns on Gemini/Codex duplicate skills.
- **setup/packs/adopt:** Link once when Codex+Gemini selected; prune `~/.gemini/skills` duplicates after relink.
- **test-gemini-codex-dedupe.js** in `test:cli`.

## v2026.06.08-plans-tracker

- **Plans family:** `kenmark-plans-setup`, `list`, `check`, `maintain`, `execute`; tiered `kenmark-plan` writes `brain/plans/`.
- **Trackers:** `brain/issues/` and `brain/plans/` tracked in git; seeded `INDEX.md` scaffolds.
- **init:** Step 1b/1c bootstrap both trackers by default.

## v2026.06.08-release-2.3.13

- **Release:** package **2.3.13** (2026-06-08). PR #16 — legacy cleanup canonical false-positive; cleanup scope prompt wording.

 for the kenmark-skills repository.

## v2026.06.08-init-cli-upgrade

- **cli-package.js:** Shared npm latest check, semver compare, global install helpers.
- **kenmark-setup.js:** Init checks CLI version; optional global upgrade + re-exec.
- **kenmark-update.js:** `npm install -g kenmark-skills@latest` (was `npm update -g`).

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

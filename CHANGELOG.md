# CHANGELOG

## v2.3.17 — Antigravity IDE target (2026-06-11)

### Feature

- **`antigravity-ide` platform:** New `--ide` target for the standalone Antigravity IDE app (`~/.gemini/antigravity-ide/skills` global; `.agents/skills` + `.agent/skills` project). MCP merges to `~/.gemini/antigravity-ide/mcp_config.json`. Clarifies `antigravity` as Antigravity 2.0 Manager (not the IDE app).

### Fix

- **Antigravity copy-default:** `antigravity-cli`, `antigravity`, and `antigravity-ide` all default to copy mode (symlinks not discovered by Antigravity surfaces). Doctor warns per-surface when symlinks remain.

### Test

- **test-antigravity-dedupe.js:** Global/project `antigravity-ide` install paths; MCP dry-run includes all three Antigravity targets.

## v2.3.16 — Antigravity platform (2026-06-08)

### Feature

- **Antigravity platform support:** New `--ide` targets `antigravity-cli` and `antigravity` (IDE) for skills linking and MCP merge. CLI global skills at `~/.gemini/antigravity-cli/skills`; IDE at `~/.gemini/antigravity/skills` with copy-default (symlinks not discovered). Project scope links both `.agent/skills` and `.agents/skills` for IDE. MCP at standalone `mcp_config.json` paths. Antigravity-cli + Gemini shared-path dedupe (parallel to Codex/Gemini).

- **MCP IDE expansion:** Bundled MCP servers merge into ten JSON `mcpServers` IDEs — cursor, claude, gemini, antigravity-cli, antigravity, kiro, trae, trae-cn, rovo, qoder — with standalone and nested config handling in `kenmark-hub.js`. Codex, OpenCode, and minimax remain skills-only.

### Fix

- **Gemini/Codex dedupe:** When both `codex` and `gemini` are in `--ide`, skills link once to `~/.agents/skills` (Gemini’s preferred alias). Setup/adopt/packs prune Kenmark-managed duplicates from `~/.gemini/skills`. Doctor warns on remaining duplicates. MCP still targets `~/.gemini/settings.json` when gemini is in `--ide`.

### Test

- **test-antigravity-dedupe.js:** Antigravity-cli+Gemini dedupe, CLI-only path, IDE project dual-path copy, MCP dry-run.
- **test-gemini-codex-dedupe.js:** Codex+Gemini and Gemini-only install paths.
- **test-cli-smoke.js:** Dry-run MCP for gemini+kiro, codex+gemini, and antigravity-cli+antigravity partial targeting.

## v2.3.15 — Plans tracker (2026-06-08)

### Feature

- **Plans tracker:** Five new `kenmark-plans-*` skills (`setup`, `list`, `check`, `maintain`, `execute`) plus tiered **`kenmark-plan`** (Quick, Prototype, Full Feature, Dig Deep, ULTRATHINK) that writes indexed files to `brain/plans/`.
- **`kenmark-init`:** Bootstraps `brain/issues/` and `brain/plans/` INDEX by default (opt out with "brain only, no trackers").
- **Git policy:** `brain/issues/` and `brain/plans/` tracked in git by default; teams may gitignore locally.

### Docs

- Bundled skill count **41**; router, `skills/README.md`, and brain KB updated for plans family.

## v2.3.14 — Init CLI upgrade check (2026-06-08)

### Feature

- **`init`:** Detects outdated global CLI against npm `latest`; interactive default prompts to run `npm install -g kenmark-skills@latest` and re-exec init from the upgraded package. Non-interactive: warns unless `--upgrade-cli` is passed. `--skip-npm` skips the check (agent/CI default-friendly).
- **`update`:** Uses `npm install -g kenmark-skills@latest` instead of `npm update -g` for reliable cross-version upgrades.
- **`cli-package.js`:** Shared semver check, registry lookup, and global install helpers for init/update.

### Test

- **test-cli-package.js:** Semver comparison unit tests.

## v2.3.13 — Legacy cleanup + scope prompt (2026-06-08)

### Fix

- **kenmark-hub.js:** `listLegacyKenmarkSkillPaths()` no longer treats canonical bundled names (e.g. `kenmark-troubleshoot`) as legacy when `kenmark-${old}` equals the rename target; init/setup legacy cleanup no longer deletes active store skills.
- **interactive.js:** Cleanup interactive scope prompt asks where cleanup should run (not where skills should be installed); install/setup/update flows unchanged.

## v2.3.12 — Adopt pass portability reporting (2026-06-08)

### Fix

- **kenmark-hub.js:** `summarizeAdoptResults` / `formatAdoptPassSummary` — adopt pass logs now report `portability-refreshed` for existing store copies (`store-current`), not only newly adopted skills.
- **setup-skills.js, kenmark-packs.js, skills-adopt.js:** Use shared adopt summary (e.g. `Adopt pass: 0 adopted, 39 portability-refreshed of 39 candidate(s)`).

## v2.3.11 — Impeccable cwd-relative script repair (2026-06-07)

### Fix

- **kenmark-hub.js:** During catalog skill adopt/portability repair, rewrite agent-facing `node ./scripts/*.mjs` invocations in `SKILL.md` and `reference/*.md` to absolute store-resolved paths. Fixes impeccable setup failing when agents run scripts from a consumer project root (e.g. `kenmark-studio`) instead of the skill directory.
- **doctor:** Flags remaining cwd-relative script invocations in store and IDE copies.

## v2.3.10 — brain/ knowledge base + README slim (2026-06-07)

### Docs

- **brain/:** Initialized project knowledge base — `rules/`, numbered `kb/`, `features/`, INDEX, CHANGELOG. Documents CLI, 36 skills, MCP, recommended packs, hub store, and workflows.
- **README:** Reduced to quick start + pointers to `brain/kb/` (~250 lines vs ~800).
- **AGENTS.md:** Pointer stub to `brain/rules/standards.md`.
- **.gitignore:** Track `brain/` in git; exclude local `brain/issues/`.
- **Issue tracking routing:** Split "Need issue tracking?" into setup vs scan — `kenmark-issues-setup` bootstraps `brain/issues/` docs; `kenmark-issues-scan` finds bugs and files issues (not setup).
- **kenmark-init:** Optional Step 1b asks "Need issue tracking?" and runs `kenmark-issues-setup` Steps 2–4 when user opts in.
- **kenmark-issues-setup / scan / list / check:** Cross-references, redundancy note when init already created `INDEX.md`, and prerequisite guards.
- **skills/README / kenmark-router:** Updated day-to-day tables and issue tracking section.

## v2.3.9 — README interactive vs agent split (2026-06-07)

### Docs

- **README:** Quick install and Quick start show interactive `init` only; consolidated non-interactive flags, MCP, update, cleanup, and `KENMARK_SKILLS_NONINTERACTIVE` in new **Agents and automation (non-interactive)** section before License.
- **README:** Installation, Operations, and Kenmark hub deduped — middle sections point to the agent section instead of repeating `-y` examples.

## v2.3.8 — MCP server selection + init-centric CLI (2026-06-07)

### Feature

- **Interactive MCP:** `init`, `setup`, and `update` now prompt for individual MCP **servers** by name (from `config/mcp-servers.json`) instead of bundled profiles.
- **`--mcp-servers`:** Non-interactive flag to install specific servers (e.g. `--mcp-servers playwright,context7,fetch`). `--mcp-profile` and `--with-mcp` remain supported.

### Docs

- **README:** `init` is the single recommended first-install command; removed confusing `init` vs `setup` table. Legacy `setup` documented as backward-compat alias only.
- **README:** MCP server selection and `--mcp-servers` usage; migration examples (`setup -y` → `init --skip-recommended -y`).

### CLI

- **`setup` deprecation hint:** Prints one-line stderr note — prefer `npx kenmark-skills init --skip-recommended -y` (`setup` and `kenmark-skills-setup` bin unchanged).

### Test

- **test-cli-smoke.js:** `--mcp-servers` dry-run and updated plan text assertions.

## v2.3.7 — Cleanup managed skills (2026-06-07)

### Feature

- **`kenmark-skills cleanup`:** Expanded categories beyond broken/legacy hygiene — `--kenmark`, `--recommended` / `--packs`, `--all-managed`, and `--full`. Interactive mode prompts for categories. `--include-store` clears matching store entries. Only removes known Kenmark-managed or catalog pack skill names (never arbitrary user skills).

### Docs

- **README:** Cleanup operations table, examples, and clarification vs `uninstall`.

### Test

- **test-cleanup-temp-home.js:** Covers `--kenmark` and `--packs` modes; verifies user-owned skills are untouched.

## v2.3.6 — Cleanup subcommand (2026-06-07)

### Feature

- **`kenmark-skills cleanup`:** Opt-in removal of broken skill symlinks and proven legacy Kenmark paths (`--broken-only` default, `--legacy-only`, `--all`). Supports `--global` / `--project`, `--ide`, `--dry-run`, and `-y`. Reuses setup legacy ownership checks; proven legacy removals are backed up under `~/.kenmark/backups/legacy-cleanup/`.
- **`doctor`:** Suggested fix now points to `cleanup` before re-running `setup`.

### Test

- **test-cli-smoke.js:** `cleanup --dry-run --global -y`.
- **test-cleanup-temp-home.js:** Temp `HOME` integration test for broken symlink removal.

## v2.3.5 — MCP prompts in init/setup/update (2026-06-07)

### Feature

- **init / setup / update:** Interactive flows now ask whether to install or refresh bundled MCP servers and which profile to use (`none`, `web`, `research`, `deep`, `all`), with numbered choices and server lists like pack selection.
- **Non-interactive (`-y`):** MCP remains opt-in via `--mcp-profile` or `--with-mcp`; plain `-y` does not install MCP.

### Test

- **test-cli-smoke.js:** Dry-run assertions for init/setup/update with `--mcp-profile`.

## v2.3.4 — Wire recommended packs to all IDEs (2026-06-07)

### Fix

- **install-recommended / adopt:** Catalog packs with SKILL.md verify (e.g. `code-review-skill`, `graphify`) are adoptable and relinked to every `--ide` target, even when install is skipped as already present. Previously only `impeccable` and ECC were wired via the store.

### Test

- **packs-verify:** Assert an already-installed git-sync pack links into cursor, codex, gemini, opencode, and minimax after a multi-IDE install-recommended run.

## v2.3.3 — Update flag, install test, setup plan (2026-06-07)

### Fix

- **update:** Parse `--all` for non-interactive refresh of all recommended packs.
- **setup:** Adopt plan text clarifies catalog adoption targets selected IDE root(s) only.

### Test

- **install:** Assert non-selected IDE skill directories stay completely empty (not just kenmark-* free).

## v2.3.2 — IDE scoping, update catalog, README (2026-06-07)

### Fix

- **setup / adopt / relink:** Respect `--ide` selection instead of applying changes across all IDEs.
- **update:** Interactive pack prompt lists the full recommended catalog instead of a hardcoded impeccable/ecc subset.

### Docs

- **README:** Lead with `init` and `setup` commands for first-time onboarding.

### Chore

- **gitignore:** Ignore `node_modules/` and `package-lock.json` (avoid self-dependency lockfile in repo).

## v2.3.1 — Skill portability repair

### Fix

- **kenmark-hub.js:** Rewrite hardcoded IDE anchor paths (`.agents/.cursor/.claude/skills/<name>/`) to `./` when adopting catalog skills into `~/.kenmark/store`, including existing store copies (`store-current` repair). Doctor scans the store and linked IDE copies for non-portable paths; `adopt --symlink` relinks broken copies to the normalized store.

## v2.3.0 — Issues fix-and-ship orchestrator

### New skills

- **kenmark-issues-fix-and-ship (1.1.0):** End-to-end orchestrator — parse blob, dedupe INDEX, create issues, P0→P2 fix loop on feature branch, complete issues, pre-commit validation, `kenmark-commit`, PR-first merge with explicit user confirmation (`references/workflow.md`, `references/merge-safety.md`). Triggers include "fix issues end to end", "blob to merge", "scan fix commit and merge".

### Docs

- Bundled skill count **36** (`package.json`, `README.md`, `skills/README.md`, inventory keep list, router routing).
- Release metadata aligned for v2.3.0 (version bump, README counts, CHANGELOG section).

## v2.2.0 — Audit skills (security-review, performance, repo-deps)

### New skills

- **kenmark-security-review:** Read-only secure-code review (auth/RBAC, injection, uploads, SSRF, redirects, CORS, rate limits, security config). Delegates secrets to `kenmark-repo-secrets` and public readiness to `kenmark-repo-public`.
- **kenmark-performance:** Read-only performance review for Next.js/Node/Prisma/Mongo/React stacks — slow routes, N+1, bundle/hydration, caching, API latency, memory/CPU (P0–P3 impact model). Not a substitute for `kenmark-repo-quality`.

### Skills — enhancements

- **kenmark-repo-deps (1.2.0):** Monorepo/workspace drift, `packageManager` vs lockfile, duplicate React/Next majors, overrides/resolutions review, UI-library overlap, bundle/side-effect and client/server import boundary checks; expanded report sections.

### Docs / validation

- Bundled skill count **35** (README, `skills/README.md`, `package.json`, inventory keep list, router routing tables).
- Router audit boundaries, day-to-day README guidance, and cross-links in `kenmark-repo-hygiene` / `kenmark-setup`.
- **Skill activation tiers** in README (core daily, specialist, explicit admin); `kenmark-router` scoring respects the policy.

## v2.1.2 — Git branch policy and setup/docs polish

### Skills — git branch policy

- **kenmark-init (1.2.0):** `brain/rules/workflow.md` template adds **Git branch policy** table (`main`, `master`, `dev`, `develop`, `staging`, `production`); `deployment.md` cross-links; reset/modularize can merge policy into existing `workflow.md`; related `kenmark-commit` note.
- **kenmark-commit (2.1.2):** Extended default protected deployment branches (`staging`, `production`); workflow.md Git branch policy table overrides defaults.
- **kenmark-commit (2.2.0):** Step 2 branch safety — protected deployment branches plus stale/mismatched feature-branch check before staging; hard rule against stacking unrelated work on old branches.

### Docs / doctor

- **doctor / README:** WSL install-path warning, Windows setup note, and `homeDir` in doctor output for path debugging.

## v2.1.1 — Dangling legacy symlink cleanup

### Fix

- **kenmark-hub.js:** Use `lstatSync` / `pathEntryExists` instead of `existsSync` for removal, legacy cleanup, and symlink ownership proof so dangling Kenmark store symlinks are detected, backed up, and removed during setup.
- **kenmark-hub.js:** Legacy symlink backups write `SYMLINK_TARGET.txt` instead of copying missing targets.
- **kenmark-hub.js:** Doctor skill counts include valid symlinked skills with a resolvable `SKILL.md`.
- **doctor.js:** Suggest `setup --global --ide auto|all` when broken IDE symlinks are found.
- **test-broken-symlink-cleanup.js:** Regression test for dangling `issues-check` → store cleanup.

### Breaking (UX)

- **recommended-catalog.json (v5):** Primary mental model is **selectable optional installs** with repo-aware suggestions (`mode: selectable`), not profile-first setup. `profiles` renamed to **`presets`** (advanced/CI shortcuts). Default install selection is only **impeccable** + **code-review-skill** via `defaults.selectedIds`. SEO split into **`seo-geo-selected`** and **`seo-geo-full`** packs.
- **install-recommended / init:** Interactive flow is a **checklist** with `--suggest`, `--list`, `--explain`; `--list-profiles` aliases `--list-presets`. `--profile` still works for presets (`lean`, `core-next`, …).

### Fix

- **kenmark-hub.js:** Legacy skill and Claude command cleanup requires ownership proof (symlink to `~/.kenmark/store`, `.kenmark-managed` parent, Kenmark markers in `SKILL.md`, or `manifest.json` `source: kenmark-package`). Unproven same-name paths are skipped with `legacy-candidate-review-required`; proven removals are backed up under `~/.kenmark/backups/legacy-cleanup/<timestamp>/`.
- **setup-skills.js / kenmark-hub.js:** Stop generating Claude slash-command wrappers on install; install and uninstall remove stale `~/.claude/commands/kenmark-*.md` (legacy unprefixed wrapper names included). Namespaced skills under `~/.claude/skills/` are the supported entry point.

## v2.1.0 — Testing suite skills

### New skills

- **kenmark-test-plan:** Test strategy — layers, tools, ROI, CI gates before writing tests.
- **kenmark-test-unit:** Unit tests for functions, components, hooks, utilities.
- **kenmark-test-integration:** API, DB, service, and module boundary tests.
- **kenmark-test-e2e:** Browser/user-journey tests (Playwright, Cypress, etc.).
- **kenmark-test-mocks:** Fixtures, factories, MSW handlers, fake adapters.
- **kenmark-test-coverage:** Coverage and risk-gap audit (read-only).
- **kenmark-test-ci:** Wire tests into CI/CD and release gates.
- **kenmark-router / README / skills/README.md / validate-repo.js:** Routing table, docs, and bundled skill count 26 → 33.

## v2.0.3 — Optional pack verify-before-install

### Perf

- **kenmark-packs.js:** Verify-before-install skips upstream pack installers when verify already passes; `--force` reinstalls without tying to `--adopt-overwrite`. Skip message: `Already installed: <id> — skipping install`.
- **recommended-catalog.json (impeccable):** Global/project verify also checks `~/.cursor/skills/impeccable/SKILL.md`.
- **cli.js:** `version`, `--version`, and `-v` print package version from `package.json`.
- **recommended-catalog.js:** Prefer local `skills` CLI over `npx --yes skills` when available on PATH.
- **test-packs-verify-skip.js:** Regression tests for skip and `--force` reinstall.
- **test-cli-smoke.js / validate-repo.js:** Wire verify-skip tests into `npm test`; assert update `--both` uses `--ids`, not `--all`.

## v2.0.2 — Update flow safe defaults

### Fix

- **kenmark-update.js:** Interactive and non-interactive default is Kenmark-only (not both). Empty recommended pack choice uses `defaultSelectedIds` (`--ids`), never implicit `--all`. After top-level confirmation, `setup-skills.js` always receives `-y` and `--ide auto` (or explicit IDE); recommended refresh always forwards `--ide auto`.
- **kenmark-hub.js:** `--ide auto` resolves to detected IDEs or default agent IDEs.
- **test-cli-smoke.js:** Assert update dry-run commands for Kenmark-only and both modes.
- **kenmark-update skill:** Docs match Kenmark-only default and agent example.

## v2.0.1 — Issues ID ledger

### Fix

- **kenmark-issues-scan / setup / check / maintain / list:** Global immutable issue IDs — next ID from `INDEX.md` + active + `completed/` (fixes ID reuse when issues are archived); ID Ledger in setup template; preservation rules on close; maintain validates `Last Assigned ID`; `validate-repo.js` regression markers on scan skill.

## v2.0.0 — Kenmark-prefixed skill names (semver major)

**Major version:** Every bundled Kenmark skill was renamed (`commit-push` → `kenmark-commit`, `skills-router` → `kenmark-router`, `repo-quality-gates` → `kenmark-repo-quality`, etc.). Slash commands, symlinks, and docs that referenced unprefixed or legacy names break until you re-run setup. Do not publish as 1.x.

### Fix

- **CLI scripts:** Renamed `scripts/skills-init.js`, `skills-install-recommended.js`, and `skills-update.js` to `kenmark-setup.js`, `kenmark-packs.js`, and `kenmark-update.js` so `package.json` `files`, `cli.js`, and published tarballs match on-disk paths (`init`, `install-recommended`, `update`).
- **validate-repo.js:** Assert each required `package.json` `files` entry exists on disk (except globs) and each `cli.js` spawn target is present — catches publish breaks when manifest and filesystem diverge.

### Breaking rename (23 bundled skills)

All Kenmark bundled skills now use the `kenmark-<domain>` namespace (e.g. `kenmark-router`, `kenmark-commit`, `kenmark-repo-quality`). Folder names, frontmatter `name`, and IDE symlinks align; invoke skills by name (e.g. `kenmark-router`), not duplicate slash-command wrappers.

- **kenmark-hub.js:** `LEGACY_SKILL_RENAMES` map; `setup` removes unprefixed folders, old `kenmark-<legacy>` paths, and stale Claude command wrappers on install.
- **setup-skills.js:** Claude command wrappers removed on install/uninstall; no longer created (use `kenmark-*` skills directly).
- **Docs / router / inventory:** References and registry inference updated for `kenmark-*` names.

Run `npx kenmark-skills setup --global --force -y` after upgrading to migrate local installs (or `--ide cursor,claude,codex` to target specific harnesses; use `--ide all` only when you need every detected IDE path).

## v1.5.0 — Quality gates, catalog profiles, and validation

### kenmark-repo-quality

- **kenmark-repo-quality (1.2.0):** Step 2b — discover CI configs (`find` on workflows/GitLab/Bitbucket/Circle) and grep workflow commands so `ci-parity` mode prefers real CI commands over guessed package scripts.
- **kenmark-repo-quality (1.1.0):** Prefer `./node_modules/.bin/` for direct typecheck/lint/format invocations; use `npx` only as fallback when local binaries are missing.

### New skill

- **kenmark-repo-quality (1.0.0):** Universal verify-phase workflow — discover package scripts, run safe typecheck/lint/format/build/test/dev gates in order, classify failures, report fix plan without auto-editing (`category: workflow`, `phase: verify`, `risk: shell`).
- **kenmark-router / README / package.json / skills/README.md:** Kenmark skill count 22 → 23; routing row for dev/build/type/lint/format errors.

### Validation entry points

- **README / script headers:** Document two equivalent paths — `npm run validate` / `npm test` → `scripts/validate-repo.js`; `kenmark-skills validate` → `scripts/validate.js` → `validate-repo.js`. Both files remain in `package.json` `files`.
- **validate-repo.js:** Regression check that `cli.js` spawns `validate.js`, not `validate-repo.js` directly.
- **validate-repo.js:** Enforce bundled skill count consistency across `package.json`, `README.md`, and `skills/README.md` vs `skills/user-skills/*/SKILL.md`.

### Repo skill routing

- **kenmark-repo-hygiene:** Clutter-only scope; removed broad `sanitize repo` trigger; expanded handoff table for public-readiness and secrets phrases.
- **kenmark-repo-public:** Added public-readiness trigger phrases (`public repository readiness`, `prepare repo for public`, `sanitize before public`, etc.); clarified not for clutter-only audits.
- **kenmark-router:** Tie-break and ambiguity note — public/open-source/sanitize-before-public → `kenmark-repo-public`, not `kenmark-repo-hygiene`.
- **kenmark-repo-release (1.0.1):** Ship vs verify boundary with `kenmark-repo-quality`; smoke-only quality-gates step; hand off failing build/type/lint/test/runtime checks to `kenmark-repo-quality`.

### Init, recommended packs, and catalog

- **`kenmark-setup.js`:** Single `setup-skills` run with comma-separated `--ide` (no per-IDE loop / repeated adopt passes). Forwards `--ide` to `kenmark-packs` so curated packs align with the chosen targets.
- **`kenmark-packs.js` / `skills-adopt.js`:** `--ide` accepts `cursor,codex,claude` and `all` via shared `resolveExplicitTargetIdes` in the hub.
- **`recommended-catalog.json`:** `core-next-lite` is Impeccable + code review only; `core-next` unchanged (lite + Graphify). New **`core-next-agentic`** (core-next + ECC minimal). ECC removed from default `core-next-lite` and `audit-review`. ECC pack uses **`installStrategy: manual`** until `ecc-install` is verified on npm; ECC `install.global` / `install.project` use `manual: true` (no dead `ecc-install` commands).
- **`validate-repo.js`:** Manual-strategy packs require `manual: true` on global/project scopes and must not set `install.*.command`.
- **Impeccable:** Catalog warning documents upstream partial harness failures when verify passes.

### Brain KB (kenmark-init + kenmark-commit)

- **kenmark-init (1.1.0):** Step 1.5 inspects the repo and creates numbered `brain/kb/` (`00`–`11`, `features/`, `decisions/`); INDEX and pointer stub reference KB; `standards.md` / `workflow.md` templates add KB maintenance and update requirements.
- **kenmark-commit (1.1.0):** Pre-commit Brain KB check — behavioral code changes should update `brain/kb/` or `brain/CHANGELOG.md`.
- **validate-repo.js:** Regression checks that `kenmark-init` and `kenmark-commit` retain KB markers.

## Planned

- **`kenmark-troubleshoot-template` (CLI)** — `npx kenmark-skills kenmark-troubleshoot-template --title "cursor slowdown"` writes `brain/kenmark-troubleshooting/YYYY-MM-DD-<slug>.md` via `scripts/brain-template.js` (scaffolding exists; not registered in `cli.js` yet). Extend the same module for other `brain/` artifacts later. Referenced from the **kenmark-troubleshoot** skill docs.

## v1.4.0 — Repo skill family

### Repo operating system (8 skills)

- **kenmark-repo-hygiene (1.1.0):** Clutter-focused audit; delegates deep secrets to `kenmark-repo-secrets` and publish gate to `kenmark-repo-public`.
- **kenmark-repo-secrets:** Read-only deep credential scan with mandatory redaction and history-cleanup guidance.
- **kenmark-repo-public:** Read-only safe-to-publish verdict (Yes / No / Conditional), blockers, and history-rewrite flag.
- **kenmark-repo-kb:** Incremental `brain/kb/` and `brain/CHANGELOG.md` updates after code changes.
- **kenmark-repo-docs:** Documentation quality audit (README, env, scripts, KB freshness, links).
- **kenmark-repo-structure:** Read-only folder layout and module-boundary recommendations.
- **kenmark-repo-deps:** Read-only package health (unused/duplicate deps, lockfile consistency).
- **kenmark-repo-release:** Pre-ship checklist (version, changelog, tests, build, meta consistency).
- **kenmark-router / kenmark-troubleshoot / kenmark-setup / kenmark-maintain:** Repo family routing table; specialist tie-break over `kenmark-repo-hygiene`.
- **scripts/skills-inventory.js:** `KEEP_ALWAYS` includes all `repo-*` skills.
- **README / package.json / skills/README.md:** Kenmark skill count 15 → 22.

## v1.3.0 — Universal kenmark-troubleshoot, validation, MCP profiles

### IDE detection

- **`detectInstalledIdes`:** No longer treats a parent folder as “installed” when it only contains `skills/` (avoids false positives after `setup --ide all`). Also treats `~/.claude.json` as Claude install evidence.
- **Kenmark-managed markers:** `setup` writes `.kenmark-managed` under each IDE skills directory it creates; **`detectManagedIdes`** lists those paths separately from real installs.
- **Interactive setup/init/doctor:** Prompts and doctor output show **Detected** vs **Kenmark-managed**; auto-detect / `--ide` omission uses detected IDEs only (defaults to `cursor`, `claude`, `codex` when none detected).

### Polish

- **README:** Install pin example updated to `@1.3.0`; documents `@latest` alternative.
- **package.json:** `npm run mcp:uninstall` → `kenmark-skills mcp uninstall`.
- **doctor:** `--no-fail` exits 0 with issues still listed in output/JSON (`ok: false`); distinct from `--soft` (warnings-only). Default still non-zero for CI.

### Troubleshoot & workflow

- **kenmark-troubleshoot:** New bundled workflow skill (`phase: diagnose`) — universal evidence-first diagnosis, hypothesis tree, test plan, and ranked action plan; optional sub-agent tracks for deep investigation.
- **kenmark-troubleshoot:** Trigger phrases for Cursor slowdown, production diagnosis, deployment root cause, and test-plan-before-fix requests.
- **kenmark-troubleshoot:** `risk` set to `write-files` (TodoWrite, optional `brain/kenmark-troubleshooting/` artifacts); default investigation mode remains read-only until user approval or explicit repo documentation workflow.
- **kenmark-troubleshoot:** Evidence bundle (`E1`, `E2`, …) table and **Evidence ↔ hypotheses** citations in hypotheses, tests, final report, and `brain/kenmark-troubleshooting/` artifacts.
- **kenmark-router:** `infer_category` / `infer_phase` recognize kenmark-troubleshoot/diagnose triggers; category quick map includes kenmark-troubleshooting; `diagnose` documented as a workflow phase; **Recommended Kenmark workflows** section (kenmark-troubleshoot before router).
- **README / skills/README.md / kenmark-setup:** Documented day-to-day workflow order with `kenmark-troubleshoot` first; trigger examples for production/debug/test-plan phrasing.
- **README / package.json / skills/README.md:** Kenmark skill count 13 → 14.

### Validation

- **validate / doctor split:** `kenmark-skills validate` (repo/package health; `npm test` / `npm run validate`) vs `kenmark-skills doctor` (local install only: store, manifest, MCP, IDE links, symlinks, hash drift). `doctor --soft` reports warnings and exits 0 (useful before first `setup`). Catalog and package invariants are no longer checked by `doctor`.
- **validate-repo.js / package.json:** `npm run validate` and `npm test` — automated checks for skill frontmatter, recommended catalog profiles/packs, package `files`/scripts, and forbidden project-specific terms. `npm test` no longer runs `doctor` (missing `~/.kenmark/store` failed CI/fresh clones); use `npm run doctor:local` after setup.

### Recommended catalog (v4)

- **recommended-catalog.json (v4):** Setup profiles `lean` (default), `core-next` (Kenmark stack), `growth-seo`, `audit-review`, `power-user`; overlap install rules; richer pack metadata (`bloatScore`, `weight`, `bestFor`, `avoidWhen`, SEO install modes, ECC profiles).
- **recommended-catalog.json:** `power-user` renamed to `experimental-heavy`; new `core-next-lite` profile (Impeccable + review + ECC minimal); `core-next` extends `core-next-lite` + Graphify. SEO pack adds `selectedBloatScore` (profile totals use selected score when installing subset skills).
- **recommended-catalog.json:** `core-next` copy uses universal wording (`agency/client projects`, Next.js full-stack notes) instead of Kenmark-as-workflow assumptions.
- **recommended-catalog.js:** Profile resolution (`extends`, pack merge), install plan builder, weight/bloat summaries, per-skill SEO installs; bloat totals respect `selectedBloatScore` for selected-skills SEO installs; catalog list shows pack + selected bloat.
- **recommended-catalog.json / recommended-catalog.js:** SEO selected-skills profiles (e.g. `growth-seo`) use `batchSkillInstall` — one `npx skills add … -s` with space-separated skill names instead of six separate installs; per-skill fallback and `Installing SEO/GEO selected skills: N/M` progress when batch is unavailable.
- **recommended-catalog.js / kenmark-packs.js:** When `entry.seoSkills` is set, post-install verify requires every selected skill’s `SKILL.md` (not just `keyword-research` or the full pack directory), so partial batch installs fail verify for `growth-seo`.
- **recommended-catalog.json / recommended-catalog.js:** `code-review-skill` uses `installStrategy: "git-sync"` — clone on first install, `git pull --ff-only` when the target is already a repo; safe to re-run `install-recommended --profile lean`.
- **kenmark-packs.js:** `--profile`, `--list-profiles`; interactive profile picker with install preview; power-user confirmation; ECC default **minimal** (was `core`). Adopt pass forwards `--copy`, `--symlink`, `--prefer-copy-on-windows`, `--adopt-overwrite` (same as `setup` / `adopt`). Runs git-sync installs via Node instead of a bare `git clone` shell command.
- **interactive.js:** `promptSelectProfile`, `printProfileSummary`, `promptHighBloatConfirm`.
- **kenmark-setup.js:** Recommended step uses profiles; `--profile` for agents.
- **kenmark-packs/SKILL.md, README, cli.js:** Docs updated for profile-first workflow.

### Issues skills

- **kenmark-issues-setup / kenmark-issues-scan / kenmark-issues-list / kenmark-issues-maintain:** Expanded default `area` values (`frontend`, `backend`, `auth`, `performance`, `dx`, `docs`, `workflow`, `unknown`, …); `worker` documented as optional when the repo has background jobs; maintenance accepts legacy `maintainability`.

### MCP

- **MCP opt-in:** `setup` no longer installs bundled MCP by default. Use `--with-mcp` (profile `all`) or `--mcp-profile <name>` (`none`, `web`, `research`, `deep`, `all`). `--skip-mcp` overrides an explicit opt-in. Full `uninstall` removes Kenmark-managed MCP entries when present.
- **MCP uninstall:** `npx kenmark-skills mcp uninstall` and `uninstall --mcp-only` remove only Kenmark MCP from IDE configs and `~/.kenmark/store/mcp.json`; skill links are unchanged.
- **doctor / MCP:** Reports MCP store, installed profile, servers, IDE configs touched, and whether `npx` / `uvx` are on PATH; warns when `fetch` (research/deep profiles) needs `uvx` but it is missing.
- **config/mcp-profiles.json:** Profile → server name mapping for bundled MCP.
- **kenmark-hub.js / setup-skills.js:** Profile filtering, manifest records `mcp.profile`.

## v1.2.7 — Doctor command, adopt guards, init hub alignment

- **`scripts/doctor.js`:** New `kenmark-skills doctor` command — checks Node version, store, manifest, catalog, detected IDE roots, per-IDE skill counts, broken symlinks, and store/IDE hash mismatches. Optional `--json <path>` for a full report.
- **`kenmark-hub.js`:** `runDoctor()` powers the doctor command; adopt leaves skills in **review-required** when store content differs from the IDE copy unless `--force` / `--adopt-overwrite` is passed (full bundled → store → IDE source priority is a future pass).
- **`setup-skills.js`:** `--strict-targets` fails when no IDE skill directory is detected and `--ide` is omitted; `--symlink` / `--prefer-copy-on-windows` control link mode on Windows.
- **`skills-adopt.js`:** `--adopt-overwrite` (alias `--force`) overwrites store from IDE copies; setup surfaces review-required counts after adopt.
- **`kenmark-setup.js`:** IDE detection delegates to `detectInstalledIdes()` + `buildGlobalTargets` / `buildProjectTargets` from the hub (same paths as `setup`).
- **README:** CLI table includes `doctor`; common flags for `--strict-targets`, `--symlink`, `--prefer-copy-on-windows`, `--adopt-overwrite`; adopt review-required note.

## v1.2.6 — Standardized skill frontmatter and layout docs

- **All Kenmark skills:** Unified YAML frontmatter (`name`, `version`, `category`, `scope`, `phase`, `description`, `triggers`, `allowed-tools`, `risk`, `disable-model-invocation`). Removed legacy `preamble-tier`.
- **Categories:** `onboarding`, `workflow`, `git`, `issues`, `admin` (flat dirs under `skills/user-skills/`; logical map in `skills/README.md`).
- **Scopes:** `universal` on all bundled skills; `setup` skips any skill with `scope: project-specific` in frontmatter.
- **kenmark-hub:** `setup` skips skills with `scope: project-specific` in frontmatter.
- **Risk levels:** `read-only`, `write-files`, `shell`, `git-write`, `destructive-possible`.
- **kenmark-router:** Registry includes `scope` / `project`; inference aligned with new categories.

## v1.2.5 — kenmark-init modular rules

- **kenmark-init:** Split default rules into `brain/rules/standards.md` (lean universal), `stack.md`, `workflow.md`, `testing.md`, `ui.md`, and optional `deployment.md` — no mandatory MCP, sub-agents, or browser tooling.
- **kenmark-init:** IDE stub reads `standards.md` first; other rule files only when relevant to the task.
- **kenmark-init:** `sync-full` embeds lean `standards.md` only; migration path for monolithic legacy `standards.md`.
- **README:** Brain onboarding note reflects modular `brain/rules/`.

## v1.2.4 — Kenmark hub MCP servers

- **`config/mcp-servers.json`:** Bundled MCP definitions (Playwright, Context7, sequential-thinking, fetch via `uvx`, Browser MCP).
- **`kenmark-hub.js`:** MCP store at `~/.kenmark/store/mcp.json`; merge into Cursor (`mcp.json`) and Claude (`~/.claude.json` or project `.mcp.json`); uninstall removes Kenmark-managed entries only.
- **`setup-skills.js`:** Runs MCP install on `setup` by default; `--skip-mcp` to disable; `--force` overwrites existing server entries with the same name.
- **README:** Kenmark hub MCP section and CLI flag table.

## v1.2.2 — kenmark-init stub-first (multi-IDE)

- **kenmark-init:** Default sync mode is **`stub`** — identical pointer block in selected `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/project-standards.mdc`, `.cursorrules`; full standards stay only in `brain/rules/standards.md` with a required **Read** at conversation start.
- **kenmark-init:** Optional **`sync-full`** embeds the entire standards file inside merge markers (previous default behavior).
- **kenmark-init:** Documents harness-agnostic design (no Cursor hooks); recommends `AGENTS.md` for multi-IDE coverage.
- **README:** Updated kenmark-init description and brain onboarding note.

## v1.2.0 — Explicit interactive init (no silent defaults)

- **.gitignore / .npmignore:** Ignore entire `brain/` (local workspace); release notes at root `CHANGELOG.md` (npm `files`). `.claude/`, `.cursor/`, `.agents/` remain gitignored.
- **kenmark-setup.js:** Interactive flow starts with nothing selected; Kenmark and recommended packs each require an explicit yes. Scope, IDE targets, pack list, ECC profile, and final confirm all require explicit choices (empty Enter does not proceed).
- **interactive.js:** Added `required`, `noDefaults`, and `requiredConfirm` options for scope, IDE, pack, ECC profile, and confirm prompts.
- **kenmark-packs.js:** Interactive pack picker no longer falls back to `defaultSelected`; `--all` installs every catalog pack. Confirm requires explicit yes in interactive mode.
- **recommended-catalog.json:** `impeccable.defaultSelected` set to `false`.
- **kenmark-setup, kenmark-packs, README:** Docs and agent examples updated (`init -y` no longer implies recommended packs; use `--ids` or `--all`).

## v1.1.9 — Adopt defaults, docs, package metadata

- **.gitignore / .npmignore:** Ignore `.claude/`, `.cursor/`, `.agents/` (local IDE installs; source of truth remains `skills/user-skills/`). Removed previously tracked project copies from git.
- **kenmark-packs.js:** After each pack install, runs **adopt** into `~/.kenmark/store` and relinks IDEs. New flags: `--skip-adopt`, `--ide` (limit relink target).
- **kenmark-update.js:** Drops separate `skills-adopt.js` invocation; adopt runs inside `setup` and `install-recommended` (forwards `--skip-adopt`, `--ecc-profile`, `--ide`).
- **README:** At-a-glance counts (13 skills, 8 CLI commands); **While coding** group for `kenmark-router`; full CLI table including `uninstall`; **`init` vs `setup`** and **Adopt (on by default)** sections; repository layout notes `scripts/`.
- **package.json:** Bump to 1.1.9; description reflects skills + CLI; npm scripts `adopt` and `uninstall`; keywords `claude-code`, `subagents`, `cli`.

## v1.1.8 — More IDE targets and setup adopt

- **kenmark-hub.js:** Inventory and relink scan **Kiro**, **Trae** / **Trae CN**, **Rovo Dev**, and **Qoder** (`~/.kiro`, `~/.trae`, `~/.trae-cn`, `~/.rovodev`, `~/.qoder`). `relinkSkillsToIdes` pre-creates target skill directories so `setup --ide kiro` materializes `~/.kiro/skills/` even before skills link.
- **setup-skills.js:** After Kenmark install, runs **adopt** for catalog skills already present in any IDE root (`--skip-adopt`, `--ecc-profile` flags). Help text updated.

## v1.1.4 — Multi-pack recommended catalog

- **recommended-catalog.json (v3):** Catalog expanded from 1 to 5 packs: `impeccable` (default), `ecc` (minimal/core/full profiles, default `minimal`), `graphify` (Python via uv/pipx), `code-review-skill` (git clone), `seo-geo-claude-skills` (npx). Dropped `defaults.eccProfile`; the profile now lives on the `ecc` pack itself.
- **scripts/kenmark-packs.js:** Reused existing `id === "ecc"` special-casing to wire up the ECC profile prompt and `{{profile}}` placeholder substitution. CLI now accepts `--ecc-profile minimal|core|full` (e.g. `npx kenmark-skills install-recommended --ids ecc --ecc-profile minimal --global -y`).
- **kenmark-packs, kenmark-setup, kenmark-update, README:** Docs and examples updated to reflect the multi-pack catalog. The "ECC, gstack not in this catalog" note is gone; the Impeccable-only pack table now lists all 5 packs with their install methods.
- **Removed:** `compound-engineering` pack entry (replaced by `ecc` as the preferred harness pack).

## v1.1.3 — Impeccable-only recommended catalog

- **recommended-catalog.json (v3):** Removed `ecc` and `gstack` packs; only **Impeccable** remains (`defaultSelected: true`). Dropped `defaults.eccProfile`.
- **kenmark-packs, kenmark-setup, kenmark-update, README:** Docs and examples updated for Impeccable-only curated installs. ECC/gstack can still be installed separately outside the catalog.

## v1.1.2 — gstack in recommended catalog

- **recommended-catalog.json:** Added [gstack](https://github.com/garrytan/gstack) pack (`id: gstack`) with global `git clone` + `./setup` and project team-mode via `gstack-team-init optional`; `defaultSelected: false`.
- **kenmark-packs:** Documented gstack install commands, requirements (Git, Bun), and overlap note with ECC.

## v1.1.1 — ECC adopt scope fix

- **`kenmark-hub.js`:** ECC adopt names come from ECC `install-profiles.json` / `install-modules.json` (profile from catalog, default `core`), not every skill under `~/.claude/skills`. Optional pack-level `adoptSkillNames` override in `recommended-catalog.json`.

## v1.1.0 — Kenmark unified skill hub

- **`~/.kenmark/store/skills`:** Canonical store for Kenmark bundled skills; IDE paths symlink (or copy on Windows) instead of blind per-IDE copies.
- **`scripts/kenmark-hub.js`:** Manifest, install-to-store, relink, adopt catalog skills (bundled + Impeccable + ECC skill folders).
- **`setup-skills.js`:** Store + link; `--copy`, `--force`, `--keep-store` / `--no-keep-store` on uninstall.
- **`kenmark-update.js`:** Runs adopt after setup/recommended by default; `--skip-adopt`.
- **CLI:** `npx kenmark-skills adopt`.
- **`skills-inventory.js`:** Scans `kenmark-store`; verdict `adopt-candidate`; `issues-*` in `KEEP_ALWAYS`.
- **Docs:** README hub section; **kenmark-setup**, **kenmark-update**, **kenmark-maintain**, **kenmark-router** (registry merges store + agents).

## v2026.06.02-2345-minimax-code-target

- **Setup / init / inventory:** Added **MiniMax Code** as an install target (`~/.minimax/skills`, project `.minimax/skills`). Auto-detect when `~/.minimax` exists.
- **README:** Documented MiniMax Code global skills path.

## v2026.06.02-2330-readme-skills-grouped

- **README:** Reorganized "What's included" by use case — onboard, ship, `issues-*`, `skills-*` — with workflow order within each group.
- **README:** Extended manual Claude uninstall `rm` list to include all `skills-*` skill folders.

## v2026.06.02-2320-kenmark-maintain-interactive-docs

- **kenmark-maintain:** document `kenmark-setup`, interactive-first CLI, inventory TTY prompts, and `-y` for agents.
- Synced `.cursor/` and `.claude/` copies for `kenmark-setup`, `kenmark-packs`, `kenmark-update`, `kenmark-maintain`.

## v2026.06.02-2315-interactive-cli-init
- **Interactive-first CLI:** all setup/install/init flows prompt in a TTY by default; agents use explicit flags + `-y` (or `KENMARK_SKILLS_NONINTERACTIVE=1`).
- Added **`scripts/interactive.js`** shared prompts (scope, IDE, action, confirm).
- **`setup-skills.js`:** interactive install/uninstall wizard; `-y`, `--dry-run`, comma-separated `--ide`.
- **`kenmark-setup.js`** + **`npx kenmark-skills init`:** first-time onboarding (Kenmark + optional recommended defaults).
- **`kenmark-packs.js`:** shared prompts, numbered pack selection, Enter = default packs.
- **`kenmark-update.js`:** shared `promptScope` / `confirmPlan`.
- **`skills-inventory.js`:** interactive output path choice; `-y` for agents.
- New skill **`kenmark-setup`**, README table, `package.json` `files` + `init` script.

## v2026.06.02-2230-kenmark-update
- Added **`kenmark-update`** skill and **`scripts/kenmark-update.js`**: interactive refresh for Kenmark skills, optional `npm update -g kenmark-skills`, and optional recommended-pack reinstall via npx.
- CLI: `npx kenmark-skills update` with flags `--kenmark-only`, `--recommended-only`, `--both`, `--global`, `--project`, `--ide`, `--npm-only`, `--dry-run`, `-y`.
- Wired `kenmark-update` into inventory `KEEP_ALWAYS`, README, and cross-links from **kenmark-maintain** / **kenmark-packs**.

## v2026.06.02-2200-recommended-catalog-npx-interactive
- **recommended-catalog.json v2:** removed git-clone install paths; each pack defines `install.global` and `install.project` npx commands.
- **Impeccable:** global `npx skills add pbakaus/impeccable -g -y`; project `npx impeccable skills install`.
- **ECC:** `npx -p ecc-universal ecc-install` with profile `core` (default), targets `claude` (global) or `cursor` (project); documented single-path warning vs marketplace plugin.
- **kenmark-packs.js:** interactive scope (global/project), pack selection, ECC profile prompt; flags `--global`, `--project`, `--scope`, `--ecc-profile`.
- Updated **kenmark-packs** skill docs, README, and synced `.cursor`/`.claude` catalog copies.

## v2026.06.02-2115-rename-kenmark-router
- Renamed **`skill-router`** → **`kenmark-router`** for consistent `skills-*` Kenmark naming.
- Registry path is now `skills/user-skills/kenmark-router/registry.json`; Claude slash command is `/kenmark-router`.
- After upgrading, remove old installs (`skill-router` folders and `kenmark-skill-router.md`) or re-run `npx kenmark-skills setup`.

## v2026.06.02-2100-kenmark-maintain-and-recommended-install
- Added **`kenmark-maintain`** skill: inventory installed `SKILL.md` trees, group by name, flag vendored mirrors (e.g. gstack), recommend keep vs remove — never auto-deletes.
- Added **`kenmark-packs`** skill and **`recommended-catalog.json`** with curated packs: [Impeccable](https://github.com/pbakaus/impeccable), [Everything Claude Code](https://github.com/affaan-m/everything-claude-code).
- Added CLI commands: `npx kenmark-skills inventory` and `npx kenmark-skills install-recommended` (`--list`, `--all`, `--ids`, `--dry-run`, `-y`).
- Published scripts: `scripts/skills-inventory.js`, `scripts/kenmark-packs.js`.

## v2026.06.02-2000-skill-description-normalization
- Normalized skill frontmatter descriptions from YAML block style (`description: |`) to single-line `description: "..."` format.
- Applied across all local `SKILL.md` files so skill descriptions render consistently in clients that expect inline description values.

## v2026.06.02-1955-uninstall-version-lag-kenmark-troubleshooting
- Added uninstall kenmark-troubleshooting to README for `Unknown command: uninstall` caused by older `npx` package versions.
- Documented explicit `npx kenmark-skills@latest` usage, npm cache clean fallback, and manual Claude cleanup commands.

## v2026.06.02-1945-uninstall-command-support
- Added `uninstall` support to the package CLI (`npx kenmark-skills uninstall`) with `--global|--project` and `--ide` targeting.
- Setup installer now supports `--uninstall` mode and removes only Kenmark-installed skill directories from target paths.
- Claude-specific uninstall also removes generated `/kenmark-*` command wrappers from `.claude/commands`.
- Added `uninstall:skills` npm script and documented global/project uninstall flows in README.

## v2026.06.02-1938-claude-command-wrappers
- Updated setup installer to generate Claude Code slash-command wrappers under `.claude/commands` for every shipped Kenmark skill.
- This enables direct slash usage (for example `/kenmark-init`) in addition to selecting skills from `/skills`.
- Updated README to document Claude wrapper commands and restart note.

## v2026.06.02-1930-readme-npx-first-install
- Updated README install guidance to remove the clone-based setup path.
- Reframed Option B as local/project installation via `npx kenmark-skills setup --project`.
- Kept install flow focused on global npm install and npx-based usage.

## v2026.06.02-1925-cli-setup-modes-targets
- Added package CLI entrypoint so setup can run as `npx kenmark-skills setup` (plus existing `kenmark-skills-setup` bin).
- Expanded setup script to support install modes: `--global` (default) and `--project`.
- Added broader harness target mappings: Cursor, Codex, Claude, Gemini, OpenCode, Kiro, Trae (`trae` and `trae-cn`), Rovo, and Qoder.
- Updated README install docs with new command syntax, install modes, and expanded target list.

## v2026.06.02-1920-global-setup-script
- Updated install docs so Option A is now global npm install with a one-command setup flow.
- Added `scripts/setup-skills.js` to auto-copy packaged skills to detected IDE paths (`~/.cursor/skills`, `~/.agents/skills`, `~/.claude/skills`) with `--ide` override flags.
- Wired setup into `package.json` via `setup:skills` script and global `kenmark-skills-setup` bin.

## v2026.06.02-1912-kenmark-init-user-choice
- kenmark-init now asks which agent config files to sync instead of creating all targets by default.
- Brain scaffold still always runs; only user-selected files (CLAUDE.md, AGENTS.md, Cursor, GEMINI.md) are written.

## v2026.06.02-readme
- Added root `README.md` with skill inventory, install paths (Cursor, `~/.agents/skills`, npm), usage notes, and repo layout.

## v2026.06.02-package-metadata
- Updated `package.json` description, authors, and GitHub URLs for Kenmark ITan Solutions (`tanoojmehra/kenmark-skills`).

## v2026.06.02-1905-kenmark-init-cross-agent
- Expanded `skills/user-skills/kenmark-init/SKILL.md` to bootstrap `brain/` and sync standards to `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and `.cursor/rules/project-standards.mdc`.
- Documented `brain/rules/standards.md` as source of truth with `kenmark-init` merge markers for idempotent updates across Claude Code, Codex, and Cursor.

## v2026.06.02-1810-init-skills
- Initialized project scaffold with local `skills/`, `brain/`, and `temp/` directories.
- Copied user-authored skills from `~/.claude/skills` and `~/.codex/skills` into workspace-local skill packs.

## v2026.06.02-1814-skill-filter
- Filtered copied skills to requested set only: `issues-*`, `kenmark-commit`, and `skill-router`.
- Re-copied using symlink target resolution so requested skills are fully included.

## v2026.06.02-1819-skill-unify
- Merged split skill packs into a single folder: `skills/user-skills/`.
- Deduped by skill name and preserved source provenance in `skills/user-skills-manifest.md`.
- Removed `skills/claude-user-skills/` and `skills/codex-user-skills/` after merge.

## v2026.06.02-1820-brain-rules-skill
- Added `skills/user-skills/brain-rules/SKILL.md` with all provided Cursor rules embedded in one reusable skill.
- Preserved all rule sections and bullet points from the supplied rule set.

## v2026.06.02-1826-npm-package-config
- Added root `package.json` for npm publishing with public access config and Node engine requirement.
- Whitelisted publish files to include unified user skills and changelog artifacts only.
- Added helper scripts: `pack:check` and `publish:public`.

## v2026.06.02-1844-kenmark-init-rename
- Renamed skill folder from `skills/user-skills/brain-rules/` to `skills/user-skills/kenmark-init/`.
- Updated skill title to `Init Brain Skill`.
- Updated skill inventory files to include `kenmark-init` and refresh counts.

## v2026.06.02-1851-skill-router-registry-runtime
- Updated `skills/user-skills/skill-router/SKILL.md` to generate `skills/user-skills/skill-router/registry.json` at runtime on each invocation.
- Added repo and publish ignores so the generated registry file is not committed or shipped (`.gitignore`, `.npmignore`).
- Removed tracked `skills/user-skills/skill-router/registry.json`; it is now per-user generated state.


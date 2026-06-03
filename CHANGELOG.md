# CHANGELOG

## Unreleased

### Validation entry points

- **README / script headers:** Document two equivalent paths — `npm run validate` / `npm test` → `scripts/validate-repo.js`; `kenmark-skills validate` → `scripts/validate.js` → `validate-repo.js`. Both files remain in `package.json` `files`.
- **validate-repo.js:** Regression check that `cli.js` spawns `validate.js`, not `validate-repo.js` directly.

### Repo skill routing

- **repo-hygiene:** Clutter-only scope; removed broad `sanitize repo` trigger; expanded handoff table for public-readiness and secrets phrases.
- **repo-public-readiness:** Added public-readiness trigger phrases (`public repository readiness`, `prepare repo for public`, `sanitize before public`, etc.); clarified not for clutter-only audits.
- **skills-router:** Tie-break and ambiguity note — public/open-source/sanitize-before-public → `repo-public-readiness`, not `repo-hygiene`.

### Init, recommended packs, and catalog

- **`skills-init.js`:** Single `setup-skills` run with comma-separated `--ide` (no per-IDE loop / repeated adopt passes). Forwards `--ide` to `skills-install-recommended` so curated packs align with the chosen targets.
- **`skills-install-recommended.js` / `skills-adopt.js`:** `--ide` accepts `cursor,codex,claude` and `all` via shared `resolveExplicitTargetIdes` in the hub.
- **`recommended-catalog.json`:** `core-next-lite` is Impeccable + code review only; `core-next` unchanged (lite + Graphify). New **`core-next-agentic`** (core-next + ECC minimal). ECC removed from default `core-next-lite` and `audit-review`. ECC pack uses **`installStrategy: manual`** until `ecc-install` is verified on npm; ECC `install.global` / `install.project` use `manual: true` (no dead `ecc-install` commands).
- **`validate-repo.js`:** Manual-strategy packs require `manual: true` on global/project scopes and must not set `install.*.command`.
- **Impeccable:** Catalog warning documents upstream partial harness failures when verify passes.

### Brain KB (init-brain + commit-push)

- **init-brain (1.1.0):** Step 1.5 inspects the repo and creates numbered `brain/kb/` (`00`–`11`, `features/`, `decisions/`); INDEX and pointer stub reference KB; `standards.md` / `workflow.md` templates add KB maintenance and update requirements.
- **commit-push (1.1.0):** Pre-commit Brain KB check — behavioral code changes should update `brain/kb/` or `brain/CHANGELOG.md`.
- **validate-repo.js:** Regression checks that `init-brain` and `commit-push` retain KB markers.

## Planned

- **`troubleshoot-template` (CLI)** — `npx kenmark-skills troubleshoot-template --title "cursor slowdown"` writes `brain/troubleshooting/YYYY-MM-DD-<slug>.md` via `scripts/brain-template.js` (scaffolding exists; not registered in `cli.js` yet). Extend the same module for other `brain/` artifacts later. Referenced from the **troubleshoot** skill docs.

## v1.4.0 — Repo skill family

### Repo operating system (8 skills)

- **repo-hygiene (1.1.0):** Clutter-focused audit; delegates deep secrets to `repo-secrets-audit` and publish gate to `repo-public-readiness`.
- **repo-secrets-audit:** Read-only deep credential scan with mandatory redaction and history-cleanup guidance.
- **repo-public-readiness:** Read-only safe-to-publish verdict (Yes / No / Conditional), blockers, and history-rewrite flag.
- **repo-kb-sync:** Incremental `brain/kb/` and `brain/CHANGELOG.md` updates after code changes.
- **repo-docs-audit:** Documentation quality audit (README, env, scripts, KB freshness, links).
- **repo-structure-audit:** Read-only folder layout and module-boundary recommendations.
- **repo-dependency-audit:** Read-only package health (unused/duplicate deps, lockfile consistency).
- **repo-release-readiness:** Pre-ship checklist (version, changelog, tests, build, meta consistency).
- **skills-router / troubleshoot / skills-init / skills-maintain:** Repo family routing table; specialist tie-break over `repo-hygiene`.
- **scripts/skills-inventory.js:** `KEEP_ALWAYS` includes all `repo-*` skills.
- **README / package.json / skills/README.md:** Kenmark skill count 15 → 22.

## v1.3.0 — Universal troubleshoot, validation, MCP profiles

### IDE detection

- **`detectInstalledIdes`:** No longer treats a parent folder as “installed” when it only contains `skills/` (avoids false positives after `setup --ide all`). Also treats `~/.claude.json` as Claude install evidence.
- **Kenmark-managed markers:** `setup` writes `.kenmark-managed` under each IDE skills directory it creates; **`detectManagedIdes`** lists those paths separately from real installs.
- **Interactive setup/init/doctor:** Prompts and doctor output show **Detected** vs **Kenmark-managed**; auto-detect / `--ide` omission uses detected IDEs only (defaults to `cursor`, `claude`, `codex` when none detected).

### Polish

- **README:** Install pin example updated to `@1.3.0`; documents `@latest` alternative.
- **package.json:** `npm run mcp:uninstall` → `kenmark-skills mcp uninstall`.
- **doctor:** `--no-fail` exits 0 with issues still listed in output/JSON (`ok: false`); distinct from `--soft` (warnings-only). Default still non-zero for CI.

### Troubleshoot & workflow

- **troubleshoot:** New bundled workflow skill (`phase: diagnose`) — universal evidence-first diagnosis, hypothesis tree, test plan, and ranked action plan; optional sub-agent tracks for deep investigation.
- **troubleshoot:** Trigger phrases for Cursor slowdown, production diagnosis, deployment root cause, and test-plan-before-fix requests.
- **troubleshoot:** `risk` set to `write-files` (TodoWrite, optional `brain/troubleshooting/` artifacts); default investigation mode remains read-only until user approval or explicit repo documentation workflow.
- **troubleshoot:** Evidence bundle (`E1`, `E2`, …) table and **Evidence ↔ hypotheses** citations in hypotheses, tests, final report, and `brain/troubleshooting/` artifacts.
- **skills-router:** `infer_category` / `infer_phase` recognize troubleshoot/diagnose triggers; category quick map includes troubleshooting; `diagnose` documented as a workflow phase; **Recommended Kenmark workflows** section (troubleshoot before router).
- **README / skills/README.md / skills-init:** Documented day-to-day workflow order with `troubleshoot` first; trigger examples for production/debug/test-plan phrasing.
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
- **recommended-catalog.js / skills-install-recommended.js:** When `entry.seoSkills` is set, post-install verify requires every selected skill’s `SKILL.md` (not just `keyword-research` or the full pack directory), so partial batch installs fail verify for `growth-seo`.
- **recommended-catalog.json / recommended-catalog.js:** `code-review-skill` uses `installStrategy: "git-sync"` — clone on first install, `git pull --ff-only` when the target is already a repo; safe to re-run `install-recommended --profile lean`.
- **skills-install-recommended.js:** `--profile`, `--list-profiles`; interactive profile picker with install preview; power-user confirmation; ECC default **minimal** (was `core`). Adopt pass forwards `--copy`, `--symlink`, `--prefer-copy-on-windows`, `--adopt-overwrite` (same as `setup` / `adopt`). Runs git-sync installs via Node instead of a bare `git clone` shell command.
- **interactive.js:** `promptSelectProfile`, `printProfileSummary`, `promptHighBloatConfirm`.
- **skills-init.js:** Recommended step uses profiles; `--profile` for agents.
- **skills-install-recommended/SKILL.md, README, cli.js:** Docs updated for profile-first workflow.

### Issues skills

- **issues-setup / issues-scan / issues-list / issues-maintenance:** Expanded default `area` values (`frontend`, `backend`, `auth`, `performance`, `dx`, `docs`, `workflow`, `unknown`, …); `worker` documented as optional when the repo has background jobs; maintenance accepts legacy `maintainability`.

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
- **`skills-init.js`:** IDE detection delegates to `detectInstalledIdes()` + `buildGlobalTargets` / `buildProjectTargets` from the hub (same paths as `setup`).
- **README:** CLI table includes `doctor`; common flags for `--strict-targets`, `--symlink`, `--prefer-copy-on-windows`, `--adopt-overwrite`; adopt review-required note.

## v1.2.6 — Standardized skill frontmatter and layout docs

- **All Kenmark skills:** Unified YAML frontmatter (`name`, `version`, `category`, `scope`, `phase`, `description`, `triggers`, `allowed-tools`, `risk`, `disable-model-invocation`). Removed legacy `preamble-tier`.
- **Categories:** `onboarding`, `workflow`, `git`, `issues`, `admin` (flat dirs under `skills/user-skills/`; logical map in `skills/README.md`).
- **Scopes:** `universal` on all bundled skills; `setup` skips any skill with `scope: project-specific` in frontmatter.
- **kenmark-hub:** `setup` skips skills with `scope: project-specific` in frontmatter.
- **Risk levels:** `read-only`, `write-files`, `shell`, `git-write`, `destructive-possible`.
- **skills-router:** Registry includes `scope` / `project`; inference aligned with new categories.

## v1.2.5 — init-brain modular rules

- **init-brain:** Split default rules into `brain/rules/standards.md` (lean universal), `stack.md`, `workflow.md`, `testing.md`, `ui.md`, and optional `deployment.md` — no mandatory MCP, sub-agents, or browser tooling.
- **init-brain:** IDE stub reads `standards.md` first; other rule files only when relevant to the task.
- **init-brain:** `sync-full` embeds lean `standards.md` only; migration path for monolithic legacy `standards.md`.
- **README:** Brain onboarding note reflects modular `brain/rules/`.

## v1.2.4 — Kenmark hub MCP servers

- **`config/mcp-servers.json`:** Bundled MCP definitions (Playwright, Context7, sequential-thinking, fetch via `uvx`, Browser MCP).
- **`kenmark-hub.js`:** MCP store at `~/.kenmark/store/mcp.json`; merge into Cursor (`mcp.json`) and Claude (`~/.claude.json` or project `.mcp.json`); uninstall removes Kenmark-managed entries only.
- **`setup-skills.js`:** Runs MCP install on `setup` by default; `--skip-mcp` to disable; `--force` overwrites existing server entries with the same name.
- **README:** Kenmark hub MCP section and CLI flag table.

## v1.2.2 — init-brain stub-first (multi-IDE)

- **init-brain:** Default sync mode is **`stub`** — identical pointer block in selected `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/project-standards.mdc`, `.cursorrules`; full standards stay only in `brain/rules/standards.md` with a required **Read** at conversation start.
- **init-brain:** Optional **`sync-full`** embeds the entire standards file inside merge markers (previous default behavior).
- **init-brain:** Documents harness-agnostic design (no Cursor hooks); recommends `AGENTS.md` for multi-IDE coverage.
- **README:** Updated init-brain description and brain onboarding note.

## v1.2.0 — Explicit interactive init (no silent defaults)

- **.gitignore / .npmignore:** Ignore entire `brain/` (local workspace); release notes at root `CHANGELOG.md` (npm `files`). `.claude/`, `.cursor/`, `.agents/` remain gitignored.
- **skills-init.js:** Interactive flow starts with nothing selected; Kenmark and recommended packs each require an explicit yes. Scope, IDE targets, pack list, ECC profile, and final confirm all require explicit choices (empty Enter does not proceed).
- **interactive.js:** Added `required`, `noDefaults`, and `requiredConfirm` options for scope, IDE, pack, ECC profile, and confirm prompts.
- **skills-install-recommended.js:** Interactive pack picker no longer falls back to `defaultSelected`; `--all` installs every catalog pack. Confirm requires explicit yes in interactive mode.
- **recommended-catalog.json:** `impeccable.defaultSelected` set to `false`.
- **skills-init, skills-install-recommended, README:** Docs and agent examples updated (`init -y` no longer implies recommended packs; use `--ids` or `--all`).

## v1.1.9 — Adopt defaults, docs, package metadata

- **.gitignore / .npmignore:** Ignore `.claude/`, `.cursor/`, `.agents/` (local IDE installs; source of truth remains `skills/user-skills/`). Removed previously tracked project copies from git.
- **skills-install-recommended.js:** After each pack install, runs **adopt** into `~/.kenmark/store` and relinks IDEs. New flags: `--skip-adopt`, `--ide` (limit relink target).
- **skills-update.js:** Drops separate `skills-adopt.js` invocation; adopt runs inside `setup` and `install-recommended` (forwards `--skip-adopt`, `--ecc-profile`, `--ide`).
- **README:** At-a-glance counts (13 skills, 8 CLI commands); **While coding** group for `skills-router`; full CLI table including `uninstall`; **`init` vs `setup`** and **Adopt (on by default)** sections; repository layout notes `scripts/`.
- **package.json:** Bump to 1.1.9; description reflects skills + CLI; npm scripts `adopt` and `uninstall`; keywords `claude-code`, `subagents`, `cli`.

## v1.1.8 — More IDE targets and setup adopt

- **kenmark-hub.js:** Inventory and relink scan **Kiro**, **Trae** / **Trae CN**, **Rovo Dev**, and **Qoder** (`~/.kiro`, `~/.trae`, `~/.trae-cn`, `~/.rovodev`, `~/.qoder`). `relinkSkillsToIdes` pre-creates target skill directories so `setup --ide kiro` materializes `~/.kiro/skills/` even before skills link.
- **setup-skills.js:** After Kenmark install, runs **adopt** for catalog skills already present in any IDE root (`--skip-adopt`, `--ecc-profile` flags). Help text updated.

## v1.1.4 — Multi-pack recommended catalog

- **recommended-catalog.json (v3):** Catalog expanded from 1 to 5 packs: `impeccable` (default), `ecc` (minimal/core/full profiles, default `minimal`), `graphify` (Python via uv/pipx), `code-review-skill` (git clone), `seo-geo-claude-skills` (npx). Dropped `defaults.eccProfile`; the profile now lives on the `ecc` pack itself.
- **scripts/skills-install-recommended.js:** Reused existing `id === "ecc"` special-casing to wire up the ECC profile prompt and `{{profile}}` placeholder substitution. CLI now accepts `--ecc-profile minimal|core|full` (e.g. `npx kenmark-skills install-recommended --ids ecc --ecc-profile minimal --global -y`).
- **skills-install-recommended, skills-init, skills-update, README:** Docs and examples updated to reflect the multi-pack catalog. The "ECC, gstack not in this catalog" note is gone; the Impeccable-only pack table now lists all 5 packs with their install methods.
- **Removed:** `compound-engineering` pack entry (replaced by `ecc` as the preferred harness pack).

## v1.1.3 — Impeccable-only recommended catalog

- **recommended-catalog.json (v3):** Removed `ecc` and `gstack` packs; only **Impeccable** remains (`defaultSelected: true`). Dropped `defaults.eccProfile`.
- **skills-install-recommended, skills-init, skills-update, README:** Docs and examples updated for Impeccable-only curated installs. ECC/gstack can still be installed separately outside the catalog.

## v1.1.2 — gstack in recommended catalog

- **recommended-catalog.json:** Added [gstack](https://github.com/garrytan/gstack) pack (`id: gstack`) with global `git clone` + `./setup` and project team-mode via `gstack-team-init optional`; `defaultSelected: false`.
- **skills-install-recommended:** Documented gstack install commands, requirements (Git, Bun), and overlap note with ECC.

## v1.1.1 — ECC adopt scope fix

- **`kenmark-hub.js`:** ECC adopt names come from ECC `install-profiles.json` / `install-modules.json` (profile from catalog, default `core`), not every skill under `~/.claude/skills`. Optional pack-level `adoptSkillNames` override in `recommended-catalog.json`.

## v1.1.0 — Kenmark unified skill hub

- **`~/.kenmark/store/skills`:** Canonical store for Kenmark bundled skills; IDE paths symlink (or copy on Windows) instead of blind per-IDE copies.
- **`scripts/kenmark-hub.js`:** Manifest, install-to-store, relink, adopt catalog skills (bundled + Impeccable + ECC skill folders).
- **`setup-skills.js`:** Store + link; `--copy`, `--force`, `--keep-store` / `--no-keep-store` on uninstall.
- **`skills-update.js`:** Runs adopt after setup/recommended by default; `--skip-adopt`.
- **CLI:** `npx kenmark-skills adopt`.
- **`skills-inventory.js`:** Scans `kenmark-store`; verdict `adopt-candidate`; `issues-*` in `KEEP_ALWAYS`.
- **Docs:** README hub section; **skills-init**, **skills-update**, **skills-maintain**, **skills-router** (registry merges store + agents).

## v2026.06.02-2345-minimax-code-target

- **Setup / init / inventory:** Added **MiniMax Code** as an install target (`~/.minimax/skills`, project `.minimax/skills`). Auto-detect when `~/.minimax` exists.
- **README:** Documented MiniMax Code global skills path.

## v2026.06.02-2330-readme-skills-grouped

- **README:** Reorganized "What's included" by use case — onboard, ship, `issues-*`, `skills-*` — with workflow order within each group.
- **README:** Extended manual Claude uninstall `rm` list to include all `skills-*` skill folders.

## v2026.06.02-2320-skills-maintain-interactive-docs

- **skills-maintain:** document `skills-init`, interactive-first CLI, inventory TTY prompts, and `-y` for agents.
- Synced `.cursor/` and `.claude/` copies for `skills-init`, `skills-install-recommended`, `skills-update`, `skills-maintain`.

## v2026.06.02-2315-interactive-cli-init
- **Interactive-first CLI:** all setup/install/init flows prompt in a TTY by default; agents use explicit flags + `-y` (or `KENMARK_SKILLS_NONINTERACTIVE=1`).
- Added **`scripts/interactive.js`** shared prompts (scope, IDE, action, confirm).
- **`setup-skills.js`:** interactive install/uninstall wizard; `-y`, `--dry-run`, comma-separated `--ide`.
- **`skills-init.js`** + **`npx kenmark-skills init`:** first-time onboarding (Kenmark + optional recommended defaults).
- **`skills-install-recommended.js`:** shared prompts, numbered pack selection, Enter = default packs.
- **`skills-update.js`:** shared `promptScope` / `confirmPlan`.
- **`skills-inventory.js`:** interactive output path choice; `-y` for agents.
- New skill **`skills-init`**, README table, `package.json` `files` + `init` script.

## v2026.06.02-2230-skills-update
- Added **`skills-update`** skill and **`scripts/skills-update.js`**: interactive refresh for Kenmark skills, optional `npm update -g kenmark-skills`, and optional recommended-pack reinstall via npx.
- CLI: `npx kenmark-skills update` with flags `--kenmark-only`, `--recommended-only`, `--both`, `--global`, `--project`, `--ide`, `--npm-only`, `--dry-run`, `-y`.
- Wired `skills-update` into inventory `KEEP_ALWAYS`, README, and cross-links from **skills-maintain** / **skills-install-recommended**.

## v2026.06.02-2200-recommended-catalog-npx-interactive
- **recommended-catalog.json v2:** removed git-clone install paths; each pack defines `install.global` and `install.project` npx commands.
- **Impeccable:** global `npx skills add pbakaus/impeccable -g -y`; project `npx impeccable skills install`.
- **ECC:** `npx -p ecc-universal ecc-install` with profile `core` (default), targets `claude` (global) or `cursor` (project); documented single-path warning vs marketplace plugin.
- **skills-install-recommended.js:** interactive scope (global/project), pack selection, ECC profile prompt; flags `--global`, `--project`, `--scope`, `--ecc-profile`.
- Updated **skills-install-recommended** skill docs, README, and synced `.cursor`/`.claude` catalog copies.

## v2026.06.02-2115-rename-skills-router
- Renamed **`skill-router`** → **`skills-router`** for consistent `skills-*` Kenmark naming.
- Registry path is now `skills/user-skills/skills-router/registry.json`; Claude slash command is `/kenmark-skills-router`.
- After upgrading, remove old installs (`skill-router` folders and `kenmark-skill-router.md`) or re-run `npx kenmark-skills setup`.

## v2026.06.02-2100-skills-maintain-and-recommended-install
- Added **`skills-maintain`** skill: inventory installed `SKILL.md` trees, group by name, flag vendored mirrors (e.g. gstack), recommend keep vs remove — never auto-deletes.
- Added **`skills-install-recommended`** skill and **`recommended-catalog.json`** with curated packs: [Impeccable](https://github.com/pbakaus/impeccable), [Everything Claude Code](https://github.com/affaan-m/everything-claude-code).
- Added CLI commands: `npx kenmark-skills inventory` and `npx kenmark-skills install-recommended` (`--list`, `--all`, `--ids`, `--dry-run`, `-y`).
- Published scripts: `scripts/skills-inventory.js`, `scripts/skills-install-recommended.js`.

## v2026.06.02-2000-skill-description-normalization
- Normalized skill frontmatter descriptions from YAML block style (`description: |`) to single-line `description: "..."` format.
- Applied across all local `SKILL.md` files so skill descriptions render consistently in clients that expect inline description values.

## v2026.06.02-1955-uninstall-version-lag-troubleshooting
- Added uninstall troubleshooting to README for `Unknown command: uninstall` caused by older `npx` package versions.
- Documented explicit `npx kenmark-skills@latest` usage, npm cache clean fallback, and manual Claude cleanup commands.

## v2026.06.02-1945-uninstall-command-support
- Added `uninstall` support to the package CLI (`npx kenmark-skills uninstall`) with `--global|--project` and `--ide` targeting.
- Setup installer now supports `--uninstall` mode and removes only Kenmark-installed skill directories from target paths.
- Claude-specific uninstall also removes generated `/kenmark-*` command wrappers from `.claude/commands`.
- Added `uninstall:skills` npm script and documented global/project uninstall flows in README.

## v2026.06.02-1938-claude-command-wrappers
- Updated setup installer to generate Claude Code slash-command wrappers under `.claude/commands` for every shipped Kenmark skill.
- This enables direct slash usage (for example `/kenmark-init-brain`) in addition to selecting skills from `/skills`.
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

## v2026.06.02-1912-init-brain-user-choice
- init-brain now asks which agent config files to sync instead of creating all targets by default.
- Brain scaffold still always runs; only user-selected files (CLAUDE.md, AGENTS.md, Cursor, GEMINI.md) are written.

## v2026.06.02-readme
- Added root `README.md` with skill inventory, install paths (Cursor, `~/.agents/skills`, npm), usage notes, and repo layout.

## v2026.06.02-package-metadata
- Updated `package.json` description, authors, and GitHub URLs for Kenmark ITan Solutions (`tanoojmehra/kenmark-skills`).

## v2026.06.02-1905-init-brain-cross-agent
- Expanded `skills/user-skills/init-brain/SKILL.md` to bootstrap `brain/` and sync standards to `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and `.cursor/rules/project-standards.mdc`.
- Documented `brain/rules/standards.md` as source of truth with `init-brain` merge markers for idempotent updates across Claude Code, Codex, and Cursor.

## v2026.06.02-1810-init-skills
- Initialized project scaffold with local `skills/`, `brain/`, and `temp/` directories.
- Copied user-authored skills from `~/.claude/skills` and `~/.codex/skills` into workspace-local skill packs.

## v2026.06.02-1814-skill-filter
- Filtered copied skills to requested set only: `issues-*`, `commit-push`, and `skill-router`.
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

## v2026.06.02-1844-init-brain-rename
- Renamed skill folder from `skills/user-skills/brain-rules/` to `skills/user-skills/init-brain/`.
- Updated skill title to `Init Brain Skill`.
- Updated skill inventory files to include `init-brain` and refresh counts.

## v2026.06.02-1851-skill-router-registry-runtime
- Updated `skills/user-skills/skill-router/SKILL.md` to generate `skills/user-skills/skill-router/registry.json` at runtime on each invocation.
- Added repo and publish ignores so the generated registry file is not committed or shipped (`.gitignore`, `.npmignore`).
- Removed tracked `skills/user-skills/skill-router/registry.json`; it is now per-user generated state.


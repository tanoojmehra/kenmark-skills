# Testing and quality

Last updated: 2026-10-29
Status: reviewed

## Confirmed facts

### validate-repo (`scripts/validate-repo.js`)

Checks include:

- All bundled skills have required frontmatter fields and valid categories/scopes.
- Skill count consistency with package description / docs.
- `recommended-catalog.json` schema, presets, pack IDs, install/verify commands.
- `package.json` `files` entries exist on disk.
- Forbidden terms and legacy rename map (`LEGACY_SKILL_RENAMES` from hub).

### Test suites (`package.json` scripts)

| Script | Runs |
| --- | --- |
| `validate` | `validate-repo.js` only (repo invariants) |
| `test` | `validate` + `test:cli` + `test:packs-verify` |
| `test:cli` | smoke, interactive scope prompt, non-interactive stdin, CLI package semver, Gemini/Codex dedupe, Antigravity dedupe |
| `test:install` | temp-HOME install |
| `test:pack` | npm pack contents |
| `test:broken-links` | broken symlinks, cleanup modes, legacy cleanup safety |
| `test:portability` | store path rewriting + adopt summary |
| `test:brain` | `node --test` Brain contract suite |
| `test:all` | `test`, `test:install`, `test:pack`, `test:broken-links`, `test:portability`, `test:brain` — in that order; `prepublishOnly` runs it before `pack:check` |

### Test scripts

| Script | Purpose |
| --- | --- |
| `test-cli-smoke.js` | CLI dispatch and dry-run assertions |
| `test-interactive-scope-prompt.js` | Global-only scope prompt lines; `--project` rejection helper |
| `test-interactive-noninteractive-stdin.js` | TTY/non-TTY stdin guards for `init`/`update` |
| `test-cli-package.js` | `cli-package.js` semver parse/compare (`parseSemver`, `semverLt`) |
| `test-gemini-codex-dedupe.js` | Gemini/Codex path dedupe (temp HOME) |
| `test-antigravity-dedupe.js` | Antigravity CLI/IDE path dedupe (temp HOME) |
| `test-packs-verify-skip.js` | Catalog verify logic |
| `test-install-temp-home.js` | Install with temp HOME |
| `test-pack.js` | npm pack contents |
| `test-broken-symlink-cleanup.js` | Cleanup broken symlinks |
| `test-cleanup-temp-home.js` | Cleanup kenmark/packs modes |
| `test-legacy-cleanup-canonical.js` | Legacy cleanup must not remove canonical bundled skills after init |
| `test-skill-portability.js` | Path rewrite in store (IDE anchors + cwd-relative `./scripts/` in agent-facing docs); adopt result summarizer (`summarizeAdoptResults`, `formatAdoptPassSummary`) |
| `test-brain-contract.js` | `brain-contract.js` ID audit/reserve + tracker CLI (`node --test`) |

### Skill verification policy

- `kenmark-output` requires fresh evidence before completion claims such as "fixed", "passes", or "ready".
- `kenmark-repo-quality` records starting/final HEAD + dirty state and marks gate evidence fresh/stale/not-run; affected checks must be rerun after later mutations.
- `kenmark-test-coverage` includes optional mutation-confidence analysis. It remains read-only by default; use configured mutation tooling or disposable worktrees for manual mutation experiments.

### doctor (`scripts/doctor.js`)

Local machine checks: store presence, manifest, MCP CLI tools on PATH, IDE symlinks, hash drift, non-portable skill paths, WSL hints.

Flags: `--soft`, `--no-fail`, `--json <path>`.

## Important files inspected

- `package.json` scripts
- `scripts/validate-repo.js` (header and requires)

## Maintenance notes

- New validation rules: extend `validate-repo.js` and document here.
